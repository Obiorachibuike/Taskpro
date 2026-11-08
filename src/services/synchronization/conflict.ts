import type { ConflictDecision, RemoteRecord } from '../../types';

/**
 * Version-aware last-writer-wins for clean records. Dirty local changes are
 * never silently replaced: divergent records are returned for user review.
 */
export function resolveConflict(local: RemoteRecord | null, remote: RemoteRecord): ConflictDecision {
  if (!local || local.syncStatus !== 'pending') {
    if (local && remote.version < local.version) return { type: 'local', record: local };
    if (local && remote.version === local.version && remote.updatedAt < local.updatedAt) return { type: 'local', record: local };
    return { type: 'remote', record: remote };
  }
  if (remote.version <= local.version && remote.updatedAt <= local.updatedAt) return { type: 'local', record: local };
  return { type: 'conflict', local, remote };
}

export function mergeSubtasks<T extends { id: string; title: string }>(local: T[], remote: T[]): T[] {
  const byId = new Map(remote.map((item) => [item.id, item]));
  for (const item of local) if (!byId.has(item.id)) byId.set(item.id, item);
  return [...byId.values()];
}
