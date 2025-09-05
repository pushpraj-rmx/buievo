"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

import {
  ContactForm,
  ContactTable,
  ContactView,
  ContactsToolbar,
  Pagination,
  SegmentForm,
  ImportExportDialog,
  ContactStats,
  ContactSearchDialog,
  SegmentManagementDialog,
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

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await contactApi.getContacts({
        page: pagination.page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(segmentFilter !== "all" && { segmentId: segmentFilter }),
      });

      setContacts(response.data);
      setPagination(response.pagination);
    } catch (error) {
      toast.error("Failed to fetch contacts");
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, segmentFilter]);

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

  useEffect(() => {
    fetchContacts();
    fetchSegments();
  }, [fetchContacts, fetchSegments]);

  // Contact handlers
  const handleCreateContact = () => {
    setEditingContact(null);
    setContactDialogOpen(true);
  };

  const handleEditContact = (contact: ContactType) => {
    setEditingContact(contact);
    setContactDialogOpen(true);
  };

  const handleViewContact = (contact: ContactType) => {
    setViewingContact(contact);
    setViewDialogOpen(true);
  };

  const handleDeleteContact = async (id: string) => {
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
  };

  const handleBulkDelete = async () => {
    if (selectedContacts.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedContacts.length} contacts?`
      )
    ) {
      return;
    }

    try {
      const promises = selectedContacts.map((id) =>
        contactApi.deleteContact(id)
      );

      await Promise.all(promises);
      toast.success(`${selectedContacts.length} contacts deleted successfully`);
      setSelectedContacts([]);
      fetchContacts();
    } catch (error) {
      toast.error("Failed to delete some contacts");
    }
  };

  // Segment handlers
  const handleCreateSegment = () => {
    setEditingSegment(null);
    setSegmentDialogOpen(true);
  };

  // Import/Export handlers
  const handleImport = () => {
    setImportDialogOpen(true);
  };

  const handleExport = () => {
    setExportDialogOpen(true);
  };

  // Utility handlers
  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const handleClearSelection = () => {
    setSelectedContacts([]);
  };

  const handleContactSuccess = () => {
    fetchContacts();
    setSelectedContacts([]);
  };

  const handleSegmentSuccess = () => {
    fetchSegments();
  };

  const handleAdvancedSearch = () => {
    setSearchDialogOpen(true);
  };

  const handleSearchResults = (searchResults: ContactType[]) => {
    // Ensure we have valid data
    const results = searchResults || [];
    setContacts(results);
    setPagination({
      page: 1,
      limit: 10,
      total: results.length,
      totalPages: Math.ceil(results.length / 10),
    });
  };

  const handleManageSegment = (segment: SegmentType) => {
    setSelectedSegment(segment);
    setSegmentManagementDialogOpen(true);
  };

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

      {/* Analytics Dashboard */}
      <ContactStats onRefresh={fetchContacts} />

      {/* Toolbar */}
      <ContactsToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        segmentFilter={segmentFilter}
        onSegmentFilterChange={setSegmentFilter}
        segments={segments}
        onCreateContact={handleCreateContact}
        onCreateSegment={handleCreateSegment}
        onImport={handleImport}
        onExport={handleExport}
        onAdvancedSearch={handleAdvancedSearch}
        selectedContacts={selectedContacts}
        onBulkDelete={handleBulkDelete}
        onClearSelection={handleClearSelection}
      />

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contact List</CardTitle>
          <CardDescription>
            Showing {contacts.length} of {pagination.total} contacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContactTable
            contacts={contacts}
            onEdit={handleEditContact}
            onView={handleViewContact}
            onDelete={handleDeleteContact}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

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
