"use client";
import { useState } from "react";
import { ArrowRight, Download, FileSpreadsheet } from "lucide-react";
import { Action, Busy } from "./ui";
import {
  budgetSchema,
  budgetTotals,
  goalSchema,
  money,
  type Budget,
  type Goals,
} from "@/lib/finance";
import { requestAI } from "@/lib/client";

export function BudgetBuilder({
  budget,
  goals,
  setGoals,
  onBudget,
}: {
  budget: Budget | null;
  goals: Goals;
  setGoals: (value: Goals) => void;
  onBudget: (budget: Budget) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function generate(e: React.FormEvent) {
    e.preventDefault();
    const validated = goalSchema.safeParse(goals);
    if (!validated.success) {
      setError(
        "Enter a positive monthly income and at least 10 characters describing your goals.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await requestAI({
        mode: "budget",
        goals: validated.data,
      });
      onBudget(budgetSchema.parse(response.budget));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "The budget could not be generated.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function download() {
    if (!budget) return;
    try {
      const { downloadBudget } = await import("@/utils/excelGen");
      downloadBudget(budget);
    } catch {
      setError("The Excel file could not be generated. Please retry.");
    }
  }
  const totals = budget ? budgetTotals(budget) : null;
  return (
    <div className="split">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">02 / GIVE EVERY DOLLAR A DIRECTION</p>
            <h2 className="mt-3">A budget built around you.</h2>
            <p>
              Start with your real commitments. Make room for your priorities.
            </p>
          </div>
        </div>
        <form onSubmit={generate}>
          <div className="form-grid">
            <label className="field">
              Monthly take-home income ({goals.currency})
              <input
                required
                type="number"
                min="0.01"
                max="1000000000"
                step="0.01"
                value={goals.income || ""}
                onChange={(e) =>
                  setGoals({ ...goals, income: Number(e.target.value) })
                }
                placeholder="0.00"
              />
            </label>
            <label className="field">
              Monthly fixed commitments
              <input
                required
                type="number"
                min="0"
                max="1000000000"
                step="0.01"
                value={goals.fixed}
                onChange={(e) =>
                  setGoals({ ...goals, fixed: Number(e.target.value) })
                }
              />
            </label>
            <label className="field">
              Total savings goal
              <input
                required
                type="number"
                min="0"
                max="1000000000"
                step="0.01"
                value={goals.target}
                onChange={(e) =>
                  setGoals({ ...goals, target: Number(e.target.value) })
                }
              />
            </label>
            <label className="field">
              Time to reach it (months)
              <input
                required
                type="number"
                min="1"
                max="120"
                step="1"
                value={goals.months}
                onChange={(e) =>
                  setGoals({ ...goals, months: Number(e.target.value) })
                }
              />
            </label>
            <label className="field full">
              Your priorities & constraints
              <textarea
                required
                minLength={10}
                maxLength={3000}
                value={goals.goals}
                onChange={(e) => setGoals({ ...goals, goals: e.target.value })}
                placeholder="Describe fixed costs, typical variable spending, and what you’re saving for. Include anything your plan needs to protect."
              />
            </label>
          </div>
          <div className="notice mt-5">
            <strong>Prompt preview</strong>
            <p>
              Plan in {goals.currency} with{" "}
              {money(goals.income, goals.currency)} monthly income,{" "}
              {money(goals.fixed, goals.currency)} fixed costs, and{" "}
              {money(
                goals.months > 0 ? goals.target / goals.months : 0,
                goals.currency,
              )}{" "}
              monthly savings over {goals.months} months. Allocate variable
              expenses and explain any shortfall.
            </p>
          </div>
          <p className="help">
            Generating sends these inputs to NVIDIA. Your transaction ledger is
            not sent.
          </p>
          {error && (
            <div className="notice error mt-4" role="alert">
              {error}
            </div>
          )}
          <div className="form-footer">
            <span className="help">Estimates to review. A plan to keep.</span>
            <Action type="submit" disabled={busy}>
              {busy ? (
                <Busy text="Building your budget…" />
              ) : (
                <>
                  Generate budget <ArrowRight size={15} />
                </>
              )}
            </Action>
          </div>
        </form>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>{budget?.title || "Your next chapter"}</h2>
            <p>
              {budget
                ? "Review your plan, then take it with you."
                : "A clear, portable budget will appear here."}
            </p>
          </div>
          <FileSpreadsheet size={23} strokeWidth={1.3} />
        </div>
        {!budget ? (
          <div className="empty">
            <FileSpreadsheet size={35} strokeWidth={1} />
            <h3>Built for life outside this tab</h3>
            <p>
              Your workbook includes income streams, fixed expenses, variable
              expenses, savings targets, and a monthly summary.
            </p>
          </div>
        ) : (
          <>
            <p className="help">{budget.summary}</p>
            {totals && (
              <div
                className={`notice mt-5 ${totals.remaining < 0 ? "error" : "success"}`}
              >
                <strong>{money(totals.remaining, budget.currency)}</strong>{" "}
                {totals.remaining < 0
                  ? "monthly shortfall. Revise the plan before using it."
                  : "unallocated each month."}
              </div>
            )}
            {(
              [
                ["Income streams", budget.incomeStreams],
                ["Fixed expenses", budget.fixedExpenses],
                ["Variable expenses", budget.variableExpenses],
                ["Savings targets", budget.savingsTargets],
              ] as const
            ).map(([title, items]) => (
              <div className="budget-section" key={title}>
                <h3>{title}</h3>
                {items.length ? (
                  items.map((item, index) => (
                    <div className="budget-row" key={`${item.item}-${index}`}>
                      <span>
                        {item.item}
                        <small>
                          {item.frequency} · {item.priority}
                        </small>
                      </span>
                      <span className="mono">
                        {money(item.estimatedCost, budget.currency)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="help">No allocations in this section.</p>
                )}
              </div>
            ))}
            <Action className="w-full mt-6" onClick={download}>
              <Download size={15} /> Download Excel workbook
            </Action>
            <p className="help mt-3">
              Weekly and yearly amounts are normalized to months. One-time items
              stay separate from recurring totals.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
