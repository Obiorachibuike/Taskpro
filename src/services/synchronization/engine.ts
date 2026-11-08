import { SyncRepository } from '../../database/repositories/syncRepository';
import { resolveConflict } from './conflict';
import type { SyncApi } from '../../types';

export interface SyncResult { pushed: number; pulled: number; failed: number; conflicts: number }
export class SyncEngine {
  private running = false;
  constructor(private readonly repository: SyncRepository, private readonly api: SyncApi) {}
  async synchronize(userId: string): Promise<SyncResult> {
    if (this.running) return { pushed: 0, pulled: 0, failed: 0, conflicts: 0 };
    this.running = true;
    const result = { pushed: 0, pulled: 0, failed: 0, conflicts: 0 };
    try {
      const operations = await this.repository.ready();
      for (const operation of operations) {
        try { const response = await this.api.push(operation); await this.repository.succeed(operation, response.version); result.pushed++; }
        catch (error) { await this.repository.fail(operation.id, operation.attempts + 1, error instanceof Error ? error.message : 'Unknown sync error'); result.failed++; }
      }
      let cursor = await this.repository.metadata(`cursor:${userId}`);
      let pages = 0;
      do {
        const response = await this.api.pull(userId, cursor);
        for (const remote of response.records) {
          const local = await this.repository.getLocal(String(remote.entity ?? 'task'), remote.id);
          const decision = resolveConflict(local, remote);
          if (decision.type === 'remote') { await this.repository.applyRemote(remote); result.pulled++; }
          else if (decision.type === 'conflict') { await this.repository.markConflict(String(remote.entity ?? 'task'), remote.id, remote); result.conflicts++; }
        }
        cursor = response.cursor;
        await this.repository.setMetadata(`cursor:${userId}`, cursor ?? '');
        pages++;
      } while (cursor && pages < 100);
      await this.repository.setMetadata(`lastSync:${userId}`, new Date().toISOString());
      return result;
    } finally { this.running = false; }
  }
}
