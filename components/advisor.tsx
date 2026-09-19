"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, MessageSquare, Trash2 } from "lucide-react";
import { Action, Busy } from "./ui";
import { requestAI } from "@/lib/client";
export type Message = { role: "user" | "assistant"; content: string };
export function Advisor({
  messages,
  setMessages,
}: {
  messages: Message[];
  setMessages: (value: Message[]) => void;
}) {
  const [draft, setDraft] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages, busy]);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || busy) return;
    const text = draft.trim(),
      next: Message[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setDraft("");
    setBusy(true);
    setError("");
    try {
      const response = await requestAI({
        mode: "chat",
        messages: next.slice(-19),
      });
      if (typeof response.message !== "string")
        throw new Error("No answer was returned. Please retry.");
      setMessages([...next, { role: "assistant", content: response.message }]);
    } catch (e) {
      setMessages(messages);
      setDraft(text);
      setError(
        e instanceof Error ? e.message : "The message could not be sent.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="chat-layout">
      <section className="panel chat-panel">
        <div className="chat-top">
          <div>
            <h2 className="text-lg">A sounding board for your budget.</h2>
            <p className="help mt-1">
              Powered by NVIDIA · Ask a question, get a next step.
            </p>
          </div>
          <button
            className="icon-button"
            aria-label="Clear conversation"
            disabled={busy || !messages.length}
            onClick={() => {
              if (confirm("Clear this conversation?")) setMessages([]);
            }}
          >
            <Trash2 size={15} />
          </button>
        </div>
        <div
          className="chat-log"
          ref={log}
          role="log"
          aria-live="polite"
          aria-label="Advisor conversation"
        >
          {!messages.length && (
            <div className="empty">
              <MessageSquare size={32} strokeWidth={1} />
              <h3>A little perspective helps.</h3>
              <p>
                Talk through a savings goal, an expense category, or a monthly
                plan. Start with what’s on your mind.
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`message ${m.role}`}>
              <div className="message-label">
                {m.role === "user" ? "YOU" : "FOLIO ADVISOR"}
              </div>
              {m.content}
            </div>
          ))}
          {busy && (
            <p className="help">
              <Busy text="Thinking through your question…" />
            </p>
          )}
        </div>
        {error && (
          <div className="notice error mx-5" role="alert">
            {error}
          </div>
        )}
        <form className="chat-compose" onSubmit={send}>
          <label className="sr-only" htmlFor="chat-message">
            Message the advisor
          </label>
          <textarea
            id="chat-message"
            maxLength={6000}
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="What would you like to make sense of?"
            disabled={busy}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <Action type="submit" disabled={busy || !draft.trim()}>
            <ArrowUp size={17} />
            <span className="sr-only">Send message</span>
          </Action>
        </form>
      </section>
      <aside className="panel">
        <h3 className="text-lg mb-5">Start somewhere.</h3>
        {[
          "How can I build a budget when my income changes each month?",
          "How should I plan for irregular yearly expenses?",
          "Help me turn a savings goal into small monthly steps.",
        ].map((prompt) => (
          <button
            className="suggestion"
            key={prompt}
            disabled={busy}
            onClick={() => setDraft(prompt)}
          >
            {prompt}
          </button>
        ))}
        <p className="help mt-7">
          Only this conversation is sent to NVIDIA. Your ledger is not shared
          automatically. Messages stay in memory for this session.
        </p>
        <p className="help mt-4">
          AI can make mistakes. Check calculations and use this as educational
          budgeting support.
        </p>
      </aside>
    </div>
  );
}
