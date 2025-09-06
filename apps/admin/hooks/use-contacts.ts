import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { contactApi, type ContactType } from '@/lib/contact-api';
import { queryKeys } from '@/lib/query-client';

export interface ContactFilters {
    page?: number;
    limit?: number;
    search?: string;
    name?: string;
    email?: string;
    phone?: string;
    comment?: string;
    segmentName?: string;
    status?: string;
    segmentId?: string;
    createdAfter?: string;
    createdBefore?: string;
    updatedAfter?: string;
    updatedBefore?: string;
    includeInactive?: boolean;
    fuzzySearch?: boolean;
    // Sorting parameters
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface ContactsResponse {
    data: ContactType[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Hook for fetching contacts with pagination
export function useContacts(filters: ContactFilters = {}) {
    return useQuery({
        queryKey: queryKeys.contacts.list(filters),
        queryFn: async (): Promise<ContactsResponse> => {
            try {
                const response = await contactApi.getContacts(filters);
                // Ensure we always return a valid ContactsResponse object
                if (response && response.data && response.pagination) {
                    return {
                        data: response.data || [],
                        pagination: {
                            page: response.pagination.page || 1,
                            limit: response.pagination.limit || 10,
                            total: response.pagination.total || 0,
                            totalPages: response.pagination.totalPages || 0,
                        },
                    };
                }
                // Return default response if data is invalid
                return {
                    data: [],
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 0,
                        totalPages: 0,
                    },
                };
            } catch (error) {
                console.error('Error fetching contacts:', error);
                // Return default response on error
                return {
                    data: [],
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 0,
                        totalPages: 0,
                    },
                };
            }
        },
        // Keep previous data while fetching new data for smooth pagination
        placeholderData: (previousData) => previousData,
        // Refetch when filters change
        enabled: true,
    });
}

// Hook for infinite scroll contacts
export function useInfiniteContacts(filters: Omit<ContactFilters, 'page'> = {}) {
    return useInfiniteQuery({
        queryKey: queryKeys.contacts.list(filters),
        queryFn: async ({ pageParam = 1 }): Promise<ContactsResponse> => {
            try {
                const response = await contactApi.getContacts({
                    ...filters,
                    page: pageParam,
                });
                // Ensure we always return a valid ContactsResponse object
                if (response && response.data && response.pagination) {
                    return {
                        data: response.data || [],
                        pagination: {
                            page: response.pagination.page || 1,
                            limit: response.pagination.limit || 10,
                            total: response.pagination.total || 0,
                            totalPages: response.pagination.totalPages || 0,
                        },
                    };
                }
                // Return default response if data is invalid
                return {
                    data: [],
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 0,
                        totalPages: 0,
                    },
                };
            } catch (error) {
                console.error('Error fetching contacts:', error);
                // Return default response on error
                return {
                    data: [],
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 0,
                        totalPages: 0,
                    },
                };
            }
        },
        getNextPageParam: (lastPage) => {
            const { page, totalPages } = lastPage.pagination;
            return page < totalPages ? page + 1 : undefined;
        },
        initialPageParam: 1,
        // Keep previous data for smooth infinite scroll
        placeholderData: (previousData) => previousData,
    });
}

// Hook for fetching a single contact
export function useContact(id: string) {
    return useQuery({
        queryKey: queryKeys.contacts.detail(id),
        queryFn: async () => {
            const response = await contactApi.getContact(id);
            return response;
        },
        enabled: !!id,
    });
}
