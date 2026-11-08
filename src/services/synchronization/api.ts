import type { SyncApi, SyncOperation, SyncPullResponse } from '../../types';

export class HttpSyncApi implements SyncApi {
  constructor(private readonly baseUrl: string, private readonly token: string) {}
  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}`, ...init?.headers },
    });
    if (!response.ok) throw new Error(`Sync request failed (${response.status})`);
    return response.json() as Promise<T>;
  }
  push(operation: SyncOperation) {
    return this.request<{ accepted: boolean; version: number }>('/sync/push', { method: 'POST', body: JSON.stringify({ operation }) });
  }
  pull(userId: string, cursor: string | null) {
    return this.request<SyncPullResponse>(`/sync/pull?cursor=${encodeURIComponent(cursor ?? '')}&userId=${encodeURIComponent(userId)}`);
  }
}
