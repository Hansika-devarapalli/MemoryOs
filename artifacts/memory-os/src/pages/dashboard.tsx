import { useGetStats } from '@workspace/api-client-react';
import { motion } from 'framer-motion';
import { Brain, FileText, Image as ImageIcon, Database, HardDrive, Search, Activity, FileCode, AlignLeft, File } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatBytes } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { data: stats, isLoading } = useGetStats();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!stats) return null;

  const statCards = [
    { label: 'Total Indexed', value: stats.totalDocuments.toLocaleString(), icon: Brain, color: 'text-primary' },
    { label: 'Documents', value: (stats.typeBreakdown.pdf + stats.typeBreakdown.docx + stats.typeBreakdown.txt + stats.typeBreakdown.md).toLocaleString(), icon: FileText, color: 'text-accent' },
    { label: 'Images', value: stats.totalImages.toLocaleString(), icon: ImageIcon, color: 'text-green-400' },
    { label: 'Storage Used', value: formatBytes(stats.storageUsedBytes), icon: HardDrive, color: 'text-orange-400' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your digital second brain.</p>
      </motion.div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 rounded-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
              <card.icon className={`w-16 h-16 ${card.color}`} />
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-2">{card.label}</p>
            <p className="text-3xl font-bold">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 rounded-2xl lg:col-span-2 flex flex-col"
        >
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Activity Overview</h2>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.activityByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIndexed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSearched" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="indexed" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorIndexed)" name="Indexed Items" />
                <Area type="monotone" dataKey="searched" stroke="hsl(var(--accent))" strokeWidth={2} fillOpacity={1} fill="url(#colorSearched)" name="Searches" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 rounded-2xl flex flex-col"
        >
          <div className="flex items-center gap-2 mb-6">
            <Database className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold">Index Breakdown</h2>
          </div>
          
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            <BreakdownRow icon={FileText} label="PDF Documents" value={stats.typeBreakdown.pdf} total={stats.totalDocuments} color="bg-red-500" />
            <BreakdownRow icon={File} label="Word Documents" value={stats.typeBreakdown.docx} total={stats.totalDocuments} color="bg-blue-500" />
            <BreakdownRow icon={FileCode} label="Markdown Files" value={stats.typeBreakdown.md} total={stats.totalDocuments} color="bg-yellow-500" />
            <BreakdownRow icon={AlignLeft} label="Text Files" value={stats.typeBreakdown.txt} total={stats.totalDocuments} color="bg-gray-400" />
            <BreakdownRow icon={ImageIcon} label="Images" value={stats.typeBreakdown.image} total={stats.totalDocuments} color="bg-green-500" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function BreakdownRow({ icon: Icon, label, value, total, color }: any) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium truncate">{label}</span>
          <span className="text-muted-foreground">{value}</span>
        </div>
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
      <div>
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-[400px] lg:col-span-2 rounded-2xl" />
        <Skeleton className="h-[400px] rounded-2xl" />
      </div>
    </div>
  );
}
