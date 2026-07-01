import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search as SearchIcon, FileText, Image as ImageIcon, FileCode,
  AlignLeft, File, ArrowRight, Loader2, Clock, Sparkles, X,
} from 'lucide-react';
import { Link } from 'wouter';
import { useSemanticSearch, useGetSearchHistory, SearchResultItem } from '@workspace/api-client-react';

const PLACEHOLDERS = [
  'Find the PDF I studied before my ML exam…',
  'Show me screenshots with Python errors…',
  'Find my internship resume…',
  'What did I write about transformer architectures?',
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [phIdx, setPhIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: history } = useGetSearchHistory({ limit: 8 });
  const searchMutation = useSemanticSearch();

  useEffect(() => {
    inputRef.current?.focus();
    const t = setInterval(() => setPhIdx(i => (i + 1) % PLACEHOLDERS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const handleSearch = (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    searchMutation.mutate({ data: { query: q } });
  };

  const hasResults = searchMutation.isSuccess && searchMutation.data;
  const isSearching = searchMutation.isPending;

  return (
    <div className="flex flex-col h-full w-full">

      {/* Search header */}
      <div className={`w-full max-w-3xl mx-auto px-6 flex flex-col transition-all duration-400 ${
        hasResults || isSearching ? 'pt-6' : 'pt-[18vh]'
      }`}>
        {!hasResults && !isSearching && (
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Remember</h1>
            <p className="text-muted-foreground text-sm mt-1">Search your personal knowledge base</p>
          </div>
        )}

        {/* Search bar */}
        <div className="spotlight-bar flex items-center gap-3 px-4 py-3.5 relative">
          {isSearching
            ? <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
            : <SearchIcon className="w-4 h-4 text-muted-foreground shrink-0" />
          }

          <div className="flex-1 relative min-w-0">
            {!query && (
              <div className="absolute inset-0 flex items-center pointer-events-none overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={phIdx}
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -8, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="text-sm text-muted-foreground whitespace-nowrap"
                  >
                    {PLACEHOLDERS[phIdx]}
                  </motion.p>
                </AnimatePresence>
              </div>
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch(query)}
              className="w-full h-6 bg-transparent text-sm outline-none text-foreground placeholder:text-transparent"
              placeholder=" "
            />
          </div>

          {query ? (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => { setQuery(''); searchMutation.reset(); }}
                className="p-1 rounded hover:bg-secondary text-muted-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleSearch(query)}
                disabled={isSearching}
                className="flex items-center gap-1.5 bg-primary text-white text-xs font-medium px-3 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Search <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <kbd className="text-xs text-muted-foreground border border-border rounded px-1.5 py-0.5 shrink-0">↵</kbd>
          )}
        </div>

        {/* History pills */}
        {!hasResults && !isSearching && history?.history && history.history.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            className="mt-5 flex flex-wrap gap-2">
            {history.history.map(item => (
              <button
                key={item.id}
                onClick={() => handleSearch(item.query)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-white text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                <Clock className="w-3 h-3" />
                {item.query}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-6 pb-12 mt-6 w-full max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          {hasResults && searchMutation.data && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* AI Answer */}
              {searchMutation.data.aiResponse && (
                <div className="card p-5 border-l-4 border-l-primary">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{searchMutation.data.aiResponse}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>{searchMutation.data.totalResults} results · {searchMutation.data.timeTakenMs}ms</span>
                <button
                  onClick={() => { setQuery(''); searchMutation.reset(); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
              </div>

              <div className="space-y-2">
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

function ResultCard({ item, index }: { item: SearchResultItem; index: number }) {
  const Icon = typeIcon(item.document.type);
  const score = Math.round(item.score * 100);
  const scoreColor = score >= 80 ? 'bg-green-50 text-green-700' : score >= 50 ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link href={`/documents/${item.document.id}`} className="block outline-none">
        <div className="card card-hover p-4 cursor-pointer">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-sm font-medium text-foreground truncate">{item.document.title}</h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${scoreColor}`}>
                  {score}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate mb-2">{item.document.path}</p>
              {item.snippet && (
                <p className="text-xs text-foreground/70 bg-secondary px-3 py-2 rounded-md line-clamp-2 leading-relaxed">
                  {item.snippet}
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
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
