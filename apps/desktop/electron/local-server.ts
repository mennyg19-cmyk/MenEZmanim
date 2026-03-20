import express from 'express';
import path from 'path';
import os from 'os';

const app = express();
const PORT = 3001;

const mobilePwaDir = path.join(__dirname, '..', '..', 'mobile-pwa');
app.use(express.static(mobilePwaDir));

app.get('/api/zmanim/:date', (req, res) => {
  const params = (req as { params?: { date?: string } }).params;
  res.json({
    date: params?.date ?? '',
    zmanim: [],
    message: 'Placeholder - zmanim data',
  });
});

app.get('/api/schedule', (_req, res) => {
  res.json({
    schedule: [],
    message: 'Placeholder - schedule data',
  });
});

app.get('/api/announcements', (_req, res) => {
  res.json({
    announcements: [],
    message: 'Placeholder - announcements data',
  });
});

function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (!iface) continue;
    for (const info of iface) {
      if (String(info.family) === 'IPv4' && !info.internal) {
        return info.address;
      }
    }
  }
  return '127.0.0.1';
}

export function startLocalServer(): void {
  app.listen(PORT, () => {
    const localIp = getLocalIpAddress();
    console.log(`[Local Server] Mobile PWA available at http://${localIp}:${PORT}`);
    console.log(`[Local Server] Or connect via http://localhost:${PORT}`);
  });
}
