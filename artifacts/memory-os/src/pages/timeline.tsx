import { useGetTimeline } from '@workspace/api-client-react';
import { motion } from 'framer-motion';
import { Calendar, Search as SearchIcon, FileText, Image as ImageIcon, FileCode, AlignLeft, File, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';

export default function TimelinePage() {
  const { data: timeline, isLoading } = useGetTimeline();

  if (isLoading) return <TimelineSkeleton />;
  if (!timeline) return null;

  return (
    <div className="p-8 max-w-3xl mx-auto w-full pb-16">

      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Memory Journey</h1>
        <p className="text-sm text-muted-foreground">A chronological view of everything you've indexed and searched.</p>
      </div>

      {timeline.groups.length === 0 && (
        <div className="card p-12 text-center text-muted-foreground">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No memories yet</p>
          <p className="text-sm mt-1">Index a folder in Settings to get started.</p>
        </div>
      )}

      <div className="space-y-10">
        {timeline.groups.map((group, gi) => (
          <motion.div
            key={group.date}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.08 }}
          >
            {/* Date header */}
            <div className="sticky top-0 z-10 py-2 bg-background/95 backdrop-blur-sm flex items-center gap-3 mb-4">
              <h2 className="text-sm font-semibold text-foreground">{group.label}</h2>
              <span className="text-xs text-muted-foreground">{group.date}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Timeline entries */}
            <div className="space-y-6 pl-5 ml-2 border-l-2 border-border">

              {/* Searches */}
              {group.searches.length > 0 && (
                <div className="relative">
                  <div className="absolute -left-[27px] top-0 w-7 h-7 bg-background flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-accent/15 border-2 border-accent flex items-center justify-center">
                      <SearchIcon className="w-2.5 h-2.5 text-accent" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {group.searches.map(s => (
                      <div key={s.id} className="card px-4 py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <SearchIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm text-foreground truncate">"{s.query}"</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                          <span>{s.resultCount} results</span>
                          <span>{new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {group.documents.length > 0 && (
                <div className="relative">
                  <div className="absolute -left-[27px] top-0 w-7 h-7 bg-background flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                      <FileText className="w-2.5 h-2.5 text-primary" />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {group.documents.map(doc => {
                      const Icon = typeIcon(doc.type);
                      return (
                        <Link key={doc.id} href={`/documents/${doc.id}`}>
                          <div className="card card-hover px-4 py-3 flex items-center gap-3 cursor-pointer group">
                            <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{doc.path}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        ))}
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

function TimelineSkeleton() {
  return (
    <div className="p-8 max-w-3xl mx-auto w-full space-y-8">
      <div><Skeleton className="h-7 w-56 mb-2" /><Skeleton className="h-4 w-80" /></div>
      {[1,2,3].map(i => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <div className="pl-5 space-y-2">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
