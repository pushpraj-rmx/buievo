"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Download, Upload, Users } from "lucide-react";
import type { SortingState, ColumnFiltersState, PaginationState } from '@tanstack/react-table';

// Import new components
import { TanStackContactTable } from "./components/tanstack-contact-table";
import {
  ContactForm,
  ContactView,
  SegmentForm,
  ImportExportDialog,
  ContactSearchDialog,
  SegmentManagementDialog,
} from "./components";

// Import new hooks
import {
  useContacts,
  useSegments,
  useContactStats,
  useDeleteContact,
  type ContactFilters,
} from "@/hooks";

import { type ContactType, type SegmentType } from "@/lib/contact-api";

export default function ContactsPageNew() {
  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Search and filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [segmentFilter, setSegmentFilter] = useState("all");

  // Dialog states
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [segmentDialogOpen, setSegmentDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [segmentManagementDialogOpen, setSegmentManagementDialogOpen] = useState(false);

  // Form states
  const [editingContact, setEditingContact] = useState<ContactType | null>(null);
  const [editingSegment, setEditingSegment] = useState<SegmentType | null>(null);
  const [viewingContact, setViewingContact] = useState<ContactType | null>(null);
  const [selectedSegment] = useState<SegmentType | null>(null);

  // Build filters for API call
  const filters: ContactFilters = useMemo(() => ({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    ...(search && { search }),
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(segmentFilter !== "all" && { segmentId: segmentFilter }),
    fuzzySearch: true,
    // Add sorting parameters
    ...(sorting.length > 0 && {
      sortBy: sorting[0].id,
      sortOrder: sorting[0].desc ? 'desc' : 'asc',
    }),
  }), [pagination.pageIndex, pagination.pageSize, search, statusFilter, segmentFilter, sorting]);

  // Fetch data using TanStack Query
  const { data: contactsData, isLoading: contactsLoading, error: contactsError } = useContacts(filters);
  const { data: segments = [] } = useSegments();
  const { data: stats } = useContactStats();

  // Mutations
  const deleteContactMutation = useDeleteContact();

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


  const handleContactSuccess = useCallback(() => {
    setContactDialogOpen(false);
    setEditingContact(null);
  }, []);

  const handleSegmentSuccess = useCallback(() => {
    setSegmentDialogOpen(false);
    setEditingSegment(null);
  }, []);

  const handleImport = useCallback(() => {
    setImportDialogOpen(true);
  }, []);

  const handleExport = useCallback(() => {
    setExportDialogOpen(true);
  }, []);

  const handleAdvancedSearch = useCallback(() => {
    setSearchDialogOpen(true);
  }, []);

  const handleSearchResults = useCallback((results: ContactType[]) => {
    // Handle search results from advanced search dialog
    console.log('Search results:', results);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    // Reset to first page when searching
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handleSegmentFilterChange = useCallback((value: string) => {
    setSegmentFilter(value);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handlePaginationChange = useCallback((newPagination: PaginationState) => {
    setPagination(newPagination);
  }, []);

  const handleSortingChange = useCallback((newSorting: SortingState) => {
    setSorting(newSorting);
    // Reset to first page when sorting
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, []);

  const handleColumnFiltersChange = useCallback((newFilters: ColumnFiltersState) => {
    setColumnFilters(newFilters);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, []);

  if (contactsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Contacts</h2>
          <p className="text-gray-600 mb-4">
            {contactsError instanceof Error ? contactsError.message : 'An unexpected error occurred'}
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
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">
            Manage your contact database with advanced search and filtering
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateContact}>
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
          <Button variant="outline" onClick={handleCreateSegment}>
            <Users className="mr-2 h-4 w-4" />
            Manage Segments
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inactive}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
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
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search contacts by name, phone, email, or comments..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={segmentFilter} onValueChange={handleSegmentFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Segment" />
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
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleAdvancedSearch}>
                <Filter className="mr-2 h-4 w-4" />
                Advanced
              </Button>
              <Button variant="outline" onClick={handleImport}>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contact List</CardTitle>
          <CardDescription>
            {contactsData ? (
              `Showing ${contactsData.data.length} of ${contactsData.pagination.total} contacts`
            ) : (
              'Loading contacts...'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TanStackContactTable
            data={contactsData?.data || []}
            onEdit={handleEditContact}
            onView={handleViewContact}
            onDelete={handleDeleteContact}
            loading={contactsLoading}
            pagination={contactsData?.pagination}
            onPaginationChange={handlePaginationChange}
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
        onSuccess={handleContactSuccess}
      />

      <SegmentForm
        open={segmentDialogOpen}
        onOpenChange={setSegmentDialogOpen}
        editingSegment={editingSegment}
        onSuccess={handleSegmentSuccess}
      />

      <ContactView
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        contact={viewingContact}
      />

      <ImportExportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        mode="import"
        onSuccess={() => setImportDialogOpen(false)}
      />

      <ImportExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        mode="export"
        onSuccess={() => setExportDialogOpen(false)}
      />

      <ContactSearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onSearchResults={handleSearchResults}
        segments={segments}
      />

      <SegmentManagementDialog
        open={segmentManagementDialogOpen}
        onOpenChange={setSegmentManagementDialogOpen}
        segment={selectedSegment}
        onSuccess={() => setSegmentManagementDialogOpen(false)}
      />
    </div>
  );
}
