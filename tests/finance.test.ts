import test from "node:test";
import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import {
  budgetTotals,
  deduplicate,
  monthly,
  summarize,
  transactionSchema,
  type Budget,
  type Transaction,
} from "../lib/finance";
import { createBudgetWorkbook } from "../utils/excelGen";
const tx = (
  id: string,
  amount: number,
  category: Transaction["category"],
): Transaction => ({
  id,
  date: "2026-09-01",
  description: id,
  amount,
  category,
});
export const budget: Budget = {
  title: "Test plan",
  currency: "USD",
  summary: "Test assumptions",
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
  variableExpenses: [
    {
      item: '=HYPERLINK("https://example.com")',
      estimatedCost: 120,
      frequency: "Weekly",
      priority: "Important",
    },
  ],
  savingsTargets: [
    {
      item: "Buffer",
      estimatedCost: 300,
      frequency: "Monthly",
      priority: "Important",
    },
  ],
};
test("ledger excludes transfers and savings from spending and income", () => {
  const result = summarize([
    tx("Pay", 3000, "Income"),
    tx("Rent", -1000, "Housing"),
    tx("Transfer", -800, "Transfer"),
    tx("Saving", -300, "Savings"),
  ]);
  assert.equal(result.income, 3000);
  assert.equal(result.expenses, 1000);
  assert.equal(result.remaining, 2000);
});
test("deduplication ignores category edits and preserves unique purchases", () => {
  const first = tx("Cafe", -10, "Food");
  assert.equal(
    deduplicate(
      [first],
      [
        { ...first, id: "new", category: "Other" },
        tx("Book", -20, "Education"),
      ],
    ).length,
    2,
  );
});
test("normalizes frequencies and excludes one-time costs from recurring totals", () => {
  assert.equal(
    monthly({
      ...budget.incomeStreams[0],
      estimatedCost: 1200,
      frequency: "Yearly",
    }),
    100,
  );
  assert.equal(
    monthly({ ...budget.incomeStreams[0], frequency: "One-time" }),
    0,
  );
  assert.equal(budgetTotals(budget).remaining, 1180);
});
test("rejects rolled-over dates and infinite amounts", () => {
  assert.equal(
    transactionSchema.safeParse({ ...tx("x", 1, "Other"), date: "2026-02-30" })
      .success,
    false,
  );
  assert.equal(
    transactionSchema.safeParse(tx("x", Infinity, "Other")).success,
    false,
  );
});
test("Excel round-trip preserves five sheets, numeric values and safe text cells", () => {
  const workbook = createBudgetWorkbook(budget);
  const restored = XLSX.read(
    XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }),
    { type: "buffer" },
  );
  assert.equal(restored.SheetNames.length, 5);
  assert.equal(restored.Sheets["Income Streams"].B2.v, 3000);
  assert.equal(restored.Sheets["Variable Expenses"].A2.t, "s");
  assert.equal(restored.Sheets["Variable Expenses"].A2.f, undefined);
  assert.match(restored.Sheets["Variable Expenses"].E2.f!, /52\/12/);
  assert.equal(restored.Sheets.Summary.B9.v, 1180);
});
