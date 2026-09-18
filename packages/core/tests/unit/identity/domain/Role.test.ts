import { describe, expect, it } from 'vitest';

import { RoleService } from '../../../../src/identity/domain/Role';

describe('Role Domain Model', () => {
  describe('RoleService', () => {
    it('getPermissionsForRole should return correct permissions for GUEST', () => {
      const permissions = RoleService.getPermissionsForRole('GUEST');
      expect(permissions).toEqual(['catalog:read']);
    });

    it('getPermissionsForRole should return correct permissions for ADMIN', () => {
      const permissions = RoleService.getPermissionsForRole('ADMIN');
      expect(permissions).toContain('catalog:write');
      expect(permissions).toContain('users:manage');
    });

    it('hasPermission should return true when role has permission', () => {
      expect(RoleService.hasPermission('CURATOR', 'affiliate:manage')).toBe(true);
    });

    it('hasPermission should return false when role lacks permission', () => {
      expect(RoleService.hasPermission('USER', 'catalog:write')).toBe(false);
    });

    it('hasAnyPermission should return true if any role has required permission', () => {
      expect(RoleService.hasAnyPermission(['USER', 'SUPPORT'], ['users:read'])).toBe(true);
    });

    it('hasAnyPermission should return false if no role has required permission', () => {
      expect(RoleService.hasAnyPermission(['GUEST', 'USER'], ['catalog:write', 'users:manage'])).toBe(false);
    });

    it('hasAllPermissions should return true if roles collectively have all required permissions', () => {
      expect(RoleService.hasAllPermissions(['USER', 'SUPPORT'], ['catalog:read', 'users:read'])).toBe(true);
    });

    it('hasAllPermissions should return false if roles collectively lack any required permission', () => {
      expect(RoleService.hasAllPermissions(['USER', 'SUPPORT'], ['catalog:read', 'users:manage'])).toBe(false);
    });
  });
});
