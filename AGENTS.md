# AGENTS.md — Gemini Decisions Interactive Playground (GDG Edition)

This repository implements the **Gemini Decisions Interactive Playground (GDG Edition)** for the **Road to DevFest 2026 — GDGoC FPTU** Team AI technical demo (Nov 25, 2026).

Read this file and the Stitch export files (`DESIGN.md`, `code.html`, `screen.jpg`) completely before modifying code or adding dependencies.

## 1. Runtime & Package Manager (Bun Only)

- **Package Manager & Runtime:** Strictly use **`bun`** (never `npm`, `npx`, `yarn`, or `pnpm`).
- **Standard Commands:**
  - Install dependencies: `bun install` / `bun add <pkg>`
  - Dev server: `bun run dev`
  - Production build & typecheck: `bun run build`
  - Lint: `bun run lint`
- **Lockfile:** Commit `bun.lock` only; do not generate `package-lock.json`.

## 2. Stitch Reference Files & Design System (`DevPlayground Core`)

Place the exported Stitch files in `design/` (or repo root) as the visual source of truth:

- `DESIGN.md` — **DevPlayground Core** tokens (sharp `0px` corner radius universally, Google developer spectrum `#4285f4` Blue / `#34a853` Green / `#fbbc04` Yellow / `#ea4335` Red + pastel washes `#e8f0fe`, `#e6f4ea`, `#fef7e0`, `#fce8e6`, `#f0f0f0` / `#fbfbfc` canvas, `#1e1e1e` ink).
- `code.html` — Exact HTML/Tailwind markup for the top `Google Developer Group / Playground [GDG Edition]` bar, `.scratch-block` notch connectors, 4px Google-colored left accent bars, and modular `State` + `Questions` cards.
- `screen.jpg` — Visual layout reference.

### Mandatory Cleanups When Porting `code.html` to React

1. **Replace leftover Jev / TypeSafe copy:** Change `jev-decision-1` → **`gemini-decision-1`** (`v1beta`), and remove all `"TypeSafe"` / `"Jev"` / `"Learn to image model"` text.
2. **Remove `+ box`:** [Gemini Decision 1](https://aistudio.google.com/docs/models/gemini-decision-1) supports strictly 3 question types: `noul`, `choice`, and `score`. Make the bottom `Add Output Block` palette a **3-column grid** (`+ noul`, `+ choice`, `+ score`).
3. **Fix `score` block criteria:** Replace the `min / max / step` numeric inputs in `code.html` with **ordered 0-indexed rubric level text inputs** (`0`, `1`, `2`...) + `+ Add Level` button, matching the [Gemini Decisions API](https://aistudio.google.com/docs/decisions-api) schema.
4. **Replace the right pane:** Swap the static `"Learn to image model"` release panel in `code.html` for the interactive **Response Table + Generated SDK Code / Raw JSON** inspector (matching the same sharp `0px` radius, hairline borders, and `Plus Jakarta Sans` + `JetBrains Mono` typography from `DESIGN.md`).
5. **Keep the canvas open & free-form:** No forced presets—users can edit, add (`+`), or clear any `State`, `Questions`, or `Criteria` block live on stage.

## 3. Tech Stack & Conventions

- **Framework:** Next.js (App Router) + TypeScript (strict mode) + Tailwind CSS (configured with `Plus Jakarta Sans` and `JetBrains Mono`, enforcing `0px` border radius per `DESIGN.md`).
- **AI SDK:** `@google/genai` (`>= 3.2.0`, `apiVersion: "v1beta"`).
- **Security:** NEVER expose `GEMINI_API_KEY` on the client. All model calls MUST run through the server-side Route Handler `POST /api/decision`.
- **Stage Safety (Live / Mock Toggle):** Include a subtle **Live / Mock** toggle in the header (and auto-fallback to Mock if `GEMINI_API_KEY` is missing) so the stage demo stays resilient if venue Wi-Fi drops.

## 4. Official Gemini Decisions API Contract

Follow the official [Gemini Decisions API](https://aistudio.google.com/docs/decisions-api) and [`gemini-decision-1`](https://aistudio.google.com/docs/models/gemini-decision-1) specification:

```ts
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1beta",
});

const result = await ai.decisions.create({
  model: "gemini-decision-1",
  input,
  questions,
});
```

- **`input` (Shared State — billed once across up to 1,000 parallel questions, up to 262,144 tokens):**
  - Serialize all `SET state.` blocks into a typed JSON object (respecting each block's `string | number | boolean | json` selector from `code.html`) inside `{ type: "text", text: JSON.stringify(stateObj) + "\n" }`.
  - For each `ATTACH asset_ref` block (image or PDF), append `{ type: "image", data: base64, mime_type, resolution: "low" }` or `{ type: "document", data: base64, mime_type: "application/pdf" }`.
- **`questions` (Parallel, Isolated Scoring):**
  - **`noul` (Yes/No):** `{ type: "noul", instructions, criteria?: { true_description, false_description } }` → returns `noul` (`0.01–0.99`), `confidence`. Never enforce thresholds `> 0.99`.
  - **`choice` (Single Select, 2–255 options):** `{ type: "choice", instructions, criteria: Record<string, string> }` → returns `choice`, `probabilities`, `confidence`. Warn subtly if `"other"` is missing (keys sort alphabetically in UTF-8; avoid `"none_of_the_above"`).
  - **`score` (Ordered Rubric, 2–255 levels):** `{ type: "score", instructions, criteria: string[] }` → returns probability-weighted `score`, `probabilities`, `legend`, `confidence`.
- **`usage`:** Always display `total_input_tokens`, **`total_output_tokens: 0`**, and server-measured `latencyMs`.

## 5. Architecture & File Layout

```text
design/
├── DESIGN.md                   # Exported Stitch design tokens
├── code.html                   # Exported Stitch visual markup
└── screen.jpg                  # Exported Stitch screenshot
src/
├── app/
│   ├── layout.tsx              # Plus Jakarta Sans + JetBrains Mono fonts, 0px sharp-corner global rule
│   ├── page.tsx                # 50/50 split Playground shell
│   └── api/
│       └── decision/
│           └── route.ts        # POST handler: validates payload, calls @google/genai, returns latencyMs
├── components/
│   ├── TopBar.tsx              # GDG 4-color squares, "Google Developer Group / Playground [GDG Edition]", Clear, Live/Mock, Copy SDK
│   ├── StateBuilder.tsx        # .scratch-block SET state. (Blue) + ATTACH asset_ref (Red) + "+ Add State Block" / "Attach Asset Block"
│   ├── QuestionBuilder.tsx     # .scratch-block noul (Blue), choice (Yellow), score (Green) + 3-button Add Output Block palette
│   ├── ResponsePanel.tsx       # 3-column structured Response table (donuts, dot-on-line gauges, expandable criteria, latency + 0 out tokens)
│   └── SdkCodePanel.tsx        # Live 1-to-1 Python (google-genai) & TypeScript (@google/genai) codegen + Raw JSON
├── lib/
│   ├── types.ts                # Shared TS interfaces for StateBlock, QuestionBlock, DecisionResponse
│   ├── codegen.ts              # Pure Python & TypeScript SDK code generator
│   └── mockEvaluator.ts        # Deterministic offline fallback evaluator
```

## 6. Verification Checklist

- [ ] `bun run build` completes with zero TypeScript or ESLint errors.
- [ ] `POST /api/decision` returns real calibrated probabilities and `usage.total_output_tokens === 0` when `GEMINI_API_KEY` is set in `.env.local`.
- [ ] Mock Mode runs completely offline with zero console errors.
- [ ] Editing any `State` block, `Question`, `Choice` option, or `Score` level updates the generated Python/TS SDK code live.
- [ ] `Ctrl+Enter` / `Cmd+Enter` triggers `Run request`.
- [ ] Zero leftover `"Jev"`, `"TypeSafe"`, `"jev-decision-1"`, or `"+ box"` references exist in the app, and sharp `0px` corners match `DESIGN.md`.
