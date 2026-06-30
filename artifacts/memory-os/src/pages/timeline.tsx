import { useGetTimeline } from '@workspace/api-client-react';
import { motion } from 'framer-motion';
import { Calendar, Search as SearchIcon, FileText, Image as ImageIcon, FileCode, AlignLeft, File, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';

export default function TimelinePage() {
  const { data: timeline, isLoading } = useGetTimeline();

  if (isLoading) {
    return <TimelineSkeleton />;
  }

  if (!timeline) return null;

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <Calendar className="w-8 h-8 text-primary" /> Memory Timeline
        </h1>
        <p className="text-muted-foreground">A chronological view of your indexed files and searches.</p>
      </div>

      <div className="space-y-12">
        {timeline.groups.map((group, groupIndex) => (
          <motion.div 
            key={group.date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
            className="relative"
          >
            {/* Date sticky header */}
            <div className="sticky top-0 z-10 py-2 bg-background/80 backdrop-blur-md flex items-center gap-4 mb-6">
              <h2 className="text-xl font-bold text-foreground">{group.label}</h2>
              <span className="text-sm text-muted-foreground">{group.date}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="pl-6 space-y-6 border-l-2 border-border ml-2">
              
              {/* Searches Section */}
              {group.searches.length > 0 && (
                <div className="relative">
                  <div className="absolute -left-[35px] w-8 h-8 bg-background flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent flex items-center justify-center">
                      <SearchIcon className="w-3 h-3 text-accent" />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {group.searches.map(search => (
                      <div key={search.id} className="glass-card p-4 rounded-xl flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <SearchIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">"{search.query}"</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{search.resultCount} results</span>
                          <span>{new Date(search.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents Section */}
              {group.documents.length > 0 && (
                <div className="relative">
                  <div className="absolute -left-[35px] w-8 h-8 bg-background flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary flex items-center justify-center">
                      <FileText className="w-3 h-3 text-primary" />
                    </div>
                  </div>
                  
                  <div className="grid gap-3">
                    {group.documents.map(doc => {
                      const Icon = getDocumentIcon(doc.type);
                      return (
                        <Link key={doc.id} href={`/documents/${doc.id}`}>
                          <div className="glass-card p-4 rounded-xl flex items-center gap-4 hover:border-primary/50 transition-colors cursor-pointer group">
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                              <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">{doc.title}</h4>
                              <p className="text-xs text-muted-foreground truncate">{doc.path}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0" />
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

function TimelineSkeleton() {
  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-8">
      <Skeleton className="h-10 w-64" />
      <div className="space-y-10 pl-4 border-l border-border ml-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
