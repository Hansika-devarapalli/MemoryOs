import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Brain, Home, Search, Clock, Settings } from 'lucide-react';
import { useGetStats } from '@workspace/api-client-react';

const NAV = [
  { href: '/dashboard', label: 'Home',          icon: Home   },
  { href: '/search',    label: 'Remember',       icon: Search },
  { href: '/timeline',  label: 'Memory Journey', icon: Clock  },
  { href: '/settings',  label: 'Settings',       icon: Settings },
];

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { data: stats } = useGetStats();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className="w-56 shrink-0 flex flex-col border-r border-border"
        style={{ background: 'hsl(var(--sidebar))' }}
      >
        {/* Logo */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-foreground">MemoryOS</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = location.startsWith(href);
            return (
              <Link key={href} href={href} className="block outline-none">
                <div
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-100 cursor-pointer
                    ${active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent'
                    }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary' : 'opacity-60'}`} />
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-background border border-border">
            <div className="status-dot active" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                {stats ? `${stats.totalDocuments.toLocaleString()} memories` : 'Loading…'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>

    </div>
  );
}
