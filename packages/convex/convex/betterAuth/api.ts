import { getBaseAuthOptions } from '../authOptions';
import { createApi } from './createApi';
import schema from './schema';

// Use factory function for options to satisfy type signature
export const api = createApi(schema, () => getBaseAuthOptions());

export const { create, createMany, findOne, findMany, updateOne, updateMany, deleteOne, deleteMany, getCorePermissions, getAdminDashboardStats, getCurrentUserWithPermissions, getAdminUserList, getAdminOrgList, getMembersWithUsers } = api;
