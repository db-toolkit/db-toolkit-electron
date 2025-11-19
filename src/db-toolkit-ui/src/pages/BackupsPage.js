import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Database, Clock } from 'lucide-react';
import { useBackups } from '../hooks/useBackups';
import { useConnections } from '../hooks';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/common/Button';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { BackupCard } from '../components/backup/BackupCard';
import { BackupModal } from '../components/backup/BackupModal';
import { ScheduleModal } from '../components/backup/ScheduleModal';
import { ScheduleCard } from '../components/backup/ScheduleCard';
import { useBackupWebSocket } from '../websockets/useBackupWebSocket';
import { pageTransition } from '../utils/animations';
import api from '../services/api';

function BackupsPage() {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [activeTab, setActiveTab] = useState('backups');
  const { connections } = useConnections();
  const { backups, loading, createBackup, restoreBackup, downloadBackup, deleteBackup, fetchBackups } = useBackups();

  const handleBackupUpdate = useCallback((data) => {
    fetchBackups(true);
    
    if (data.status === 'completed') {
      if (Notification.permission === 'granted') {
        new Notification('Backup Completed', {
          body: `Backup completed successfully`,
          icon: '/icon.png'
        });
      }
      toast.success('Backup completed successfully');
    } else if (data.status === 'failed') {
      if (Notification.permission === 'granted') {
        new Notification('Backup Failed', {
          body: data.data?.error || 'Backup failed',
          icon: '/icon.png'
        });
      }
      toast.error('Backup failed');
    }
  }, [fetchBackups, toast]);

  useBackupWebSocket(handleBackupUpdate);

  useEffect(() => {
    fetchSchedules();
    
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await api.get('/backup-schedules');
      setSchedules(response.data.schedules);
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
    }
  };

  const handleCreate = async (data) => {
    try {
      await createBackup(data);
      toast.success('Backup created successfully');
      setShowModal(false);
    } catch (err) {
      toast.error('Failed to create backup');
    }
  };

  const handleCreateSchedule = async (data) => {
    try {
      await api.post('/backup-schedules', data);
      await fetchSchedules();
      toast.success('Schedule created successfully');
      setShowScheduleModal(false);
    } catch (err) {
      toast.error('Failed to create schedule');
    }
  };

  const handleToggleSchedule = async (scheduleId, enabled) => {
    try {
      await api.put(`/backup-schedules/${scheduleId}`, { enabled });
      await fetchSchedules();
      toast.success(enabled ? 'Schedule enabled' : 'Schedule disabled');
    } catch (err) {
      toast.error('Failed to update schedule');
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Delete this schedule?')) return;
    
    try {
      await api.delete(`/backup-schedules/${scheduleId}`);
      await fetchSchedules();
      toast.success('Schedule deleted');
    } catch (err) {
      toast.error('Failed to delete schedule');
    }
  };

  const handleVerify = async (backupId) => {
    try {
      const response = await api.post(`/backups/${backupId}/verify`);
      if (response.data.success) {
        toast.success('Backup verified successfully');
        await fetchBackups();
      } else {
        toast.error('Backup verification failed');
      }
    } catch (err) {
      toast.error('Failed to verify backup');
    }
  };

  const handleRestore = async (backupId) => {
    if (!window.confirm('Restore this backup? This will overwrite existing data.')) return;
    
    try {
      await restoreBackup(backupId);
      toast.success('Backup restored successfully');
    } catch (err) {
      toast.error('Failed to restore backup');
    }
  };

  const handleDownload = async (backupId, filename) => {
    try {
      await downloadBackup(backupId, filename);
      toast.success('Backup downloaded');
    } catch (err) {
      toast.error('Failed to download backup');
    }
  };

  const handleDelete = async (backupId) => {
    if (!window.confirm('Delete this backup? This cannot be undone.')) return;
    
    try {
      await deleteBackup(backupId);
      toast.success('Backup deleted');
    } catch (err) {
      toast.error('Failed to delete backup');
    }
  };

  if (loading) return <LoadingState fullScreen message="Loading backups..." />;

  return (
    <motion.div className="p-8" {...pageTransition}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Database Backups</h2>
        <div className="flex gap-2">
          <Button icon={<Plus size={20} />} onClick={() => setShowModal(true)}>
            New Backup
          </Button>
          <Button variant="secondary" icon={<Clock size={20} />} onClick={() => setShowScheduleModal(true)}>
            Schedule Backup
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('backups')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'backups'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          Backups ({backups.length})
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'schedules'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          Schedules ({schedules.length})
        </button>
      </div>

      {activeTab === 'backups' && backups.length === 0 ? (
        <EmptyState
          icon={Database}
          title="No backups yet"
          description="Create your first database backup to protect your data"
          action={
            <Button icon={<Plus size={20} />} onClick={() => setShowModal(true)}>
              Create Backup
            </Button>
          }
        />
      ) : activeTab === 'backups' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {backups.map((backup) => (
            <BackupCard
              key={backup.id}
              backup={backup}
              onRestore={handleRestore}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No schedules yet"
          description="Create a backup schedule to automate your backups"
          action={
            <Button icon={<Plus size={20} />} onClick={() => setShowScheduleModal(true)}>
              Create Schedule
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              onToggle={handleToggleSchedule}
              onDelete={handleDeleteSchedule}
            />
          ))}
        </div>
      )}

      <BackupModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleCreate}
        connections={connections}
      />

      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onSave={handleCreateSchedule}
        connections={connections}
      />
    </motion.div>
  );
}

export default BackupsPage;
