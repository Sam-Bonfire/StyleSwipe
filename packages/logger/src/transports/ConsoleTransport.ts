import { LogEntry, Transport } from '../types';

/**
 * Standard console transport for local development.
 * Note: We store original console methods early to avoid infinite loops if Console Capture is enabled.
 */
const originalConsole = {
    debug: console.debug.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    log: console.log.bind(console),
};

export class ConsoleTransport implements Transport {
    log(entry: LogEntry): void {
        const { level, message, context, error, timestamp } = entry;
        const time = new Date(timestamp).toLocaleTimeString();

        const contextStr = context ? JSON.stringify(context) : '';
        const errorStr = error ? `\nError: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}` : '';

        const format = `[${time}] [${level}] ${message} ${contextStr}${errorStr}`;

        switch (level) {
            case 'DEBUG':
                originalConsole.debug(format);
                break;
            case 'INFO':
                originalConsole.info(format);
                break;
            case 'WARN':
                originalConsole.warn(format);
                break;
            case 'ERROR':
                originalConsole.error(format);
                break;
        }
    }

    flush(): void {
        // Console is synchronous
    }
}

