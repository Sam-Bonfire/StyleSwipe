import { describe, it, expect, mock, beforeEach } from 'bun:test';

import { createServer } from '../../src/server';

// Mock ConvexHttpClient to prevent real network calls
mock.module('convex/browser', () => ({
    ConvexHttpClient: class {
        query = mock(() => Promise.resolve([]));
        mutation = mock(() => Promise.resolve('job-1'));
    },
}));

describe('Scraper Server', () => {
    let app: ReturnType<typeof createServer>;
    const mockQueue = {
        push: mock(() => Promise.resolve('id')),
        pushBatch: mock(() => Promise.resolve(['id'])),
        pull: mock(() => Promise.resolve([])),
        complete: mock(() => Promise.resolve()),
        fail: mock(() => Promise.resolve()),
        size: mock(() => Promise.resolve(42)),
    };

    beforeEach(() => {
        app = createServer({
            convexUrl: 'https://test.convex.cloud',
            port: 3000,
            queue: mockQueue as never,
        });
    });

    describe('GET /api/health', () => {
        it('should return ok status', async () => {
            const res = await app.request('/api/health');
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.status).toBe('ok');
            expect(typeof body.timestamp).toBe('number');
        });
    });

    describe('POST /api/jobs', () => {
        it('should return 400 when type is missing', async () => {
            const res = await app.request('/api/jobs', {
                method: 'POST',
                body: JSON.stringify({ query: 'http://test.com' }),
                headers: { 'Content-Type': 'application/json' },
            });
            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.error).toContain('required');
        });

        it('should return 400 when query is missing', async () => {
            const res = await app.request('/api/jobs', {
                method: 'POST',
                body: JSON.stringify({ type: 'single' }),
                headers: { 'Content-Type': 'application/json' },
            });
            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.error).toContain('required');
        });

        it('should create job with valid input', async () => {
            const res = await app.request('/api/jobs', {
                method: 'POST',
                body: JSON.stringify({ type: 'category', query: 'https://www.myntra.com/shirts' }),
                headers: { 'Content-Type': 'application/json' },
            });
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.jobId).toBeDefined();
            expect(body.message).toContain('success');
        });
    });

    describe('GET /api/queue/status', () => {
        it('should return queue size', async () => {
            const res = await app.request('/api/queue/status');
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.queueSize).toBe(42);
            expect(typeof body.timestamp).toBe('number');
        });
    });

    describe('GET /api/jobs', () => {
        it('should return jobs list', async () => {
            const res = await app.request('/api/jobs');
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.jobs).toBeInstanceOf(Array);
        });
    });
});
