import { pgTable, text, serial, timestamp, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  path: text("path").notNull().unique(),
  type: text("type").notNull().default("unknown"), // pdf, docx, txt, md, image, unknown
  size: integer("size").notNull().default(0),
  summary: text("summary"),
  keywords: text("keywords").array().notNull().default([]),
  preview: text("preview"),
  ocrText: text("ocr_text"),
  indexed: boolean("indexed").notNull().default(false),
  embeddingCount: integer("embedding_count"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  modifiedAt: timestamp("modified_at", { withTimezone: true }).notNull().defaultNow(),
  indexedAt: timestamp("indexed_at", { withTimezone: true }),
});

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({
  id: true,
  createdAt: true,
  indexedAt: true,
});
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;
