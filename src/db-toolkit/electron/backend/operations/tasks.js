/**
 * Background tasks initialization.
 */

const { backupScheduler } = require('./backup/backup-scheduler');
const { logger } = require('../utils/logger');

function startBackgroundTasks() {
  logger.info('Starting background tasks');
  backupScheduler.start();
}

function stopBackgroundTasks() {
  logger.info('Stopping background tasks');
  backupScheduler.stop();
}

module.exports = { startBackgroundTasks, stopBackgroundTasks };
