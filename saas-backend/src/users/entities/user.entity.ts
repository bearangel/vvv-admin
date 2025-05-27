export enum UserStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export class User {
  id: string; // UUID - from Supabase Auth
  tenantId: string; // UUID
  email: string; // From Supabase Auth, stored here for convenience
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  roleIds?: string[]; // Array of UUIDs
  organizationUnitId?: string; // UUID
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}
