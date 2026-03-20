import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config: Record<string, unknown>) => ipcRenderer.invoke('save-config', config),
  getDbPath: () => ipcRenderer.invoke('get-db-path'),
  onSyncUpdate: (callback: (data: unknown) => void) => {
    ipcRenderer.on('sync-update', (_event: unknown, data: unknown) => callback(data));
  },
  getMode: () => ipcRenderer.invoke('get-mode'),
});
