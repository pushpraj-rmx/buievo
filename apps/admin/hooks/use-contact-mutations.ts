import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contactApi, type ContactType } from '@/lib/contact-api';
import { queryKeys } from '@/lib/query-client';
import { toast } from 'sonner';

export interface CreateContactData {
    name: string;
    email?: string;
    phone: string;
    status?: 'active' | 'inactive' | 'pending';
    comment?: string;
    segmentIds?: string[];
}

export interface UpdateContactData extends Partial<CreateContactData> {
    id: string;
}

// Hook for creating a contact
export function useCreateContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: CreateContactData) => {
            const response = await contactApi.createContact(data);
            return response;
        },
        onSuccess: (newContact) => {
            // Invalidate and refetch contacts list
            queryClient.invalidateQueries({ queryKey: queryKeys.contacts.lists() });
            // Invalidate stats
            queryClient.invalidateQueries({ queryKey: queryKeys.stats.contacts() });
            // Add the new contact to the cache
            queryClient.setQueryData(
                queryKeys.contacts.detail(newContact.data.id),
                newContact.data
            );
            toast.success('Contact created successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to create contact');
        },
    });
}

// Hook for updating a contact
export function useUpdateContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...data }: UpdateContactData) => {
            const response = await contactApi.updateContact(id, data);
            return response;
        },
        onSuccess: (updatedContact) => {
            // Update the contact in the cache
            queryClient.setQueryData(
                queryKeys.contacts.detail(updatedContact.data.id),
                updatedContact.data
            );
            // Invalidate contacts list to refetch with updated data
            queryClient.invalidateQueries({ queryKey: queryKeys.contacts.lists() });
            // Invalidate stats
            queryClient.invalidateQueries({ queryKey: queryKeys.stats.contacts() });
            toast.success('Contact updated successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update contact');
        },
    });
}

// Hook for deleting a contact
export function useDeleteContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            await contactApi.deleteContact(id);
            return id;
        },
        onSuccess: (deletedId) => {
            // Remove the contact from the cache
            queryClient.removeQueries({ queryKey: queryKeys.contacts.detail(deletedId) });
            // Invalidate contacts list to refetch
            queryClient.invalidateQueries({ queryKey: queryKeys.contacts.lists() });
            // Invalidate stats
            queryClient.invalidateQueries({ queryKey: queryKeys.stats.contacts() });
            toast.success('Contact deleted successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to delete contact');
        },
    });
}

// Hook for bulk deleting contacts (using individual delete calls)
export function useBulkDeleteContacts() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (ids: string[]) => {
            // Delete contacts one by one since bulk delete is not available
            const deletePromises = ids.map(id => contactApi.deleteContact(id));
            await Promise.all(deletePromises);
            return ids;
        },
        onSuccess: (deletedIds) => {
            // Remove all deleted contacts from the cache
            deletedIds.forEach(id => {
                queryClient.removeQueries({ queryKey: queryKeys.contacts.detail(id) });
            });
            // Invalidate contacts list to refetch
            queryClient.invalidateQueries({ queryKey: queryKeys.contacts.lists() });
            // Invalidate stats
            queryClient.invalidateQueries({ queryKey: queryKeys.stats.contacts() });
            toast.success(`${deletedIds.length} contacts deleted successfully`);
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to delete contacts');
        },
    });
}

// Hook for checking duplicates
export function useCheckDuplicates() {
    return useMutation({
        mutationFn: async (data: CreateContactData) => {
            const response = await contactApi.checkDuplicates(data);
            return response;
        },
    });
}
