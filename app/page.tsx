import {
  ArrowDown,
  ArrowUpRight,
  Check,
  FileSpreadsheet,
  Fingerprint,
  ListFilter,
  MoveUpRight,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { Brand, Launch, Reveal } from "@/components/ui";

export default function Home() {
  return (
    <main id="main" className="landing">
      <header className="site-header">
        <Brand />
        <nav aria-label="Main navigation">
          <a href="#workflow">How it works</a>
          <a href="#principles">Built differently</a>
        </nav>
        <Launch />
      </header>
      <section className="hero shell">
        <Reveal>
          <div className="eyebrow">
            <span className="status-dot" /> A LITTLE CLARITY GOES A LONG WAY
          </div>
          <h1>
            Good with money.
            <br />
            <span>Better at living.</span>
          </h1>
          <p className="hero-copy">
            Give every dollar a direction. Turn scattered statements into a
            clear budget, a considered plan, and a little more breathing room.
          </p>
          <div className="hero-actions">
            <Launch />
            <a className="text-link" href="#workflow">
              See how it works <ArrowDown size={15} />
            </a>
          </div>
          <div className="hero-notes">
            <span>
              <Check size={14} /> No bank connection
            </span>
            <span>
              <Check size={14} /> Your plan, in Excel
            </span>
          </div>
        </Reveal>
        <Reveal className="hero-product" delay={0.15}>
          <div className="preview-top">
            <span className="mini-logo">
              <ListFilter size={16} /> Your month, in focus
            </span>
            <span className="pill">ILLUSTRATIVE PREVIEW</span>
          </div>
          <div className="preview-body">
            <div className="preview-heading">
              <div>
                <p className="label">AVAILABLE AFTER EXPENSES</p>
                <div className="preview-amount">
                  $1,840<span>.00</span>
                </div>
              </div>
              <div className="preview-arrow">
                <MoveUpRight size={28} strokeWidth={1.2} />
              </div>
            </div>
            <div className="cash-bar">
              <span />
              <span />
              <span />
            </div>
            <div className="preview-legend">
              <span>
                <i /> Essentials
              </span>
              <span>
                <i /> Lifestyle
              </span>
              <span>
                <i /> Room to grow
              </span>
            </div>
            <div className="preview-divider" />
            <div className="preview-row">
              <span>
                <span className="transaction-icon">
                  <ScanLine size={17} />
                </span>
                <span>
                  Statement to structure
                  <small>Everything in its right place.</small>
                </span>
              </span>
              <span className="pill">
                SORTED <Check size={12} />
              </span>
            </div>
            <div className="preview-row">
              <span>
                <span className="transaction-icon">
                  <FileSpreadsheet size={17} />
                </span>
                <span>
                  A plan you can keep<small>Made for your real life.</small>
                </span>
              </span>
              <ArrowUpRight size={18} />
            </div>
          </div>
          <div className="preview-footer">
            <ShieldCheck size={14} /> A clear picture. A more intentional next
            step.
          </div>
        </Reveal>
      </section>
      <div className="capability-strip shell">
        <span>LESS ADMIN. MORE INTENTION.</span>
        <span>01 / Categorize</span>
        <span>02 / Plan</span>
        <span>03 / Make progress</span>
      </div>
      <section id="workflow" className="section shell">
        <Reveal className="section-heading">
          <div>
            <p className="eyebrow">FROM NUMBERS TO NEXT STEPS</p>
            <h2>
              Make sense of it.
              <br />
              <span>Then make it yours.</span>
            </h2>
          </div>
          <p>
            You don’t need another spreadsheet to maintain.
            <br />
            You need a place to see the whole picture.
          </p>
        </Reveal>
        <div className="workflow-grid">
          {[
            {
              n: "01",
              icon: ScanLine,
              title: "Bring the messy bits.",
              text: "Paste your statement text. Puter AI organizes dates, descriptions, and amounts into categories you can review.",
              detail: "RAW STATEMENT → CLEAR CATEGORIES",
            },
            {
              n: "02",
              icon: FileSpreadsheet,
              title: "Give your money a plan.",
              text: "Set your income, commitments, and goals. Build a tailored budget and take the complete Excel workbook with you.",
              detail: "YOUR PRIORITIES → A REAL BUDGET",
            },
            {
              n: "03",
              icon: MoveUpRight,
              title: "Know your next move.",
              text: "Spot spending patterns, understand your monthly margin, and break a savings goal into achievable steps.",
              detail: "SMALL ACTIONS → VISIBLE PROGRESS",
            },
          ].map(({ n, icon: Icon, title, text, detail }, i) => (
            <Reveal key={n} delay={i * 0.08} className="workflow-card">
              <div className="step-top">
                <Icon size={25} strokeWidth={1.3} />
                <span>{n}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
              <div className="step-caption">{detail}</div>
            </Reveal>
          ))}
        </div>
      </section>
      <section id="principles" className="principles shell">
        <Reveal>
          <p className="eyebrow">CONSIDERED BY DESIGN</p>
          <h2>
            Your finances.
            <br />
            <span>Your frame of mind.</span>
          </h2>
          <p className="muted max-w-md mt-6">
            A quiet workspace for a noisy part of life. No feeds, no product
            pitches, no bank passwords.
          </p>
        </Reveal>
        <div className="principle-list">
          {[
            {
              icon: Fingerprint,
              title: "You decide what to share",
              text: "Your ledger stays in this browser. Statement text goes to Puter only when you choose to categorize; budget prompts and chat go to NVIDIA.",
            },
            {
              icon: ListFilter,
              title: "The details stay editable",
              text: "Review every imported row. Correct categories, remove duplicates, and work from numbers you trust.",
            },
            {
              icon: FileSpreadsheet,
              title: "Take the plan with you",
              text: "Export a five-sheet Excel workbook with income, expenses, savings, and working monthly formulas.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <Reveal key={title} className="principle">
              <Icon size={22} strokeWidth={1.3} />
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
      <Reveal className="final-cta shell">
        <p className="eyebrow">MAKE ROOM FOR WHAT MATTERS</p>
        <h2>
          A clearer month
          <br />
          starts here.
        </h2>
        <Launch>Open your workspace</Launch>
        <p>No bank login required. AI services require provider access.</p>
      </Reveal>
      <footer className="site-footer shell">
        <Brand />
        <span>Money, with a little more intention.</span>
        <span>© {new Date().getFullYear()} Folio</span>
      </footer>
    </main>
  );
}
