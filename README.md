# KAWN Content Creator Agent — Phase 4

A **Next.js** app that turns a **topic** into **researched facts** and **KAWN Post drafts** (per style, tone, and length). Research and drafts run in your **browser** and on your **Next.js server**. There is **no** database, **no** user accounts, and **no** live **Publish to KAWN** server integration in this version (exports and copy are local).

This README matches the **Phase 4** codebase: workflow configuration, automation **flags** (not schedulers), local-only storage, and a clear path toward **KAWN publishing** automation.

---

## What the app does today

| Area | What you get |
|------|----------------|
| **Research** | Load facts via **mock** (offline templates) or **live web** search (when configured). |
| **Review** | Deduplicated **sources**, pin/sort facts, filter by **confidence**, **freshness** hints on facts and sources. |
| **Drafts** | **One KAWN Post Draft per selected style**; regenerate all or one slot (template rotation). |
| **Quick polish** | Deterministic edits (shorter, tone tweaks, strip hashtags, …). Optional **AI assist** for quick polish when the server has an OpenAI key. |
| **AI rewrite** | Optional **AI improve** on a single draft (`/api/posts/rewrite`); falls back gracefully if unavailable. |
| **Content brief** | Optional brief (deterministic or AI-enhanced when configured). |
| **Notes** | Session **notes** (pipeline fallbacks, low-confidence facts, …) — same signals can flow into **exports**. |
| **Compare drafts** | Select **two or more** KAWN Post Drafts to compare side by side (read-only; edits stay in the cards above). |
| **Draft package** | Compact **summary** before export (topic, counts, tone, length, styles). |
| **KAWN Publish Ready** | When drafts exist, a **full bundle** view: topic, settings, brief, warnings, facts, sources, **KAWN Posts** — aligned with file export. |
| **Export** | **Plain text** / **Markdown** downloads and **copy all KAWN Posts** — built from one structured **run report**. |
| **History** | **Save** runs to **this browser** (`localStorage`); **restore all** or **reuse facts only**. |
| **Watchlist** | Save topics to revisit; optional **recurring preferences** (stored only — **no scheduling**). **Monitoring preview** explains what a future automated run could look like. |
| **Style memory** | Tone, length, styles, and research mode **persist** in the browser and reload next visit. |
| **Automation candidates** | Flag a **watchlist row**, a **saved run**, or **saved preferences** as a future automation candidate (local flags only). |
| **Traceability** | Each KAWN Post Draft can show which **facts** were used when it was generated. |

Server logic lives under `lib/services/`. The main page stays thinner by calling **`lib/workflows/runContentDraftWorkflow.ts`** for research/generate orchestration and **`lib/contentRunReport.ts`** for the canonical snapshot used by history and export.

---

## Feature notes (beginner-friendly)

### AI-assisted rewriting

- **AI improve** (per post): calls **`POST /api/posts/rewrite`** with your draft and context. Requires **`OPENAI_API_KEY`** on the server.
- **AI assist quick polish**: when enabled, quick-polish actions try the same API and fall back to deterministic rules if the call fails.
- **AI enhance brief** / **AI topic suggestions**: optional; deterministic paths always exist.

Nothing publishes to KAWN automatically; AI only rewrites text you already have in the app.

### Watchlist and future monitoring

- Add topics you want to revisit. Each row can store **recurring preferences** (e.g. intended frequency, tone, length) — **informational only**; nothing runs on a schedule.
- **Preview monitoring run** opens a dialog that describes a **hypothetical** pipeline using saved prefs + current session defaults. Use **Run research** to execute the real flow today.

### Style memory

- **Preferred** tone, length, post styles, and research mode are saved to **`localStorage`** whenever you change them.
- **Reset preferences** clears that memory and restores defaults. **Mark saved preferences as automation candidate** is a separate local flag for future automation planning.

### Compare drafts

- Check **Compare** on two or more post cards to open **Compare drafts**: stacked columns with copy buttons. Editing still happens in the main post cards.

### Traceability and freshness

- **Confidence** bands and scores on facts; **Notes** aggregate session-level issues (e.g. mock fallback).
- **Freshness** badges on facts and sources classify publication dates (e.g. recent vs older) when dates exist — hints only, not a guarantee of accuracy.

### Draft-to-publish package (KAWN Publish Ready)

- After generation, the **KAWN Publish Ready** section shows a **single readable snapshot**: topic, research line, generation settings, optional **content brief**, **warnings**, selected facts, **source list**, and **generated KAWN Posts**. Exports (`.txt` / `.md`) can include the same structured content so files match what you reviewed.

### Current limitations

- **Research:** Facts are built from **search snippets/titles**, not full-page analysis; some domains are treated as low-signal; one search adapter shape (Brave-style) is wired by default.
- **Storage:** History, watchlist, style memory, and automation flags are **browser-only**; clearing site data loses them.
- **Auth & KAWN publishing:** No login, no cloud sync, no server-side **Publish to KAWN** pipeline in this repo.
- **Scheduling:** No cron, no background workers — watchlist **recurring** fields and **automation candidates** are **labels + stored prefs**, not executed jobs.
- **AI:** Depends on env configuration; failures should degrade to deterministic behavior where possible.

### Future direct automation opportunities

The codebase is structured so a **scheduler or worker** could call the **same steps** as the UI (`runContentDraftWorkflow`, API routes, or packaged `WorkflowAutomationConfig`), without changing the core contract:

- **`WorkflowAutomationConfig`** (`lib/workflowAutomationConfig.ts`) — one typed object for topic, research mode, generation defaults, optional watchlist/recurring context, and per-snapshot automation intent.
- **`AutomationCandidatesState`** (`lib/automationCandidatesStorage.ts`) — which watchlist ids, history run ids, and “settings profile” are flagged locally.
- **`runContentDraftWorkflow`** — async pipeline already grouped for client use; a future caller would supply inputs and persist outputs elsewhere.

What is **not** here yet: durable queues, server-side user storage, OAuth, a live **KAWN** publish API integration, or cron. Those would sit **outside** this app and call into the same workflows.

---

## Mock mode vs live mode

### Mock (offline)

- **What:** Deterministic **template facts** for your topic — no search API calls.
- **When:** Choose **Mock** in the UI, or the server falls back when live web is unavailable.
- **Good for:** Demos, local dev, or working without API keys.

### Live web research

- **What:** The server calls a **web search API** (Brave-compatible JSON), then builds facts from **titles and snippets**.
- **When:** Choose **Live web** **and** set **`SEARCH_API_URL`** and **`SEARCH_API_KEY`** in `.env.local`. Legacy: **`RESEARCH_PROVIDER=web`** when the API body omits `researchMode`.
- **Good for:** Real URLs tied to your topic (within the limitations above).

### Fallback (live → mock)

If live web is requested but search is not configured, or the pipeline cannot return usable facts, the app returns **mock facts** and an **`info`** message (surfaced in **Notes**). Errors avoid exposing secrets.

---

## Post generation: template vs AI

- **Default:** **`POST_GENERATION_PROVIDER=template`** (or unset) — deterministic templates.
- **Optional:** **`ai`** — placeholder provider; production AI drafts need a full provider implementation and **`OPENAI_API_KEY`**.

---

## History and export

- **History** stores **`ContentRunReport`** snapshots (topic, facts, posts, options, pipeline metadata, issues, optional brief) under **`localStorage`** — **this device only**.
- **Export** (`.txt` / `.md`) and **copy all KAWN Posts** use the same **run report** shape where applicable; the **KAWN Publish Ready** view mirrors that bundle for review.
- **Restore all** reloads a full snapshot; **reuse facts only** loads saved facts/settings and clears posts so you can generate again.

---

## Environment variables

Copy **`.env.example`** to **`.env.local`** (gitignored). You can run with **no** env file: mock research + template posts work.

| Variable | Required for | Purpose |
|----------|----------------|--------|
| **`SEARCH_API_URL`** | Live web | Search endpoint (see `.env.example`). |
| **`SEARCH_API_KEY`** | Live web | API key for that provider. **Never commit real keys.** |
| **`RESEARCH_PROVIDER`** | Optional | `mock` (default) or `web` when the API body omits `researchMode`. |
| **`POST_GENERATION_PROVIDER`** | Optional | `template` (default) or `ai` (placeholder). |
| **`OPENAI_API_KEY`** | Optional | Enables **AI improve**, **AI assist quick polish**, and other routes that call OpenAI when implemented. |

Live web needs **both** `SEARCH_API_URL` and `SEARCH_API_KEY` non-empty.

---

## How to run

```bash
cd KawnContentCreatorAgent
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

---

## Project structure (Phase 4)

| Path | Role |
|------|------|
| `app/page.tsx` | Main UI: state, sections, workflow + storage wiring. |
| `app/api/facts`, `app/api/posts`, `app/api/posts/rewrite`, … | HTTP entrypoints; delegate to `lib/services/`. |
| `lib/config.ts` | Server env (research/post providers, keys). |
| `lib/workflows/runContentDraftWorkflow.ts` | Client orchestration (research → generate phases). |
| `lib/contentRunReport.ts` | Typed **run report** for export, history, KAWN Publish Ready. |
| `lib/workflowAutomationConfig.ts` | Unified **workflow + automation** snapshot type and builders. |
| `lib/automationCandidatesStorage.ts` | Local **automation candidate** flags (watchlist / runs / settings). |
| `lib/styleMemory.ts` | Persisted **default** tone, length, styles, research mode. |
| `lib/watchlistStorage.ts` | Watchlist items + optional recurring prefs. |
| `lib/historyStorage.ts` | `localStorage` for saved runs + legacy migration. |
| `lib/exportContent.ts` | Plain/Markdown bodies from a run report. |
| `lib/sessionWarnings.ts` | **Notes** / export issues from facts + research context. |
| `lib/formatIsoTimestamp.ts` | Shared ISO timestamp formatting for UI. |
| `lib/services/research/` | Mock + web providers, orchestrator, dedup, extraction. |
| `lib/services/postGeneration/` | Template (and placeholder AI) post generation. |
| `components/` | UI pieces: facts, posts, watchlist, history, compare, packages, … |

---

## Ideas for later

More search vendors; stronger **AI** drafts; user accounts; cloud save; **native Publish to KAWN** integration; **scheduled runs** implemented **on top of** `WorkflowAutomationConfig` + the existing workflow module — without changing the core snapshot shapes.
