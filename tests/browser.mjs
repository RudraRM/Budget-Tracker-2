import { chromium } from "@playwright/test";
import serverChromium from "@sparticuz/chromium";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3100",
  ],
  { stdio: "pipe" },
);
let browser;
try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Server did not start")),
      15000,
    );
    server.stdout.on("data", (data) => {
      if (String(data).includes("Ready")) {
        clearTimeout(timer);
        resolve();
      }
    });
    server.on("error", reject);
    server.on("exit", (code) => {
      if (code) reject(new Error(`Server exited ${code}`));
    });
  });
  browser = await chromium.launch({
    executablePath:
      process.env.CHROMIUM_PATH || (await serverChromium.executablePath()),
    args: serverChromium.args,
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:3100/");
  await page.getByRole("heading", { level: 1 }).waitFor();
  for (const section of ["#workflow", "#principles", ".final-cta"]) {
    await page.locator(section).scrollIntoViewIfNeeded();
    await page.waitForTimeout(650);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(700);
  await page.screenshot({ path: "/tmp/folio-landing.png", fullPage: true });
  await page.getByRole("link", { name: "Launch Workspace" }).first().click();
  await page.getByText("A clean slate", { exact: true }).waitFor();
  await page.getByRole("tab", { name: "Categorizer", exact: true }).click();
  await page.getByLabel("Statement text").fill("2026-09-01 Coffee -5.00");
  assert.equal(
    await page
      .getByRole("button", { name: "Categorize statement" })
      .isDisabled(),
    true,
  );
  await page.getByRole("tab", { name: "Create a Budget", exact: true }).click();
  await page.getByLabel("Monthly take-home income").fill("3000");
  await page.getByLabel("Monthly fixed commitments").fill("1000");
  await page.getByLabel("Total savings goal").fill("1200");
  await page
    .getByLabel("Your priorities & constraints")
    .fill("Build an emergency fund while keeping a realistic food budget.");
  const budget = {
    title: "Browser test budget",
    currency: "USD",
    summary: "A test-only response.",
    incomeStreams: [
      {
        item: "Salary",
        estimatedCost: 3000,
        frequency: "Monthly",
        priority: "Essential",
      },
    ],
    fixedExpenses: [
      {
        item: "Housing",
        estimatedCost: 1000,
        frequency: "Monthly",
        priority: "Essential",
      },
    ],
    variableExpenses: [],
    savingsTargets: [
      {
        item: "Buffer",
        estimatedCost: 100,
        frequency: "Monthly",
        priority: "Important",
      },
    ],
  };
  await page.route("**/api/chat", async (route) => {
    const data = route.request().postDataJSON();
    await route.fulfill({
      json:
        data.mode === "budget"
          ? { budget }
          : { message: "Set aside a manageable amount each month." },
    });
  });
  await page.getByRole("button", { name: "Generate budget" }).click();
  await page.getByText("Browser test budget", { exact: true }).waitFor();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Excel workbook" }).click();
  assert.match((await downloadPromise).suggestedFilename(), /\.xlsx$/);
  await page
    .getByRole("tab", { name: "Financial Planner", exact: true })
    .click();
  await page.getByLabel("Savings horizon").fill("6");
  await page.getByRole("tab", { name: "AI Advisor", exact: true }).click();
  await page.getByLabel("Message the advisor").fill("How do I make a budget?");
  await page.getByRole("button", { name: "Send message" }).click();
  await page
    .locator(".message.assistant")
    .filter({ hasText: "Set aside a manageable amount each month." })
    .waitFor();
  await page.getByRole("tab", { name: "Overview", exact: true }).click();
  await page
    .getByRole("button", { name: "Connection and data settings" })
    .click();
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const fixture = {
    transactions: [
      {
        id: "1",
        date: `${month}-01`,
        description: "Pay",
        amount: 3000,
        category: "Income",
      },
      {
        id: "2",
        date: `${month}-02`,
        description: "Groceries",
        amount: -100,
        category: "Food",
      },
    ],
    budget,
    goals: {
      income: 3000,
      fixed: 1000,
      target: 1200,
      months: 6,
      currency: "USD",
      goals: "Build a cash buffer.",
    },
  };
  page.on("dialog", (dialog) => dialog.accept());
  await page.locator("input[type=file]").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(fixture)),
  });
  await page.getByLabel("Description for Groceries").waitFor();
  await page.getByLabel("Category for Groceries").selectOption("Other");
  await page.reload();
  await page.getByLabel("Category for Groceries").waitFor();
  assert.equal(
    await page.getByLabel("Category for Groceries").inputValue(),
    "Other",
  );
  await page.screenshot({ path: "/tmp/folio-dashboard.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const tab of [
    "Overview",
    "Categorizer",
    "Create a Budget",
    "Financial Planner",
    "AI Advisor",
  ]) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      true,
      `Overflow in ${tab}`,
    );
  }
  await page.screenshot({ path: "/tmp/folio-mobile.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log(
    "Browser checks passed: routing, consent gate, API errors, budget download, chat, planner, backup restore, persistence, and five mobile tabs.",
  );
} finally {
  await browser?.close();
  server.kill();
}
