import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Toaster } from 'sonner';

import { Layout } from './components/layout';
import LandingPage from './pages/landing';
import Dashboard from './pages/dashboard';
import SearchPage from './pages/search';
import TimelinePage from './pages/timeline';
import DocumentViewer from './pages/document-viewer';
import SettingsPage from './pages/settings';
import NotFound from './pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard">
        <Layout><Dashboard /></Layout>
      </Route>
      <Route path="/search">
        <Layout><SearchPage /></Layout>
      </Route>
      <Route path="/timeline">
        <Layout><TimelinePage /></Layout>
      </Route>
      <Route path="/documents/:id">
        <Layout><DocumentViewer /></Layout>
      </Route>
      <Route path="/settings">
        <Layout><SettingsPage /></Layout>
      </Route>
      <Route>
        <Layout><NotFound /></Layout>
      </Route>
    </Switch>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <AppRoutes />
      </WouterRouter>
      <Toaster theme="dark" position="bottom-right" className="font-sans" />
    </QueryClientProvider>
  );
}

export default App;
