export type SyncOperation = 'create' | 'update' | 'delete';

export interface SyncMessage {
  id: string;
  orgId: string;
  tableName: string;
  recordId: string;
  operation: SyncOperation;
  data: Record<string, unknown>;
  timestamp: number;
  clientId: string;
}

export interface SyncBatch {
  messages: SyncMessage[];
  lastSyncTimestamp: number;
  clientId: string;
}

export interface SyncResponse {
  accepted: string[];
  rejected: Array<{ id: string; reason: string }>;
  serverChanges: SyncMessage[];
  serverTimestamp: number;
}

export interface ConflictResolution {
  strategy: 'last-write-wins' | 'server-wins' | 'client-wins' | 'manual';
}

export function resolveConflict(
  clientMessage: SyncMessage,
  serverMessage: SyncMessage,
  strategy: ConflictResolution['strategy']
): SyncMessage {
  switch (strategy) {
    case 'client-wins':
      return clientMessage;
    case 'server-wins':
      return serverMessage;
    case 'last-write-wins':
      return clientMessage.timestamp >= serverMessage.timestamp ? clientMessage : serverMessage;
    case 'manual':
      // For manual, default to server-wins; caller would handle manual resolution
      return serverMessage;
    default:
      return serverMessage;
  }
}

export function generateSyncId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function createSyncMessage(
  orgId: string,
  tableName: string,
  recordId: string,
  operation: SyncOperation,
  data: Record<string, unknown>,
  clientId: string
): SyncMessage {
  return {
    id: generateSyncId(),
    orgId,
    tableName,
    recordId,
    operation,
    data,
    timestamp: Date.now(),
    clientId,
  };
}
