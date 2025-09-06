"use client";

import { memo, useMemo } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ContactTable } from "./contact-table";
import { Pagination } from "./pagination";
import { type ContactType } from "@/lib/contact-api";

interface ContactsTableSectionProps {
    contacts: ContactType[];
    pagination: {
        page: number;
        totalPages: number;
        total: number;
    };
    onEdit: (contact: ContactType) => void;
    onView: (contact: ContactType) => void;
    onDelete: (id: string) => void;
    onPageChange: (page: number) => void;
}

export const ContactsTableSection = memo(function ContactsTableSection({
    contacts,
    pagination,
    onEdit,
    onView,
    onDelete,
    onPageChange,
}: ContactsTableSectionProps) {
    // Memoized values to prevent unnecessary re-renders
    const memoizedTableProps = useMemo(() => ({
        contacts,
        onEdit,
        onView,
        onDelete,
    }), [contacts, onEdit, onView, onDelete]);

    const memoizedPagination = useMemo(() => ({
        currentPage: pagination.page,
        totalPages: pagination.totalPages,
        onPageChange,
    }), [pagination.page, pagination.totalPages, onPageChange]);

    const memoizedCardDescription = useMemo(() =>
        `Showing ${contacts.length} of ${pagination.total} contacts`,
        [contacts.length, pagination.total]
    );

    return (
        <>
            {/* Contacts Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Contact List</CardTitle>
                    <CardDescription>
                        {memoizedCardDescription}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ContactTable {...memoizedTableProps} />
                </CardContent>
            </Card>

            {/* Pagination */}
            {memoizedPagination.totalPages > 1 && (
                <div className="flex justify-center">
                    <Pagination {...memoizedPagination} />
                </div>
            )}
        </>
    );
});
