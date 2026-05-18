# Claude Code instructions

This is **Akselerja**, a Next.js 15 / React 19 demo platform for AI job matching and upskilling, built for hackathon Tema 22 (Job Matching & Workforce Upskilling, Real Sector Economy).

## Design Context

Two files in [docs/](docs/) carry the strategic and visual rules. Read them before any UI or design work; their guidance overrides general assumptions.

- [docs/PRODUCT.md](docs/PRODUCT.md) — strategic doc. Audience (kandidat-only Indonesia), brand personality (Confident, Helpful, Credible), anti-references, six design principles. The hackathon judging criteria (25/25/30/20%) sit here.
- [docs/DESIGN.md](docs/DESIGN.md) — visual system. OKLCH palette (Restrained: Paper + Tint + Line + one Teal accent + three Signal hues), General Sans typography, component tokens, named rules.

**Strategic principles** (from PRODUCT.md, applied to every change):

1. Skor selalu berpasangan dengan penjelasan dan aksi.
2. Plain Bahasa Indonesia, bukan jargon HR.
3. Tenang di permukaan, dalam di isi.
4. Explainability adalah fitur, bukan tooltip.
5. Onboarding adalah produknya.
6. Hormati keterbatasan pengguna (HP kelas menengah-bawah, 3G/4G).

**Hard bans** (from DESIGN.md):

- No corporate blue, no gradient text, no glassmorphism, no side-stripe colored borders, no decorative shadows on default surfaces.
- No em dashes in copy. Use commas, colons, or hyphens.
- No vendor names (Azure, Gemini, OpenAI) in user-facing UI. Architecture narrative belongs in pitch slides, not in chrome.
- No two "Lamar" buttons on one detail page. One sticky sidebar button suffices.
- Don't copy Glints visuals (bright blue, all-caps "APPLY & CHAT ON APP" buttons). Akselerja layers on Glints data without cloning the look.

## Architecture

- **Frontend**: Next.js 15 App Router, React 19, Tailwind v4, General Sans via Fontshare CDN.
- **Data layer**: Cosmos DB (`jobs`, `candidates`, `users` containers; `/companyId` partition key for jobs).
- **Search**: Azure AI Search (`jobs-v1` index) with hybrid vector + BM25 query. `descriptionVector` field is 768-dim, populated by [scripts/embed-jobs.ts](scripts/embed-jobs.ts).
- **Embeddings**: Gemini `gemini-embedding-001` (768-dim, normalized) via [lib/gemini-embed.ts](lib/gemini-embed.ts). Free tier; no Azure OpenAI.
- **Profile vector**: regenerated after every profile mutation via [lib/profile-summary.ts](lib/profile-summary.ts), called from `revalidateProfileSurfaces()` in [lib/profile-actions.ts](lib/profile-actions.ts).
- **Job source**: Glints public sitemaps. Pipeline: [scripts/scrape-glints-detail.ts](scripts/scrape-glints-detail.ts) → [scripts/normalize-glints.ts](scripts/normalize-glints.ts) → [scripts/cosmos-replace-jobs.ts](scripts/cosmos-replace-jobs.ts) → [scripts/search-sync.ts](scripts/search-sync.ts) → [scripts/embed-jobs.ts](scripts/embed-jobs.ts).
- **CV parsing**: Gemini `gemini-2.5-flash` via [lib/cv-parser.ts](lib/cv-parser.ts). Free tier 1500 RPD shared with chat.

## Conventions

- **Tailwind tokens**: prefer `text-(--color-X)` arbitrary value syntax over canonical class names. Keeps OKLCH tokens in CSS as the single source of truth, lints will warn but the pattern is intentional.
- **Server actions**: every profile mutation that touches preferences, skills, education, experience, or CV must end in `revalidateProfileSurfaces()`, which also schedules the profile embedding refresh.
- **External links** (apply to Glints) always `target="_blank" rel="noopener noreferrer"` plus a visible arrow icon and `aria-label` for SR.
- **Mobile-first**: meta info grids `grid-cols-1 sm:grid-cols-2`, salary spans both columns. Never overflow horizontally.
- **Data folder** (`data/`) is gitignored — raw HTML cache, vector cache, normalized JSON. Regenerable via scripts.

## Common commands

```bash
npm run dev              # local dev server
npx tsc --noEmit         # type check
npx tsx scripts/embed-jobs.ts        # populate AI Search vectors (idempotent, cache-aware)
npx tsx scripts/search-sync.ts       # repopulate scalar fields from Cosmos
```

## Don't

- Don't add Azure OpenAI dependencies. Student subscription doesn't include it; we route inference through Gemini and keep Azure on infrastructure (Cosmos + AI Search + Blob).
- Don't reintroduce HR/perusahaan side. Removed deliberately to focus the demo.
- Don't write to MEMORY.md or auto-memory files in this project unless the user asks. Project context lives in PRODUCT.md / DESIGN.md.
