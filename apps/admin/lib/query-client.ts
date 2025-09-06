import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data is considered fresh for 5 minutes
            staleTime: 5 * 60 * 1000, // 5 minutes
            // Cache data for 10 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            // Don't refetch on window focus for better UX
            refetchOnWindowFocus: false,
            // Retry failed requests 2 times
            retry: 2,
            // Enable structural sharing for better performance
            structuralSharing: true,
            // Keep previous data while fetching new data (smooth pagination)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            placeholderData: (previousData: any) => previousData,
        },
        mutations: {
            // Retry failed mutations once
            retry: 1,
            // Network error retry delay
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        },
    },
});

// Query keys factory for consistent key management
export const queryKeys = {
    contacts: {
        all: ['contacts'] as const,
        lists: () => [...queryKeys.contacts.all, 'list'] as const,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        list: (filters: Record<string, any>) => [...queryKeys.contacts.lists(), filters] as const,
        details: () => [...queryKeys.contacts.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.contacts.details(), id] as const,
    },
    segments: {
        all: ['segments'] as const,
        lists: () => [...queryKeys.segments.all, 'list'] as const,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        list: (filters?: Record<string, any>) => [...queryKeys.segments.lists(), filters] as const,
        details: () => [...queryKeys.segments.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.segments.details(), id] as const,
    },
    stats: {
        all: ['stats'] as const,
        contacts: () => [...queryKeys.stats.all, 'contacts'] as const,
    },
} as const;
