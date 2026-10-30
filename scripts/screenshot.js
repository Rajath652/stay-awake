// Renders the UI in its idle and running states and saves PNGs to docs/ for the README.
// Run with: npm run screenshots
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// Stub the real handlers so taking screenshots doesn't touch power settings.
ipcMain.handle('start', () => true);
ipcMain.handle('stop', () => false);

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 320, height: 340, show: false, autoHideMenuBar: true,
    webPreferences: { preload: path.join(root, 'preload.js') }
  });
  await win.loadFile(path.join(root, 'index.html'));

  const save = async (name) => {
    await new Promise((r) => setTimeout(r, 300));
    fs.writeFileSync(path.join(root, 'docs', name), (await win.webContents.capturePage()).toPNG());
  };

  await save('idle.png');
  await win.webContents.executeJavaScript("document.getElementById('btn').click()");
  await save('running.png');
  app.quit();
});
