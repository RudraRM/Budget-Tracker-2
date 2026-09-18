"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Trash2,
  ReceiptText,
} from "lucide-react";
import { categories, money, type Transaction } from "@/lib/finance";

export function TransactionTable({
  rows,
  currency,
  onChange,
  onDelete,
}: {
  rows: Transaction[];
  currency: string;
  onChange: (id: string, patch: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const filtered = rows.filter((t) =>
    `${t.description} ${t.category} ${t.date}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const lastPage = Math.max(0, Math.ceil(filtered.length / 10) - 1),
    current = Math.min(page, lastPage);
  return (
    <>
      <div className="panel-heading">
        <div>
          <h2>
            Transactions <span className="number-chip">{rows.length}</span>
          </h2>
          <p>Review the details. Change a category at any time.</p>
        </div>
        <label className="search">
          <Search size={14} />
          <input
            aria-label="Search transactions"
            placeholder="Search transactions"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </label>
      </div>
      {!filtered.length ? (
        <div className="empty">
          <ReceiptText size={28} strokeWidth={1} />
          <h3>{rows.length ? "No matching transactions" : "A clean slate"}</h3>
          <p>
            {rows.length
              ? "Try another description, category, or date."
              : "Categorize a statement to bring your financial picture into focus."}
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(current * 10, current * 10 + 10).map((t) => (
                <motion.tr
                  layout
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <td className="mono muted">{t.date}</td>
                  <td>
                    <input
                      className="bg-transparent border-0 w-44"
                      aria-label={`Description for ${t.description}`}
                      maxLength={200}
                      value={t.description}
                      onChange={(e) =>
                        onChange(t.id, { description: e.target.value })
                      }
                    />
                  </td>
                  <td>
                    <select
                      aria-label={`Category for ${t.description}`}
                      className="category-select"
                      value={t.category}
                      onChange={(e) =>
                        onChange(t.id, {
                          category: e.target.value as Transaction["category"],
                        })
                      }
                    >
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </td>
                  <td className={`mono ${t.amount > 0 ? "positive" : ""}`}>
                    <input
                      aria-label={`Amount for ${t.description}`}
                      className="bg-transparent border-0 w-28 text-right"
                      type="number"
                      step="0.01"
                      min={-1e9}
                      max={1e9}
                      value={t.amount}
                      onChange={(e) => {
                        if (
                          e.target.value !== "" &&
                          Number.isFinite(e.target.valueAsNumber)
                        )
                          onChange(t.id, { amount: e.target.valueAsNumber });
                      }}
                    />
                    <span className="sr-only">{money(t.amount, currency)}</span>
                  </td>
                  <td>
                    <button
                      className="icon-button"
                      aria-label={`Delete ${t.description}`}
                      onClick={() => onDelete(t.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {filtered.length > 10 && (
        <div className="pagination">
          <span>
            {current * 10 + 1}–{Math.min((current + 1) * 10, filtered.length)}{" "}
            of {filtered.length}
          </span>
          <div>
            <button
              aria-label="Previous page"
              className="icon-button"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              <ArrowLeft size={14} />
            </button>
            <button
              aria-label="Next page"
              className="icon-button"
              disabled={current === lastPage}
              onClick={() => setPage(current + 1)}
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
