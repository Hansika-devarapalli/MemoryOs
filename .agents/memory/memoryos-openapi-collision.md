---
name: MemoryOS OpenAPI Orval collision fix
description: When a GET endpoint has BOTH path params AND query params, Orval generates the path-param type in both generated/api.ts and generated/types/, causing TS2308 on the barrel export.
---

**Rule:** If a GET endpoint has path params, do NOT also add query params unless necessary. When both are needed, consider changing the operationId or restructuring the endpoint.

**Why:** Orval generates `{OperationIdPascal}Params` for path params in both `api.ts` (Zod schema) and `types/` (TS interface). The barrel `api-zod/src/index.ts` re-exports both with `export *`, causing a TS2308 duplicate export error. The codegen itself succeeds — only the chained `pnpm run typecheck:libs` fails, making it look like a codegen error.

**How to apply:** When writing `lib/api-spec/openapi.yaml`, if a GET endpoint needs a path param like `{id}`, avoid adding optional query params unless essential. If both are needed, the openapi.md body-naming rules won't help — restructure (e.g. move limit server-side or change operationId).

**Example fixed:** `GET /documents/{id}/related` — removed optional `limit` query param, hardcoded server-side to 5 results. Previously caused `GetRelatedDocumentsParams` collision.
