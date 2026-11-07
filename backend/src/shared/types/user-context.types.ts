import { Role } from '@prisma/client';

export interface TenantContext {
  id: string;
  name: string;
  subdomain: string;
}

export interface UserContext {
  id: string;
  tenantId: string;
  role: Role;
  email: string;
  wardId: string | null;
}

