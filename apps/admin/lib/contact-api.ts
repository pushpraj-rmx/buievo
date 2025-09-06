/**
 * Contact Service API Client
 * 
 * This client provides a type-safe interface to the Contact Service microservice.
 * It handles all 23 endpoints and provides proper error handling.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_CONTACT_SERVICE_URL || "http://localhost:32102";

// Types matching the Contact Service API
export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  status: "active" | "inactive" | "pending";
  comment?: string | null;
  segments: Segment[];
  createdAt: string;
  updatedAt: string;
}

export interface Segment {
  id: string;
  name: string;
  description?: string;
  _count?: {
    contacts: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export interface ContactStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
}

export interface SegmentStats {
  total: number;
  segments: Segment[];
}

export interface DuplicateInfo {
  contact: Partial<Contact>;
  existingContact: Contact;
  duplicateType: "email" | "phone" | "both";
}

export interface BulkImportResult {
  imported: Contact[];
  duplicates: DuplicateInfo[];
}

export interface DuplicateResolution {
  duplicates: DuplicateInfo[];
  action: "update" | "skip" | "force-create";
}

export interface DuplicateCheckResult {
  hasDuplicates: boolean;
  duplicates: Array<{
    existingContact: Contact;
    duplicateType: "email" | "phone" | "both";
    conflictFields: string[];
  }>;
  suggestedActions: Array<"update" | "skip" | "force-create">;
}

export interface ContactResolution {
  action: "update" | "skip" | "force-create";
  targetContactId?: string;
}

export interface ContactCreationResult {
  success: boolean;
  contact?: Contact;
  action: "created" | "updated" | "skipped";
  message: string;
}

class ContactApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error?.message || `API Error: ${response.status}`
      );
    }

    return data;
  }

  // Health Checks
  async checkHealth(): Promise<{ success: true; message: string }> {
    return this.request("/");
  }

  async getDetailedHealth(): Promise<{
    success: true;
    data: { status: string; database: string; timestamp: string };
  }> {
    return this.request("/health/detailed");
  }

  // Contacts API
  async getContacts(params?: {
    page?: number;
    limit?: number;
    status?: string;
    segmentId?: string;
    search?: string;
    // Advanced search parameters (already supported by backend)
    name?: string;
    email?: string;
    phone?: string;
    comment?: string;
    segmentName?: string;
    createdAfter?: string;
    createdBefore?: string;
    updatedAfter?: string;
    updatedBefore?: string;
    includeInactive?: boolean;
    fuzzySearch?: boolean;
  }): Promise<PaginatedResponse<Contact>> {
    const searchParams = new URLSearchParams();

    // Add all non-empty parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.set(key, value.toString());
        }
      });
    }

    const response = await fetch(`${this.baseUrl}/api/v1/contacts?${searchParams}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch contacts: ${response.status}`);
    }
    const data = await response.json();
    // Contact Service returns { contacts: [...], pagination: {...} } format
    // Convert to expected PaginatedResponse format
    return {
      success: true,
      data: data.contacts || [],
      pagination: {
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 10,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.pages || 0
      }
    };
  }

  async getContact(id: string): Promise<{ success: true; data: Contact }> {
    return this.request(`/api/v1/contacts/${id}`);
  }

  async createContact(contact: {
    name: string;
    email?: string;
    phone: string;
    status?: "active" | "inactive" | "pending";
    comment?: string;
    segmentIds?: string[];
  }): Promise<{ success: true; data: Contact }> {
    return this.request("/api/v1/contacts", {
      method: "POST",
      body: JSON.stringify(contact),
    });
  }

  async updateContact(
    id: string,
    updates: Partial<{
      name: string;
      email: string;
      phone: string;
      status: "active" | "inactive" | "pending";
      comment: string;
      segmentIds: string[];
    }>
  ): Promise<{ success: true; data: Contact }> {
    return this.request(`/api/v1/contacts/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async deleteContact(id: string): Promise<{ success: true; message: string }> {
    return this.request(`/api/v1/contacts/${id}`, {
      method: "DELETE",
    });
  }

  async searchContacts(params: {
    q: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Contact>> {
    const searchParams = new URLSearchParams();
    searchParams.set("q", params.q);
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.limit) searchParams.set("limit", params.limit.toString());

    const response = await fetch(`${this.baseUrl}/api/v1/contacts/search?${searchParams}`);
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }
    const data = await response.json();

    // Handle different response formats from Contact Service
    if (Array.isArray(data)) {
      // If it's a direct array, wrap it in pagination format
      return {
        success: true,
        data: data,
        pagination: {
          page: params.page || 1,
          limit: params.limit || 10,
          total: data.length,
          totalPages: Math.ceil(data.length / (params.limit || 10))
        }
      };
    } else if (data.contacts && Array.isArray(data.contacts)) {
      // If it's in { contacts: [...], pagination: {...} } format
      return {
        success: true,
        data: data.contacts,
        pagination: data.pagination || {
          page: params.page || 1,
          limit: params.limit || 10,
          total: data.contacts.length,
          totalPages: Math.ceil(data.contacts.length / (params.limit || 10))
        }
      };
    } else {
      // Fallback to generic request format
      return this.request(`/api/v1/contacts/search?${searchParams}`);
    }
  }


  async getSearchSuggestions(params: {
    q: string;
    limit?: number;
  }): Promise<Contact[]> {
    const searchParams = new URLSearchParams();
    searchParams.set("q", params.q);
    if (params.limit) searchParams.set("limit", params.limit.toString());

    const response = await fetch(`${this.baseUrl}/api/v1/contacts/search/suggestions?${searchParams}`);
    if (!response.ok) {
      throw new Error(`Search suggestions failed: ${response.status}`);
    }
    return response.json();
  }

  async getContactStats(): Promise<{ success: true; data: ContactStats }> {
    return this.request("/api/v1/contacts/stats");
  }

  async exportContacts(params?: {
    format?: "csv";
    status?: string;
    segmentId?: string;
  }): Promise<string> {
    const searchParams = new URLSearchParams();
    if (params?.format) searchParams.set("format", params.format);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.segmentId) searchParams.set("segmentId", params.segmentId);

    const response = await fetch(
      `${this.baseUrl}/api/v1/contacts/export?${searchParams}`
    );

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    return response.text();
  }

  async bulkImportContacts(data: {
    contacts: Array<{
      name: string;
      email?: string;
      phone: string;
      status?: "active" | "inactive" | "pending";
      comment?: string;
    }>;
    segmentIds?: string[];
  }): Promise<{ success: true; data: BulkImportResult }> {
    return this.request("/api/v1/contacts/bulk-import", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async resolveDuplicates(
    resolution: DuplicateResolution
  ): Promise<{ success: true; data: { resolved: Contact[]; skipped: unknown[] } }> {
    return this.request("/api/v1/contacts/resolve-duplicates", {
      method: "POST",
      body: JSON.stringify(resolution),
    });
  }

  async checkDuplicates(contact: {
    name: string;
    email?: string;
    phone: string;
    status?: "active" | "inactive" | "pending";
    comment?: string;
    segmentIds?: string[];
  }): Promise<{ success: true; data: DuplicateCheckResult }> {
    return this.request("/api/v1/contacts/check-duplicates", {
      method: "POST",
      body: JSON.stringify(contact),
    });
  }

  async createWithResolution(
    contact: {
      name: string;
      email?: string;
      phone: string;
      status?: "active" | "inactive" | "pending";
      comment?: string;
      segmentIds?: string[];
    },
    resolution: ContactResolution
  ): Promise<{ success: true; data: ContactCreationResult }> {
    return this.request("/api/v1/contacts/create-with-resolution", {
      method: "POST",
      body: JSON.stringify({ contact, resolution }),
    });
  }

  async getAvailableSegments(): Promise<{ success: true; data: Segment[] }> {
    return this.request("/api/v1/contacts/segments");
  }

  // Segments API
  async getSegments(): Promise<{ success: true; data: Segment[] }> {
    const response = await fetch(`${this.baseUrl}/api/v1/segments`);
    if (!response.ok) {
      throw new Error(`Failed to fetch segments: ${response.status}`);
    }
    const data = await response.json();
    // Contact Service returns segments directly as array, not wrapped
    return { success: true, data: Array.isArray(data) ? data : [] };
  }

  async getSegment(id: string): Promise<{ success: true; data: Segment }> {
    const segment = await this.request<Segment>(`/api/v1/segments/${id}`);
    return { success: true, data: segment };
  }

  async createSegment(data: {
    name: string;
    description?: string;
  }): Promise<{ success: true; data: Segment }> {
    const segment = await this.request<Segment>("/api/v1/segments", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return { success: true, data: segment };
  }

  async updateSegment(
    id: string,
    updates: { name?: string; description?: string }
  ): Promise<{ success: true; data: Segment }> {
    const segment = await this.request<Segment>(`/api/v1/segments/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    return { success: true, data: segment };
  }

  async deleteSegment(id: string): Promise<{ success: true; message: string }> {
    return this.request(`/api/v1/segments/${id}`, {
      method: "DELETE",
    });
  }

  async getSegmentStats(): Promise<{ success: true; data: SegmentStats }> {
    const stats = await this.request<SegmentStats>("/api/v1/segments/stats");
    return { success: true, data: stats };
  }

  async addContactsToSegment(
    segmentId: string,
    contactIds: string[]
  ): Promise<{ success: true; data: { added: number; segment: Segment } }> {
    return this.request(`/api/v1/segments/${segmentId}/contacts`, {
      method: "POST",
      body: JSON.stringify({ contactIds }),
    });
  }

  async removeContactsFromSegment(
    segmentId: string,
    contactIds: string[]
  ): Promise<{ success: true; data: { removed: number; segment: Segment } }> {
    return this.request(`/api/v1/segments/${segmentId}/contacts`, {
      method: "DELETE",
      body: JSON.stringify({ contactIds }),
    });
  }
}

// Export singleton instance
export const contactApi = new ContactApiClient();

// Export types for use in components
export type {
  Contact as ContactType,
  Segment as SegmentType,
  PaginatedResponse as PaginatedResponseType,
  ApiError as ApiErrorType,
  ContactStats as ContactStatsType,
  SegmentStats as SegmentStatsType,
  DuplicateInfo as DuplicateInfoType,
  BulkImportResult as BulkImportResultType,
  DuplicateResolution as DuplicateResolutionType,
};

