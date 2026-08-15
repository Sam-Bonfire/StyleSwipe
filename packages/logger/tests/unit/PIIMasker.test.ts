import { describe, it, expect } from 'vitest';

import { maskPII } from '../../src/utils/PIIMasker';

describe('PIIMasker', () => {
    describe('maskPII', () => {
        it('should mask default sensitive keys', () => {
            const data = {
                name: 'John',
                password: 'secret123',
                email: 'john@test.com',
                phone: '+919876543210',
            };
            const result = maskPII(data);
            expect(result.name).toBe('John');
            expect(result.password).toBe('[REDACTED]');
            expect(result.email).toBe('[REDACTED]');
            expect(result.phone).toBe('[REDACTED]');
        });

        it('should mask keys case-insensitively', () => {
            const data = {
                userPassword: 'abc',
                AuthToken: 'xyz',
                API_KEY: '123',
            };
            const result = maskPII(data);
            expect(result.userPassword).toBe('[REDACTED]');
            expect(result.AuthToken).toBe('[REDACTED]');
            expect(result.API_KEY).toBe('[REDACTED]');
        });

        it('should mask nested objects recursively', () => {
            const data = {
                user: {
                    name: 'Jane',
                    credentials: {
                        password: 'hidden',
                        token: 'abc123',
                    },
                },
            };
            const result = maskPII(data);
            expect(result.user.name).toBe('Jane');
            expect(result.user.credentials.password).toBe('[REDACTED]');
            expect(result.user.credentials.token).toBe('[REDACTED]');
        });

        it('should mask arrays of objects', () => {
            const data = [
                { name: 'A', email: 'a@test.com' },
                { name: 'B', email: 'b@test.com' },
            ];
            const result = maskPII(data);
            expect(result[0].name).toBe('A');
            expect(result[0].email).toBe('[REDACTED]');
            expect(result[1].email).toBe('[REDACTED]');
        });

        it('should return primitives unchanged', () => {
            expect(maskPII('hello')).toBe('hello');
            expect(maskPII(42)).toBe(42);
            expect(maskPII(null)).toBeNull();
            expect(maskPII(undefined)).toBeUndefined();
        });

        it('should support custom sensitive keys', () => {
            const data = { ssn: '123-45-6789', customField: 'sensitive' };
            const result = maskPII(data, ['customfield']);
            expect(result.ssn).toBe('123-45-6789');
            expect(result.customField).toBe('[REDACTED]');
        });

        it('should mask credit card related keys', () => {
            const data = {
                cardNumber: '4111111111111111',
                cvv: '123',
                name: 'John',
            };
            const result = maskPII(data);
            expect(result.cardNumber).toBe('[REDACTED]');
            expect(result.cvv).toBe('[REDACTED]');
            expect(result.name).toBe('John');
        });

        it('should handle empty objects', () => {
            expect(maskPII({})).toEqual({});
        });

        it('should not modify original object', () => {
            const original = { password: 'secret', name: 'John' };
            maskPII(original);
            expect(original.password).toBe('secret');
        });
    });
});
