export function detectPlatform() {
  if (typeof window === 'undefined') return null;
  
  const platform = window.navigator.platform.toLowerCase();
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  if (platform.includes('win') || userAgent.includes('win')) return 'windows';
  if (platform.includes('mac') || userAgent.includes('mac')) return 'macos';
  if (platform.includes('linux') || userAgent.includes('linux')) return 'linux';
  
  return 'windows';
}

export function getDownloadUrl(platform) {
  const urls = {
    windows: 'https://github.com/Adelodunpeter25/db-toolkit/releases/latest/download/DB.Toolkit-win-x64.exe',
    macos: 'https://github.com/Adelodunpeter25/db-toolkit/releases/latest/download/DB.Toolkit-mac-x64.dmg',
    linux: 'https://github.com/Adelodunpeter25/db-toolkit/releases/latest/download/DB.Toolkit-linux.AppImage'
  };
  
  return urls[platform] || urls.windows;
}
