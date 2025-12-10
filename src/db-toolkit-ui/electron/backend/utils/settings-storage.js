/**
 * Settings storage management.
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const DEFAULT_SETTINGS = {
  theme: 'auto',
  editor_font_size: 14,
  default_query_limit: 1000,
  default_query_timeout: 30,
  auto_format_on_paste: false,
  query_history_retention_days: 30,
  editor_tab_size: 2,
  editor_word_wrap: true,
  editor_auto_complete: true,
  editor_snippets_enabled: true,
  default_db_type: 'postgresql',
  connection_timeout: 10,
  auto_reconnect: true,
};

class SettingsStorage {
  constructor(storagePath = null) {
    this.storagePath = storagePath || path.join(os.homedir(), '.db-toolkit', 'settings.json');
  }

  async ensureStorageDir() {
    const dir = path.dirname(this.storagePath);
    await fs.mkdir(dir, { recursive: true });
  }

  async getSettings() {
    try {
      await this.ensureStorageDir();
      const data = await fs.readFile(this.storagePath, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { ...DEFAULT_SETTINGS };
      }
      throw error;
    }
  }

  async updateSettings(updates) {
    const current = await this.getSettings();
    const updated = { ...current, ...updates };
    await this.saveSettings(updated);
    return updated;
  }

  async resetSettings() {
    await this.saveSettings(DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS };
  }

  async saveSettings(settings) {
    await this.ensureStorageDir();
    await fs.writeFile(this.storagePath, JSON.stringify(settings, null, 2), 'utf-8');
  }
}

const settingsStorage = new SettingsStorage();

module.exports = { SettingsStorage, settingsStorage };
