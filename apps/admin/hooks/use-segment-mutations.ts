import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactApi, type SegmentType } from '@/lib/contact-api';
import { queryKeys } from '@/lib/query-client';
import { toast } from 'sonner';

export interface CreateSegmentData {
    name: string;
    description?: string;
}

export interface UpdateSegmentData extends Partial<CreateSegmentData> {
    id: string;
}

// Hook for creating a segment
export function useCreateSegment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateSegmentData) => {
            const response = await contactApi.createSegment(data);
            return response;
        },
        onSuccess: (newSegment) => {
            // Invalidate and refetch segments list
            queryClient.invalidateQueries({ queryKey: queryKeys.segments.lists() });
            // Add the new segment to the cache
            queryClient.setQueryData(
                queryKeys.segments.detail(newSegment.data.id),
                newSegment.data
            );
            toast.success('Segment created successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to create segment');
        },
    });
}

// Hook for updating a segment
export function useUpdateSegment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...data }: UpdateSegmentData) => {
            const response = await contactApi.updateSegment(id, data);
            return response;
        },
        onSuccess: (updatedSegment) => {
            // Update the segment in the cache
            queryClient.setQueryData(
                queryKeys.segments.detail(updatedSegment.data.id),
                updatedSegment.data
            );
            // Invalidate segments list to refetch with updated data
            queryClient.invalidateQueries({ queryKey: queryKeys.segments.lists() });
            toast.success('Segment updated successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update segment');
        },
    });
}

// Hook for deleting a segment
export function useDeleteSegment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await contactApi.deleteSegment(id);
            return id;
        },
        onSuccess: (deletedId) => {
            // Remove the segment from the cache
            queryClient.removeQueries({ queryKey: queryKeys.segments.detail(deletedId) });
            // Invalidate segments list to refetch
            queryClient.invalidateQueries({ queryKey: queryKeys.segments.lists() });
            toast.success('Segment deleted successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to delete segment');
        },
    });
}
