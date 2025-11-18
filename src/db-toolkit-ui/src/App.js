import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/common/Layout';
import ConnectionsPage from './pages/ConnectionsPage';
import SchemaPage from './pages/SchemaPage';
import QueryPage from './pages/QueryPage';
import './styles/App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<ConnectionsPage />} />
          <Route path="/schema/:connectionId" element={<SchemaPage />} />
          <Route path="/query/:connectionId" element={<QueryPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
