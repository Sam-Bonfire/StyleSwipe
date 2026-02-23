import { LogEntry, Transport } from '../types';

// Define a minimal interface compatible with ConvexClient and ConvexReactClient
export interface IConvexClient {
  mutation(name: string, args?: Record<string, unknown>): Promise<unknown>;
}

export class ConvexTransport implements Transport {
  private client: IConvexClient;
  private batch: LogEntry[] = [];
  private batchSize: number;
  private mutation: string;

  constructor(client: IConvexClient, options: { batchSize?: number } = {}) {
    this.client = client;
    this.batchSize = options.batchSize ?? 10;
    this.mutation = 'logs:logBatch';
  }

  log(entry: LogEntry): void {
    this.batch.push(entry);
    if (this.batch.length >= this.batchSize) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.batch.length === 0) return;

    // Sanitize logs to prevent serialization errors (e.g. circular refs, permission denied props)
    const logsToSend = this.batch.map(this.sanitizeLog);
    this.batch = [];

    try {
      await this.client.mutation(this.mutation, { logs: logsToSend });
    } catch {
      // Fallback to console if convex fails
      console.error('Failed to log to Convex');
    }
  }

  private sanitizeLog(entry: LogEntry): LogEntry {
    if (!entry.error) return entry;

    try {
      // Create a safe error object
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const safeError: Record<string, any> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = entry.error as any;

      if (err instanceof Error || (typeof err === 'object' && err !== null)) {
        // Safely copy standard properties
        ['name', 'message', 'stack', 'code'].forEach((prop) => {
          try {
            if (err[prop] !== undefined) safeError[prop] = err[prop];
          } catch {
            // Ignore properties that throw on access
            safeError[prop] = '[Access Error]';
          }
        });

        // If it's the specific "Permission denied" error, we might want to capture that explicitly
        if (
          safeError.message?.includes('Permission denied') &&
          safeError.message?.includes('usage')
        ) {
          safeError.note = 'Likely Firefox SVG/ShadowDOM issue';
        }
      } else {
        return entry;
      }

      return {
        ...entry,
        error: safeError,
      };
    } catch {
      // If sanitization fails completely, return a fallback with the error message if possible
      return {
        ...entry,
        error: { message: 'Failed to sanitize error object', originalType: typeof entry.error },
      };
    }
  }
}
