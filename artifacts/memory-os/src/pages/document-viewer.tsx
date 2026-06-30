import { useGetDocument, useGetRelatedDocuments, useGenerateSummary, getGetDocumentQueryKey, getGetRelatedDocumentsQueryKey } from '@workspace/api-client-react';
import { useParams, Link } from 'wouter';
import { motion } from 'framer-motion';
import { FileText, File, FileCode, AlignLeft, Image as ImageIcon, ArrowLeft, Calendar, HardDrive, Hash, Sparkles, Loader2 } from 'lucide-react';
import { formatBytes, formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';

export default function DocumentViewer() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  
  const { data: doc, isLoading: isDocLoading } = useGetDocument(id!, { 
    query: { enabled: !!id, queryKey: getGetDocumentQueryKey(id!) } 
  });
  
  const { data: relatedDocs } = useGetRelatedDocuments(id!, {
    query: { enabled: !!id, queryKey: getGetRelatedDocumentsQueryKey(id!) }
  });

  const summaryMutation = useGenerateSummary({
    mutation: {
      onSuccess: (data) => {
        // Optimistically update document cache with new summary data
        queryClient.setQueryData(getGetDocumentQueryKey(id!), (old: any) => {
          if (!old) return old;
          return {
            ...old,
            summary: data.summary,
            keywords: data.keywords
          };
        });
      }
    }
  });

  if (isDocLoading) return <DocumentSkeleton />;
  if (!doc) return <div className="p-8 text-center text-muted-foreground">Document not found</div>;

  const Icon = getDocumentIcon(doc.type);

  return (
    <div className="flex h-full w-full">
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8 border-r border-border">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <Link href="/search" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Search
          </Link>

          {/* Header */}
          <div className="glass-card p-6 rounded-2xl flex gap-6">
            <div className="w-16 h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold truncate text-foreground mb-2">{doc.title}</h1>
              <p className="text-muted-foreground text-sm truncate font-mono bg-black/20 p-2 rounded border border-white/5 inline-block">
                {doc.path}
              </p>
              
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5"><HardDrive className="w-4 h-4" /> {formatBytes(doc.size)}</div>
                <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Modified {formatDate(doc.modifiedAt)}</div>
                <div className="flex items-center gap-1.5"><Hash className="w-4 h-4" /> {doc.embeddingCount || 0} Embeddings</div>
              </div>
            </div>
          </div>

          {/* Keywords */}
          {doc.keywords && doc.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {doc.keywords.map(kw => (
                <Badge key={kw} variant="glass">{kw}</Badge>
              ))}
            </div>
          )}

          {/* AI Summary Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> AI Summary
              </h2>
              {!doc.summary && (
                <Button 
                  onClick={() => summaryMutation.mutate({ id: doc.id })}
                  disabled={summaryMutation.isPending}
                  size="sm"
                  className="gap-2"
                >
                  {summaryMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate Summary
                </Button>
              )}
            </div>

            {doc.summary ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 rounded-2xl bg-primary/5 border-primary/20 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <p className="leading-relaxed text-foreground/90">{doc.summary}</p>
              </motion.div>
            ) : (
              <div className="glass-card p-8 rounded-2xl flex flex-col items-center text-center text-muted-foreground border-dashed">
                <Sparkles className="w-8 h-8 opacity-20 mb-3" />
                <p>No summary generated yet.</p>
              </div>
            )}
          </div>

          {/* Content / OCR Text */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Content Extracted</h2>
            <div className="glass-card p-6 rounded-2xl bg-black/40 font-mono text-sm leading-relaxed overflow-x-auto max-h-[500px] overflow-y-auto whitespace-pre-wrap text-muted-foreground border-white/5 shadow-inner">
              {doc.ocrText || doc.preview || "No text content available."}
            </div>
          </div>

        </div>
      </div>

      {/* Sidebar - Related Documents */}
      <div className="w-80 bg-sidebar p-6 overflow-y-auto hidden lg:block shrink-0">
        <h3 className="font-semibold mb-6 flex items-center gap-2">
          <Hash className="w-4 h-4 text-muted-foreground" /> Related Memories
        </h3>
        
        <div className="space-y-4">
          {relatedDocs?.documents && relatedDocs.documents.length > 0 ? (
            relatedDocs.documents.map((relDoc, i) => {
              const RelIcon = getDocumentIcon(relDoc.type);
              return (
                <motion.div
                  key={relDoc.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link href={`/documents/${relDoc.id}`} className="block outline-none">
                    <div className="p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer group">
                      <div className="flex gap-3">
                        <RelIcon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{relDoc.title}</p>
                          <p className="text-xs text-muted-foreground truncate mt-1">{relDoc.path.split('/').pop()}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })
          ) : (
            <p className="text-sm text-muted-foreground">No closely related documents found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function getDocumentIcon(type: string) {
  switch (type) {
    case 'pdf': return FileText;
    case 'docx': return File;
    case 'md': return FileCode;
    case 'txt': return AlignLeft;
    case 'image': return ImageIcon;
    default: return File;
  }
}

function DocumentSkeleton() {
  return (
    <div className="flex h-full w-full p-8 space-gap-8">
      <div className="flex-1 max-w-3xl mx-auto space-y-8">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    </div>
  );
}
