import { useGetDocument, useGetRelatedDocuments, useGenerateSummary, getGetDocumentQueryKey, getGetRelatedDocumentsQueryKey } from '@workspace/api-client-react';
import { useParams, Link } from 'wouter';
import { motion } from 'framer-motion';
import {
  FileText, File, FileCode, AlignLeft, Image as ImageIcon,
  ArrowLeft, Calendar, HardDrive, Hash, Sparkles, Loader2, Tag,
} from 'lucide-react';
import { formatBytes, formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';

export default function DocumentViewer() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: doc, isLoading } = useGetDocument(id!, {
    query: { enabled: !!id, queryKey: getGetDocumentQueryKey(id!) },
  });
  const { data: related } = useGetRelatedDocuments(id!, {
    query: { enabled: !!id, queryKey: getGetRelatedDocumentsQueryKey(id!) },
  });
  const summaryMutation = useGenerateSummary({
    mutation: {
      onSuccess: data => {
        queryClient.setQueryData(getGetDocumentQueryKey(id!), (old: any) =>
          old ? { ...old, summary: data.summary, keywords: data.keywords } : old
        );
      },
    },
  });

  if (isLoading) return <ViewerSkeleton />;
  if (!doc) return (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
      Memory not found.
    </div>
  );

  const Icon = typeIcon(doc.type);

  return (
    <div className="flex h-full w-full overflow-hidden">

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto space-y-7">

          <Link href="/search">
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Remember
            </div>
          </Link>

          {/* Header */}
          <div className="card p-6 flex gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">{doc.title}</h1>
              <p className="text-xs text-muted-foreground font-mono mt-1 truncate">{doc.path}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><HardDrive className="w-3.5 h-3.5" />{formatBytes(doc.size)}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Modified {formatDate(doc.modifiedAt)}</span>
                <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" />{doc.embeddingCount || 0} embeddings</span>
              </div>
            </div>
          </div>

          {/* Keywords */}
          {doc.keywords && doc.keywords.length > 0 && (
            <div className="flex items-start gap-3">
              <Tag className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex flex-wrap gap-1.5">
                {doc.keywords.map(kw => (
                  <span key={kw} className="text-xs px-2.5 py-1 rounded-full border border-border bg-secondary text-foreground">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> AI Summary
              </h2>
              {!doc.summary && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => summaryMutation.mutate({ id: doc.id })}
                  disabled={summaryMutation.isPending}
                  className="h-7 text-xs gap-1.5"
                >
                  {summaryMutation.isPending
                    ? <><Loader2 className="w-3 h-3 animate-spin" />Generating…</>
                    : <><Sparkles className="w-3 h-3" />Generate</>
                  }
                </Button>
              )}
            </div>

            {doc.summary ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-5 border-l-4 border-l-primary bg-primary/2"
              >
                <p className="text-sm leading-relaxed text-foreground">{doc.summary}</p>
              </motion.div>
            ) : (
              <div className="card p-8 flex flex-col items-center text-center text-muted-foreground border-dashed">
                <Sparkles className="w-7 h-7 opacity-20 mb-2" />
                <p className="text-sm">No summary yet. Click Generate to create one with Gemma 3.</p>
              </div>
            )}
          </div>

          {/* Extracted content */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Extracted Content</h2>
            <div className="card p-5 bg-secondary/50 font-mono text-xs leading-relaxed overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap text-foreground/80">
              {doc.ocrText || doc.preview || 'No text content extracted from this file.'}
            </div>
          </div>

        </div>
      </div>

      {/* Related memories sidebar */}
      <div className="w-72 shrink-0 border-l border-border overflow-y-auto p-5 hidden lg:block bg-secondary/30">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Related Memories</h3>

        {related?.documents && related.documents.length > 0 ? (
          <div className="space-y-2">
            {related.documents.map((rel, i) => {
              const RelIcon = typeIcon(rel.type);
              return (
                <motion.div
                  key={rel.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Link href={`/documents/${rel.id}`}>
                    <div className="card card-hover p-3 cursor-pointer flex items-start gap-2.5">
                      <RelIcon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{rel.title}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{rel.path.split('/').pop()}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No closely related memories found.</p>
        )}
      </div>

    </div>
  );
}

function typeIcon(type: string) {
  switch (type) {
    case 'pdf':   return FileText;
    case 'docx':  return File;
    case 'md':    return FileCode;
    case 'txt':   return AlignLeft;
    case 'image': return ImageIcon;
    default:      return File;
  }
}

function ViewerSkeleton() {
  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="flex gap-2"><Skeleton className="h-6 w-20 rounded-full" /><Skeleton className="h-6 w-24 rounded-full" /></div>
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
