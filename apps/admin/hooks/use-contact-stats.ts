import { useQuery } from '@tanstack/react-query';
import { contactApi } from '@/lib/contact-api';
import { queryKeys } from '@/lib/query-client';

export interface ContactStats {
    total: number;
    active: number;
    inactive: number;
    pending: number;
}

// Hook for fetching contact statistics
export function useContactStats() {
    return useQuery({
        queryKey: queryKeys.stats.contacts(),
        queryFn: async (): Promise<ContactStats> => {
            try {
                const response = await contactApi.getContactStats();
                // Ensure we always return a valid ContactStats object
                if (response && response.data) {
                    return {
                        total: response.data.total || 0,
                        active: response.data.active || 0,
                        inactive: response.data.inactive || 0,
                        pending: response.data.pending || 0,
                    };
                }
                // Return default stats if response is invalid
                return {
                    total: 0,
                    active: 0,
                    inactive: 0,
                    pending: 0,
                };
            } catch (error) {
                console.error('Error fetching contact stats:', error);
                // Return default stats on error
                return {
                    total: 0,
                    active: 0,
                    inactive: 0,
                    pending: 0,
                };
            }
        },
        // Refetch stats every 5 minutes
        staleTime: 5 * 60 * 1000,
        // Keep previous data while fetching new data
        placeholderData: (previousData) => previousData,
    });
}
