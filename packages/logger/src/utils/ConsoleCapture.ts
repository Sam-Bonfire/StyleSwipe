import { ILogger } from '../types';

/**
 * Utility to automatically redirect all console.log/warn/error calls to our Logger.
 */
export function enableConsoleCapture(logger: ILogger) {
    const levels: Array<'log' | 'warn' | 'error' | 'info' | 'debug'> = [
        'log',
        'warn',
        'error',
        'info',
        'debug',
    ];

    levels.forEach((level) => {
        const original = console[level];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console[level] = (...args: any[]) => {
            // Call original first (so developers still see it in real-time if not filtered)
            original.apply(console, args);

            // Format message for our logger
            const message = args
                .map((arg) => {
                    if (typeof arg === 'string') return arg;
                    try {
                        return JSON.stringify(arg);
                    } catch {
                        return String(arg);
                    }
                })
                .join(' ');

            // Map console level to our logger level
            switch (level) {
                case 'error':
                    logger.error(message);
                    break;
                case 'warn':
                    logger.warn(message);
                    break;
                default:
                    logger.info(message); // Map info/debug/log to INFO for uniformity in Convex for now
                    break;
            }
        };
    });
}
