import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { LogEntry } from '../../src/types';

import { ConvexTransport } from '../../src/transports/ConvexTransport';

function createEntry(overrides: Partial<LogEntry> = {}): LogEntry {
    return {
        level: 'INFO',
        message: 'test message',
        timestamp: Date.now(),
        sessionId: 'sess-1',
        ...overrides,
    };
}

describe('ConvexTransport', () => {
    let mockClient: { mutation: ReturnType<typeof mock> };
    let transport: ConvexTransport;

    beforeEach(() => {
        mockClient = { mutation: vi.fn(() => Promise.resolve()) };
        transport = new ConvexTransport(mockClient, { batchSize: 3 });
    });

    describe('log', () => {
        it('should accumulate entries without flushing below batch size', () => {
            transport.log(createEntry());
            transport.log(createEntry());
            expect(mockClient.mutation).not.toHaveBeenCalled();
        });

        it('should auto-flush when batch size is reached', () => {
            transport.log(createEntry());
            transport.log(createEntry());
            transport.log(createEntry());
            expect(mockClient.mutation).toHaveBeenCalledTimes(1);
        });
    });

    describe('flush', () => {
        it('should send accumulated entries to client', async () => {
            transport.log(createEntry({ message: 'msg1' }));
            transport.log(createEntry({ message: 'msg2' }));
            await transport.flush();

            expect(mockClient.mutation).toHaveBeenCalledTimes(1);
            const callArgs = mockClient.mutation.mock.calls[0];
            expect(callArgs[1].logs).toHaveLength(2);
            expect(callArgs[1].logs[0].message).toBe('msg1');
        });

        it('should not call client when batch is empty', async () => {
            await transport.flush();
            expect(mockClient.mutation).not.toHaveBeenCalled();
        });

        it('should clear batch after flush', async () => {
            transport.log(createEntry());
            await transport.flush();
            await transport.flush(); // Second flush should be no-op
            expect(mockClient.mutation).toHaveBeenCalledTimes(1);
        });

        it('should not throw when client mutation fails', async () => {
            mockClient.mutation = vi.fn(() => Promise.reject(new Error('network')));
            transport = new ConvexTransport(mockClient, { batchSize: 10 });
            transport.log(createEntry());
            await expect(transport.flush()).resolves.toBeUndefined();
        });
    });

    describe('sanitizeLog', () => {
        it('should sanitize Error objects in entries', async () => {
            const error = new Error('Something broke');
            error.name = 'TestError';
            transport.log(createEntry({ error }));
            await transport.flush();

            const sentLogs = mockClient.mutation.mock.calls[0][1].logs;
            expect(sentLogs[0].error.message).toBe('Something broke');
            expect(sentLogs[0].error.name).toBe('TestError');
        });

        it('should handle entries without errors', async () => {
            transport.log(createEntry());
            await transport.flush();

            const sentLogs = mockClient.mutation.mock.calls[0][1].logs;
            expect(sentLogs[0].error).toBeUndefined();
        });
    });
});
