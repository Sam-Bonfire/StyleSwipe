import { ILogger } from '../types';

/**
 * Utility to intercept global fetch calls and record breadcrumbs.
 * Also injects trace IDs into outgoing headers.
 */
export function enableNetworkInterception(logger: ILogger) {
    const originalFetch = global.fetch;

    if (!originalFetch) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : input.url);
        const method = init?.method || 'GET';
        const timestamp = Date.now();

        // Inject Trace ID if available
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const traceId = (logger as any).activeTraceId;
        const modifiedInit = { ...init };
        if (traceId) {
            const headers = new Headers(modifiedInit.headers || {});
            headers.set('X-Trace-Id', traceId);
            modifiedInit.headers = headers;
        }

        try {
            const response = await originalFetch(input, modifiedInit);
            const duration = Date.now() - timestamp;

            logger.addBreadcrumb({
                category: 'network',
                message: `${method} ${url}`,
                data: {
                    status: response.status,
                    durationMs: duration,
                    ok: response.ok,
                },
                level: response.ok ? 'INFO' : 'WARN',
            });

            return response;
        } catch (error) {
            const duration = Date.now() - timestamp;
            logger.addBreadcrumb({
                category: 'network',
                message: `${method} ${url} (FAILED)`,
                data: {
                    error: String(error),
                    durationMs: duration,
                },
                level: 'ERROR',
            });
            throw error;
        }
    };
}
