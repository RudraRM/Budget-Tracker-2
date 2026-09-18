"use client";
import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { money, summarize, type Goals, type Transaction } from "@/lib/finance";
export function Planner({
  rows,
  goals,
  setGoals,
}: {
  rows: Transaction[];
  goals: Goals;
  setGoals: (value: Goals) => void;
}) {
  const summary = summarize(rows);
  const [topCategory, topAmount] = summary.grouped[0] || ["", 0];
  const monthly = goals.months > 0 ? goals.target / goals.months : 0;
  const margin = rows.length ? summary.remaining : goals.income - goals.fixed;
  const gap = Math.max(0, monthly - margin);
  const subscriptions = rows
    .filter((t) => t.category === "Subscriptions" && t.amount < 0)
    .reduce((s, t) => s - t.amount, 0);
  const milestones = [
    ...new Set([1, 2, 3, 4].map((n) => Math.ceil((goals.months * n) / 4))),
  ].map((month) => ({ month, value: monthly * month }));
  return (
    <div className="split">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">03 / SMALL MOVES, REAL PROGRESS</p>
            <h2 className="mt-3">Give your goal a timeline.</h2>
            <p>Explore a simple monthly savings scenario.</p>
          </div>
          <Target size={25} strokeWidth={1.3} />
        </div>
        <div className="form-grid">
          <label className="field">
            Savings target ({goals.currency})
            <input
              type="number"
              min="0"
              max="1000000000"
              step="0.01"
              value={goals.target}
              onChange={(e) =>
                setGoals({
                  ...goals,
                  target: Math.max(0, Math.min(1e9, Number(e.target.value))),
                })
              }
            />
          </label>
          <label className="field">
            Time horizon · {goals.months} months
            <input
              aria-label="Savings horizon"
              type="range"
              min="1"
              max="120"
              value={goals.months}
              onChange={(e) =>
                setGoals({ ...goals, months: Number(e.target.value) })
              }
            />
          </label>
        </div>
        <motion.div layout className="planner-metric">
          {money(monthly, goals.currency)}
        </motion.div>
        <p className="help">
          to set aside each month · no interest or returns assumed
        </p>
        {goals.target > 0 ? (
          <div className="step-list">
            {milestones.map((step, i) => (
              <motion.div layout key={i} className="plan-step">
                <p className="eyebrow">
                  MILESTONE {i + 1} / MONTH {step.month}
                </p>
                <h3>{money(step.value, goals.currency)} set aside</h3>
                <p>
                  {
                    [
                      "Choose a dedicated savings category and schedule a monthly check-in. Confirm that essentials are covered before allocating your first amount.",
                      "Compare actual spending against your plan. Review discretionary purchases and update your contribution if income or costs changed.",
                      "Recheck upcoming irregular bills. Keep a buffer so an unexpected expense does not erase your progress.",
                      "Review your balance against the target, then choose whether to extend the timeline or start the next goal.",
                    ][i]
                  }
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="empty">
            <Target size={30} />
            <h3>Choose something worth saving for</h3>
            <p>Set a target above zero to see your milestone timeline.</p>
          </div>
        )}
      </section>
      <aside className="panel">
        <div className="panel-heading">
          <div>
            <h2>The signals worth noticing.</h2>
            <p>
              {rows.length
                ? "Calculated from the selected month’s ledger."
                : "Add transactions for a detailed spending analysis."}
            </p>
          </div>
        </div>
        <div
          className={`notice ${margin < 0 || gap > 0 ? "error" : "success"}`}
        >
          <strong>
            {margin < 0
              ? "Cash-flow deficit"
              : gap > 0
                ? "Your timeline needs room"
                : "Within the available margin"}
          </strong>
          <p>
            {margin < 0
              ? `Outflows exceed income by ${money(-margin, goals.currency)}. Reconcile missing income and recurring commitments before allocating savings.`
              : gap > 0
                ? `This target needs ${money(gap, goals.currency)} more per month than the available margin. Try a longer timeline or a smaller target.`
                : `${money(Math.max(0, margin - monthly), goals.currency)} remains after the planned monthly contribution.`}
          </p>
        </div>
        <p className="help">
          {rows.length
            ? "This is a snapshot, not a forecast. Imported data may cover only part of the month. Transfers and savings movements are excluded."
            : "Without transactions, the estimate uses entered income minus fixed costs and does not include variable expenses."}
        </p>
        <div className="insight mt-5">
          <h3>Largest spending category</h3>
          <p>
            {topCategory
              ? `${topCategory} accounts for ${money(topAmount, goals.currency)} (${Math.round((topAmount / summary.expenses) * 100)}% of recorded expenses). A 10% reduction would free up ${money(topAmount * 0.1, goals.currency)}; check whether this is practical before changing your plan.`
              : "Import a statement to see where your spending concentrates."}
          </p>
        </div>
        <div className="insight">
          <h3>Recurring-cost review</h3>
          <p>
            {subscriptions
              ? `You recorded ${money(subscriptions, goals.currency)} in subscriptions. Review renewal dates, duplicated services, and unused plans; the full amount is not necessarily reducible.`
              : "No subscription expenses are recorded for this month. Review categories to make sure recurring payments are correctly assigned."}
          </p>
        </div>
        <div className="insight">
          <h3>Keep the plan honest</h3>
          <p>
            Check upcoming annual bills and irregular costs. This timeline
            assumes equal monthly contributions, and does not claim that savings
            have already happened.
          </p>
        </div>
      </aside>
    </div>
  );
}
