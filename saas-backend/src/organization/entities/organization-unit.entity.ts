export enum OrganizationUnitStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export class OrganizationUnit {
  id: string; // UUID
  name: string;
  tenantId: string; // UUID
  parentId?: string | null; // UUID or null for root units
  description?: string;
  leaderUserId?: string | null; // UUID
  status: OrganizationUnitStatus;
  createdAt: Date;
  updatedAt: Date;
}
