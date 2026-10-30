const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('awake', {
  start: (mode, minutes, keepActive) => ipcRenderer.invoke('start', mode, minutes, keepActive),
  stop: () => ipcRenderer.invoke('stop'),
  onStopped: (cb) => ipcRenderer.on('stopped', cb)
});
