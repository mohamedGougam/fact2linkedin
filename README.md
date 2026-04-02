# Fact2LinkedIn — Phase 3

A **Next.js** app that turns a **topic** into **researched facts** and **LinkedIn-style post drafts** (per style, tone, and length). Research and drafts run in your **browser** and on your **Next.js server** — there is **no** database, **no** user accounts, and **no** LinkedIn posting API in this version.

---

## What the app does today

| Area | Capability |
|------|------------|
| **Research** | Load facts for a topic via **mock** (offline templates) or **live web** search (when configured). |
| **Review** | Browse deduplicated **sources**, pin/sort facts, filter by confidence. |
| **Drafts** | Generate **one post per selected style**; **regenerate** all or a single slot (template rotation). |
| **Editing** | Per-post **quick polish** (shorter, tone tweaks, strip hashtags, etc.) — deterministic helpers. |
| **Notes** | **Session notes** explain fallbacks, low-confidence facts, missing dates, merged sources — same signals go into **exports** when relevant. |
| **Package** | **Draft package** summary before export (topic, counts, tone, length, styles). |
| **Export** | **Plain text** / **Markdown** downloads and **copy all posts** — built from a structured **run report**. |
| **History** | **Save** completed generations to **this browser** (localStorage); **restore all** or **reuse facts only** to draft again. |

Server logic lives under `lib/services/` (research, search, post generation). The **UI** in `app/page.tsx` stays thin by calling **`lib/workflows/runContentDraftWorkflow.ts`** for fetch orchestration and **`lib/contentRunReport.ts`** for the canonical snapshot shape.

---

## Mock mode vs live mode

### Mock (offline)

- **What:** Deterministic **template facts** for your topic — no search API calls.
- **When:** Choose **Mock** in the UI, or the server falls back when live web is unavailable.
- **Good for:** Demos, local dev, or working without API keys.

### Live web research

- **What:** The server calls a **web search API** (Brave-compatible JSON), then builds facts from **titles and snippets** returned for your query.
- **When:** Choose **Live web** in the UI **and** set **`SEARCH_API_URL`** and **`SEARCH_API_KEY`** in `.env.local`. Legacy: **`RESEARCH_PROVIDER=web`** when the request omits `researchMode`.
- **Good for:** Real URLs tied to your topic (within the limitations below).

### Fallback (live → mock)

If live web is requested but search is not configured, or the live pipeline cannot return usable facts, the app returns **mock facts** and an **`info`** message (surfaced in **Notes**). The app does not crash; errors avoid exposing secrets.

---

## Post generation: template vs AI

- **Default:** **`POST_GENERATION_PROVIDER=template`** (or unset) — deterministic templates.
- **Optional:** **`ai`** — placeholder provider; full AI drafts need implementation and **`OPENAI_API_KEY`**.

---

## History and export

- **History** stores **`ContentRunReport`** snapshots (topic, facts, posts, options, pipeline metadata, notes/issues) under **`localStorage`** — **this device only**, not synced.
- **Export** (`.txt` / `.md`) and **copy all** use the same **run report** shape so files align with what you saw in the UI.
- **Restore all** reloads a full snapshot; **reuse facts only** loads saved facts/settings and clears posts so you can generate again.

---

## Environment variables

Copy **`.env.example`** to **`.env.local`** (gitignored). You can run with **no** env file: mock research + template posts work.

| Variable | Required for | Purpose |
|----------|----------------|--------|
| **`SEARCH_API_URL`** | Live web | Search endpoint (see `.env.example`). |
| **`SEARCH_API_KEY`** | Live web | API key for that search provider. **Never commit real keys.** |
| **`RESEARCH_PROVIDER`** | Optional | `mock` (default) or `web` when the API body omits `researchMode`. |
| **`POST_GENERATION_PROVIDER`** | Optional | `template` (default) or `ai` (placeholder). |
| **`OPENAI_API_KEY`** | Optional | Reserved for future AI drafts. |

Live web needs **both** `SEARCH_API_URL` and `SEARCH_API_KEY` non-empty.

---

## Current limitations

- **Research:** Facts come from **snippets/titles**, not full-page LLM analysis; some domains are filtered as low-signal; **one** search adapter shape (Brave-style) is wired by default.
- **Storage:** History is **browser-only**; clearing site data loses it.
- **Auth & posting:** No login, no server-side persistence of user content, no official LinkedIn publish API.
- **AI posts:** Not production-ready until `aiPostProvider` is implemented.

---

## Future automation (architecture-ready)

The client workflow in **`lib/workflows/runContentDraftWorkflow.ts`** groups **research → filter → generate → package** into plain async functions. A future **scheduler or worker** can call the same steps with the same inputs/outputs; only the **caller** changes (cron vs button). No scheduling code ships in this repo yet.

---

## How to run

```bash
cd Fact2LinkedIn
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build
npm start
```

---

## Project structure (high level)

| Path | Role |
|------|------|
| `app/page.tsx` | Main UI: state, sections, wires workflow + storage. |
| `app/api/facts`, `app/api/posts` | HTTP entrypoints; delegate to `lib/services/`. |
| `lib/config.ts` | Server env (research/post providers, keys). |
| `lib/workflows/runContentDraftWorkflow.ts` | Client orchestration (fetch + pure steps). |
| `lib/contentRunReport.ts` | Typed **run report** for export + history. |
| `lib/sessionWarnings.ts` | Derives **Notes** / export issues from facts + research context. |
| `lib/historyStorage.ts` | `localStorage` read/write + legacy migration. |
| `lib/exportContent.ts` | Plain/Markdown file bodies from a run report. |
| `lib/services/research/` | Mock + web providers, orchestrator, dedup, extraction. |
| `lib/services/postGeneration/` | Template (and placeholder AI) post generation. |
| `components/` | Presentational pieces (lists, forms, panels). |

---

## Ideas for later

More search vendors; real **AI** drafts; user accounts; cloud save; LinkedIn posting API; **scheduled runs** on top of the existing workflow module.
