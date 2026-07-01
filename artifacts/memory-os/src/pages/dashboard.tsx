import { useState } from 'react';
import { useGetStats, useListDocuments, useGetSearchHistory, useSemanticSearch } from '@workspace/api-client-react';
import { motion } from 'framer-motion';
import {
  Brain, FileText, Image as ImageIcon, HardDrive, Search,
  Activity, FileCode, AlignLeft, File, ArrowRight, Loader2,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatBytes } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useLocation } from 'wouter';

export default function Dashboard() {
  const { data: stats, isLoading } = useGetStats();
  const { data: recentDocs } = useListDocuments({ limit: 6 });
  const { data: recentSearches } = useGetSearchHistory({ limit: 5 });
  const [, navigate] = useLocation();
  const [query, setQuery] = useState('');
  const searchMutation = useSemanticSearch();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate('/search');
  };

  if (isLoading) return <DashboardSkeleton />;
  if (!stats) return null;

  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8">

      {/* Greeting + Search */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Good morning</h1>
        <p className="text-muted-foreground text-sm mb-6">
          {stats.totalDocuments.toLocaleString()} memories indexed and ready.
        </p>

        <form onSubmit={handleSearch}>
          <div className="spotlight-bar flex items-center gap-3 px-4 py-3.5 max-w-xl">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="What are you trying to remember?"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground"
            />
            {query && (
              <button type="submit" className="text-primary">
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Memories', value: stats.totalDocuments.toLocaleString(), icon: Brain,     color: 'text-primary',   bg: 'bg-primary/8' },
          { label: 'Documents',      value: (stats.typeBreakdown.pdf + stats.typeBreakdown.docx + stats.typeBreakdown.txt + stats.typeBreakdown.md).toLocaleString(), icon: FileText, color: 'text-blue-600',  bg: 'bg-blue-50' },
          { label: 'Images',         value: stats.totalImages.toLocaleString(),     icon: ImageIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Storage Used',   value: formatBytes(stats.storageUsedBytes),    icon: HardDrive, color: 'text-orange-600',  bg: 'bg-orange-50' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="card p-5"
          >
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Activity chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card p-6 lg:col-span-2"
        >
          <div className="flex items-center gap-2 mb-5">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Activity — last 14 days</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.activityByDay} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="hsl(221 83% 53%)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(221 83% 53%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="hsl(162 63% 41%)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(162 63% 41%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
              <Area type="monotone" dataKey="indexed"  stroke="hsl(221 83% 53%)" strokeWidth={1.5} fill="url(#gi)" name="Indexed" />
              <Area type="monotone" dataKey="searched" stroke="hsl(162 63% 41%)" strokeWidth={1.5} fill="url(#gs)" name="Searched" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* File breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <h2 className="font-semibold text-sm mb-5">Memory types</h2>
          <div className="space-y-4">
            {[
              { icon: FileText, label: 'PDF',      value: stats.typeBreakdown.pdf,  color: '#EF4444' },
              { icon: File,     label: 'Word',     value: stats.typeBreakdown.docx, color: '#3B82F6' },
              { icon: FileCode, label: 'Markdown', value: stats.typeBreakdown.md,   color: '#F59E0B' },
              { icon: AlignLeft,label: 'Text',     value: stats.typeBreakdown.txt,  color: '#6B7280' },
              { icon: ImageIcon,label: 'Images',   value: stats.typeBreakdown.image,color: '#10B981' },
            ].map(({ icon: Icon, label, value, color }) => {
              const pct = stats.totalDocuments > 0 ? (value / stats.totalDocuments) * 100 : 0;
              return (
                <div key={label} className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-foreground font-medium">{label}</span>
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                    <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Recent memories */}
      {recentDocs && recentDocs.documents.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Recent Memories</h2>
            <Link href="/timeline">
              <span className="text-xs text-primary hover:underline cursor-pointer">View all</span>
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentDocs.documents.slice(0, 6).map(doc => {
              const Icon = typeIcon(doc.type);
              return (
                <Link key={doc.id} href={`/documents/${doc.id}`}>
                  <div className="card card-hover p-4 cursor-pointer flex items-start gap-3">
                    <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{doc.path.split('/').pop()}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Recent searches */}
      {recentSearches && recentSearches.history.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h2 className="font-semibold text-sm mb-3">Recent Searches</h2>
          <div className="flex flex-wrap gap-2">
            {recentSearches.history.map(s => (
              <Link key={s.id} href="/search">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-white text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer">
                  <Search className="w-3 h-3" />
                  {s.query}
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

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

function DashboardSkeleton() {
  return (
    <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
      <div><Skeleton className="h-7 w-48 mb-2" /><Skeleton className="h-4 w-64" /></div>
      <Skeleton className="h-12 w-80 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <Skeleton className="h-64 lg:col-span-2 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
