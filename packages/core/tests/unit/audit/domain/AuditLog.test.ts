import { describe, it, expect } from 'vitest';

import { AuditLogSchema } from '../../../../src/audit/domain/AuditLog';

describe('AuditLog', () => {
  it('validates a correct audit log', () => {
    const log = {
      id: '1',
      actorId: 'a1',
      actorRole: 'USER',
      action: 'LOGIN',
      targetEntity: 'USER',
      targetId: 'a1',
      metadata: { browser: 'Chrome' },
      timestamp: Date.now(),
    };
    expect(() => AuditLogSchema.parse(log)).not.toThrow();
  });

  it('rejects invalid actor role', () => {
    const log = {
      id: '1',
      actorId: 'a1',
      actorRole: 'INVALID_ROLE',
      action: 'LOGIN',
      targetEntity: 'USER',
      targetId: 'a1',
      timestamp: Date.now(),
    };
    expect(() => AuditLogSchema.parse(log)).toThrow();
  });

  it('enforces immutability at runtime', () => {
    const log = {
      id: '1',
      actorId: 'a1',
      actorRole: 'USER',
      action: 'LOGIN',
      targetEntity: 'USER',
      targetId: 'a1',
      metadata: { browser: 'Chrome' },
      timestamp: Date.now(),
    };

    const parsedLog = AuditLogSchema.parse(log);

    expect(() => {
      // @ts-expect-error Type check will fail because it's readonly
      parsedLog.action = 'LOGOUT';
    }).toThrow();
  });
});
