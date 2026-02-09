/**
 * Utility to mask sensitive information (PII) in log context objects.
 */

const DEFAULT_SENSITIVE_KEYS = [
    'password',
    'token',
    'auth',
    'secret',
    'key',
    'email',
    'phone',
    'address',
    'card',
    'cvv',
    'ssn',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function maskPII(data: any, sensitiveKeys: string[] = DEFAULT_SENSITIVE_KEYS): any {
    if (!data || typeof data !== 'object') {
        return data;
    }

    if (Array.isArray(data)) {
        return data.map((item) => maskPII(item, sensitiveKeys));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const masked: Record<string, any> = {};

    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            const lowerKey = key.toLowerCase();
            const value = data[key];

            if (sensitiveKeys.some((s) => lowerKey.includes(s))) {
                masked[key] = '[REDACTED]';
            } else if (typeof value === 'object' && value !== null) {
                masked[key] = maskPII(value, sensitiveKeys);
            } else {
                masked[key] = value;
            }
        }
    }

    return masked;
}
