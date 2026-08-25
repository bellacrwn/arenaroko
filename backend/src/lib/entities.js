import { randomUUID } from 'node:crypto';

export function publicUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

export function walletFor(database, userId) {
  return database.wallets.find((wallet) => wallet.userId === userId);
}

export function materialMap(database) {
  return new Map(database.materials.map((material) => [material.id, material]));
}

export function addAudit(database, action, actorId, entityType, entityId, metadata = {}) {
  database.auditLogs.push({
    id: randomUUID(),
    action,
    actorId,
    entityType,
    entityId,
    metadata,
    createdAt: new Date().toISOString(),
  });
}
