# MemoryOS

An AI-powered digital second brain — find anything on your computer using natural language instead of filenames. Ask "Find the PDF I studied before my ML exam" and get instant semantic results.

## Run & Operate

- `pnpm --filter @workspace/memory-os run dev` — frontend (Vite, port assigned by artifact)
- `pnpm --filter @workspace/api-server run dev` — Express API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion + wouter + Recharts
- **Backend**: Express 5 + Node.js 24 + TypeScript
- **Database**: PostgreSQL + Drizzle ORM (documents, search_history, folders tables)
- **API codegen**: Orval (OpenAPI → React Query hooks + Zod schemas)
- **Build**: esbuild (CJS bundle)

## Where things live

- `artifacts/memory-os/src/pages/` — 6 pages: landing, dashboard, search, timeline, document-viewer, settings
- `artifacts/memory-os/src/components/layout.tsx` — sidebar + shared shell
- `artifacts/api-server/src/routes/` — documents, search, indexing, stats, timeline route handlers
- `lib/db/src/schema/` — documents, search_history, folders Drizzle tables
- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts

## Architecture decisions

- **Mock AI layer**: Search, embeddings, summaries, and OCR return intelligent mock responses. In production, wire `POST /search` to nomic-embed-text + ChromaDB, `POST /documents/:id/summary` to Ollama (Gemma 3 4B), and `POST /ocr` to Tesseract.
- **Keyword fallback search**: `/search` uses PostgreSQL ILIKE when the vector DB is not available — functional demo without requiring Ollama to be installed.
- **In-memory indexing state**: `indexingState` in `indexing.ts` is per-process. For multi-instance production, move it to the database or Redis.
- **PostgreSQL over SQLite**: The workspace provides a managed PostgreSQL instance; Drizzle ORM makes this transparent. The original spec listed SQLite but the managed DB is used instead for reliability.
- **Dark mode only**: MemoryOS is always dark — `document.documentElement.classList.add('dark')` is set once on mount, no theme toggle needed.

## Product

6 pages wired to real API data:
1. **Landing** — animated hero, feature cards, privacy-first section
2. **Dashboard** — stats cards, Recharts activity chart, recent documents/searches
3. **Search** — AI semantic search with animated placeholder cycling through examples, relevance score badges, AI-generated response
4. **Memory Timeline** — chronological view grouped by Today / Yesterday / Last Week / Last Month
5. **Document Viewer** — summary panel, keywords, key points, related documents sidebar, OCR text for images
6. **Settings** — watched folder management, indexing progress with live polling, AI model info

## Production AI Setup (local installation)

To enable real AI features, install locally:
```bash
# Ollama
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull gemma3:4b
ollama pull nomic-embed-text

# Python dependencies
pip install chromadb pymupdf python-docx pytesseract

# Tesseract OCR
brew install tesseract  # macOS
```

Then update `POST /search` to use ChromaDB, `POST /documents/:id/summary` to call Ollama, and `POST /ocr` to call Tesseract.

## User preferences

_Populate as you build._

## Gotchas

- After any OpenAPI spec change, always run codegen before touching the frontend: `pnpm --filter @workspace/api-spec run codegen`
- Body schema component names must be entity-shaped (e.g. `SearchInput`), never operation-shaped (e.g. `SearchBody`) — Orval collision rule
- `GetRelatedDocumentsParams` collision: removed the `limit` query param from `GET /documents/{id}/related` to avoid Orval TS2308 — limit is hardcoded server-side
- Express 5: always annotate async handlers `Promise<void>`, use `res.status().json(); return;` not `return res.status().json()`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
