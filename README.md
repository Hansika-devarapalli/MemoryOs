# MemoryOS

**Find anything on your computer. Instantly.**

MemoryOS is a personal AI layer for your digital life. Search your files, documents, and images using natural language — "Find the PDF I studied before my ML exam" — instead of trying to remember filenames.

Built for a hackathon. Runs fully offline once Ollama is installed.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  React + Vite (artifacts/memory-os)                   │  │
│  │                                                       │  │
│  │  Landing → Dashboard → Search → Timeline              │  │
│  │  Document Viewer → Settings                           │  │
│  │                                                       │  │
│  │  @workspace/api-client-react  (React Query hooks)     │  │
│  └────────────────────────┬──────────────────────────────┘  │
└───────────────────────────│─────────────────────────────────┘
                            │ HTTP /api/*
┌───────────────────────────▼─────────────────────────────────┐
│  Express 5 API (artifacts/api-server)                        │
│                                                             │
│  POST /api/search          GET  /api/documents              │
│  GET  /api/search/history  GET  /api/documents/:id          │
│  POST /api/index           POST /api/documents/:id/summary  │
│  GET  /api/index/status    GET  /api/documents/:id/related  │
│  GET  /api/folders         GET  /api/stats                  │
│  POST /api/ocr             GET  /api/timeline               │
│                                                             │
│  @workspace/db  (Drizzle ORM)                               │
└──────┬─────────────────────────┬───────────────────────────┘
       │                         │
┌──────▼──────┐        ┌─────────▼─────────────────────────┐
│  PostgreSQL  │        │  Local AI Stack (optional)         │
│             │        │                                    │
│  documents  │        │  Ollama ──► gemma3:4b  (summaries) │
│  folders    │        │        └──► nomic-embed-text (vecs) │
│  search_    │        │                                    │
│  history    │        │  ChromaDB  (vector search)         │
└─────────────┘        │  Tesseract (OCR for images)        │
                       └────────────────────────────────────┘
```

### Data flow — natural language search

```
User query "ML exam PDF"
        │
        ▼
POST /api/search  { query, limit }
        │
        ├─[real AI]──► nomic-embed-text → vector → ChromaDB → ranked results
        │
        └─[mock mode]─► ILIKE keyword search against PostgreSQL documents table
                         + mock AI response block
        │
        ▼
React renders results with relevance score + AI-generated answer
```

---

## Quick Start (Dev)

### Prerequisites

- Node.js 22+
- pnpm 9+
- PostgreSQL database (or use the Replit-provisioned one)

### 1. Clone & install

```bash
git clone <repo-url> memoryos
cd memoryos
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env and fill in DATABASE_URL
```

### 3. Push schema & seed

```bash
pnpm --filter @workspace/db run push    # create tables
```

### 4. Start dev servers

```bash
# Terminal 1 — API
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend
pnpm --filter @workspace/memory-os run dev
```

The frontend is at `http://localhost:<PORT>` (Vite picks a free port).  
The API is at `http://localhost:8080/api`.

---

## Enable Real AI (Local, Fully Offline)

### 1. Install Ollama

```bash
# macOS / Linux
curl -fsSL https://ollama.ai/install.sh | sh
```

Windows: download the installer from [ollama.ai](https://ollama.ai).

### 2. Pull models

```bash
# Language model for summaries & question answering (~3 GB)
ollama pull gemma3:4b

# Embedding model for semantic search (~274 MB)
ollama pull nomic-embed-text
```

Verify Ollama is running:
```bash
curl http://localhost:11434/api/tags
```

### 3. Install ChromaDB (vector store)

```bash
pip install chromadb
chroma run --path ~/.memoryos/db
```

### 4. Install Tesseract (OCR)

```bash
# macOS
brew install tesseract

# Ubuntu / Debian
sudo apt install tesseract-ocr

# Windows — download from https://github.com/tesseract-ocr/tesseract
```

### 5. Wire up the API

In `artifacts/api-server/src/routes/`:

| File | Function to replace | Replace with |
|---|---|---|
| `search.ts` | mock keyword search | embed query → ChromaDB query |
| `documents.ts` | `generateMockSummary()` | Ollama `gemma3:4b` completion |
| `indexing.ts` | `generateMockDocuments()` | read files → embed → ChromaDB upsert |
| `indexing.ts` | OCR route | Tesseract `recognize()` call |

---

## Project Structure

```
memoryos/
├── artifacts/
│   ├── api-server/              # Express 5 backend
│   │   └── src/
│   │       ├── app.ts           # Express app + error middleware
│   │       ├── index.ts         # Entry point
│   │       └── routes/
│   │           ├── documents.ts # GET/POST /documents
│   │           ├── search.ts    # POST /search, GET /search/history
│   │           ├── indexing.ts  # POST /index, GET /folders, POST /ocr
│   │           ├── stats.ts     # GET /stats
│   │           └── timeline.ts  # GET /timeline
│   │
│   └── memory-os/               # React + Vite frontend
│       └── src/
│           ├── App.tsx          # Router (wouter)
│           ├── index.css        # Design tokens, dark theme
│           ├── components/
│           │   ├── layout.tsx   # Sidebar shell
│           │   └── ui/          # shadcn/ui components
│           └── pages/
│               ├── landing.tsx
│               ├── dashboard.tsx
│               ├── search.tsx
│               ├── timeline.tsx
│               ├── document-viewer.tsx
│               └── settings.tsx
│
├── lib/
│   ├── api-spec/
│   │   ├── openapi.yaml         # Single source of truth for all API contracts
│   │   └── orval.config.ts      # Codegen config (React Query hooks + Zod schemas)
│   ├── api-client-react/        # Generated React Query hooks (do not edit src/generated/)
│   ├── api-zod/                 # Generated Zod validators (do not edit src/generated/)
│   └── db/
│       ├── src/
│       │   ├── index.ts         # Drizzle instance + re-exports
│       │   └── schema/          # documents, search_history, folders tables
│       └── drizzle.config.ts
│
├── replit.md                    # Architecture decisions & gotchas
└── README.md                    # This file
```

---

## Development Workflow

### Re-generate API client after spec changes

Any change to `lib/api-spec/openapi.yaml` requires a codegen run:

```bash
pnpm --filter @workspace/api-spec run codegen
```

This regenerates:
- `lib/api-client-react/src/generated/` — React Query hooks
- `lib/api-zod/src/generated/` — Zod validators

### Typecheck everything

```bash
pnpm run typecheck
```

### Apply schema changes to the database

```bash
pnpm --filter @workspace/db run push     # dev: push directly
pnpm --filter @workspace/db run generate # prod: generate migration SQL
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui, Framer Motion |
| Routing | wouter |
| Data fetching | TanStack Query v5 (generated via Orval) |
| Charts | Recharts |
| Backend | Express 5, Node.js 24, TypeScript |
| Database | PostgreSQL, Drizzle ORM |
| API contract | OpenAPI 3.1, Orval codegen |
| Local AI (opt.) | Ollama, Gemma 3 4B, nomic-embed-text |
| Vector store (opt.) | ChromaDB |
| OCR (opt.) | Tesseract |
| Monorepo | pnpm workspaces |

---

## Future Work

- [ ] **Real vector search** — swap mock ILIKE search for ChromaDB + nomic-embed-text embeddings
- [ ] **File watcher** — `chokidar` daemon that auto-indexes new/changed files in watched folders
- [ ] **OCR pipeline** — Tesseract integration for text extraction from images and scanned PDFs
- [ ] **AI summaries** — Ollama Gemma 3 4B for on-demand document summarisation
- [ ] **Multi-modal search** — CLIP embeddings for image semantic search ("find the diagram of the AWS architecture")
- [ ] **Folder delete** — remove folder + associated documents from index
- [ ] **Re-index button** — trigger re-embedding of changed documents
- [ ] **Pagination** — infinite scroll for large document collections
- [ ] **Export** — download search results as CSV / JSON
- [ ] **Electron wrapper** — package as a native desktop app with OS-level file system access
- [ ] **Mobile** — Expo React Native companion app for on-the-go search

---

## Privacy

All AI inference runs locally on your machine. No files, queries, or embeddings are ever sent to a remote server. MemoryOS works offline once models are downloaded.
