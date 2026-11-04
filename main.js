const { app, BrowserWindow, ipcMain, powerSaveBlocker } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let blockerId = null;
let timer = null;
let presence = null;

// Teams/Slack go "Away" after a few minutes without keyboard/mouse input.
// F15 counts as real input but no app reacts to it, so it resets the idle clock harmlessly.
function startPresence() {
  const script = "$w = New-Object -ComObject WScript.Shell; while ($true) { $w.SendKeys('{F15}'); Start-Sleep -Seconds 60 }";
  presence = spawn('powershell.exe', ['-NoProfile', '-WindowStyle', 'Hidden', '-Command', script], { windowsHide: true });
}

function stop() {
  if (blockerId !== null && powerSaveBlocker.isStarted(blockerId)) powerSaveBlocker.stop(blockerId);
  blockerId = null;
  if (presence) presence.kill();
  presence = null;
  clearTimeout(timer);
}

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 320, height: 400, resizable: false, autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });
  win.loadFile('index.html');

  // mode: 'prevent-display-sleep' keeps screen on; 'prevent-app-suspension' only keeps system awake
  ipcMain.handle('start', (_e, mode, minutes, keepActive) => {
    stop();
    blockerId = powerSaveBlocker.start(mode);
    if (keepActive) startPresence();
    if (minutes > 0) timer = setTimeout(() => { stop(); win.webContents.send('stopped'); }, minutes * 60000);
    return true;
  });
  ipcMain.handle('stop', () => { stop(); return false; });
});

app.on('window-all-closed', () => { stop(); app.quit(); });
