/**
 * Backup scheduler service.
 */

const backupStorage = require('../../utils/backup-storage');
const { connectionStorage } = require('../../utils/connection-storage');
const { BackupManager } = require('../backup-manager');
const { logger } = require('../../utils/logger');

class BackupScheduler {
  constructor() {
    this.timer = null;
    this.backupManager = new BackupManager();
  }

  start() {
    if (this.timer) return;
    
    logger.info('Starting backup scheduler');
    this.timer = setInterval(() => this.checkSchedules(), 60000); // Check every minute
    this.checkSchedules(); // Check immediately on start
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info('Stopped backup scheduler');
    }
  }

  async checkSchedules() {
    try {
      const schedules = await backupStorage.getAllSchedules();
      const now = new Date();

      for (const schedule of schedules) {
        if (!schedule.enabled) continue;

        const nextRun = schedule.next_run ? new Date(schedule.next_run) : null;
        
        if (!nextRun || now >= nextRun) {
          await this.executeSchedule(schedule);
        }
      }
    } catch (error) {
      logger.error('Error checking schedules:', error);
    }
  }

  async executeSchedule(schedule) {
    try {
      logger.info(`Executing scheduled backup: ${schedule.name}`);

      const connection = await connectionStorage.getConnection(schedule.connection_id);
      if (!connection) {
        logger.error(`Connection not found for schedule: ${schedule.name}`);
        return;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const backupName = `${schedule.name}_${timestamp}`;

      await this.backupManager.createBackup(
        null,
        connection,
        backupName,
        schedule.backup_type,
        null,
        schedule.compressed,
        schedule.id,
        schedule.backup_path
      );

      const lastRun = new Date();
      const nextRun = this.calculateNextRun(schedule.schedule, lastRun);

      await backupStorage.updateSchedule(schedule.id, {
        last_run: lastRun.toISOString(),
        next_run: nextRun.toISOString()
      });

      await this.applyRetentionPolicy(schedule);

      logger.info(`Scheduled backup completed: ${schedule.name}`);
    } catch (error) {
      logger.error(`Error executing schedule ${schedule.name}:`, error);
    }
  }

  calculateNextRun(scheduleType, fromDate) {
    const next = new Date(fromDate);

    switch (scheduleType) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
    }

    return next;
  }

  async applyRetentionPolicy(schedule) {
    try {
      const allBackups = await backupStorage.getAllBackups(schedule.connection_id);
      const scheduleBackups = allBackups
        .filter(b => b.schedule_id === schedule.id && b.status === 'completed')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      if (scheduleBackups.length > schedule.retention_count) {
        const toDelete = scheduleBackups.slice(schedule.retention_count);
        
        for (const backup of toDelete) {
          logger.info(`Deleting old backup (retention policy): ${backup.name}`);
          await this.backupManager.deleteBackup(backup.id);
        }
      }
    } catch (error) {
      logger.error('Error applying retention policy:', error);
    }
  }
}

const backupScheduler = new BackupScheduler();

module.exports = { BackupScheduler, backupScheduler };
