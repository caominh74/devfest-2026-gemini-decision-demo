# Gemini Decisions Interactive Playground (GDG Edition)

Interactive, **no-JSON** developer playground built by **Team AI — GDGoC FPTU** for **Road to DevFest 2026** (Nov 25, 2026). Presenters and developers can compose shared `State` blocks (typed variables + images/PDFs) and parallel `Questions` (`noul`, `choice`, `score`) visually—then immediately inspect calibrated probabilities, confidence scores, server-measured latency, **`0 output tokens`**, and live 1-to-1 generated **TypeScript** & **Python** SDK code.

Powered by Google's [Gemini Decisions API](https://aistudio.google.com/docs/decisions-api) ([`gemini-decision-1`](https://aistudio.google.com/docs/models/gemini-decision-1), `v1beta`).

## Tech Stack

- **Runtime & Package Manager:** [Bun](https://bun.sh) exclusively (`bun.lock`; do not use `npm`/`npx`/`yarn`/`pnpm`)
- **Framework:** Next.js 16 (App Router, Turbopack) + React 19 + TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 (`DevPlayground Core` design system — sharp `0px` corners, Google 4-color spectrum, `Plus Jakarta Sans` + `JetBrains Mono`)
- **AI SDK:** `@google/genai` (`^3.6.1`, `apiVersion: "v1beta"`) — server-side only via `POST /api/decision`

## Quick Start (New Machine)

```bash
# 1. Install dependencies with Bun
bun install

# 2. Configure your Gemini API key (server-side only; never exposed to the client)
cp .env.example .env.local
# Edit .env.local and set GEMINI_API_KEY=your_api_key_here

# 3. Start the local dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Stage Safety (Offline Fallback):** If `GEMINI_API_KEY` is not set—or if venue Wi-Fi drops—the app automatically falls back to deterministic **Mock Mode**, or you can switch manually with the **Live / Mock** toggle in the top bar.

## Key Features

- **Visual State Builder (`StateBuilder.tsx`):**
  - Dynamic `SET state.` blocks (`string | number | boolean | json` with inline JSON validation).
  - Dynamic `ATTACH asset_ref` blocks for real image (`resolution: "low"`) and PDF uploads encoded to base64.
  - Visual Block Mode / Raw `input.json` preview toggle and drag-and-drop reordering via the 6-dot grip handle.
- **Parallel Question Builder (`QuestionBuilder.tsx`):**
  - **`noul`** (Blue): Binary Yes/No (`0.01–0.99`) with optional `true_description` / `false_description` criteria.
  - **`choice`** (Yellow): Single-select with dynamic option keys & criteria descriptions (`+ Add Option`) plus a tip if `"other"` is missing.
  - **`score`** (Green): Ordered 0-indexed rubric levels (`0`, `1`, `2`… with `+ Add Level`).
  - Drag-and-drop reordering via the 6-dot grip handle and `↑` / `↓` buttons.
- **Response & SDK Inspector (`ResponsePanel.tsx` & `SdkCodePanel.tsx`):**
  - Pre-run **Gemini Decision 1** overview with 3 clickable examples (*Triage a pull request*, *Route a support ticket*, *Grade a hackathon pitch*).
  - 3-column calibrated Response table (`Key & instructions`, `gemini-decision-1 · <latency>ms · 0 out tokens`, `Type`) with mini SVG donuts, horizontal dot-on-line gauges, and expandable criteria & distribution drawers.
  - Live **`</> SDK & JSON`** tab with copy-pasteable TypeScript (`@google/genai`) and Python (`google-genai`) code + Raw API Response JSON.
- **Keyboard Shortcut:** Press **`Ctrl+Enter`** (`Cmd+Enter` on macOS) anywhere to run the request.

## Repository Layout

```text
├── AGENTS.md                        # Coding-agent rules & architecture contract
├── DESIGN.md                        # DevPlayground Core design tokens (Stitch export)
├── code.html                        # Exported Stitch visual reference markup
├── screen.png                       # Exported Stitch visual mockup
├── .env.example                     # Environment variable template (GEMINI_API_KEY)
└── src/
    ├── app/
    │   ├── layout.tsx               # Plus Jakarta Sans + JetBrains Mono fonts
    │   ├── globals.css              # 0px sharp-corner rule, .scratch-block notches, .stipple-banner
    │   ├── page.tsx                 # 50/50 split Playground shell + Ctrl+Enter handler
    │   └── api/decision/route.ts    # POST /api/decision -> @google/genai (v1beta) or mockEvaluator
    ├── components/
    │   ├── TopBar.tsx               # GDG header, Clear, Live/Mock toggle, Copy SDK
    │   ├── StateBuilder.tsx         # Draggable SET state. & ATTACH asset_ref blocks
    │   ├── QuestionBuilder.tsx      # Draggable noul, choice, score blocks + 3-col Add palette
    │   ├── ResponsePanel.tsx        # Welcome examples + 3-col Response table + expandable criteria
    │   └── SdkCodePanel.tsx         # #1e1e1e terminal panel for TS/Python SDK + Raw JSON
    └── lib/
        ├── types.ts                 # Shared TS interfaces for State, Questions, API response
        ├── serialize.ts             # Converts UI blocks into official Decisions API payload
        ├── codegen.ts               # Pure TypeScript & Python SDK code generator
        ├── mockEvaluator.ts         # Deterministic offline evaluator (total_output_tokens: 0)
        └── examples.ts              # Clickable starter examples for the welcome panel
```

## Starting a New Coding-Agent Session

`AGENTS.md` sits in the repo root and is loaded automatically by most coding agents. On a fresh machine/session, you can kick off with:

```text
Read AGENTS.md, DESIGN.md, and inspect src/ first.
Use `bun` exclusively (never npm/npx), preserve sharp 0px corners and the GDG palette, and keep everything aligned with gemini-decision-1 (v1beta, noul/choice/score only, 0 output tokens).
Task: <describe what you want to add or fix>
```

## Live Stage Demo Runbook (20 Minutes — Tech Lead → AI Lead)

1. **SDK Intro (0:00–4:00):** Pick up from Tech Lead; introduce `decisions.create`, shared `input` + parallel `questions`, the 3 types (`noul`, `choice`, `score`), and `0 output tokens`.
2. **Free-Form Playground Demo (4:00–12:00):**
   - Load one of the clickable examples on the right pane (or click `+ Add State Block` to build one live from scratch).
   - Add or edit `noul`, `choice`, or `score` blocks, drag to reorder, and press **`Ctrl+Enter`** (`Cmd+Enter` on Mac).
   - Expand a row chevron to show criteria & full probability distributions, hot-edit a criterion to watch probabilities shift, and switch to **`</> SDK & JSON`** to show the 1-to-1 TypeScript/Python snippet.
3. **4 SDK Best Practices & Pitfalls (12:00–17:00):** Highlight parallel scoring, `Criteria` tuning, avoiding `noul > 0.99` and `"none_of_the_above"` (UTF-8 key sort), and `Value + Confidence` routing.
4. **Wrap-Up & Q&A (17:00–20:00):** Share the repo and [Gemini Decisions API docs](https://aistudio.google.com/docs/decisions-api).

## Useful Commands

```bash
bun install      # Install dependencies
bun run dev      # Start local dev server (http://localhost:3000)
bun run build    # Production build & strict TypeScript check
bun run start    # Run production build locally
bun run lint     # Run ESLint
```
