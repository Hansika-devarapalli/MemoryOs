import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full text-center space-y-6">
      <h1 className="text-8xl font-bold text-primary">404</h1>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Page not found</h2>
        <p className="text-muted-foreground">The memory you are looking for has not been indexed.</p>
      </div>
      <Button asChild>
        <Link href="/">Return to Dashboard</Link>
      </Button>
    </div>
  );
}
