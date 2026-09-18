import { z } from 'zod';

import { PermissionScope } from './Permissions';

export const RoleSchema = z.enum([
  'GUEST',
  'USER',
  'CURATOR',
  'ADMIN',
  'SUPPORT',
]);

export type Role = z.infer<typeof RoleSchema>;

// Role to permissions mapping
export const RolePermissionsMap: Record<Role, readonly PermissionScope[]> = {
  GUEST: ['catalog:read'],
  USER: ['catalog:read'],
  CURATOR: ['catalog:read', 'catalog:write', 'affiliate:manage'],
  ADMIN: [
    'catalog:read',
    'catalog:write',
    'affiliate:manage',
    'users:read',
    'users:manage',
    'analytics:read',
  ],
  SUPPORT: ['catalog:read', 'users:read'],
} as const;

export const RoleService = {
  /**
   * Retrieves the permissions associated with a given role.
   */
  getPermissionsForRole: (role: Role): readonly PermissionScope[] => {
    return RolePermissionsMap[role];
  },

  /**
   * Checks if a specific role possesses a required permission.
   */
  hasPermission: (role: Role, permission: PermissionScope): boolean => {
    const permissions = RolePermissionsMap[role];
    return permissions.includes(permission);
  },

  /**
   * Check if user roles satisfy any of the required permissions.
   */
  hasAnyPermission: (roles: Role[], requiredPermissions: PermissionScope[]): boolean => {
    return roles.some((role) =>
      requiredPermissions.some((reqPerm) => RoleService.hasPermission(role, reqPerm))
    );
  },

  /**
   * Check if user roles satisfy all of the required permissions.
   */
  hasAllPermissions: (roles: Role[], requiredPermissions: PermissionScope[]): boolean => {
    const allUserPermissions = new Set(roles.flatMap((r) => RolePermissionsMap[r]));
    return requiredPermissions.every((reqPerm) => allUserPermissions.has(reqPerm));
  }
};
