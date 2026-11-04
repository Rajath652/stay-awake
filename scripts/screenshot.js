// Shows the real window (title bar included) in its idle and running states and saves PNGs to docs/ for the README.
// Run with: npm run screenshots   (Windows only — the grab uses PowerShell)
const { app, BrowserWindow, ipcMain } = require('electron');
const { execFileSync } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');

// Stub the real handlers so taking screenshots doesn't touch power settings.
ipcMain.handle('start', () => true);
ipcMain.handle('stop', () => false);

// Grabs the window's visible bounds (DWM frame, so no invisible resize border) straight off the screen.
const grab = `
Add-Type -AssemblyName System.Drawing
Add-Type @'
using System; using System.Runtime.InteropServices;
public static class W {
  [StructLayout(LayoutKind.Sequential)] public struct R { public int L, T, Ri, B; }
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("dwmapi.dll")] public static extern int DwmGetWindowAttribute(IntPtr h, int a, out R r, int s);
}
'@
[W]::SetProcessDPIAware() | Out-Null
$r = New-Object W+R
[W]::DwmGetWindowAttribute([IntPtr][long]$env:HWND, 9, [ref]$r, 16) | Out-Null
$bmp = New-Object Drawing.Bitmap ($r.Ri - $r.L), ($r.B - $r.T)
[Drawing.Graphics]::FromImage($bmp).CopyFromScreen($r.L, $r.T, 0, 0, $bmp.Size)
$bmp.Save($env:OUT, [Drawing.Imaging.ImageFormat]::Png)
`;

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 320, height: 400, resizable: false, autoHideMenuBar: true, alwaysOnTop: true,
    webPreferences: { preload: path.join(root, 'preload.js') }
  });
  await win.loadFile(path.join(root, 'index.html'));
  const hwnd = win.getNativeWindowHandle().readBigUInt64LE().toString();

  const save = async (name) => {
    win.focus();
    await new Promise((r) => setTimeout(r, 800));
    execFileSync('powershell.exe', ['-NoProfile', '-Command', grab], {
      env: { ...process.env, HWND: hwnd, OUT: path.join(root, 'docs', name) }
    });
  };

  await save('idle.png');
  await win.webContents.executeJavaScript("mins.value='15'; document.getElementById('btn').click()");
  await save('running.png');
  app.quit();
});
