# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev       # start dev server (Next.js, usually :3000 or :3001 if occupied)
npm run build     # production build
npm run lint      # ESLint
npx tsc --noEmit  # type-check without emitting (run after every change)
```

No test suite is configured.

## Architecture

### Stack
- **Next.js 16.2.7** App Router, React 19, TypeScript
- **Hono** for all backend API logic — mounted at `app/api/[[...route]]/route.ts` via `hono/vercel`. Business logic lives in `server/`, not in Next.js route handlers.
- **Supabase** is wired up (`lib/supabase/`) but currently acts as a placeholder. All data served to the UI is static frontend data from `lib/data/home.ts`.
- **Chart.js** for trend charts in survey detail.

### Routing (App Router)
| Route | Component |
|---|---|
| `/` | `components/features/home/ora-market-home.tsx` |
| `/trending` | `components/features/trending/trending-page.tsx` |
| `/latest` | `components/features/latest/latest-page.tsx` |
| `/category/[slug]` | `components/features/category/category-page.tsx` |
| `/survey/[id]` | `components/features/survey/survey-detail.tsx` |
| `/search` | `components/features/search/search-results.tsx` |

Each `app/*/page.tsx` is a thin shell that re-exports metadata and renders the feature component.

### Styling
All styles live in `app/globals.css` as hand-rolled CSS classes — **no Tailwind utility classes in components**. Feature components use `className="..."` for these global classes and `style={{...}}` for one-off overrides.

Key design tokens (CSS vars on `:root`):
- Colors: `--blue` `--blue-l` `--blue-d` `--red` `--muted` `--text` `--text2`
- Surfaces: `--bg` `--card` `--border`
- Fonts: `--font-fira-sans` (body), `--font-fira-code` (numbers/monospace)

Reusable CSS class families to know:
- **Cards**: `pred-card`, `pc-title`, `pc-pool`, `pc-vote`, `pc-vrow`, `pc-bar`, `pc-bary`, `pc-vpct`, `pc-vtag`, `pc-vodds`
- **Filter chips**: `filter-row`, `f-tag`, `f-tag.active`
- **Carousel**: `c-meta`, `c-tag`, `c-pool-val`
- **Layout**: `wrap` (max-width 1400px centered), `h-inner`, `n-inner`, `sec-title`

### i18n
Three languages: `zh-CN` (default), `zh-TW`, `en`. All strings are in `lib/i18n/dict.ts`:
- `I18N` — flat key→string map per language
- `TOPICS_I18N` — array of 10 topic names (indices 0–9 match `PredictionCard.tagIndices`)
- `TITLES_I18N` — array of 15 survey title strings

Use via the `useLanguage()` hook: `const { lang, t } = useLanguage()`. The `t(key)` function translates a key for the current language. Language is persisted to `localStorage` under `oramarket_lang`; the server/SSR default is always `zh-CN` to avoid hydration mismatches.

### Static Data (`lib/data/home.ts`)
`STABLE_CARDS` is a **module-level singleton** of 200 `PredictionCard` objects generated with the deterministic `mulberry32` PRNG (seed = `id * 0xdeadbeef + 1`). This ensures SSR and CSR produce identical data. Never call `generateCards()` inside a component or hook — always reference `STABLE_CARDS`.

`PredictionCard` fields: `id`, `titleIdx`, `pool`, `yesPct`, `noPct`, `yesOdds`, `noOdds`, `parts`, `tagIndices`, `pub`, `dl`.

Status simulation: `id % 2 !== 0` → active; `id % 2 === 0` → settled.

`CATEGORY_META` maps route slugs to sidebar topic lists for category pages.

### Home Page Pattern
`ora-market-home.tsx` is a legacy imperative component: it renders a mostly-static HTML skeleton, then wires all interactivity via `useEffect` + direct DOM manipulation (innerHTML, addEventListener, querySelector). i18n updates, carousel, charts, and nav routing all happen this way. New pages should follow the React pattern used in the other feature components, not this one.

### API (Hono RPC)
The frontend calls `api` from `lib/api/client.ts` (a typed Hono RPC client). The server app is in `server/index.ts`; routes are in `server/routes/`. Exporting `AppType` from `server/index.ts` is what enables end-to-end type inference.
