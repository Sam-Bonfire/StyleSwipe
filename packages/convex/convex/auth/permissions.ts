import { createAccessControl } from 'better-auth/plugins/access';
import {
  defaultStatements,
  ownerAc,
  adminAc,
  memberAc,
} from 'better-auth/plugins/organization/access';

// Define custom resources and actions
const statement = {
  ...defaultStatements, // organization, member, invitation, ac
  user: ['create', 'read', 'update', 'delete'],
  analytics: ['view'],
} as const;

export const ac = createAccessControl(statement);

// Define roles with permissions
export const owner = ac.newRole({
  user: ['create', 'read', 'update', 'delete'],
  analytics: ['view'],
  ...ownerAc.statements, // Include default owner permissions
});

export const admin = ac.newRole({
  user: ['create', 'read', 'update', 'delete'],
  analytics: ['view'],
  ...adminAc.statements, // Include default admin permissions
});

export const member = ac.newRole({
  user: ['read'],
  ...memberAc.statements, // Include default member permissions
});
