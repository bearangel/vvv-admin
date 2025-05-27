export enum PermissionOperationType {
  VIEW = 'View',
  CREATE = 'Create',
  UPDATE = 'Update',
  DELETE = 'Delete',
  MANAGE = 'Manage', // Represents all operations
  EXPORT = 'Export',
  // Add other specific operations as needed
}

export enum PermissionStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export class Permission {
  id: string; // UUID, primary key, auto-generated
  name: string; // Human-readable name
  description?: string;
  resourceIdentifier: string; // Programmatic key, e.g., user.create
  operationType?: PermissionOperationType;
  status: PermissionStatus; // Default: Active
  createdAt: Date; // Auto-generated
  updatedAt: Date; // Auto-generated
}
