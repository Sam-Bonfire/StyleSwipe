import * as Application from 'expo-application';
import * as Battery from 'expo-battery';
import * as Device from 'expo-device';
import * as Network from 'expo-network';

import {
    Breadcrumb,
    DeviceContext,
    ILogger,
    LoggerConfig,
    LogContext,
    LogEntry,
    LogLevel
} from './types';
import { maskPII } from './utils/PIIMasker';

export class Logger implements ILogger {
    private config: LoggerConfig;
    private queue: LogEntry[] = [];
    private breadcrumbs: Breadcrumb[] = [];
    private flushTimer: NodeJS.Timeout | null = null;

    private userId: string | null = null;
    private traceId: string | null = null;
    private sessionId: string;
    private deviceContext: DeviceContext | null = null;

    public get activeTraceId() {
        return this.traceId;
    }

    constructor(config: LoggerConfig) {
        this.config = {
            ...config,
            maxBatchSize: config.maxBatchSize ?? 50,
            flushIntervalMs: config.flushIntervalMs ?? 5000,
        };

        this.sessionId = Math.random().toString(36).substring(2, 15);

        // Initialize context asynchronously
        this.initDeviceContext();

        if (this.config.enabled !== false) {
            this.startFlushTimer();
        }
    }

    private async initDeviceContext() {
        try {
            const [batteryLevel, networkState] = await Promise.all([
                Battery.getBatteryLevelAsync().catch(() => null),
                Network.getNetworkStateAsync().catch(() => null),
            ]);

            this.deviceContext = {
                model: Device.modelName,
                osName: Device.osName,
                osVersion: Device.osVersion,
                batteryLevel,
                networkType: networkState?.type,
                freeDisk: null,
                freeMemory: null,
                appVersion: Application.nativeApplicationVersion,
                buildNumber: Application.nativeBuildVersion,
            };
        } catch {
            // Fail silently, don't crash logger
        }
    }

    private startFlushTimer() {
        if (this.flushTimer) clearInterval(this.flushTimer);
        this.flushTimer = setInterval(() => {
            this.flush();
        }, this.config.flushIntervalMs);
    }

    private createEntry(level: LogLevel, message: string, context?: LogContext, error?: unknown): LogEntry {
        return {
            level,
            message,
            context: context ? maskPII(context) : undefined,
            error: error ? (error instanceof Error ? error : maskPII(error)) : undefined,
            timestamp: Date.now(),
            traceId: this.traceId ?? undefined,
            userId: this.userId ?? undefined,
            sessionId: this.sessionId,
            device: this.deviceContext ?? undefined,
            breadcrumbs: [...this.breadcrumbs], // Snapshot current breadcrumbs
            app: this.config.app,
        };
    }

    private process(entry: LogEntry) {
        if (this.config.enabled === false) return;

        // 1. Send to transports that handle individual logs (like Console)
        this.config.transports.forEach(t => {
            // Send to transports. Individual transports (e.g. ConvexTransport)
            // handle their own internal queuing or batching.

            t.log(entry);
        });
    }

    debug(message: string, context?: LogContext): void {
        this.process(this.createEntry('DEBUG', message, context));
    }

    info(message: string, context?: LogContext): void {
        this.process(this.createEntry('INFO', message, context));
    }

    warn(message: string, context?: LogContext): void {
        this.process(this.createEntry('WARN', message, context));
    }

    error(message: string, error?: unknown, context?: LogContext): void {
        this.process(this.createEntry('ERROR', message, context, error));
    }

    setUserId(id: string | null): void {
        this.userId = id;
    }

    setTraceId(id: string | null): void {
        this.traceId = id;
    }

    addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
        const crumb: Breadcrumb = {
            ...breadcrumb,
            timestamp: Date.now(),
        };
        this.breadcrumbs.push(crumb);
        if (this.breadcrumbs.length > 20) {
            this.breadcrumbs.shift(); // Keep last 20
        }
    }

    async flush(): Promise<void> {
        await Promise.all(this.config.transports.map(t => t.flush()));
    }
}
