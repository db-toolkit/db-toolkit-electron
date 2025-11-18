
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Database } from 'lucide-react';
import { useConnections } from '../hooks';
import { useSession } from '../hooks/useSession';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/common/Button';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { ConnectionCard } from '../components/connections/ConnectionCard';
import { ConnectionModal } from '../components/connections/ConnectionModal';

function ConnectionsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalError, setModalError] = useState('');
  const [activeConnections, setActiveConnections] = useState(new Set());
  const { connections, loading, error, createConnection, deleteConnection, connectToDatabase } = useConnections();
  const { sessionState, restoreSession } = useSession();

  useEffect(() => {
    if (sessionState?.active_connections) {
      setActiveConnections(new Set(sessionState.active_connections));
    }
  }, [sessionState]);

  const handleConnect = async (id) => {
    try {
      const response = await connectToDatabase(id);
      if (response.success === false) {
        setShowErrorModal(true);
        setModalError('Failed to connect. Please check your credentials and database server.');
        return;
      }
      setActiveConnections(prev => new Set([...prev, id]));
      toast.success('Connected successfully');
      navigate(`/schema/${id}`);
    } catch (err) {
      setShowErrorModal(true);
      setModalError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this connection?')) {
      try {
        await deleteConnection(id);
        toast.success('Connection deleted');
      } catch (err) {
        toast.error('Delete failed');
      }
    }
  };

  const handleCreate = async (data) => {
    try {
      await createConnection(data);
      toast.success('Connection created');
      setShowModal(false);
    } catch (err) {
      toast.error('Failed to create connection');
    }
  };

  if (loading) return <LoadingState fullScreen message="Loading connections..." />;
  
  if (error) return (
    <div className="p-8">
      <ErrorMessage message={error} />
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Database Connections</h2>
        <Button icon={<Plus size={20} />} onClick={() => setShowModal(true)}>
          New Connection
        </Button>
      </div>
      
      {connections.length === 0 ? (
        <EmptyState
          icon={Database}
          title="No connections yet"
          description="Create your first database connection to get started"
          action={
            <Button icon={<Plus size={20} />} onClick={() => setShowModal(true)}>
              Create Connection
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map((conn) => (
            <ConnectionCard
              key={conn.id}
              connection={conn}
              onConnect={handleConnect}
              onDelete={handleDelete}
              isActive={activeConnections.has(conn.id)}
            />
          ))}
        </div>
      )}

      <ConnectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleCreate}
      />

      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Connection Failed</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">{modalError}</p>
            <Button onClick={() => setShowErrorModal(false)} className="w-full">
              Back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConnectionsPage;
