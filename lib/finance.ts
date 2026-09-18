import { z } from "zod";

export const categories = [
  "Income",
  "Housing",
  "Food",
  "Transport",
  "Utilities",
  "Shopping",
  "Health",
  "Education",
  "Entertainment",
  "Subscriptions",
  "Savings",
  "Transfer",
  "Other",
] as const;
export const transactionSchema = z.object({
  id: z.string().min(1).max(100),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(
      (s) =>
        !Number.isNaN(Date.parse(s)) &&
        new Date(s).toISOString().slice(0, 10) === s,
      "Invalid calendar date",
    ),
  description: z.string().trim().min(1).max(200),
  amount: z.number().finite().min(-1e9).max(1e9),
  category: z.enum(categories),
});
export type Transaction = z.infer<typeof transactionSchema>;
export const frequencies = ["Monthly", "Weekly", "Yearly", "One-time"] as const;
export const budgetItemSchema = z.object({
  item: z.string().trim().min(1).max(160),
  estimatedCost: z.number().finite().min(0).max(1e9),
  frequency: z.enum(frequencies),
  priority: z.enum(["Essential", "Important", "Optional"]),
});
export const budgetSchema = z.object({
  title: z.string().min(1).max(100),
  currency: z.enum(["USD", "EUR", "GBP", "INR"]),
  summary: z.string().max(2000),
  incomeStreams: z.array(budgetItemSchema).min(1).max(40),
  fixedExpenses: z.array(budgetItemSchema).max(40),
  variableExpenses: z.array(budgetItemSchema).max(40),
  savingsTargets: z.array(budgetItemSchema).max(40),
});
export type Budget = z.infer<typeof budgetSchema>;
export type BudgetItem = z.infer<typeof budgetItemSchema>;
export const goalSchema = z.object({
  income: z.number().positive().max(1e9),
  fixed: z.number().min(0).max(1e9),
  target: z.number().min(0).max(1e9),
  months: z.number().int().min(1).max(120),
  currency: z.enum(["USD", "EUR", "GBP", "INR"]),
  goals: z.string().trim().min(10).max(3000),
});
export type Goals = z.infer<typeof goalSchema>;
export function parseJSON(text: string): unknown {
  return JSON.parse(
    text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, ""),
  );
}
export function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}
export function monthly(item: BudgetItem) {
  return (
    item.estimatedCost *
    (item.frequency === "Weekly"
      ? 52 / 12
      : item.frequency === "Yearly"
        ? 1 / 12
        : item.frequency === "One-time"
          ? 0
          : 1)
  );
}
export function budgetTotals(budget: Budget) {
  const sum = (items: BudgetItem[]) =>
    items.reduce((n, i) => n + monthly(i), 0);
  const income = sum(budget.incomeStreams),
    expenses = sum(budget.fixedExpenses) + sum(budget.variableExpenses),
    savings = sum(budget.savingsTargets);
  return { income, expenses, savings, remaining: income - expenses - savings };
}
export function summarize(rows: Transaction[]) {
  const income = rows
    .filter(
      (t) =>
        t.amount > 0 && t.category !== "Transfer" && t.category !== "Savings",
    )
    .reduce((s, t) => s + t.amount, 0);
  const expenses = -rows
    .filter(
      (t) =>
        t.amount < 0 && t.category !== "Transfer" && t.category !== "Savings",
    )
    .reduce((s, t) => s + t.amount, 0);
  const grouped: Record<string, number> = {};
  for (const t of rows)
    if (t.amount < 0 && !["Transfer", "Savings"].includes(t.category))
      grouped[t.category] = (grouped[t.category] || 0) - t.amount;
  return {
    income,
    expenses,
    remaining: income - expenses,
    rate: income > 0 ? ((income - expenses) / income) * 100 : 0,
    grouped: Object.entries(grouped).sort((a, b) => b[1] - a[1]),
  };
}
export function deduplicate(existing: Transaction[], incoming: Transaction[]) {
  const key = (t: Transaction) =>
    `${t.date}|${t.description.toLowerCase().trim()}|${t.amount.toFixed(2)}`;
  const seen = new Set(existing.map(key));
  return [
    ...existing,
    ...incoming.filter((t) => {
      const k = key(t);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }),
  ].sort((a, b) => b.date.localeCompare(a.date));
}
