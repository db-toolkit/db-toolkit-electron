const { dialog, shell } = require('electron');
const https = require('https');

const GITHUB_REPO = 'Adelodunpeter25/db-toolkit';
const CURRENT_VERSION = '0.5.1';

function compareVersions(current, latest) {
  const c = current.replace('v', '').split('.').map(Number);
  const l = latest.replace('v', '').split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (l[i] > c[i]) return 1;
    if (l[i] < c[i]) return -1;
  }
  return 0;
}

function fetchLatestRelease() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_REPO}/releases/latest`,
      headers: { 'User-Agent': 'DB-Toolkit' }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error('Failed to fetch release'));
        }
      });
    }).on('error', reject);
  });
}

async function checkForUpdates() {
  try {
    const release = await fetchLatestRelease();
    const latestVersion = release.tag_name;
    const comparison = compareVersions(CURRENT_VERSION, latestVersion);

    if (comparison < 0) {
      const response = await dialog.showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: `DB Toolkit ${latestVersion} is available!`,
        detail: `You are currently using version ${CURRENT_VERSION}.\n\n${release.name}\n\n${release.body?.substring(0, 200) || ''}...`,
        buttons: ['Download Update', 'Later'],
        defaultId: 0
      });

      if (response.response === 0) {
        shell.openExternal(release.html_url);
      }
    } else {
      dialog.showMessageBox({
        type: 'info',
        title: 'No Updates',
        message: 'You\'re up to date!',
        detail: `DB Toolkit ${CURRENT_VERSION} is the latest version.`,
        buttons: ['OK']
      });
    }
  } catch (error) {
    dialog.showMessageBox({
      type: 'error',
      title: 'Update Check Failed',
      message: 'Unable to check for updates',
      detail: 'Please check your internet connection and try again.',
      buttons: ['OK']
    });
  }
}

module.exports = { checkForUpdates };
