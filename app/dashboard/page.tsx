"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  CircleHelp,
  FileSpreadsheet,
  LayoutDashboard,
  ListFilter,
  MessageSquare,
  Plus,
  Settings2,
  ShieldCheck,
  Target,
  Wallet,
} from "lucide-react";
import { Action, Brand } from "@/components/ui";
import { TransactionTable } from "@/components/transactions";
import { Categorizer } from "@/components/categorizer";
import { BudgetBuilder } from "@/components/budget-builder";
import { Planner } from "@/components/planner";
import { Advisor, type Message } from "@/components/advisor";
import {
  budgetSchema,
  deduplicate,
  goalSchema,
  money,
  summarize,
  transactionSchema,
  type Budget,
  type Goals,
  type Transaction,
} from "@/lib/finance";

const tabs = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Categorizer", icon: ListFilter },
  { name: "Create a Budget", icon: FileSpreadsheet },
  { name: "Financial Planner", icon: Target },
  { name: "AI Advisor", icon: MessageSquare },
] as const;
const initialGoals: Goals = {
  income: 0,
  fixed: 0,
  target: 0,
  months: 12,
  currency: "USD",
  goals: "",
};
const storageKey = "folio-workspace-v1";
const storedSchema = z.object({
  transactions: z.array(transactionSchema).max(10000),
  budget: budgetSchema.nullable(),
  goals: goalSchema.extend({
    income: z.number().min(0).max(1e9),
    goals: z.string().max(3000),
  }),
});

export default function Dashboard() {
  const [tab, setTab] = useState(0),
    [visited, setVisited] = useState([0]);
  const [transactions, setTransactions] = useState<Transaction[]>([]),
    [budget, setBudget] = useState<Budget | null>(null),
    [goals, setGoals] = useState<Goals>(initialGoals);
  const [messages, setMessages] = useState<Message[]>([]),
    [password, setPassword] = useState(""),
    [ready, setReady] = useState(false),
    [notice, setNotice] = useState("");
  const [month, setMonth] = useState(""),
    [settings, setSettings] = useState(false),
    [storageError, setStorageError] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const now = new Date();
    setMonth(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    );
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const data = storedSchema.parse(JSON.parse(raw));
        setTransactions(data.transactions);
        setBudget(data.budget);
        setGoals(data.goals);
      }
    } catch {
      setNotice(
        "Saved data could not be read. Export or restore a backup before clearing this browser’s storage.",
      );
      setStorageError(true);
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || storageError) return;
    const snapshot = storedSchema.safeParse({ transactions, budget, goals });
    if (!snapshot.success) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(snapshot.data));
    } catch {
      setNotice(
        "This browser could not save changes. Export a backup before leaving.",
      );
    }
  }, [transactions, budget, goals, ready, storageError]);
  function selectTab(index: number) {
    setTab(index);
    setVisited((v) => (v.includes(index) ? v : [...v, index]));
  }
  function updateTransaction(id: string, patch: Partial<Transaction>) {
    setTransactions((rows) =>
      rows.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
  }
  function importRows(rows: Transaction[]) {
    const next = deduplicate(transactions, rows);
    if (next.length > 10000) {
      setNotice(
        "The ledger supports 10,000 rows. Export a backup and remove older rows before importing more.",
      );
      return;
    }
    setTransactions(next);
    setMonth(
      rows
        .map((t) => t.date.slice(0, 7))
        .sort()
        .at(-1) || month,
    );
    setNotice(
      `Imported ${next.length - transactions.length} new transactions. ${transactions.length + rows.length - next.length} duplicates skipped.`,
    );
    selectTab(0);
  }
  function backup() {
    const blob = new Blob(
      [JSON.stringify({ transactions, budget, goals }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "folio-backup.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function restore(file?: File) {
    if (!file) return;
    try {
      if (file.size > 5000000) throw new Error("Backup exceeds 5 MB.");
      const data = storedSchema.parse(JSON.parse(await file.text()));
      if (!confirm("Replace the current ledger and budget with this backup?"))
        return;
      setTransactions(data.transactions);
      setBudget(data.budget);
      setGoals(data.goals);
      setStorageError(false);
      setNotice("Backup restored.");
    } catch {
      setNotice(
        "This backup is invalid or exceeds 5 MB. Your existing data was not changed.",
      );
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  const rows = transactions.filter((t) => t.date.startsWith(month));
  const summary = summarize(rows),
    currency = goals.currency;
  const weeks = Array.from({ length: 5 }, (_, i) =>
    summarize(
      rows.filter(
        (t) =>
          Math.min(4, Math.floor((Number(t.date.slice(-2)) - 1) / 7)) === i,
      ),
    ),
  );
  const chartMax = Math.max(1, ...weeks.flatMap((w) => [w.income, w.expenses]));
  return (
    <div className="workspace">
      <header className="workspace-header">
        <div className="workspace-header-left">
          <Brand />
          <span>Personal workspace</span>
        </div>
        <div className="header-actions">
          <span className="pill">
            <span className="status-dot" />{" "}
            {ready ? "LOCAL WORKSPACE" : "LOADING"}
          </span>
          <button
            className="icon-button"
            aria-label="Connection and data settings"
            aria-expanded={settings}
            onClick={() => setSettings(!settings)}
          >
            <Settings2 size={17} />
          </button>
        </div>
      </header>
      <main id="main" className="workspace-main">
        <div className="workspace-intro">
          <div>
            <p className="eyebrow">A CLEARER PICTURE STARTS HERE</p>
            <h1>Your money, in perspective.</h1>
            <p>A little structure today. More possibilities tomorrow.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <label className="month-filter">
              <CalendarDays size={15} />
              <input
                aria-label="Reporting month"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </label>
            <Action onClick={() => selectTab(1)}>
              <Plus size={15} /> Add transactions
            </Action>
          </div>
        </div>
        {settings && (
          <section className="panel settings">
            <div className="panel-heading">
              <div>
                <h2>Connection & data settings</h2>
                <p>
                  The ledger and budget are stored in this browser. Export a
                  backup before clearing browser data.
                </p>
              </div>
            </div>
            <div className="settings-content">
              <label className="field">
                Workspace access password
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter the password set by the owner"
                />
              </label>
              <label className="field">
                Ledger currency
                <select
                  value={currency}
                  disabled={transactions.length > 0 || !!budget}
                  onChange={(e) =>
                    setGoals({
                      ...goals,
                      currency: e.target.value as Goals["currency"],
                    })
                  }
                >
                  {["USD", "EUR", "GBP", "INR"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <Action secondary onClick={backup}>
                Export backup
              </Action>
              <Action secondary onClick={() => fileInput.current?.click()}>
                Restore backup
              </Action>
              <input
                type="file"
                accept="application/json,.json"
                ref={fileInput}
                className="hidden"
                onChange={(e) => void restore(e.target.files?.[0])}
              />
            </div>
            <p className="help mt-4">
              Password stays in memory. Currency is locked once you have data;
              this app does not perform currency conversion.
            </p>
            <button
              className="text-link mt-4"
              onClick={() => {
                if (
                  confirm(
                    "Delete all saved Folio transactions, goals, budget, and chat from this workspace? Export a backup first.",
                  )
                ) {
                  localStorage.removeItem(storageKey);
                  setTransactions([]);
                  setBudget(null);
                  setGoals(initialGoals);
                  setMessages([]);
                  setStorageError(false);
                  setNotice("Workspace data cleared.");
                }
              }}
            >
              Clear workspace data
            </button>
          </section>
        )}
        {notice && (
          <div className="notice flex justify-between gap-4" role="status">
            <span>{notice}</span>
            <button aria-label="Dismiss notice" onClick={() => setNotice("")}>
              ×
            </button>
          </div>
        )}
        <div className="tabs" role="tablist" aria-label="Workspace sections">
          {tabs.map(({ name, icon: Icon }, i) => (
            <button
              key={name}
              role="tab"
              id={`tab-${i}`}
              aria-selected={tab === i}
              aria-controls={`panel-${i}`}
              tabIndex={tab === i ? 0 : -1}
              className={`tab ${tab === i ? "active" : ""}`}
              onClick={() => selectTab(i)}
              onKeyDown={(e) => {
                let next = i;
                if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
                else if (e.key === "ArrowLeft")
                  next = (i + tabs.length - 1) % tabs.length;
                else if (e.key === "Home") next = 0;
                else if (e.key === "End") next = tabs.length - 1;
                else return;
                e.preventDefault();
                selectTab(next);
                document.getElementById(`tab-${next}`)?.focus();
              }}
            >
              {tab === i && (
                <motion.div
                  className="tab-bg"
                  layoutId="active-workspace-tab"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Icon size={15} />
              <span>{name}</span>
            </button>
          ))}
        </div>
        {!ready ? (
          <div className="empty" role="status">
            Opening your workspace…
          </div>
        ) : (
          <>
            {visited.map((index) => (
              <motion.div
                key={index}
                role="tabpanel"
                id={`panel-${index}`}
                aria-labelledby={`tab-${index}`}
                hidden={tab !== index}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: tab === index ? 1 : 0, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {index === 0 && (
                  <>
                    <div className="metric-grid">
                      {[
                        {
                          label: "Total income",
                          value: money(summary.income, currency),
                          note: "Recorded inflows this month",
                          icon: ArrowDownLeft,
                        },
                        {
                          label: "Total expenses",
                          value: money(summary.expenses, currency),
                          note: "Excludes transfers & savings",
                          icon: ArrowUpRight,
                        },
                        {
                          label: "Net cash flow",
                          value: money(summary.remaining, currency),
                          note: "Income minus recorded expenses",
                          icon: Wallet,
                        },
                        {
                          label: "Available margin",
                          value:
                            summary.income > 0
                              ? `${summary.rate.toFixed(1)}%`
                              : "—",
                          note: "Share of income after expenses",
                          icon: ChartNoAxesCombined,
                        },
                      ].map(({ label, value, note, icon: Icon }) => (
                        <motion.div layout className="metric" key={label}>
                          <div className="metric-top">
                            <span>{label}</span>
                            <Icon size={15} />
                          </div>
                          <div className="metric-number">{value}</div>
                          <p className="metric-note">{note}</p>
                        </motion.div>
                      ))}
                    </div>
                    <div className="overview-grid">
                      <section className="panel">
                        <div className="panel-heading">
                          <div>
                            <h2>The rhythm of your month</h2>
                            <p>Income and expenses by week</p>
                          </div>
                          <div className="legend">
                            <span>
                              <i /> Income
                            </span>
                            <span>
                              <i /> Expenses
                            </span>
                          </div>
                        </div>
                        {rows.length ? (
                          <>
                            <div
                              className="chart"
                              role="img"
                              aria-label={weeks
                                .map(
                                  (w, i) =>
                                    `Week ${i + 1}: income ${money(w.income, currency)}, expenses ${money(w.expenses, currency)}`,
                                )
                                .join("; ")}
                            >
                              {weeks.map((w, i) => (
                                <div
                                  className="chart-group"
                                  key={i}
                                  title={`Week ${i + 1}: ${money(w.income, currency)} in / ${money(w.expenses, currency)} out`}
                                >
                                  <motion.div
                                    className="chart-bar"
                                    initial={{ height: 0 }}
                                    animate={{
                                      height: `${(w.income / chartMax) * 95}%`,
                                    }}
                                  />
                                  <motion.div
                                    className="chart-bar out"
                                    initial={{ height: 0 }}
                                    animate={{
                                      height: `${(w.expenses / chartMax) * 95}%`,
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="chart-labels">
                              {weeks.map((_, i) => (
                                <span key={i}>
                                  {i * 7 + 1}–
                                  {i === 4
                                    ? new Date(
                                        Number(month.slice(0, 4)),
                                        Number(month.slice(5, 7)),
                                        0,
                                      ).getDate()
                                    : (i + 1) * 7}
                                </span>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="empty">
                            <ChartNoAxesCombined size={30} strokeWidth={1} />
                            <p>
                              Import transactions for this month to see your
                              cash flow.
                            </p>
                          </div>
                        )}
                      </section>
                      <section className="panel">
                        <div className="panel-heading">
                          <div>
                            <h2>Where it goes</h2>
                            <p>Your largest spending categories</p>
                          </div>
                          <CircleHelp size={15} className="muted" />
                        </div>
                        {summary.grouped.length ? (
                          summary.grouped
                            .slice(0, 5)
                            .map(([category, amount]) => (
                              <div className="category-row" key={category}>
                                <div>
                                  <span>{category}</span>
                                  <span className="mono">
                                    {money(amount, currency)}
                                  </span>
                                </div>
                                <div className="progress-track">
                                  <motion.div
                                    className="progress-fill"
                                    initial={{ width: 0 }}
                                    animate={{
                                      width: `${(amount / summary.expenses) * 100}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            ))
                        ) : (
                          <div className="empty">
                            <ListFilter size={27} strokeWidth={1} />
                            <p>Categories appear when you import expenses.</p>
                          </div>
                        )}
                      </section>
                    </div>
                    <section className="panel">
                      <TransactionTable
                        rows={rows}
                        currency={currency}
                        onChange={updateTransaction}
                        onDelete={(id) =>
                          setTransactions((ts) => ts.filter((t) => t.id !== id))
                        }
                      />
                    </section>
                  </>
                )}
                {index === 1 && (
                  <Categorizer currency={currency} onImport={importRows} />
                )}
                {index === 2 && (
                  <BudgetBuilder
                    budget={budget}
                    goals={goals}
                    setGoals={setGoals}
                    onBudget={setBudget}
                    password={password}
                  />
                )}
                {index === 3 && (
                  <Planner rows={rows} goals={goals} setGoals={setGoals} />
                )}
                {index === 4 && (
                  <Advisor
                    password={password}
                    messages={messages}
                    setMessages={setMessages}
                  />
                )}
              </motion.div>
            ))}
          </>
        )}
        <footer className="workspace-foot">
          <span>
            <ShieldCheck size={12} className="inline mr-1" /> Your ledger stays
            in this browser. AI actions send only their stated inputs.
          </span>
          <span className="mono">FOLIO / PERSONAL FINANCE, CONSIDERED</span>
        </footer>
      </main>
    </div>
  );
}
