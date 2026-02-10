export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogContext {
    [key: string]: unknown;
}

export interface DeviceContext {
    model?: string | null;
    osName?: string | null;
    osVersion?: string | null;
    batteryLevel?: number | null;
    networkType?: string | null; // e.g., "WIFI", "CELLULAR"
    freeDisk?: number | null;
    freeMemory?: number | null;
    appVersion?: string | null;
    buildNumber?: string | null;
}

export interface Breadcrumb {
    category: string;
    message: string;
    data?: LogContext;
    level?: LogLevel;
    timestamp: number;
}

export interface LogEntry {
    level: LogLevel;
    message: string;
    context?: LogContext;
    error?: Error | unknown;
    timestamp: number;

    // Smart Context (Auto-attached)
    traceId?: string;
    userId?: string;
    sessionId?: string;
    device?: DeviceContext;
    breadcrumbs?: Breadcrumb[];
    app?: string;
}

export interface Transport {
    log(entry: LogEntry): void | Promise<void>;
    flush(): void | Promise<void>;
}

export interface LoggerConfig {
    level: LogLevel;
    transports: Transport[];
    enabled?: boolean;
    maxBatchSize?: number;
    flushIntervalMs?: number;
    app?: string;
}

export interface ILogger {
    debug(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, error?: unknown, context?: LogContext): void;

    // Context Management
    setUserId(id: string | null): void;
    setTraceId(id: string | null): void;
    addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void;

    // Lifecycle
    flush(): Promise<void>;
}
