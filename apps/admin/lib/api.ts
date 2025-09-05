import type { QueryParams } from "./types";

// Local API response type to avoid conflicts
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
import {
  createErrorFromApiResponse,
  createErrorFromNetworkError,
  NetworkError,
  TimeoutError,
  AuthenticationError,
  AuthorizationError,
} from "./errors";

// API client configuration
export interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  headers?: Record<string, string>;
}

// Default configuration
const DEFAULT_CONFIG: ApiClientConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005",
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  headers: {
    "Content-Type": "application/json",
  },
};

// Request options
export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
  body?: string;
}

// API client class
export class ApiClient {
  private config: ApiClientConfig;
  private authToken?: string;

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Set authentication token
  setAuthToken(token: string) {
    this.authToken = token;
  }

  // Clear authentication token
  clearAuthToken() {
    this.authToken = undefined;
  }

  // Get request headers
  private getHeaders(
    customHeaders?: Record<string, string>,
  ): Record<string, string> {
    const headers = { ...this.config.headers, ...customHeaders };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  // Make HTTP request with retry logic
  private async makeRequest<T>(
    url: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const {
      method = "GET",
      headers: customHeaders,
      timeout = this.config.timeout,
      retries = this.config.retries,
      signal,
    } = options;

    const fullUrl = url.startsWith("http")
      ? url
      : `${this.config.baseUrl}${url}`;
    const headers = this.getHeaders(customHeaders);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(fullUrl, {
          method,
          headers,
          signal: signal || controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle HTTP errors
        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = { message: response.statusText };
          }

          throw createErrorFromApiResponse(response, errorData);
        }

        // Parse response
        let data: T;
        const contentType = response.headers.get("content-type");

        if (contentType?.includes("application/json")) {
          data = await response.json();
        } else {
          data = (await response.text()) as T;
        }

        return {
          data,
          success: true,
          message: "Request successful",
        } as ApiResponse<T>;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on client errors (4xx)
        const errorObj = error as Record<string, unknown>;
        if (
          error instanceof AuthenticationError ||
          error instanceof AuthorizationError ||
          ((errorObj.statusCode as number) >= 400 &&
            (errorObj.statusCode as number) < 500)
        ) {
          throw error;
        }

        // Don't retry on abort
        if ((error as Error).name === "AbortError") {
          throw new TimeoutError("Request timed out");
        }

        // Retry logic
        if (attempt < retries) {
          await this.delay(this.config.retryDelay * Math.pow(2, attempt));
          continue;
        }

        // If it's the last attempt, throw the error
        if (error instanceof NetworkError || error instanceof TimeoutError) {
          throw error;
        }

        throw createErrorFromNetworkError(
          error as Error,
          `API request to ${url}`,
        );
      }
    }

    throw lastError || new Error("Unknown error occurred");
  }

  // Utility method for delays
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // GET request
  async get<T>(
    url: string,
    params?: QueryParams,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    const queryString = params ? this.buildQueryString(params) : "";
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    return this.makeRequest<T>(fullUrl, { ...options, method: "GET" });
  }

  // POST request
  async post<T>(
    url: string,
    data?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    const body = data ? JSON.stringify(data) : undefined;

    return this.makeRequest<T>(url, {
      ...options,
      method: "POST",
      headers: {
        ...options?.headers,
        "Content-Type": "application/json",
      },
      body,
    });
  }

  // PUT request
  async put<T>(
    url: string,
    data?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    const body = data ? JSON.stringify(data) : undefined;

    return this.makeRequest<T>(url, {
      ...options,
      method: "PUT",
      headers: {
        ...options?.headers,
        "Content-Type": "application/json",
      },
      body,
    });
  }

  // PATCH request
  async patch<T>(
    url: string,
    data?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    const body = data ? JSON.stringify(data) : undefined;

    return this.makeRequest<T>(url, {
      ...options,
      method: "PATCH",
      headers: {
        ...options?.headers,
        "Content-Type": "application/json",
      },
      body,
    });
  }

  // DELETE request
  async delete<T>(
    url: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { ...options, method: "DELETE" });
  }

  // Build query string from params
  private buildQueryString(params: QueryParams): string {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());
    if (params.sortBy) searchParams.append("sortBy", params.sortBy);
    if (params.sortOrder) searchParams.append("sortOrder", params.sortOrder);
    if (params.search) searchParams.append("search", params.search);

    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(`filter[${key}]`, value.toString());
        }
      });
    }

    return searchParams.toString();
  }

  // File upload
  async uploadFile<T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();

    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({
              data,
              success: true,
              message: "File uploaded successfully",
            });
          } catch {
            resolve({
              data: xhr.responseText as T,
              success: true,
              message: "File uploaded successfully",
            });
          }
        } else {
          reject(
            createErrorFromApiResponse(
              new Response(xhr.responseText, { status: xhr.status }),
              { message: xhr.statusText },
            ),
          );
        }
      });

      xhr.addEventListener("error", () => {
        reject(new NetworkError("File upload failed"));
      });

      xhr.addEventListener("abort", () => {
        reject(new TimeoutError("File upload timed out"));
      });

      const fullUrl = url.startsWith("http")
        ? url
        : `${this.config.baseUrl}${url}`;
      xhr.open("POST", fullUrl);

      // Set headers
      if (this.authToken) {
        xhr.setRequestHeader("Authorization", `Bearer ${this.authToken}`);
      }

      xhr.send(formData);
    });
  }
}

export async function exportContacts() {
  const url = `${DEFAULT_CONFIG.baseUrl}/api/v1/contacts/export`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to export contacts");
  }

  return response;
}

export async function importContacts(data: Record<string, unknown>) {
  return apiClient.post("/api/v1/contacts/bulk-import", data);
}

export async function importContactsFromFile(file: File) {
  return apiClient.uploadFile("/api/v1/contacts/bulk-import", file);
}

// Create default API client instance
export const apiClient = new ApiClient();

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: "/api/v1/auth/login",
    logout: "/api/v1/auth/logout",
    refresh: "/api/v1/auth/refresh",
    profile: "/api/v1/auth/profile",
  },

  // Users
  users: {
    list: "/api/v1/users",
    create: "/api/v1/users",
    get: (id: string) => `/api/v1/users/${id}`,
    update: (id: string) => `/api/v1/users/${id}`,
    delete: (id: string) => `/api/v1/users/${id}`,
  },

  // WhatsApp
  whatsapp: {
    config: "/api/v1/whatsapp/config",
    templates: "/api/v1/whatsapp/templates",
    template: (id: string) => `/api/v1/whatsapp/templates/${id}`,
    campaigns: "/api/v1/whatsapp/campaigns",
    campaign: (id: string) => `/api/v1/whatsapp/campaigns/${id}`,
    contacts: "/api/v1/whatsapp/contacts",
    contact: (id: string) => `/api/v1/whatsapp/contacts/${id}`,
    messages: "/api/v1/whatsapp/messages",
    message: (id: string) => `/api/v1/whatsapp/messages/${id}`,
  },

  // Media
  media: {
    list: "/api/v1/media",
    upload: "/api/v1/media/upload",
    get: (id: string) => `/api/v1/media/${id}`,
    delete: (id: string) => `/api/v1/media/${id}`,
  },

  // Settings
  settings: {
    app: "/api/v1/settings/app",
    theme: "/api/v1/settings/theme",
    notifications: "/api/v1/settings/notifications",
    security: "/api/v1/settings/security",
  },

  // Analytics
  analytics: {
    dashboard: "/api/v1/analytics/dashboard",
    messages: "/api/v1/analytics/messages",
    campaigns: "/api/v1/analytics/campaigns",
    templates: "/api/v1/analytics/templates",
  },

  // Health check
  health: "/api/v1/health",
} as const;

// API service functions
export const apiService = {
  // Authentication
  auth: {
    login: async (credentials: { email: string; password: string }) => {
      return apiClient.post(API_ENDPOINTS.auth.login, credentials);
    },

    logout: async () => {
      return apiClient.post(API_ENDPOINTS.auth.logout);
    },

    refresh: async () => {
      return apiClient.post(API_ENDPOINTS.auth.refresh);
    },

    getProfile: async () => {
      return apiClient.get(API_ENDPOINTS.auth.profile);
    },
  },

  // Users
  users: {
    getList: async (params?: QueryParams) => {
      return apiClient.get(API_ENDPOINTS.users.list, params);
    },

    create: async (userData: Record<string, unknown>) => {
      return apiClient.post(API_ENDPOINTS.users.create, userData);
    },

    getById: async (id: string) => {
      return apiClient.get(API_ENDPOINTS.users.get(id));
    },

    update: async (id: string, userData: Record<string, unknown>) => {
      return apiClient.put(API_ENDPOINTS.users.update(id), userData);
    },

    delete: async (id: string) => {
      return apiClient.delete(API_ENDPOINTS.users.delete(id));
    },
  },

  // WhatsApp
  whatsapp: {
    getConfig: async () => {
      return apiClient.get(API_ENDPOINTS.whatsapp.config);
    },

    updateConfig: async (config: Record<string, unknown>) => {
      return apiClient.put(API_ENDPOINTS.whatsapp.config, config);
    },

    getTemplates: async (params?: QueryParams) => {
      return apiClient.get(API_ENDPOINTS.whatsapp.templates, params);
    },

    getTemplate: async (id: string) => {
      return apiClient.get(API_ENDPOINTS.whatsapp.template(id));
    },

    createTemplate: async (templateData: Record<string, unknown>) => {
      return apiClient.post(API_ENDPOINTS.whatsapp.templates, templateData);
    },

    updateTemplate: async (
      id: string,
      templateData: Record<string, unknown>,
    ) => {
      return apiClient.put(API_ENDPOINTS.whatsapp.template(id), templateData);
    },

    deleteTemplate: async (id: string) => {
      return apiClient.delete(API_ENDPOINTS.whatsapp.template(id));
    },

    getCampaigns: async (params?: QueryParams) => {
      return apiClient.get(API_ENDPOINTS.whatsapp.campaigns, params);
    },

    getCampaign: async (id: string) => {
      return apiClient.get(API_ENDPOINTS.whatsapp.campaign(id));
    },

    createCampaign: async (campaignData: Record<string, unknown>) => {
      return apiClient.post(API_ENDPOINTS.whatsapp.campaigns, campaignData);
    },

    updateCampaign: async (
      id: string,
      campaignData: Record<string, unknown>,
    ) => {
      return apiClient.put(API_ENDPOINTS.whatsapp.campaign(id), campaignData);
    },

    deleteCampaign: async (id: string) => {
      return apiClient.delete(API_ENDPOINTS.whatsapp.campaign(id));
    },

    getContacts: async (params?: QueryParams) => {
      return apiClient.get(API_ENDPOINTS.whatsapp.contacts, params);
    },

    getContact: async (id: string) => {
      return apiClient.get(API_ENDPOINTS.whatsapp.contact(id));
    },

    createContact: async (contactData: Record<string, unknown>) => {
      return apiClient.post(API_ENDPOINTS.whatsapp.contacts, contactData);
    },

    updateContact: async (id: string, contactData: Record<string, unknown>) => {
      return apiClient.put(API_ENDPOINTS.whatsapp.contact(id), contactData);
    },

    deleteContact: async (id: string) => {
      return apiClient.delete(API_ENDPOINTS.whatsapp.contact(id));
    },
  },

  // Media
  media: {
    getList: async (params?: QueryParams) => {
      return apiClient.get(API_ENDPOINTS.media.list, params);
    },

    upload: async (file: File, onProgress?: (progress: number) => void) => {
      return apiClient.uploadFile(API_ENDPOINTS.media.upload, file, onProgress);
    },

    getById: async (id: string) => {
      return apiClient.get(API_ENDPOINTS.media.get(id));
    },

    delete: async (id: string) => {
      return apiClient.delete(API_ENDPOINTS.media.delete(id));
    },
  },

  // Settings
  settings: {
    getApp: async () => {
      return apiClient.get(API_ENDPOINTS.settings.app);
    },

    updateApp: async (settings: Record<string, unknown>) => {
      return apiClient.put(API_ENDPOINTS.settings.app, settings);
    },

    getTheme: async () => {
      return apiClient.get(API_ENDPOINTS.settings.theme);
    },

    updateTheme: async (theme: Record<string, unknown>) => {
      return apiClient.put(API_ENDPOINTS.settings.theme, theme);
    },

    getNotifications: async () => {
      return apiClient.get(API_ENDPOINTS.settings.notifications);
    },

    updateNotifications: async (notifications: Record<string, unknown>) => {
      return apiClient.put(API_ENDPOINTS.settings.notifications, notifications);
    },

    getSecurity: async () => {
      return apiClient.get(API_ENDPOINTS.settings.security);
    },

    updateSecurity: async (security: Record<string, unknown>) => {
      return apiClient.put(API_ENDPOINTS.settings.security, security);
    },
  },

  // Analytics
  analytics: {
    getDashboard: async (params?: QueryParams) => {
      return apiClient.get(API_ENDPOINTS.analytics.dashboard, params);
    },

    getMessages: async (params?: QueryParams) => {
      return apiClient.get(API_ENDPOINTS.analytics.messages, params);
    },

    getCampaigns: async (params?: QueryParams) => {
      return apiClient.get(API_ENDPOINTS.analytics.campaigns, params);
    },

    getTemplates: async (params?: QueryParams) => {
      return apiClient.get(API_ENDPOINTS.analytics.templates, params);
    },
  },

  // Health check
  health: async () => {
    return apiClient.get(API_ENDPOINTS.health);
  },
};
