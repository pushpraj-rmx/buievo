export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  category: ContactCategory;
  tags: string[];
  status: ContactStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ContactCategory = 
  | 'member'
  | 'leadership'
  | 'prospect'
  | 'alumni'
  | 'guest'
  | 'partner';

export type ContactStatus = 
  | 'active'
  | 'inactive'
  | 'pending'
  | 'suspended';

export interface CreateContactData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  category: ContactCategory;
  tags?: string[];
  status?: ContactStatus;
  notes?: string;
}

export interface UpdateContactData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  category?: ContactCategory;
  tags?: string[];
  status?: ContactStatus;
  notes?: string;
}

export interface ContactSearchParams {
  query?: string;
  category?: string;
  tags?: string[];
  page: number;
  limit: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ContactStats {
  total: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
}

export interface BulkOperationRequest {
  operation: 'delete' | 'update_category' | 'update_status';
  contacts: string[];
  data?: any; // Additional data for update operations
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: string[];
}

