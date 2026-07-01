import { logger } from "../lib/logger";
import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, documentsTable, foldersTable } from "@workspace/db";
import { IndexFolderBody, RunOcrBody } from "@workspace/api-zod";

const router: IRouter = Router();

// In-memory state for demo indexing progress
let indexingState = {
  isIndexing: false,
  totalFiles: 0,
  processedFiles: 0,
  failedFiles: 0,
  currentFile: null as string | null,
  folders: [] as string[],
};

router.post("/index", async (req, res): Promise<void> => {
  const parsed = IndexFolderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { path, recursive = true } = parsed.data;

  // Upsert folder record
  const existing = await db
    .select()
    .from(foldersTable)
    .where(eq(foldersTable.path, path));

  if (existing.length === 0) {
    await db.insert(foldersTable).values({ path, isWatched: true });
  }

  // Simulate async indexing (in production, this spawns a background worker)
  indexingState = {
    isIndexing: true,
    totalFiles: 12,
    processedFiles: 0,
    failedFiles: 0,
    currentFile: `${path}/document_1.pdf`,
    folders: [path],
  };

  // Simulate completing indexing after a short delay
  setTimeout(() => {
    void (async () => {
      try {
        // Add mock documents from this folder
        const mockDocs = generateMockDocuments(path);
        for (const doc of mockDocs) {
          await db.insert(documentsTable).values(doc).onConflictDoNothing();
          indexingState.processedFiles += 1;
          indexingState.currentFile = doc.path;
        }

        // Update folder document count and last indexed
        const docCount = await db.select().from(documentsTable);
        await db
          .update(foldersTable)
          .set({ documentCount: docCount.length, lastIndexed: new Date() })
          .where(eq(foldersTable.path, path));

        indexingState = {
          isIndexing: false,
          totalFiles: 12,
          processedFiles: 12,
          failedFiles: 0,
          currentFile: null,
          folders: [path],
        };
      } catch (err) {
        indexingState = {
          ...indexingState,
          isIndexing: false,
          failedFiles: indexingState.failedFiles + 1,
          currentFile: null,
        };
        logger.error({ err }, "Indexing background task failed");
      }
    })();
  }, 3000);

  res.json({
    isIndexing: true,
    totalFiles: 12,
    processedFiles: 0,
    failedFiles: 0,
    currentFile: `${path}/document_1.pdf`,
    folders: [path],
  });
});

router.get("/index/status", async (_req, res): Promise<void> => {
  const folders = await db.select().from(foldersTable);
  res.json({
    ...indexingState,
    folders: folders.map((f) => f.path),
  });
});

router.get("/folders", async (_req, res): Promise<void> => {
  const folders = await db
    .select()
    .from(foldersTable)
    .orderBy(desc(foldersTable.createdAt));

  res.json({
    folders: folders.map((f) => ({
      path: f.path,
      documentCount: f.documentCount,
      lastIndexed: f.lastIndexed?.toISOString() ?? null,
      isWatched: f.isWatched,
    })),
  });
});

router.post("/ocr", async (req, res): Promise<void> => {
  const parsed = RunOcrBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { filePath } = parsed.data;

  // In production this calls Tesseract OCR. Mock response here.
  res.json({
    filePath,
    text: `Sample OCR text extracted from ${filePath}. In production, Tesseract OCR processes the image and extracts all text content, including code snippets, error messages, and handwritten notes.`,
    confidence: 0.94,
  });
});

function generateMockDocuments(folderPath: string) {
  const now = new Date();
  const types = ["pdf", "docx", "txt", "md", "image"] as const;
  const names = [
    ["Machine Learning Notes", "ml-notes.md", "md"],
    ["Internship Resume 2024", "resume_2024.pdf", "pdf"],
    ["Python Error Screenshot", "screenshot_python_error.png", "image"],
    ["Deep Learning Study Guide", "deep_learning_guide.pdf", "pdf"],
    ["Project Report Q3", "project_report_q3.docx", "docx"],
    ["SQL Cheat Sheet", "sql_cheatsheet.txt", "txt"],
    ["Transformer Architecture Notes", "transformers.md", "md"],
    ["AWS Architecture Diagram", "aws_diagram.png", "image"],
  ] as const;

  return names.map(([title, filename, type]) => ({
    title,
    path: `${folderPath}/${filename}`,
    type,
    size: Math.floor(Math.random() * 5000000) + 50000,
    summary: `This document covers ${title.toLowerCase()} and related concepts.`,
    keywords: getKeywordsForType(title),
    preview: getPreviewForTitle(title),
    ocrText: type === "image" ? `Text extracted from ${title} image file.` : null,
    indexed: true,
    embeddingCount: Math.floor(Math.random() * 20) + 5,
    modifiedAt: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    indexedAt: now,
  }));
}

function getKeywordsForType(title: string): string[] {
  const lower = title.toLowerCase();
  if (lower.includes("machine learning") || lower.includes("deep learning")) {
    return ["neural networks", "gradient descent", "backpropagation", "PyTorch", "TensorFlow"];
  }
  if (lower.includes("resume")) {
    return ["internship", "experience", "skills", "education", "projects"];
  }
  if (lower.includes("sql") || lower.includes("database")) {
    return ["SELECT", "JOIN", "INDEX", "query optimization", "PostgreSQL"];
  }
  if (lower.includes("transformer")) {
    return ["attention mechanism", "self-attention", "BERT", "GPT", "embeddings"];
  }
  if (lower.includes("aws") || lower.includes("architecture")) {
    return ["cloud", "EC2", "S3", "Lambda", "VPC", "microservices"];
  }
  return ["documentation", "reference", "technical", "guide"];
}

function getPreviewForTitle(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes("machine learning")) {
    return "Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. Key concepts include supervised learning, unsupervised learning...";
  }
  if (lower.includes("resume")) {
    return "EDUCATION: B.S. Computer Science, GPA 3.8. EXPERIENCE: Software Engineering Intern at TechCorp (Summer 2024). Built microservices architecture reducing latency by 40%...";
  }
  if (lower.includes("transformer")) {
    return "Attention is all you need. The transformer architecture relies on self-attention mechanisms to process sequential data in parallel. The multi-head attention allows the model to attend to different positions...";
  }
  if (lower.includes("sql")) {
    return "SELECT column1, column2 FROM table WHERE condition ORDER BY column1 DESC LIMIT 10; JOIN operations: INNER JOIN returns rows when there is a match in both tables...";
  }
  if (lower.includes("python error")) {
    return "Traceback (most recent call last): File 'main.py', line 42. AttributeError: 'NoneType' object has no attribute 'predict'. The model was not initialized before calling predict()...";
  }
  return `Content from ${title}. This document contains important information and reference material.`;
}

export default router;
