# Folio — Personal Budget Categorizer & Plan Maker

A complete ink-dark personal finance workspace built with Next.js App Router, TypeScript, Tailwind CSS v4, Framer Motion, Lucide, Puter.js, NVIDIA NIM, and SheetJS. The dashboard starts empty. Landing-page figures are explicitly illustrative.

## Run locally

Requires Node.js 22 or newer.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Edit `.env.local` and enter your NVIDIA API key. The default model is `meta/llama-3.3-70b-instruct`. `NVIDIA_MODEL` can select another compatible NVIDIA chat-completion model. Llama Guard is a moderation model and is not used for budget generation. Restart the server after changing environment variables.

Open http://localhost:3000. In the Categorizer, use **Connect Puter** to sign in, paste statement text, consent to provider processing, then categorize and review the extracted rows. Puter AI usage belongs to the signed-in Puter account and may require credits. No Puter API key belongs in `.env.local`.

## Production

```bash
npm ci
npm run build
npm start
```

Use a Node-capable Next.js host; this is not a static export. Set `NVIDIA_API_KEY`, `NVIDIA_MODEL`, and a strong `WORKSPACE_PASSWORD` in the host's server environment. Enter the workspace password through the dashboard's top-right connection settings. Production AI requests fail closed until a password is configured. Do not prefix secrets with `NEXT_PUBLIC_` or commit `.env.local`.

The access password protects the shared NVIDIA budget/chat endpoint; it is not a multi-user identity system. The dashboard's local ledger does not require server sign-in. This application is a personal workspace, with no bank connection, server database, billing, or cross-device sync. The in-process 20 requests/minute limit is a backstop, not a distributed rate limiter. Apply hosting-level rate limits and spending controls when exposing a shared deployment. Requests have bounded bodies, validated roles and payloads, a 50-second upstream timeout, and sanitized provider errors. Deploy behind HTTPS.

## Features

- Landing page with motion-driven workflow cards, restrained typography, clear calls to action, and local font assets.
- Five accessible tabs with a shared spring-animated indicator and keyboard navigation.
- Overview with reporting-month filter, derived income/expense metrics, weekly cash flow, category breakdown, editable transaction table, search, pagination, and deletion.
- Client-side Puter statement extraction with explicit consent, validated dates/amounts/categories, review before import, and duplicate suppression.
- Budget prompt builder with income, commitments, savings goal, horizon, and constraints. NVIDIA returns a schema-validated budget; income, currency, and fixed expense consistency are checked server-side.
- Excel download: Summary, Income Streams, Fixed Expenses, Variable Expenses, Savings Targets. Numeric formats, column widths, filters, formula cells, cached totals, and frequency normalization are included. User strings are exported as text, not executable formulas.
- Planner with computed deficits, category and subscription analysis, adjustable target/horizon, and savings milestones. Milestones are projections, not claimed achievements.
- NVIDIA chat with visible errors and draft restoration after failures. Chat and password remain in memory.
- Versioned local persistence, JSON backup/restore, explicit data clearing, reduced-motion support, and responsive layouts.

## Data and calculation rules

One currency per workspace; no exchange-rate conversion. The currency locks after importing transactions or creating a budget. Choose it in settings before entering data. Outflows are negative, inflows positive. Transfers and savings movements are excluded from expense/income totals to prevent double counting. Weekly budgets use 52/12; yearly budgets use 1/12. One-time items are excluded from recurring monthly totals. The planner uses the selected month's recorded net cash flow, which can be incomplete; without rows it uses entered income minus fixed costs and explains the missing variable costs.

Statement dates must be explicit; the categorizer asks for clarification rather than intentionally inventing missing dates. AI can still misread data, so review every row. Same date + normalized description + amount is considered a duplicate; distinguish legitimate identical purchases by editing their descriptions. Imports support 200 rows at a time, with a 10,000-row ledger limit.

Ledger, goals, and the latest budget are stored unencrypted in localStorage on the current browser profile. Do not use a shared browser profile for confidential financial information. Backups contain financial data. Puter receives statement text only after the categorization action; NVIDIA receives the budget form or chat messages. The server does not receive the ledger automatically. Chat is not persisted. No analytics or advertising SDK is installed.

## Dependencies

Puter's official package is `@heyputer/puter.js`, not `@puter/puter-js`. The package is imported only in the client categorizer. SheetJS is installed as `xlsx` from its official versioned CDN distribution (0.20.3), since the old npm-registry 0.18.5 release has known advisories. The lockfile pins the archive integrity. See https://docs.puter.com/ and https://cdn.sheetjs.com/.

The design direction uses minimalism, dark mode, clear contrast, and micro-interactions from https://uupm.cc/#styles. The implementation is original and does not copy that site's source or assets.

## Verification

```bash
npm test
npm run typecheck
npm run build
npm run test:browser
npm audit --omit=dev
```

Unit/integration tests cover calculations, deduplication, invalid dates, workbook round-trip/formula injection safety, and the NVIDIA route's authentication, validation, success, provider errors, and timeout paths. Browser tests exercise navigation, consent gating, budget download, chat, planner, backup restore, persistence, and mobile overflow. AI success responses are mocked in browser tests; live provider credentials are intentionally not included. `test:browser` uses a packaged Linux Chromium; set `CHROMIUM_PATH` to a compatible local Chromium binary on other platforms.

Full contents of the four specifically requested files are reproduced in [REQUESTED_SOURCE.md](REQUESTED_SOURCE.md). Supporting modules are required and included in this repository.
