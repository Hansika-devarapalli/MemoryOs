import { Router, type IRouter } from "express";
import { desc, gte, sql } from "drizzle-orm";
import { db, documentsTable, searchHistoryTable } from "@workspace/db";
import { GetTimelineQueryParams } from "@workspace/api-zod";

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

function getLabel(dateStr: string): string {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const yesterday = new Date(now.getTime() - 86400000).toISOString().split("T")[0];
  const lastWeekStart = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];
  const lastMonthStart = new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];

  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  if (dateStr >= lastWeekStart) return "Last Week";
  if (dateStr >= lastMonthStart) return "Last Month";
  return "Older";
}

router.get("/timeline", async (req, res): Promise<void> => {
  const parsed = GetTimelineQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const days = parsed.data.days ?? 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Fetch recent documents
  const docs = await db
    .select()
    .from(documentsTable)
    .where(gte(documentsTable.indexedAt, since))
    .orderBy(desc(documentsTable.indexedAt))
    .limit(100);

  // Fetch recent searches
  const searches = await db
    .select()
    .from(searchHistoryTable)
    .where(gte(searchHistoryTable.timestamp, since))
    .orderBy(desc(searchHistoryTable.timestamp))
    .limit(50);

  // Group by date
  const groupMap = new Map<
    string,
    {
      label: string;
      date: string;
      documents: typeof docs;
      searches: typeof searches;
    }
  >();

  for (const doc of docs) {
    const dateStr = (doc.indexedAt ?? doc.createdAt).toISOString().split("T")[0];
    if (!groupMap.has(dateStr)) {
      groupMap.set(dateStr, {
        label: getLabel(dateStr),
        date: dateStr,
        documents: [],
        searches: [],
      });
    }
    groupMap.get(dateStr)!.documents.push(doc);
  }

  for (const search of searches) {
    const dateStr = search.timestamp.toISOString().split("T")[0];
    if (!groupMap.has(dateStr)) {
      groupMap.set(dateStr, {
        label: getLabel(dateStr),
        date: dateStr,
        documents: [],
        searches: [],
      });
    }
    groupMap.get(dateStr)!.searches.push(search);
  }

  // Sort groups by date descending
  const groups = Array.from(groupMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, group]) => ({
      label: group.label,
      date: group.date,
      documents: group.documents.map(docToResponse),
      searches: group.searches.map((s) => ({
        id: String(s.id),
        query: s.query,
        timestamp: s.timestamp.toISOString(),
        resultCount: s.resultCount,
      })),
    }));

  res.json({ groups });
});

export default router;
