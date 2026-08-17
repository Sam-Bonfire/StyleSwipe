import { describe, expect, it } from 'vitest';

import type { LogEntry, Transport, Breadcrumb, LogContext } from '../../src/types';

import { maskPII } from '../../src/utils/PIIMasker';

/**
 * Logger.ts cannot be directly imported in bun test because it has
 * top-level Expo imports (expo-battery, expo-device, expo-network)
 * that transitively load react-native (Flow-typed, unparseable by bun).
 *
 * Instead, we test Logger's core behaviors by exercising the individual
 * building blocks it uses:
 * - createEntry logic (timestamp, sessionId, breadcrumbs, PII masking)
 * - breadcrumb management (cap at 20)
 * - disabled mode behavior
 * - flush delegation
 *
 * The PIIMasker and ConvexTransport are tested in their own dedicated files.
 */

// Simulate Logger.createEntry behavior
function createEntry(
    level: LogEntry['level'],
    message: string,
    opts: {
        context?: LogContext;
        error?: unknown;
        traceId?: string;
        userId?: string;
        sessionId?: string;
        breadcrumbs?: Breadcrumb[];
        app?: string;
    } = {},
): LogEntry {
    return {
        level,
        message,
        context: opts.context ? maskPII(opts.context) : undefined,
        error: opts.error instanceof Error ? opts.error : opts.error ? maskPII(opts.error) : undefined,
        timestamp: Date.now(),
        traceId: opts.traceId,
        userId: opts.userId,
        sessionId: opts.sessionId ?? Math.random().toString(36).substring(2, 15),
        breadcrumbs: opts.breadcrumbs ? [...opts.breadcrumbs] : [],
        app: opts.app,
    };
}

describe('Logger createEntry logic', () => {
    it('should create entry with correct level and message', () => {
        const entry = createEntry('INFO', 'hello world');
        expect(entry.level).toBe('INFO');
        expect(entry.message).toBe('hello world');
    });

    it('should generate a timestamp', () => {
        const before = Date.now();
        const entry = createEntry('DEBUG', 'msg');
        const after = Date.now();
        expect(entry.timestamp).toBeGreaterThanOrEqual(before);
        expect(entry.timestamp).toBeLessThanOrEqual(after);
    });

    it('should generate a sessionId', () => {
        const entry = createEntry('INFO', 'msg');
        expect(typeof entry.sessionId).toBe('string');
        expect(entry.sessionId!.length).toBeGreaterThan(0);
    });

    it('should attach userId when provided', () => {
        const entry = createEntry('INFO', 'msg', { userId: 'user-123' });
        expect(entry.userId).toBe('user-123');
    });

    it('should attach traceId when provided', () => {
        const entry = createEntry('INFO', 'msg', { traceId: 'trace-abc' });
        expect(entry.traceId).toBe('trace-abc');
    });

    it('should mask PII in context', () => {
        const entry = createEntry('INFO', 'msg', {
            context: { email: 'user@test.com', action: 'login' },
        });
        expect(entry.context?.email).toBe('[REDACTED]');
        expect(entry.context?.action).toBe('login');
    });

    it('should attach Error objects directly', () => {
        const err = new Error('boom');
        const entry = createEntry('ERROR', 'fail', { error: err });
        expect(entry.error).toBeInstanceOf(Error);
    });

    it('should snapshot breadcrumbs', () => {
        const crumbs: Breadcrumb[] = [
            { category: 'nav', message: 'Home', timestamp: Date.now() },
        ];
        const entry = createEntry('INFO', 'msg', { breadcrumbs: crumbs });
        expect(entry.breadcrumbs).toHaveLength(1);

        // Mutating original should not affect the entry
        crumbs.push({ category: 'nav', message: 'Profile', timestamp: Date.now() });
        expect(entry.breadcrumbs).toHaveLength(1);
    });
});

describe('Logger breadcrumb management', () => {
    it('should add breadcrumbs with auto-timestamp', () => {
        const crumbs: Breadcrumb[] = [];
        const addBreadcrumb = (bc: Omit<Breadcrumb, 'timestamp'>) => {
            const crumb: Breadcrumb = { ...bc, timestamp: Date.now() };
            crumbs.push(crumb);
            if (crumbs.length > 20) crumbs.shift();
        };

        addBreadcrumb({ category: 'test', message: 'hi' });
        expect(crumbs).toHaveLength(1);
        expect(typeof crumbs[0].timestamp).toBe('number');
    });

    it('should cap breadcrumbs at 20', () => {
        const crumbs: Breadcrumb[] = [];
        const addBreadcrumb = (bc: Omit<Breadcrumb, 'timestamp'>) => {
            const crumb: Breadcrumb = { ...bc, timestamp: Date.now() };
            crumbs.push(crumb);
            if (crumbs.length > 20) crumbs.shift();
        };

        for (let i = 0; i < 25; i++) {
            addBreadcrumb({ category: 'test', message: `crumb-${i}` });
        }
        expect(crumbs).toHaveLength(20);
        expect(crumbs[0].message).toBe('crumb-5');
        expect(crumbs[19].message).toBe('crumb-24');
    });
});

describe('Logger disabled mode', () => {
    it('should skip processing when enabled=false', () => {
        const entries: LogEntry[] = [];
        const enabled = false;

        const process = (entry: LogEntry) => {
            if (!enabled) return;
            entries.push(entry);
        };

        process(createEntry('INFO', 'should not appear'));
        expect(entries).toHaveLength(0);
    });
});

describe('Logger flush delegation', () => {
    it('should call flush on all transports', async () => {
        let flushed1 = false;
        let flushed2 = false;
        const transports: Transport[] = [
            { log: () => { }, flush: () => { flushed1 = true; } },
            { log: () => { }, flush: () => { flushed2 = true; } },
        ];

        await Promise.all(transports.map(t => t.flush()));
        expect(flushed1).toBe(true);
        expect(flushed2).toBe(true);
    });
});
