export enum RoleType {
  SYSTEM = 'System',
  TENANT_CUSTOM = 'TenantCustom',
}

export enum RoleStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export class Role {
  id: string; // UUID
  name: string;
  description?: string;
  tenantId?: string | null; // UUID or null for system roles
  type: RoleType;
  status: RoleStatus;
  createdAt: Date;
  updatedAt: Date;
}
