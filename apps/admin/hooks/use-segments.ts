import { useQuery } from '@tanstack/react-query';
import { contactApi, type SegmentType } from '@/lib/contact-api';
import { queryKeys } from '@/lib/query-client';

export interface SegmentFilters {
    search?: string;
    includeInactive?: boolean;
}

// Hook for fetching segments
export function useSegments(filters: SegmentFilters = {}) {
    return useQuery({
        queryKey: queryKeys.segments.list(filters),
        queryFn: async (): Promise<SegmentType[]> => {
            try {
                const response = await contactApi.getSegments();
                // Ensure we always return a valid array
                return response.data || [];
            } catch (error) {
                console.error('Error fetching segments:', error);
                // Return empty array on error
                return [];
            }
        },
        // Keep previous data while fetching new data
        placeholderData: (previousData) => previousData,
    });
}

// Hook for fetching a single segment
export function useSegment(id: string) {
    return useQuery({
        queryKey: queryKeys.segments.detail(id),
        queryFn: async () => {
            const response = await contactApi.getSegment(id);
            return response;
        },
        enabled: !!id,
    });
}
