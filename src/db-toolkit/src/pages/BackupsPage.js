import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Database, Clock, Search } from 'lucide-react';
import { useDebounce } from '../utils/debounce';
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
import { ScheduleBackupsModal } from '../components/backup/ScheduleBackupsModal';
import { useBackupWebSocket } from '../websockets/useBackupWebSocket';
import { pageTransition } from '../utils/animations';
import api from '../services/api';

function BackupsPage() {
  const toast = useToast();
  const [showModal, setShowModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showScheduleBackupsModal, setShowScheduleBackupsModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [scheduleBackupCounts, setScheduleBackupCounts] = useState({});
  const [activeTab, setActiveTab] = useState('backups');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const { connections } = useConnections();
  const { backups, loading, createBackup, restoreBackup, downloadBackup, deleteBackup, fetchBackups } = useBackups();
  const [localBackups, setLocalBackups] = useState([]);

  useEffect(() => {
    setLocalBackups(backups);
  }, [backups]);

  const handleBackupUpdate = useCallback((data) => {
    setLocalBackups(prev => prev.map(b => 
      b.id === data.backup_id ? { ...b, status: data.status, progress: data.progress } : b
    ));
    if (data.status === 'completed' || data.status === 'failed') {
      fetchBackups(true);
    }
  }, [fetchBackups]);

  useBackupWebSocket(handleBackupUpdate);

  useEffect(() => {
    fetchSchedules();
    calculateScheduleBackupCounts();
  }, [backups]);

  const calculateScheduleBackupCounts = () => {
    const counts = {};
    schedules.forEach(schedule => {
      const scheduleBackups = (backups || []).filter(b => b.schedule_id === schedule.id);
      counts[schedule.id] = {
        count: scheduleBackups.length,
        lastStatus: scheduleBackups[0]?.status || null
      };
    });
    setScheduleBackupCounts(counts);
  };

  const fetchSchedules = async () => {
    try {
      const response = await api.invoke('backup:schedule:list');
      setSchedules(response.schedules || []);
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
      await api.invoke('backup:schedule:create', data);
      await fetchSchedules();
      toast.success('Schedule created successfully');
      setShowScheduleModal(false);
    } catch (err) {
      toast.error('Failed to create schedule');
    }
  };

  const handleToggleSchedule = async (scheduleId, enabled) => {
    try {
      await api.invoke('backup:schedule:update', scheduleId, { enabled });
      await fetchSchedules();
      toast.success(enabled ? 'Schedule enabled' : 'Schedule disabled');
    } catch (err) {
      toast.error('Failed to update schedule');
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm('Delete this schedule?')) return;
    
    try {
      await api.invoke('backup:schedule:delete', scheduleId);
      await fetchSchedules();
      toast.success('Schedule deleted');
    } catch (err) {
      toast.error('Failed to delete schedule');
    }
  };

  const handleViewScheduleBackups = (scheduleId) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    setSelectedSchedule(schedule);
    setShowScheduleBackupsModal(true);
  };

  const handleShowInFolder = async (filePath) => {
    try {
      await window.electron.ipcRenderer.invoke('shell:showItemInFolder', filePath);
    } catch (err) {
      toast.error('Failed to open folder');
    }
  };

  const getScheduleBackups = (scheduleId) => {
    return (backups || []).filter(b => b.schedule_id === scheduleId);
  };

  const handleVerify = async (backupId) => {
    try {
      const response = await api.invoke('backup:verify', backupId);
      if (response.success) {
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

  const filteredBackups = (localBackups || []).filter(backup => 
    backup.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    backup.backup_type.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const filteredSchedules = (schedules || []).filter(schedule => 
    schedule.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  if (loading) return (
    <div className="p-8">
      <LoadingState message="Loading backups..." />
    </div>
  );

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

      {((backups || []).length > 0 || (schedules || []).length > 0) && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('backups')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'backups'
              ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          Backups ({filteredBackups.length})
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'schedules'
              ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          Schedules ({filteredSchedules.length})
        </button>
      </div>

      {activeTab === 'backups' && filteredBackups.length === 0 && searchQuery ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>No backups found matching "{searchQuery}"</p>
        </div>
      ) : activeTab === 'backups' && (localBackups || []).length === 0 ? (
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
          {filteredBackups.map((backup) => (
            <BackupCard
              key={backup.id}
              backup={backup}
              onRestore={handleRestore}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : filteredSchedules.length === 0 && searchQuery ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>No schedules found matching "{searchQuery}"</p>
        </div>
      ) : (schedules || []).length === 0 ? (
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
          {filteredSchedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id || schedule.name}
              schedule={schedule}
              onToggle={handleToggleSchedule}
              onDelete={handleDeleteSchedule}
              onViewBackups={handleViewScheduleBackups}
              backupCount={scheduleBackupCounts[schedule.id]?.count || 0}
              lastBackupStatus={scheduleBackupCounts[schedule.id]?.lastStatus}
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

      <ScheduleBackupsModal
        isOpen={showScheduleBackupsModal}
        onClose={() => setShowScheduleBackupsModal(false)}
        schedule={selectedSchedule}
        backups={selectedSchedule ? getScheduleBackups(selectedSchedule.id) : []}
        onRestore={handleRestore}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onShowInFolder={handleShowInFolder}
      />
    </motion.div>
  );
}

export default BackupsPage;
