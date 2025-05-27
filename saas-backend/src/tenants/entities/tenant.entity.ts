export enum TenantType {
  FREE_TRIAL = 'FreeTrial',
  STANDARD = 'Standard',
  ENTERPRISE = 'Enterprise',
}

export enum TenantStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export class Tenant {
  id: string; // UUID
  name: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  logoUrl?: string;
  tenantType: TenantType;
  subscriptionPlanId?: number;
  status: TenantStatus;
  createdAt: Date;
  updatedAt: Date;
}
