import React from 'react';
import { DisplayApp } from '@zmanim-app/ui';

declare global {
  interface Window {
    electronAPI?: {
      getConfig: () => Promise<Record<string, unknown>>;
      saveConfig: (config: Record<string, unknown>) => Promise<boolean>;
      getDbPath: () => Promise<string>;
      onSyncUpdate: (callback: (data: unknown) => void) => void;
      getMode: () => Promise<string>;
    };
  }
}

export function App(): React.ReactElement {
  const [config, setConfig] = React.useState<{ orgId?: string; screenId?: string } | null>(null);

  React.useEffect(() => {
    const api = window.electronAPI;
    if (api) {
      api.getConfig().then((cfg) => setConfig(cfg as { orgId?: string; screenId?: string }));
    } else {
      setConfig({ orgId: 'default', screenId: '1' });
    }
  }, []);

  if (!config) {
    return <div>Loading...</div>;
  }

  const orgId = config.orgId ?? 'default';
  const screenId = config.screenId ?? '1';

  return <DisplayApp orgId={orgId} screenId={screenId} />;
}
