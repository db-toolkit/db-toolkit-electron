import React, { useState, useEffect } from 'react';
import { connectionsAPI } from '../services/api';

function ConnectionsPage() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const response = await connectionsAPI.getAll();
      setConnections(response.data);
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="connections-page">
      <h2>Database Connections</h2>
      <div className="connections-list">
        {connections.length === 0 ? (
          <p>No connections yet. Create your first connection.</p>
        ) : (
          connections.map((conn) => (
            <div key={conn.id} className="connection-card">
              <h3>{conn.name}</h3>
              <p>{conn.db_type}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ConnectionsPage;
