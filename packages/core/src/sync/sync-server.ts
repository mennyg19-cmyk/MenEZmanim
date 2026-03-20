import type { SyncMessage, SyncBatch, SyncResponse } from './sync-protocol';
import { resolveConflict } from './sync-protocol';

export interface SyncServerConfig {
  conflictStrategy: 'last-write-wins' | 'server-wins';
}

export class SyncServer {
  private config: SyncServerConfig;
  private syncLog: Map<string, SyncMessage> = new Map();
  private orgIndex: Map<string, SyncMessage[]> = new Map();

  constructor(config: SyncServerConfig) {
    this.config = config;
  }

  async handlePush(batch: SyncBatch): Promise<SyncResponse> {
    const accepted: string[] = [];
    const rejected: Array<{ id: string; reason: string }> = [];
    const serverChanges: SyncMessage[] = [];

    for (const message of batch.messages) {
      const existingKey = `${message.orgId}:${message.tableName}:${message.recordId}`;
      const existing = this.syncLog.get(existingKey);

      if (existing) {
        const winning = resolveConflict(
          message,
          existing,
          this.config.conflictStrategy
        );
        if (winning === message) {
          await this.recordChange(message);
          accepted.push(message.id);
        } else {
          accepted.push(message.id);
          serverChanges.push(existing);
        }
      } else {
        try {
          await this.recordChange(message);
          accepted.push(message.id);
        } catch (err) {
          rejected.push({
            id: message.id,
            reason: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }
    }

    return {
      accepted,
      rejected,
      serverChanges,
      serverTimestamp: Date.now(),
    };
  }

  async getChangesSince(orgId: string, since: number): Promise<SyncMessage[]> {
    const orgMessages = this.orgIndex.get(orgId) ?? [];
    return orgMessages.filter((m) => m.timestamp > since);
  }

  async recordChange(message: SyncMessage): Promise<void> {
    const key = `${message.orgId}:${message.tableName}:${message.recordId}`;
    this.syncLog.set(key, message);

    const orgId = message.orgId;
    let orgMessages = this.orgIndex.get(orgId);
    if (!orgMessages) {
      orgMessages = [];
      this.orgIndex.set(orgId, orgMessages);
    }
    orgMessages.push(message);
    orgMessages.sort((a, b) => a.timestamp - b.timestamp);
  }
}
