// Staff action journal (admin_audit_logs). Written by the server in the same
// transaction as the change it describes. Append-only for everyone.
import { db } from './admin.js';

function plain(value) {
  if (value === undefined || value === null) return null;
  return JSON.parse(JSON.stringify(value));
}

export function auditData(actor, action, entityType, entityId, before = null, after = null, note = '') {
  return {
    actorUid: actor?.uid || 'system',
    actorEmail: actor?.email || 'system',
    actorRole: actor?.role || 'system',
    action,
    entityType,
    entityId: String(entityId || ''),
    before: plain(before),
    after: plain(after),
    note: String(note || '').slice(0, 500),
    createdAt: new Date().toISOString(),
  };
}

// Adds the audit record to a transaction or batch (or writes it directly).
export function audit(txOrBatch, actor, action, entityType, entityId, before, after, note) {
  const ref = db().collection('admin_audit_logs').doc();
  const data = auditData(actor, action, entityType, entityId, before, after, note);
  if (txOrBatch) txOrBatch.set(ref, data);
  else return ref.set(data);
  return null;
}
