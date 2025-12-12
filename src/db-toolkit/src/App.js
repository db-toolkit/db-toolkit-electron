import { useState, useEffect, lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useWorkspaceShortcuts } from './hooks/useWorkspaceShortcuts';
import Layout from './components/common/Layout';
import SplashScreen from './components/common/SplashScreen';
import { Spinner } from './components/common/Spinner';
import { useMenuActions } from './hooks/useMenuActions';
import { WorkspaceProvider } from './components/workspace/WorkspaceProvider';
import './styles/App.css';
import './styles/split.css';

// Lazy load pages to reduce initial bundle size
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ConnectionsPage = lazy(() => import('./pages/ConnectionsPage'));
const SchemaPage = lazy(() => import('./pages/SchemaPage'));
const QueryPage = lazy(() => import('./pages/QueryPage'));
const QueryEditorSelectPage = lazy(() => import('./pages/QueryEditorSelectPage'));
const DataExplorerPage = lazy(() => import('./pages/DataExplorerPage'));
const MigrationsPage = lazy(() => import('./pages/MigrationsPage'));
const BackupsPage = lazy(() => import('./pages/BackupsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const DocumentationPage = lazy(() => import('./pages/DocumentationPage'));

function AppContent() {
  const navigate = useNavigate();
  useMenuActions();
  useWorkspaceShortcuts();

  useEffect(() => {
    const sessionState = JSON.parse(localStorage.getItem('session-state') || '{}');
    if (!sessionState.has_opened_before) {
      localStorage.setItem('session-state', JSON.stringify({
        ...sessionState,
        has_opened_before: true,
        last_active: new Date().toISOString()
      }));
      navigate('/', { replace: true });
    }

    // Request notification permission on first navigation
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [navigate]);

  return (
    <WorkspaceProvider>
      <Layout>
        <Suspense fallback={
          <div className="flex items-center justify-center h-screen">
            <div className="flex flex-col items-center">
              <Spinner size={20} className="text-green-500" />
              <span className="mt-2 text-sm text-gray-500">Loading...</span>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/connections" element={<ConnectionsPage />} />
            <Route path="/schema/:connectionId" element={<SchemaPage />} />
            <Route path="/query-editor" element={<QueryEditorSelectPage />} />
            <Route path="/query/:connectionId" element={<QueryPage />} />
            <Route path="/data-explorer" element={<DataExplorerPage />} />
            <Route path="/migrations" element={<MigrationsPage />} />
            <Route path="/backups" element={<BackupsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/docs" element={<DocumentationPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </WorkspaceProvider>
  );
}

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1800);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => clearTimeout(timer);
  }, []);

  if (loading) return <SplashScreen />;

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
