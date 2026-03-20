import type {
  SyncMessage,
  SyncBatch,
  SyncResponse,
} from './sync-protocol';

export interface SyncClientConfig {
  serverUrl: string;
  orgId: string;
  clientId: string;
  pollInterval: number;
  conflictStrategy: 'last-write-wins' | 'server-wins' | 'client-wins';
}

export type SyncStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'syncing'
  | 'error';

export class SyncClient {
  private config: SyncClientConfig;
  private status: SyncStatus = 'disconnected';
  private pendingChanges: SyncMessage[] = [];
  private lastSyncTimestamp: number = 0;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private onStatusChange?: (status: SyncStatus) => void;
  private onDataChange?: (changes: SyncMessage[]) => void;

  constructor(config: SyncClientConfig) {
    this.config = config;
  }

  connect(): Promise<void> {
    this.setStatus('connecting');
    this.pollTimer = setInterval(() => {
      this.sync().catch(() => {
        // Errors handled in sync(), status set to error
      });
    }, this.config.pollInterval);
    this.setStatus('connected');
    return Promise.resolve();
  }

  disconnect(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.setStatus('disconnected');
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  onStatus(callback: (status: SyncStatus) => void): void {
    this.onStatusChange = callback;
  }

  onChange(callback: (changes: SyncMessage[]) => void): void {
    this.onDataChange = callback;
  }

  queueChange(message: SyncMessage): void {
    this.pendingChanges.push(message);
  }

  async sync(): Promise<SyncResponse> {
    this.setStatus('syncing');

    try {
      const batch: SyncBatch = {
        messages: [...this.pendingChanges],
        lastSyncTimestamp: this.lastSyncTimestamp,
        clientId: this.config.clientId,
      };

      const pushResponse = await fetch(`${this.config.serverUrl}/api/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });

      if (!pushResponse.ok) {
        throw new Error(`Push failed: ${pushResponse.status}`);
      }

      const pushResult: SyncResponse = await pushResponse.json();

      const pullResponse = await fetch(
        `${this.config.serverUrl}/api/sync/pull?since=${this.lastSyncTimestamp}&orgId=${this.config.orgId}`
      );

      if (!pullResponse.ok) {
        throw new Error(`Pull failed: ${pullResponse.status}`);
      }

      const pullResult: SyncResponse = await pullResponse.json();

      this.pendingChanges = this.pendingChanges.filter(
        (m) => !pushResult.accepted.includes(m.id)
      );

      const serverTimestamp = Math.max(
        pushResult.serverTimestamp ?? 0,
        pullResult.serverTimestamp ?? 0
      );
      this.lastSyncTimestamp = serverTimestamp || Date.now();

      const allServerChanges = [
        ...(pushResult.serverChanges ?? []),
        ...(pullResult.serverChanges ?? []),
      ];

      if (allServerChanges.length > 0 && this.onDataChange) {
        this.onDataChange(allServerChanges);
      }

      this.setStatus('connected');
      return pullResult;
    } catch (error) {
      this.setStatus('error');
      throw error;
    }
  }

  getPendingCount(): number {
    return this.pendingChanges.length;
  }

  getLastSyncTime(): number {
    return this.lastSyncTimestamp;
  }

  private setStatus(status: SyncStatus): void {
    this.status = status;
    this.onStatusChange?.(status);
  }
}
