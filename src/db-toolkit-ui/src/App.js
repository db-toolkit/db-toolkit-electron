import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/common/Layout';
import SplashScreen from './components/common/SplashScreen';
import DashboardPage from './pages/DashboardPage';
import ConnectionsPage from './pages/ConnectionsPage';
import SchemaPage from './pages/SchemaPage';
import QueryPage from './pages/QueryPage';
import DataExplorerPage from './pages/DataExplorerPage';
import BackupsPage from './pages/BackupsPage';
import DocumentationPage from './pages/DocumentationPage';
import './styles/App.css';
import './styles/split.css';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <SplashScreen />;

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/connections" element={<ConnectionsPage />} />
          <Route path="/schema/:connectionId" element={<SchemaPage />} />
          <Route path="/query/:connectionId" element={<QueryPage />} />
          <Route path="/data-explorer" element={<DataExplorerPage />} />
          <Route path="/backups" element={<BackupsPage />} />
          <Route path="/docs" element={<DocumentationPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
