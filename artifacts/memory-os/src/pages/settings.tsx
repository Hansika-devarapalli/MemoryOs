import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useListFolders,
  useGetIndexStatus,
  useIndexFolder,
  getGetIndexStatusQueryKey,
  getListFoldersQueryKey,
} from '@workspace/api-client-react';
import { Folder as FolderIcon, Plus, Trash2, RefreshCw, HardDrive, Server, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: foldersData, refetch: refetchFolders } = useListFolders();
  const { data: indexStatus, refetch: refetchIndexStatus } = useGetIndexStatus({
    query: {
      queryKey: getGetIndexStatusQueryKey(),
      refetchInterval: (query) => {
        const data = query.state?.data as { isIndexing?: boolean } | undefined;
        return data?.isIndexing ? 1000 : false;
      },
    },
  });

  const indexMutation = useIndexFolder();
  const [newFolderPath, setNewFolderPath] = useState('');

  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderPath.trim()) return;
    const path = newFolderPath.trim();
    setNewFolderPath('');
    indexMutation.mutate(
      { data: { path, recursive: true } },
      {
        onSuccess: () => {
          // Immediately start polling by invalidating and refetching status
          queryClient.invalidateQueries({ queryKey: getGetIndexStatusQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListFoldersQueryKey() });
          refetchIndexStatus();
          refetchFolders();
        },
      },
    );
  };

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-10 pb-20">
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage watched folders and AI settings.</p>
      </div>

      {/* Indexing Status Card */}
      {indexStatus?.isIndexing && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass-card p-6 rounded-2xl border-primary/50 relative overflow-hidden bg-primary/5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              Indexing in progress...
            </h3>
            <Badge variant="outline" className="font-mono text-xs">
              {indexStatus.processedFiles} / {indexStatus.totalFiles}
            </Badge>
          </div>
          
          <Progress 
            value={(indexStatus.processedFiles / Math.max(indexStatus.totalFiles, 1)) * 100} 
            className="mb-3"
          />
          
          <p className="text-xs text-muted-foreground font-mono truncate">
            Processing: {indexStatus.currentFile || 'Scanning directory...'}
          </p>
        </motion.div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-xl font-semibold">Watched Folders</h2>
            <p className="text-sm text-muted-foreground mt-1">Directories automatically scanned and embedded.</p>
          </div>
          <Badge variant="secondary">{foldersData?.folders.length || 0} Folders</Badge>
        </div>

        <form onSubmit={handleAddFolder} className="flex gap-3">
          <Input 
            placeholder="/Users/username/Documents" 
            value={newFolderPath}
            onChange={(e) => setNewFolderPath(e.target.value)}
            className="flex-1 font-mono text-sm"
          />
          <Button type="submit" disabled={indexMutation.isPending || !newFolderPath.trim()} className="gap-2">
            <Plus className="w-4 h-4" /> Add Folder
          </Button>
        </form>

        <div className="grid gap-3">
          {foldersData?.folders.map((folder) => (
            <div key={folder.path} className="glass-card p-4 rounded-xl flex items-center justify-between group">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                  <FolderIcon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate font-mono text-sm">{folder.path}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{folder.documentCount} items</span>
                    {folder.lastIndexed && (
                      <>
                        <span>•</span>
                        <span>Indexed {new Date(folder.lastIndexed).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" title="Reindex">
                  <RefreshCw className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {(!foldersData?.folders || foldersData.folders.length === 0) && (
            <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
              No folders watched yet. Add one above.
            </div>
          )}
        </div>
      </div>

      {/* System Settings */}
      <div className="space-y-6 pt-8 border-t border-border">
        <div>
          <h2 className="text-xl font-semibold">System Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">Local AI models and storage configuration.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="glass-card p-5 rounded-xl space-y-4">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-accent" />
              <h3 className="font-medium">Ollama Backend</h3>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Status</span>
                <span className="text-green-400 font-medium">Running</span>
              </div>
              <div className="flex justify-between">
                <span>Embedding Model</span>
                <span className="font-mono">nomic-embed-text</span>
              </div>
              <div className="flex justify-between">
                <span>LLM</span>
                <span className="font-mono">llama3</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl space-y-4">
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-primary" />
              <h3 className="font-medium">Vector Database</h3>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Engine</span>
                <span>ChromaDB</span>
              </div>
              <div className="flex justify-between">
                <span>Storage Path</span>
                <span className="font-mono">~/.memoryos/db</span>
              </div>
              <div className="pt-2 mt-2 border-t border-white/5">
                <Button variant="destructive" size="sm" className="w-full">Clear Database</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
