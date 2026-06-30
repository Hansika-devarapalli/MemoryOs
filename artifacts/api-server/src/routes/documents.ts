import { Router, type IRouter } from "express";
import { eq, like, or, desc, sql } from "drizzle-orm";
import { db, documentsTable } from "@workspace/db";
import {
  GetDocumentParams,
  GenerateSummaryParams,
  GetRelatedDocumentsParams,
  ListDocumentsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function docToResponse(doc: typeof documentsTable.$inferSelect) {
  return {
    id: String(doc.id),
    title: doc.title,
    path: doc.path,
    type: doc.type,
    size: doc.size,
    summary: doc.summary ?? null,
    keywords: doc.keywords ?? [],
    preview: doc.preview ?? null,
    ocrText: doc.ocrText ?? null,
    indexed: doc.indexed,
    embeddingCount: doc.embeddingCount ?? null,
    createdAt: doc.createdAt.toISOString(),
    modifiedAt: doc.modifiedAt.toISOString(),
  };
}

router.get("/documents", async (req, res): Promise<void> => {
  const query = ListDocumentsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  const { type, limit = 50, offset = 0 } = query.data;

  let dbQuery = db.select().from(documentsTable).$dynamic();

  if (type && type !== "all") {
    dbQuery = dbQuery.where(eq(documentsTable.type, type));
  }

  const docs = await dbQuery
    .orderBy(desc(documentsTable.indexedAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(documentsTable)
    .where(type && type !== "all" ? eq(documentsTable.type, type) : undefined);

  res.json({
    documents: docs.map(docToResponse),
    total: countResult[0]?.count ?? 0,
  });
});

router.get("/documents/:id", async (req, res): Promise<void> => {
  const params = GetDocumentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const numericId = parseInt(String(params.data.id), 10);
  if (isNaN(numericId)) {
    res.status(400).json({ error: "Invalid document id" });
    return;
  }

  const [doc] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, numericId));

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  res.json(docToResponse(doc));
});

router.post("/documents/:id/summary", async (req, res): Promise<void> => {
  const params = GenerateSummaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const numericId = parseInt(String(params.data.id), 10);
  if (isNaN(numericId)) {
    res.status(400).json({ error: "Invalid document id" });
    return;
  }

  const [doc] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, numericId));

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  // In production this would call Ollama/Gemma 3. Here we return a mock summary.
  const mockSummary =
    doc.summary ??
    `This document discusses key concepts related to ${doc.title}. It covers important technical and conceptual material that would be useful for reference and study. The content is well-structured and provides comprehensive coverage of the subject matter.`;

  const mockKeywords =
    doc.keywords.length > 0
      ? doc.keywords
      : ["machine learning", "documentation", "reference", "technical"];

  const mockKeyPoints = [
    `Core concepts related to ${doc.title} are explained in detail`,
    "Practical examples and use cases are provided throughout",
    "Key terminology and definitions are clearly established",
    "References to related topics and further reading are included",
  ];

  // Persist the summary if not already set
  if (!doc.summary) {
    await db
      .update(documentsTable)
      .set({ summary: mockSummary, keywords: mockKeywords })
      .where(eq(documentsTable.id, numericId));
  }

  res.json({
    id: String(doc.id),
    summary: mockSummary,
    keywords: mockKeywords,
    keyPoints: mockKeyPoints,
  });
});

router.get("/documents/:id/related", async (req, res): Promise<void> => {
  const params = GetRelatedDocumentsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const numericId = parseInt(String(params.data.id), 10);
  if (isNaN(numericId)) {
    res.status(400).json({ error: "Invalid document id" });
    return;
  }

  const [doc] = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.id, numericId));

  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }

  // In production this would use ChromaDB vector search. Return same-type docs as related.
  const related = await db
    .select()
    .from(documentsTable)
    .where(eq(documentsTable.type, doc.type))
    .orderBy(desc(documentsTable.indexedAt))
    .limit(6);

  const filtered = related
    .filter((d) => d.id !== numericId)
    .slice(0, 5);

  res.json({
    documents: filtered.map(docToResponse),
    total: filtered.length,
  });
});

export default router;
