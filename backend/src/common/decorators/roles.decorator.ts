import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const CURRENT_USER_KEY = 'currentUser';
export const TenantKey = (key: string) => SetMetadata('tenantKey', key);
