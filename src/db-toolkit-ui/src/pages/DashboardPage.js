import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, FileText, HardDrive, Plus, ArrowRight, Activity } from 'lucide-react';
import { useConnections } from '../hooks';
import { Button } from '../components/common/Button';
import api from '../services/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { connections, loading } = useConnections();
  const [stats, setStats] = useState({ queries: 0, backups: 0 });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const loadStats = async () => {
      const queryTabs = JSON.parse(localStorage.getItem('query-tabs') || '[]');
      
      let backupCount = 0;
      try {
        const response = await api.get('/backup-schedules');
        backupCount = response.data.schedules?.length || 0;
      } catch (err) {
        console.error('Failed to fetch backup schedules:', err);
      }
      
      setStats({
        queries: queryTabs.length,
        backups: backupCount
      });
    };
    
    loadStats();

    const activity = [];
    const sessionState = JSON.parse(localStorage.getItem('session-state') || '{}');
    if (sessionState.last_active) {
      const lastActive = new Date(sessionState.last_active);
      const timeAgo = getTimeAgo(lastActive);
      activity.push({ text: 'Last session activity', time: timeAgo, icon: Activity });
    }
    
    setRecentActivity(activity);
  }, []);

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const activeConnections = connections.filter(c => c.status === 'connected');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome to DB Toolkit</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Modern database management made simple</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-green-300 dark:hover:border-green-700 transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Database className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{connections.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Connections</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.queries}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Saved Queries</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <HardDrive className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.backups}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Backup Schedules</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('/connections')}>
            <Plus size={16} className="mr-1" /> New Connection
          </Button>
          <Button variant="secondary" onClick={() => navigate('/query/new')}>
            <FileText size={16} className="mr-1" /> New Query
          </Button>
          <Button variant="secondary" onClick={() => navigate('/backups')}>
            <HardDrive size={16} className="mr-1" /> Create Backup
          </Button>
        </div>
      </div>

      {connections.length === 0 ? (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-8 border border-green-200 dark:border-green-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Getting Started</h2>
          <ol className="space-y-3 text-gray-700 dark:text-gray-300 mb-6">
            <li className="flex items-start gap-2">
              <span className="font-semibold">1.</span>
              <span>Create your first database connection</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">2.</span>
              <span>Explore your schema and tables</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">3.</span>
              <span>Run queries and manage your data</span>
            </li>
          </ol>
          <Button onClick={() => navigate('/connections')}>
            Get Started <ArrowRight size={16} className="ml-1" />
          </Button>
        </div>
      ) : (
        <>
          {recentActivity.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <activity.icon size={16} />
                    <span>{activity.text}</span>
                    <span className="text-gray-400 dark:text-gray-500">• {activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Connections</h2>
              {connections.length > 2 && (
                <Button size="sm" variant="secondary" onClick={() => navigate('/connections')}>
                  View All
                </Button>
              )}
            </div>
            {connections.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No connections yet</p>
            ) : (
              <div className="space-y-3">
                {connections.slice(0, 2).map((conn) => (
                  <div
                    key={conn.id}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${conn.status === 'connected' ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{conn.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {conn.db_type} • {conn.host}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => navigate(`/schema/${conn.id}`)}>
                        Open Schema
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => navigate(`/query/${conn.id}`)}>
                        Open Query
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
