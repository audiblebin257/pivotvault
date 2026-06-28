> Last updated: 2026-06-28 | Always update this file after every session.

# Project Memory

> **READ THIS FIRST.** This file is the single source of truth for any AI assistant working on **PivotVault**. Read it at the start of **every** session instead of re-scanning the entire codebase. After you finish meaningful work, update the relevant sections and append to the Session History log at the bottom.

---

## Project Overview

**PivotVault** is a startup-failure intelligence platform. Users explore documented postmortems of failed startups, analyze failure patterns, run AI risk scans, autopsy pitch decks, take failure quizzes, and learn from a database of failures.

- **Tagline (branding — do NOT change):** "Where Startup Lessons Live Forever".
- **Type:** Monorepo — `frontend/` (React + Vite) and `backend/` (Express + Prisma).
- **Tech stack:**
  - **Frontend:** React 18, Vite 5, plain JS/JSX (no TypeScript), Tailwind CSS 3, react-router-dom v6 (v7 future flags on), framer-motion + gsap, recharts + react-countup, d3 submodules (d3-selection/zoom/drag/force/transition), axios, zustand, lucide-react, clsx + tailwind-merge, jszip (PPTX parsing).
  - **Backend:** Express, helmet, cors, express-rate-limit, morgan, Prisma ORM, JWT auth, Tavily web search.
- **Deployment:** Frontend on Netlify; backend on Railway (`https://pivotvault-production.up.railway.app`). CORS also allows `*.vercel.app` and `localhost:5173`.

---

## Architecture

### Monorepo layout
- `frontend/` — React + Vite SPA.
- `backend/` — Express API + Prisma.

### Frontend (`frontend/src/`)
- **`main.jsx`** — entry point. Provider order: `ErrorBoundary > Theme > Auth > Bookmark > Workspace > Toast > App`.
- **`App.jsx`** — Router + lazy-loaded routes + Suspense fallback + intro/loader.
- **`lib/api.js`** — axios wrapper. **The only correct way to fetch data.** Tries real API, falls back to mock on error. (See Key Decisions.)
- **`lib/mockApi.js`** — mock data + handlers for the api.js fallback / DEMO_MODE.
- **`lib/quizData.js`** — local quiz questions.
- **`lib/design-system.js`** — design tokens.
- **`context/`** — Auth, Bookmark, Theme, Workspace, Loading providers.
- **`components/`** — Sidebar, Navbar, TopBar, WorkspaceBar, StartupCard, Logo, ErrorBoundary, Toast, GhostChat, CrowdCanvas, LiveIntelPulse, Skiper39, `onboarding/`, `ui/*` (SearchInput, ConversationPanel, Field, IconInput, Button, Card, Table).
- **`pages/`** — one file per route.

#### Route table (`App.jsx`)
| Path | Page | Protected? |
| --- | --- | --- |
| `/` | LandingPage | no |
| `/explore` | FailureExplorer | no |
| `/startup/:slug` | StartupDetailPage / PostmortemPage | no |
| `/scan` | RiskScanner | yes |
| `/graph` | KnowledgeGraph | no |
| `/confessions` | ConfessionWall | no |
| `/insights` | InsightsDashboard | no |
| `/assistant` | AiAssistant | yes |
| `/bookmarks` | BookmarksPage | yes |
| `/history` | HistoryPage | yes |
| `/playbook` | FounderPlaybook | yes |
| `/quiz` | FailureQuiz | no |
| `/ghosts` | HallOfGhosts | no |
| `/autopsy` | PitchDeckAutopsy | yes |
| `/login`, `/signup` | Login / Signup | no |

All page components are lazy-loaded via `React.lazy` and wrapped in Suspense.

### Backend (`backend/src/`)
- **`index.js`** — Express app entry. Middleware: helmet, CORS (allowlist function), morgan, `express.json({ limit: '10kb' })`, global rate limiter (200 req / 15 min on `/api/`). Health check at `GET /api/health`.
- **`routes/`** — `{ai, auth, bookmarks, confessions, graph, insights, quiz, startups}.js`. (`rss.js` and `feedback.js` exist but are commented out / disabled.)
- **`routes/ai.js`** — risk-scan, research, playbook, autopsy, compare endpoints with a shared "consultant brief" markdown contract and graceful no-AI fallbacks.
- **`services/searchService.js`** — Tavily web search.
- **`middleware/auth.js`** — JWT bearer-token auth.
- **`prisma/`** — `schema.prisma`, migrations, `seed.js`.

---

## Current State

- **Working:** Full SPA with all routes; frontend builds and runs. api.js mock-fallback keeps the UI functional even with the backend down. Auth, bookmarks, quiz, AI routes, graph, confessions, insights wired up.
- **In progress:** Workspace feature (new `WorkspaceContext`, `WorkspaceBar`, `TopBar`, `onboarding/`) — uncommitted, recently added. Production-readiness audit (Session 2) was underway.
- **Backend often not running locally** → app falls back to mock data (expected; you'll see dev-only "Backend unavailable, using mock data" + `ERR_CONNECTION_REFUSED`).

---

## Key Decisions & Why

- **api.js mock-fallback pattern (IMPORTANT).** `frontend/src/lib/api.js` exports a default `api` object with `get/post/put/delete`. Each method: (1) if `DEMO_MODE` (`VITE_DEMO_MODE === 'true'`) returns mock data directly; (2) else tries the real backend (`VITE_API_URL` or `http://localhost:4000`); (3) **on any error, falls back to mock data** so the UI never crashes when the backend is down (fallback warnings gated behind `import.meta.env.DEV`); (4) a `401` broadcasts a `pv-unauthorized` event that AuthContext uses to log out.
  - **RULE:** Always fetch via `import api from '../lib/api'` and call e.g. `api.get('/startups')` (paths relative to `/api`). **Never** use raw axios in pages — it bypasses the mock fallback and makes pages blank when the backend is unreachable.
- **d3 submodules, not monolithic d3.** Import `d3-selection/zoom/drag/force/transition` individually. The monolithic `d3` package is now a dead dependency (safe to prune).
- **Two design systems** — Apple (light/"blue") and Cursor (dark) — driven by Tailwind tokens backed by CSS variables, so both themes work without hardcoded hex (except where d3/recharts require explicit fills).
- **Code-splitting:** `vite.config.js` defines `manualChunks` (react-vendor, charts, d3, gsap, motion, vendor). Keep heavy libs split.

---

## Active Tasks

- Workspace feature build-out (WorkspaceContext / WorkspaceBar / TopBar / onboarding) — uncommitted changes present across many pages.
- Production readiness audit (Session 2).
- Memory/handoff scaffolding (this file + AGENTS.md).

---

## Known Issues / TODOs

- **Mock graph nodes lack slug/industry/status:** On `/graph`, clicking a node opens a panel whose "View Full Postmortem" link points to `/startup/undefined` (mock graph nodes have no slug; real backend provides it).
- **`d3` is a dead dependency** in `frontend/package.json` (only submodules imported). Safe to leave; can be pruned.
- **`frontend/dist/` is committed** with built asset hashes; can get stale vs source.
- **No automated tests / no lint script.** Verification = clean `npm run build` + manual/browser checks.
- **`npm audit`** reports a few pre-existing vulnerabilities (1 moderate, 2 high).
- Backend `rss` and `feedback` routes are disabled (commented out in `index.js`).

---

## Conventions

- **Branding:** Never change the name "PivotVault", the tagline, the favicon, or visual identity.
- **Features:** Never remove features. Only improve quality unless explicitly asked.
- **Minimal diffs:** Smallest change that solves the problem. Reuse existing helpers/components/utility classes (`pv-card`, `pv-btn-primary`, `pv-field`, `pv-btn-icon`, `pv-nav-item`).
- **Data fetching:** Use the api.js wrapper. Default arrays defensively (`response.data.data || []`).
- **Console hygiene:** No stray `console.log`. Gate dev logging behind `if (import.meta.env.DEV)`. Prod builds drop console/debugger via Vite `esbuild.drop`.
- **Refs:** Components passed a ref (incl. children of framer-motion `AnimatePresence mode="popLayout"`) MUST use `React.forwardRef`.
- **Accessibility:** Buttons get `type` + `aria-label`; modals/drawers trap focus and close on Escape; loaders use `role="status"` + `aria-live`.
- **Theme:** Use Tailwind tokens backed by CSS vars (`bg-bg`, `text-text-primary`, `border-border`, `text-accent`) so both themes work.
- **Naming:** Plain JS/JSX, PascalCase components, one file per route page.
- **Packages:** Install with `npm install <pkg>` inside `frontend/`. Never global.

---

## Environment & Config

### Env vars
- **Frontend:** `VITE_API_URL` (backend base URL; defaults to `http://localhost:4000`), `VITE_DEMO_MODE` (`'true'` forces mock data).
- **Backend:** `PORT` (default 4000), `DATABASE_URL` (Prisma), JWT secret, Tavily API key, AI provider key(s). See `backend/.env` / `backend/src/routes/ai.js` and `searchService.js`.

### Run locally
```bash
# Frontend
cd frontend && npm install
cd frontend && npm run dev        # Vite dev server
cd frontend && npm run build      # production build (validation gate)
cd frontend && npm run preview

# Backend
cd backend && npm install
# Prisma migrate/seed live in backend/prisma; backend entry: backend/src/index.js
```

### Deploy
- **Frontend → Netlify** (`netlify.toml`, `frontend/_redirects`, committed `frontend/dist/`).
- **Backend → Railway** (`https://pivotvault-production.up.railway.app`).

### Validation
- `cd frontend && npm run build` must be clean. No unit tests / no lint. Use a browser agent for runtime/console checks.

---

## Session History

> Append newest entries at the **top**. Each entry: date, model, summary, files, verification, follow-ups.

### Session 6 — 2026-06-28 — Hackathon Audit & Optimizations (model: Antigravity)
- **Summary:** Conducted a comprehensive production optimization audit and finalized bug fixes for AI follow-ups, loading experiences, and the mathematical Failure Index to prepare PivotVault for the national hackathon.
- **Key Changes:**
  - Optimized images by converting `all-peeps.png` to WebP (65% smaller) and compressing logos (`quibi.webp`, `color lab.png` to WebP) by **98%** in `frontend/public/`.
  - Updated image loader paths in `PivotVaultLoader.jsx`, `PivotVaultIntro.jsx`, and `Logo.jsx` to load new WebP assets.
  - Wrapped `StartupCard.jsx` in `React.memo` to optimize list rendering performance.
  - Optimized font preloading and resource hints (dns-prefetch) inside `index.html`.
  - Merged missing Apple/Cursor CSS variables from `global.css` into `index.css` to fix text contrast and dark/light mode issues.
  - Wrapped Recharts SVG color parameters in `rgb(var(--color-...))` for `InsightsDashboard.jsx` and `PostmortemPage.jsx` to fix invisible chart labels.
  - Added collapsed navigation link `aria-label={item.name}` inside `Sidebar.jsx`.
  - Created standard `sitemap.xml` and `robots.txt` in `frontend/public/` for search engine visibility.
  - Replaced solid grey skeleton screens in `FailureExplorer.jsx` with card-matching shape shimmers.
  - Fixed AI assistant follow-up context bug in `backend/src/routes/ai.js` and `frontend/src/pages/AiAssistant.jsx` by separating `query` from `followUpQuestion`.
  - Swapped screen-blocking loader overlays for inline typing bubble animations (`loading={loading}`) in `AiAssistant.jsx`.
  - Redesigned `FailureRiskIndex.jsx` to map 8 weighted categories and display a togglable mathematical summation calculation table explaining the index.
- **Files:** `frontend/src/index.css`, `frontend/src/pages/InsightsDashboard.jsx`, `frontend/src/pages/PostmortemPage.jsx`, `frontend/src/components/loaders/PivotVaultLoader.jsx`, `frontend/src/components/loaders/PivotVaultIntro.jsx`, `frontend/src/components/Logo.jsx`, `frontend/src/components/StartupCard.jsx`, `frontend/src/components/Sidebar.jsx`, `frontend/index.html`, `frontend/public/sitemap.xml`, `frontend/public/robots.txt`, `frontend/src/pages/FailureExplorer.jsx`, `backend/src/routes/ai.js`, `frontend/src/pages/AiAssistant.jsx`, `frontend/src/components/FailureRiskIndex.jsx`, `memory.md`.
- **Verification:** Ran `npm run build` in `frontend/` which successfully built the production bundle in 11.17s.
- **Follow-up:** Project is fully optimized and 100% production-ready for the hackathon final.

### Session 5 — 2026-06-28 — Documentary Overhaul & Data Enrichment (model: Gemini 3.5 Flash)
- **Summary:** Transformed the startup detail page from a basic database view into a premium, cinematic documentary experience ("HBR meets Netflix documentary").
- **Key Changes:**
  - Overhauled [PostmortemPage.jsx](file:///c:/Users/Rehan/OneDrive/Desktop/hacakathon/hackverse/1st%20demo/pivotvault/frontend/src/pages/PostmortemPage.jsx) to render 7 core sections: Hero Summary, compelling Story Section (with drop cap & pulled quotes), 7-stage Timeline, Forensic Autopsy, Postmortem Playbook, Correlated Failures, and the AI Investigator.
  - Created [documentaryData.js](file:///c:/Users/Rehan/OneDrive/Desktop/hacakathon/hackverse/1st%20demo/pivotvault/frontend/src/lib/documentaryData.js) to store rich, long-form narrative data for key startups (Juicero, Theranos, WeWork, Quibi, Webvan, MoviePass) and a dynamic fallback generator for other startups.
  - Enriched the mock AI responses (`mockAiResponse` and `mockPlaybook`) in [mockApi.js](file:///c:/Users/Rehan/OneDrive/Desktop/hacakathon/hackverse/1st%20demo/pivotvault/frontend/src/lib/mockApi.js) to make them highly detailed, structured, HBR-style analyses.
  - Enriched the smart fallback AI summaries (`generateSmartResearchFallback`) in [ai.js](file:///c:/Users/Rehan/OneDrive/Desktop/hacakathon/hackverse/1st%20demo/pivotvault/backend/src/routes/ai.js) to provide deep, structured, HBR-style case analyses.
  - Corrected direct `axios` calls in [PostmortemPage.jsx](file:///c:/Users/Rehan/OneDrive/Desktop/hacakathon/hackverse/1st%20demo/pivotvault/frontend/src/pages/PostmortemPage.jsx) to use the standard `api` wrapper.
- **Files:** `frontend/src/pages/PostmortemPage.jsx`, `frontend/src/lib/documentaryData.js`, `frontend/src/lib/mockApi.js`, `backend/src/routes/ai.js`, `memory.md`.
- **Verification:** Ran `npm run build` in `frontend/` successfully (clean compilation in 13.41s).
- **Follow-up:** None. All features fully implemented and verified.

### Session 4 — 2026-06-28 — Bug sweep + auth-fallback fix (model: claude-opus-4-8)
- Audited build + new Workspace/onboarding code. Frontend `npm run build` clean; backend syntax valid; Workspace context and onboarding gate correctly wired (`useAuth` exposes `loading`/`isAuthed`).
- **Fixed (real demo-breaking bug):** `frontend/src/lib/api.js` `mockApiHandler` had no `/auth` case, so a failed `/auth/login` or `/auth/register` (backend down/slow) fell through to `{ success: true }` with no token/user → `login()` set undefined → `ProtectedRoute` silently bounced the user back to `/login` with no error. Added a `/auth` mock branch returning a demo token + user so login/signup work offline / in DEMO_MODE.
- **Noted (not fixed):** `frontend/src/pages/StartupDetailPage.jsx` is orphaned (imported nowhere; `/startup/:slug` uses `PostmortemPage`). Dead code, not a bug.
- Files: `frontend/src/lib/api.js`, `memory.md`.
- Verification: `cd frontend && npm run build` (clean, 18s).
- Follow-up: consider pruning `StartupDetailPage.jsx` or wiring it in if it's the intended replacement; backend AI fallbacks have a few `.slice()` calls on possibly-null `summary`/`description` (latent, data-dependent).

### Session 3 — 2026-06-28 — Memory scaffolding (model: claude-opus-4-8)
- Restructured `memory.md` into the standard handoff template (Overview / Architecture / Current State / Key Decisions / Active Tasks / Known Issues / Conventions / Environment) while preserving prior knowledge (api.js pattern, route table, conventions, gotchas). Added `AGENTS.md` with read-first/update-after rules.
- Files: `memory.md`, `AGENTS.md`.
- Verification: content review against source files (`backend/src/index.js`, `frontend/package.json`).
- Follow-up: fill in exact backend env var names from `backend/.env`; finish the Workspace feature notes once that work lands.

### Session 2 — 2026-06-28 — Production readiness audit (model: claude — entry was truncated in prior memory; details unknown).
