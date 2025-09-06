"use client";

import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import {
    ContactForm, ContactView, SegmentForm, ImportExportDialog,
    ContactSearchDialog, SegmentManagementDialog, InfiniteContactTable,
} from "./components";
import {
    useInfiniteContacts, useSegments, useContactStats, useDeleteContact,
    useCreateContact, useUpdateContact, useCreateSegment, useUpdateSegment, useDeleteSegment,
    type ContactFilters,
} from "@/hooks";
import { type ContactType, type SegmentType } from "@/lib/contact-api";
import { toast } from "sonner";
import { SortingState, ColumnFiltersState } from "@tanstack/react-table";

export default function InfiniteContactsPage() {
    // UI State
    const [contactDialogOpen, setContactDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [segmentDialogOpen, setSegmentDialogOpen] = useState(false);
    const [importExportDialogOpen, setImportExportDialogOpen] = useState(false);
    const [searchDialogOpen, setSearchDialogOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<ContactType | null>(null);
    const [editingSegment, setEditingSegment] = useState<SegmentType | null>(null);
    const [viewingContact, setViewingContact] = useState<ContactType | null>(null);
    const [selectedSegment] = useState<SegmentType | null>(null);

    // Search and Filter State
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [segmentFilter, setSegmentFilter] = useState("all");
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    // Build filters for API call (without page parameter for infinite scroll)
    const filters: Omit<ContactFilters, 'page'> = useMemo(() => ({
        limit: 20, // Load 20 contacts per page for infinite scroll
        ...(search && { search }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(segmentFilter !== "all" && { segmentId: segmentFilter }),
        fuzzySearch: true,
        // Add sorting parameters
        ...(sorting.length > 0 && {
            sortBy: sorting[0].id,
            sortOrder: sorting[0].desc ? 'desc' : 'asc',
        }),
    }), [search, statusFilter, segmentFilter, sorting]);

    // Fetch data using TanStack Query Infinite Query
    const {
        data,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isError,
    } = useInfiniteContacts(filters);

    const { data: segments = [] } = useSegments();
    const { data: stats } = useContactStats();

    // Flatten all pages of contacts
    const allContacts = useMemo(() => {
        return data?.pages.flatMap(page => page.data) || [];
    }, [data]);

    // Get total count from first page
    const totalCount = data?.pages[0]?.pagination?.total || 0;

    // Mutations
    const deleteContactMutation = useDeleteContact();
    const createContactMutation = useCreateContact();
    const updateContactMutation = useUpdateContact();
    const createSegmentMutation = useCreateSegment();
    const updateSegmentMutation = useUpdateSegment();
    const deleteSegmentMutation = useDeleteSegment();

    // Handlers
    const handleCreateContact = useCallback(() => {
        setEditingContact(null);
        setContactDialogOpen(true);
    }, []);

    const handleEditContact = useCallback((contact: ContactType) => {
        setEditingContact(contact);
        setContactDialogOpen(true);
    }, []);

    const handleViewContact = useCallback((contact: ContactType) => {
        setViewingContact(contact);
        setViewDialogOpen(true);
    }, []);

    const handleDeleteContact = useCallback(async (id: string) => {
        if (confirm("Are you sure you want to delete this contact?")) {
            deleteContactMutation.mutate(id);
        }
    }, [deleteContactMutation]);

    const handleCreateSegment = useCallback(() => {
        setEditingSegment(null);
        setSegmentDialogOpen(true);
    }, []);

    const handleEditSegment = useCallback((segment: SegmentType) => {
        setEditingSegment(segment);
        setSegmentDialogOpen(true);
    }, []);

    const handleDeleteSegment = useCallback(async (id: string) => {
        if (confirm("Are you sure you want to delete this segment?")) {
            deleteSegmentMutation.mutate(id);
        }
    }, [deleteSegmentMutation]);

    const handleSortingChange = useCallback((updater: SortingState | ((old: SortingState) => SortingState)) => {
        setSorting(updater);
    }, []);

    const handleColumnFiltersChange = useCallback((updater: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState)) => {
        setColumnFilters(updater);
    }, []);

    const handleLoadMore = useCallback(() => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    if (isError) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Contacts</h2>
                    <p className="text-gray-600 mb-4">
                        {error instanceof Error ? error.message : 'An unexpected error occurred'}
                    </p>
                    <Button onClick={() => window.location.reload()}>
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Contacts (Infinite Scroll)</h1>
                    <p className="text-muted-foreground">
                        Manage your contact database with infinite scroll loading
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleCreateContact}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Contact
                    </Button>
                    <Button variant="outline" onClick={handleCreateSegment}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Segment
                    </Button>
                    <Button variant="outline" onClick={() => setImportExportDialogOpen(true)}>
                        Import/Export
                    </Button>
                </div>
            </div>

            {/* Stats Section */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.inactive}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pending}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Search and Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Search & Filter</CardTitle>
                    <CardDescription>
                        Search and filter your contacts with infinite scroll loading.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Search contacts..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by segment" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Segments</SelectItem>
                                {segments.map((segment) => (
                                    <SelectItem key={segment.id} value={segment.id}>
                                        {segment.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={() => setSearchDialogOpen(true)}>
                            Advanced Search
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Contacts Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Contact List</CardTitle>
                    <CardDescription>
                        Showing {allContacts.length} of {totalCount} contacts
                        {hasNextPage && " (scroll to load more)"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <InfiniteContactTable
                        contacts={allContacts}
                        onEdit={handleEditContact}
                        onView={handleViewContact}
                        onDelete={handleDeleteContact}
                        loading={isLoading}
                        hasNextPage={hasNextPage}
                        isFetchingNextPage={isFetchingNextPage}
                        onLoadMore={handleLoadMore}
                        onSortingChange={handleSortingChange}
                        onColumnFiltersChange={handleColumnFiltersChange}
                        sorting={sorting}
                        columnFilters={columnFilters}
                    />
                </CardContent>
            </Card>

            {/* Dialogs */}
            <ContactForm
                open={contactDialogOpen}
                onOpenChange={setContactDialogOpen}
                editingContact={editingContact}
                segments={segments}
                onSuccess={() => {
                    setContactDialogOpen(false);
                    setEditingContact(null);
                    toast.success(editingContact ? "Contact updated successfully" : "Contact created successfully");
                }}
            />

            <ContactView
                open={viewDialogOpen}
                onOpenChange={setViewDialogOpen}
                contact={viewingContact}
            />

            <SegmentForm
                open={segmentDialogOpen}
                onOpenChange={setSegmentDialogOpen}
                editingSegment={editingSegment}
                onSuccess={() => {
                    setSegmentDialogOpen(false);
                    setEditingSegment(null);
                    toast.success(editingSegment ? "Segment updated successfully" : "Segment created successfully");
                }}
            />

            <ImportExportDialog
                open={importExportDialogOpen}
                onOpenChange={setImportExportDialogOpen}
                mode="import"
                onSuccess={() => {
                    setImportExportDialogOpen(false);
                    toast.success("Import/Export completed successfully");
                }}
            />

            <ContactSearchDialog
                open={searchDialogOpen}
                onOpenChange={setSearchDialogOpen}
                onSearchResults={(contacts) => {
                    // For infinite scroll, we'll just close the dialog
                    // The search will be handled by the filters
                    setSearchDialogOpen(false);
                }}
                segments={segments}
            />

            <SegmentManagementDialog
                open={false}
                onOpenChange={() => { }}
                segment={null}
                onSuccess={() => {
                    toast.success("Segment operation completed successfully");
                }}
            />
        </div>
    );
}
