import { app, BrowserWindow, ipcMain, Tray, nativeImage, Menu, globalShortcut } from 'electron';
import path from 'path';
import fs from 'fs';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow: InstanceType<typeof BrowserWindow> | null = null;
let adminWindow: InstanceType<typeof BrowserWindow> | null = null;
let tray: InstanceType<typeof Tray> | null = null;

let dataDir: string;
let configPath: string;
let config: Record<string, unknown> = {};

function getBasePath(): string {
  const exePath = app.getPath('exe');
  return path.dirname(exePath);
}

function ensureDataDir(): void {
  const basePath = getBasePath();
  dataDir = path.join(basePath, 'data');
  configPath = path.join(dataDir, 'config.json');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function loadConfig(): Record<string, unknown> {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load config:', err);
  }
  return {};
}

function saveConfig(cfg: Record<string, unknown>): void {
  try {
    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf-8');
    config = cfg;
  } catch (err) {
    console.error('Failed to save config:', err);
  }
}

function getDbPath(): string {
  return path.join(dataDir, 'zmanim.db');
}

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    frame: true,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, '..', '..', 'out', 'web', 'index.html');
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      mainWindow.loadURL('http://localhost:3000');
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createAdminWindow(): void {
  if (adminWindow) {
    adminWindow.focus();
    return;
  }

  adminWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    adminWindow.loadURL('http://localhost:3000/admin');
  } else {
    const adminPath = path.join(__dirname, '..', '..', 'out', 'web', 'admin', 'index.html');
    if (fs.existsSync(adminPath)) {
      adminWindow.loadFile(adminPath);
    } else {
      adminWindow.loadURL('http://localhost:3000/admin');
    }
  }

  adminWindow.on('closed', () => {
    adminWindow = null;
  });

  adminWindow.once('ready-to-show', () => {
    adminWindow?.show();
  });
}

function toggleAdminWindow(): void {
  if (adminWindow) {
    if (adminWindow.isVisible()) {
      adminWindow.hide();
    } else {
      adminWindow.show();
      adminWindow.focus();
    }
  } else {
    createAdminWindow();
  }
}

function createTray(): void {
  const iconPath = path.join(__dirname, '..', '..', 'assets', 'tray-icon.png');
  let icon = nativeImage.createEmpty();
  if (fs.existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath);
  }
  if (icon.isEmpty()) {
    icon = nativeImage.createFromDataURL(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    );
  }

  tray = new Tray(icon);
  tray.setToolTip('Zmanim App');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show Display', click: () => mainWindow?.show() },
      { label: 'Show Admin', click: () => toggleAdminWindow() },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() },
    ])
  );
}

function setupIpc(): void {
  ipcMain.handle('get-config', () => config);
  ipcMain.handle('save-config', (_event: unknown, cfg: Record<string, unknown>) => {
    saveConfig(cfg);
    return true;
  });
  ipcMain.handle('get-db-path', () => getDbPath());
  ipcMain.handle('get-mode', () => (isDev ? 'development' : 'production'));
}

import { startLocalServer } from './local-server';

function initLocalServer(): void {
  startLocalServer();
}

app.whenReady().then(() => {
  ensureDataDir();
  config = loadConfig();
  setupIpc();
  createMainWindow();
  createTray();
  initLocalServer();

  globalShortcut.register('CommandOrControl+Shift+A', () => {
    toggleAdminWindow();
  });
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});
