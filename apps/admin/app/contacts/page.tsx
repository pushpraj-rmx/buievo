"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";

import {
  ContactForm,
  ContactView,
  SegmentForm,
  ImportExportDialog,
  ContactSearchDialog,
  SegmentManagementDialog,
  ContactsSearchSection,
  ContactsTableSection,
} from "./components";
import {
  contactApi,
  type ContactType,
  type SegmentType,
} from "@/lib/contact-api";

export default function ContactsPage() {
  // State
  const [contacts, setContacts] = useState<ContactType[]>([]);
  const [segments, setSegments] = useState<SegmentType[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  // Dialog states
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [segmentDialogOpen, setSegmentDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [segmentManagementDialogOpen, setSegmentManagementDialogOpen] =
    useState(false);
  const [selectedSegment, setSelectedSegment] = useState<SegmentType | null>(
    null
  );

  // Form states
  const [editingContact, setEditingContact] = useState<ContactType | null>(
    null
  );
  const [editingSegment, setEditingSegment] = useState<SegmentType | null>(
    null
  );
  const [viewingContact, setViewingContact] = useState<ContactType | null>(
    null
  );

  // Loading states
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const paginationRef = useRef(pagination);
  const statusFilterRef = useRef(statusFilter);
  const segmentFilterRef = useRef(segmentFilter);
  const selectedContactsRef = useRef(selectedContacts);

  // Update refs when values change - combine into single effect to reduce re-renders
  useEffect(() => {
    paginationRef.current = pagination;
    statusFilterRef.current = statusFilter;
    segmentFilterRef.current = segmentFilter;
    selectedContactsRef.current = selectedContacts;
  }, [pagination, statusFilter, segmentFilter, selectedContacts]);

  // Fetch contacts - stable function using refs
  const fetchContacts = useCallback(async (searchTerm?: string, page?: number, limit?: number) => {
    try {
      setLoading(true);
      const response = await contactApi.getContacts({
        page: page || paginationRef.current.page,
        limit: limit || paginationRef.current.limit,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilterRef.current !== "all" && { status: statusFilterRef.current }),
        ...(segmentFilterRef.current !== "all" && { segmentId: segmentFilterRef.current }),
        // Enable fuzzy search for better results
        fuzzySearch: true,
      });

      setContacts(response.data);
      setPagination(response.pagination);
    } catch (error) {
      toast.error("Failed to fetch contacts");
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  }, []); // Stable function - no dependencies needed since we use refs

  // Debounced search function - stable function using refs
  const debouncedSearch = useCallback((searchTerm: string) => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const response = await contactApi.getContacts({
          page: paginationRef.current.page,
          limit: paginationRef.current.limit,
          search: searchTerm,
          ...(statusFilterRef.current !== "all" && { status: statusFilterRef.current }),
          ...(segmentFilterRef.current !== "all" && { segmentId: segmentFilterRef.current }),
          fuzzySearch: true,
        });

        setContacts(response.data);
        setPagination(response.pagination);
      } catch (error) {
        toast.error("Failed to fetch contacts");
        console.error("Error fetching contacts:", error);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms delay
  }, []); // Stable function - no dependencies needed since we use refs

  // Fetch segments
  const fetchSegments = useCallback(async () => {
    try {
      const response = await contactApi.getSegments();
      setSegments(response.data);
    } catch (error) {
      toast.error("Failed to fetch segments");
      console.error("Error fetching segments:", error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchContacts();
    fetchSegments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Handle filter changes (status and segment filters)
  useEffect(() => {
    fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, segmentFilter]); // fetchContacts is stable, no need to include it

  // Debounced search effect
  useEffect(() => {
    if (search.trim()) {
      debouncedSearch(search);
    } else {
      // If search is empty, fetch all contacts immediately
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      fetchContacts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]); // debouncedSearch and fetchContacts are stable, no need to include them

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // Contact handlers
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
    try {
      await contactApi.deleteContact(id);
      toast.success("Contact deleted successfully");
      fetchContacts();
      setSelectedContacts((prev) =>
        prev.filter((contactId) => contactId !== id)
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete contact"
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchContacts is stable now

  const handleBulkDelete = useCallback(async () => {
    if (selectedContactsRef.current.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedContactsRef.current.length} contacts?`
      )
    ) {
      return;
    }

    try {
      const promises = selectedContactsRef.current.map((id) =>
        contactApi.deleteContact(id)
      );

      await Promise.all(promises);
      toast.success(`${selectedContactsRef.current.length} contacts deleted successfully`);
      setSelectedContacts([]);
      fetchContacts();
    } catch (error) {
      toast.error("Failed to delete some contacts");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // No dependencies needed since we use refs

  // Segment handlers
  const handleCreateSegment = useCallback(() => {
    setEditingSegment(null);
    setSegmentDialogOpen(true);
  }, []);

  // Import/Export handlers
  const handleImport = useCallback(() => {
    setImportDialogOpen(true);
  }, []);

  const handleExport = useCallback(() => {
    setExportDialogOpen(true);
  }, []);

  // Utility handlers
  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedContacts([]);
  }, []);

  const handleContactSuccess = useCallback(() => {
    fetchContacts();
    setSelectedContacts([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchContacts is stable now

  const handleSegmentSuccess = useCallback(() => {
    fetchSegments();
  }, [fetchSegments]);

  const handleAdvancedSearch = useCallback(() => {
    setSearchDialogOpen(true);
  }, []);

  const handleSearchResults = useCallback((searchResults: ContactType[]) => {
    // Ensure we have valid data
    const results = searchResults || [];
    setContacts(results);
    setPagination({
      page: 1,
      limit: 10,
      total: results.length,
      totalPages: Math.ceil(results.length / 10),
    });
  }, []);

  // Memoized search change handler
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  // Memoized filter change handlers
  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
  }, []);

  const handleSegmentFilterChange = useCallback((value: string) => {
    setSegmentFilter(value);
  }, []);


  // Note: Stats are now handled by the ContactStats component

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div></div>
      </div>

      {/* Search Section - Isolated from table rendering */}
      <ContactsSearchSection
        search={search}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        segmentFilter={segmentFilter}
        onSegmentFilterChange={handleSegmentFilterChange}
        segments={segments}
        onCreateContact={handleCreateContact}
        onCreateSegment={handleCreateSegment}
        onImport={handleImport}
        onExport={handleExport}
        onAdvancedSearch={handleAdvancedSearch}
        selectedContacts={selectedContacts}
        onBulkDelete={handleBulkDelete}
        onClearSelection={handleClearSelection}
        onRefresh={fetchContacts}
      />

      {/* Table Section - Only re-renders when contacts data changes */}
      <ContactsTableSection
        contacts={contacts}
        pagination={pagination}
        onEdit={handleEditContact}
        onView={handleViewContact}
        onDelete={handleDeleteContact}
        onPageChange={handlePageChange}
      />

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
        onSuccess={handleContactSuccess}
      />

      <ImportExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        mode="export"
        onSuccess={handleContactSuccess}
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
        onSuccess={handleContactSuccess}
      />
    </div>
  );
}
