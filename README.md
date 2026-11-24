# Gemini Decisions Interactive Playground (GDG Edition)

Interactive, **no-JSON** developer playground built by **Team AI — GDGoC FPTU** for **Road to DevFest 2026** (Nov 25, 2026). Lets presenters build `State`, `Questions` (`noul`, `choice`, `score`), and `Criteria` live using modular input blocks and `+` buttons—and immediately inspect calibrated probabilities, latency, `0 output tokens`, and 1-to-1 generated SDK code.

Powered by Google's [Gemini Decisions API](https://aistudio.google.com/docs/decisions-api) ([`gemini-decision-1`](https://aistudio.google.com/docs/models/gemini-decision-1), `v1beta`).

## Quick Start (Bun)

```bash
# 1. Install dependencies
bun install

# 2. Configure your Gemini API key (server-side only)
cp .env.example .env.local
# Edit .env.local and set GEMINI_API_KEY=...

# 3. Start the dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). If `GEMINI_API_KEY` is not set (or venue Wi-Fi drops), toggle **Mock Mode** in the top bar for safe offline demoing.

## Repository Layout

```text
├── AGENTS.md              # Coding-agent rules (auto-read by agents each session)
├── BUILD_PROMPTS.md       # Step-by-step build prompts (Prompts 1–4)
├── README.md              # Human quick-start, session starter & stage runbook
├── design/                # Exported Google Stitch reference files
│   ├── DESIGN.md          # DevPlayground Core tokens (0px corners, GDG palette)
│   ├── code.html          # Exported Stitch HTML/Tailwind layout
│   └── screen.jpg         # Visual mockup reference
└── src/                   # Next.js App Router + /api/decision + UI components
```

## Starting a New Coding-Agent Session

Keep `AGENTS.md` in the repo root (most coding agents load it automatically). Whenever you open a fresh agent chat, paste this 3-line kickoff:

```text
Read AGENTS.md and check the current files in src/ first.
Use `bun` exclusively (never npm/npx), follow design/DESIGN.md (0px corners, GDG palette), and keep everything aligned with gemini-decision-1 (v1beta, noul/choice/score only, 0 output tokens).
Task for this session: <paste your prompt from BUILD_PROMPTS.md or describe the fix>
```

## Live Stage Demo Runbook (20 Minutes — Tech Lead → AI Lead)

1. **SDK Intro (0:00–4:00):** Pick up from Tech Lead; introduce `decisions.create`, shared `input` + parallel `questions`, the 3 types (`noul`, `choice`, `score`), and `0 output tokens`.
2. **Free-Form Playground Demo (4:00–12:00):**
   - Click `+ Add State Block` to type a live example (e.g., a suspected spam message + sender context).
   - Click `+ noul`, `+ choice`, or `+ score` to add questions and `+ Add Option` / `+ Add Level` for criteria.
   - Press **`Ctrl+Enter`** (`Cmd+Enter` on Mac) to run, hot-edit a field or criterion to show probabilities shift, switch to **`</>` SDK Code** to show the 1-to-1 Python/TS snippet, and take an open audience suggestion.
3. **4 SDK Best Practices & Pitfalls (12:00–17:00):** Highlight parallel scoring, `Criteria` tuning, avoiding `noul > 0.99` and `"none_of_the_above"` (UTF-8 key sort), and `Value + Confidence` routing.
4. **Wrap-Up & Q&A (17:00–20:00):** Share the repo and [Gemini Decisions API docs](https://aistudio.google.com/docs/decisions-api).

## Useful Commands

```bash
bun run dev      # Local development server
bun run build    # Production build & TypeScript check
bun run lint     # ESLint check
```
