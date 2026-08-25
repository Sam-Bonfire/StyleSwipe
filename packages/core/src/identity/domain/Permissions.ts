import { z } from 'zod';

export const PermissionScopeSchema = z.enum([
  'catalog:read',
  'catalog:write',
  'affiliate:manage',
  'users:read',
  'users:manage',
  'analytics:read',
]);

export type PermissionScope = z.infer<typeof PermissionScopeSchema>;
