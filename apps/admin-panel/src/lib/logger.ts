import { Logger, ConsoleTransport, ConvexTransport, IConvexClient, enableConsoleCapture, enableNetworkInterception } from '@app/logger';

let loggerInstance: Logger | null = null;

// Use the structural interface
export const initLogger = (client: IConvexClient) => {
    if (loggerInstance) return loggerInstance;

    loggerInstance = new Logger({
        level: 'DEBUG',
        transports: [
            new ConsoleTransport(),
            new ConvexTransport(client, { batchSize: 5 }),
        ],
        flushIntervalMs: 5000,
        app: 'admin-panel',
    });

    // Automatically capture all console.log/warn/error
    enableConsoleCapture(loggerInstance);

    // Automatically capture all network requests
    enableNetworkInterception(loggerInstance);

    // Global Error Handler
    // React Native Global Error Handler
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((global as any).ErrorUtils) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const globalHandler = (ErrorUtils as any)?.getGlobalHandler?.();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).ErrorUtils.setGlobalHandler((error: any, isFatal: boolean) => {
            try {
                loggerInstance?.error('Uncaught Exception (RN)', error, { isFatal });
            } catch (e) {
                // Fallback if accessing error properties fails
                console.error('Failed to log RN error:', e);
            }
            if (globalHandler) {
                globalHandler(error, isFatal);
            }
        });
    }

    // Web Global Error Handlers
    if (typeof window !== 'undefined') {
        const originalOnError = window.onerror;
        window.onerror = (message, source, lineno, colno, error) => {
            try {
                loggerInstance?.error('Uncaught Exception (Web)', error || message, {
                    source,
                    lineno,
                    colno,
                });
            } catch (e) {
                console.error('Failed to log Web error:', e);
            }
            if (originalOnError) {
                return originalOnError(message, source, lineno, colno, error);
            }
            return false;
        };

        const originalOnUnhandledRejection = window.onunhandledrejection;
        window.onunhandledrejection = (event) => {
            try {
                loggerInstance?.error('Unhandled Promise Rejection', event.reason, {
                    type: event.type
                });
            } catch (e) {
                console.error('Failed to log Promise rejection:', e);
            }
            if (originalOnUnhandledRejection) {
                originalOnUnhandledRejection.call(window, event);
            }
        };
    }

    return loggerInstance;
};

export const getLogger = () => {
    if (!loggerInstance) {
        console.warn('Logger not initialized, calling initLogger first is required.');
        return new Logger({ level: 'DEBUG', transports: [new ConsoleTransport()] });
    }
    return loggerInstance;
};

 
export const logger = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    debug: (msg: string, ctx?: any) => getLogger().debug(msg, ctx),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    info: (msg: string, ctx?: any) => getLogger().info(msg, ctx),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    warn: (msg: string, ctx?: any) => getLogger().warn(msg, ctx),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: (msg: string, err?: any, ctx?: any) => getLogger().error(msg, err, ctx),
    setUserId: (id: string | null) => getLogger().setUserId(id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addBreadcrumb: (crumb: any) => getLogger().addBreadcrumb(crumb),
};
