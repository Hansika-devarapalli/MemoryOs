import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, FileText, Image as ImageIcon, FileCode, AlignLeft, File, ArrowRight, Loader2, Clock, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { useSemanticSearch, useGetSearchHistory, SearchResultItem } from '@workspace/api-client-react';
import { Badge } from '@/components/ui/badge';

const PLACEHOLDERS = [
  "Find the PDF I studied before my ML exam...",
  "Show me screenshots with Python errors...",
  "Find my internship resume...",
  "What notes did I write about transformers?"
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: history } = useGetSearchHistory({ limit: 5 });
  const searchMutation = useSemanticSearch();

  useEffect(() => {
    inputRef.current?.focus();
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    searchMutation.mutate({ data: { query } });
  };

  const hasResults = searchMutation.isSuccess && searchMutation.data;
  const isSearching = searchMutation.isPending;

  return (
    <div className="flex flex-col h-full w-full">
      {/* Search Header Container - animates up when searching */}
      <motion.div 
        layout
        className={`w-full max-w-4xl mx-auto px-6 transition-all duration-500 flex flex-col ${
          hasResults || isSearching ? 'pt-8' : 'pt-[20vh]'
        }`}
      >
        <motion.div layout className="mb-6 text-center">
          <BrainLogo className={`mx-auto mb-4 transition-all duration-500 ${hasResults ? 'w-10 h-10' : 'w-16 h-16'}`} />
          {!hasResults && !isSearching && (
            <h1 className="text-3xl font-bold tracking-tight">Ask your second brain</h1>
          )}
        </motion.div>

        <form onSubmit={handleSearch} className="relative group">
          <div className={`absolute -inset-1 rounded-2xl blur-lg transition-all duration-500 ${isFocused ? 'bg-primary/30 opacity-100' : 'bg-primary/0 opacity-0'}`} />
          <div className="relative flex items-center bg-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden focus-within:border-primary/50 transition-colors">
            <div className="pl-6 text-primary">
              {isSearching ? <Loader2 className="w-6 h-6 animate-spin" /> : <SearchIcon className="w-6 h-6" />}
            </div>
            
            <div className="relative flex-1">
              {!query && !isFocused && (
                <div className="absolute inset-0 flex items-center pointer-events-none px-4 overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={placeholderIndex}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      className="text-muted-foreground text-lg whitespace-nowrap"
                    >
                      {PLACEHOLDERS[placeholderIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              )}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="w-full h-16 bg-transparent px-4 text-lg outline-none placeholder:text-transparent"
                placeholder=" "
              />
            </div>
            
            {query && (
              <button 
                type="submit" 
                disabled={isSearching}
                className="pr-4 pl-2 h-full flex items-center justify-center text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
              >
                <div className="bg-white/5 hover:bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/10">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </button>
            )}
          </div>
        </form>

        {/* Search History Pills */}
        {!hasResults && !isSearching && history?.history && history.history.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8 flex flex-wrap gap-2 justify-center"
          >
            {history.history.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setQuery(item.query);
                  searchMutation.mutate({ data: { query: item.query } });
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/5 bg-white/5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/10 hover:border-white/10 transition-all backdrop-blur-sm"
              >
                <Clock className="w-3.5 h-3.5" />
                {item.query}
              </button>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto px-6 pb-20 w-full max-w-4xl mx-auto mt-8">
        <AnimatePresence mode="wait">
          {searchMutation.isSuccess && searchMutation.data && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* AI Response Card */}
              {searchMutation.data.aiResponse && (
                <div className="glass-card p-6 rounded-2xl border-primary/20 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  <div className="flex gap-4">
                    <div className="mt-1">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-foreground leading-relaxed">
                        {searchMutation.data.aiResponse}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-sm text-muted-foreground flex justify-between items-center px-2">
                <span>Found {searchMutation.data.totalResults} results in {searchMutation.data.timeTakenMs}ms</span>
              </div>

              {/* Result List */}
              <div className="space-y-4">
                {searchMutation.data.results.map((item: SearchResultItem, index: number) => (
                  <ResultCard key={item.document.id} item={item} index={index} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ResultCard({ item, index }: { item: SearchResultItem, index: number }) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'pdf': return FileText;
      case 'docx': return File;
      case 'md': return FileCode;
      case 'txt': return AlignLeft;
      case 'image': return ImageIcon;
      default: return File;
    }
  };
  
  const Icon = getIcon(item.document.type);
  
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.5) return 'warning';
    return 'destructive';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/documents/${item.document.id}`} className="block outline-none">
        <div className="glass-card p-4 rounded-xl hover:border-primary/50 transition-all duration-200 cursor-pointer group">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <Icon className="w-5 h-5 opacity-70 group-hover:opacity-100" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {item.document.title}
                </h3>
                <Badge variant={getScoreColor(item.score)}>
                  {Math.round(item.score * 100)}% Match
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground truncate mb-2">
                {item.document.path}
              </p>
              
              <div className="text-sm text-foreground/80 bg-black/20 p-3 rounded-lg border border-white/5 line-clamp-2 leading-relaxed">
                "{item.snippet}"
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function BrainLogo({ className }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
      <div className="w-full h-full bg-card border border-primary/30 rounded-2xl flex items-center justify-center relative z-10 shadow-lg shadow-primary/20">
        <Sparkles className="w-1/2 h-1/2 text-primary" />
      </div>
    </div>
  );
}
