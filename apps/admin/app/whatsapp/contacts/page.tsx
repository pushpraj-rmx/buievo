"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Search,
  Upload,
  Download,
  Edit,
  Trash2,
  Eye,
  Users,
  Tag,
  Filter,
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone: string;
  status: string;
  comment?: string;
  createdAt: string;
  segments: Segment[];
  conversations: Array<{
    id: string;
    lastMessageAt: string;
    unreadCount: number;
  }>;
}

interface Segment {
  id: string;
  name: string;
  _count?: {
    contacts: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function WhatsAppContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [segmentFilter, setSegmentFilter] = useState("all");

  // Dialog states
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [segmentDialogOpen, setSegmentDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Form states
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);

  // Loading states
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState("");
  const [segmentCreateLoading, setSegmentCreateLoading] = useState(false);
  const [segmentUpdateLoading, setSegmentUpdateLoading] = useState(false);
  const [segmentDeleteLoading, setSegmentDeleteLoading] = useState("");
  const [importLoading, setImportLoading] = useState(false);

  // Form data
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    status: "active",
    comment: "",
    segmentIds: [] as string[],
  });

  const [segmentForm, setSegmentForm] = useState({
    name: "",
  });

  const [importData, setImportData] = useState("");

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(segmentFilter !== "all" && { segmentId: segmentFilter }),
      });

      const response = await fetch(`/api/v1/contacts?${params}`);
      if (!response.ok) throw new Error("Failed to fetch contacts");

      const data = await response.json();
      setContacts(data.contacts);
      setPagination(data.pagination);
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
      const response = await fetch("/api/v1/contacts/segments");
      if (!response.ok) throw new Error("Failed to fetch segments");

      const data = await response.json();
      setSegments(data);
    } catch (error) {
      toast.error("Failed to fetch segments");
      console.error("Error fetching segments:", error);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
    fetchSegments();
  }, [fetchContacts, fetchSegments]);

  // Create contact
  const handleCreateContact = async () => {
    try {
      setCreateLoading(true);
      const response = await fetch("/api/v1/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create contact");
      }

      toast.success("Contact created successfully");
      setContactDialogOpen(false);
      resetContactForm();
      fetchContacts();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create contact"
      );
    } finally {
      setCreateLoading(false);
    }
  };

  // Update contact
  const handleUpdateContact = async () => {
    if (!editingContact) return;

    try {
      setUpdateLoading(true);
      const response = await fetch(`/api/v1/contacts/${editingContact.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update contact");
      }

      toast.success("Contact updated successfully");
      setContactDialogOpen(false);
      setEditingContact(null);
      resetContactForm();
      fetchContacts();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update contact"
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  // Delete contact
  const handleDeleteContact = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      setDeleteLoading(id);
      const response = await fetch(`/api/v1/contacts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete contact");

      toast.success("Contact deleted successfully");
      fetchContacts();
    } catch (error) {
      toast.error("Failed to delete contact");
      console.error("Error deleting contact:", error);
    } finally {
      setDeleteLoading("");
    }
  };

  // Create segment
  const handleCreateSegment = async () => {
    try {
      setSegmentCreateLoading(true);
      const response = await fetch("/api/v1/contacts/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(segmentForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create segment");
      }

      toast.success("Segment created successfully");
      setSegmentDialogOpen(false);
      setSegmentForm({ name: "" });
      fetchSegments();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create segment"
      );
    } finally {
      setSegmentCreateLoading(false);
    }
  };

  // Update segment
  const handleUpdateSegment = async () => {
    if (!editingSegment) return;

    try {
      setSegmentUpdateLoading(true);
      const response = await fetch(
        `/api/v1/contacts/segments/${editingSegment.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(segmentForm),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update segment");
      }

      toast.success("Segment updated successfully");
      setSegmentDialogOpen(false);
      setEditingSegment(null);
      setSegmentForm({ name: "" });
      fetchSegments();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update segment"
      );
    } finally {
      setSegmentUpdateLoading(false);
    }
  };

  // Delete segment
  const handleDeleteSegment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this segment?")) return;

    try {
      setSegmentDeleteLoading(id);
      const response = await fetch(`/api/v1/contacts/segments/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete segment");

      toast.success("Segment deleted successfully");
      fetchSegments();
    } catch (error) {
      toast.error("Failed to delete segment");
      console.error("Error deleting segment:", error);
    } finally {
      setSegmentDeleteLoading("");
    }
  };

  // Bulk import
  const handleBulkImport = async () => {
    try {
      setImportLoading(true);
      const lines = importData.trim().split("\n");
      const contacts = lines
        .slice(1)
        .map((line) => {
          const [name, email, phone, status = "active", comment = ""] = line
            .split(",")
            .map((field) => field.trim());
          return { name, email, phone, status, comment };
        })
        .filter((contact) => contact.name && contact.phone);

      const response = await fetch("/api/v1/contacts/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to import contacts");
      }

      const result = await response.json();
      toast.success(
        `Import completed: ${result.results.created} created, ${result.results.skipped} skipped`
      );
      setImportDialogOpen(false);
      setImportData("");
      fetchContacts();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to import contacts"
      );
    } finally {
      setImportLoading(false);
    }
  };

  // Reset forms
  const resetContactForm = () => {
    setContactForm({
      name: "",
      email: "",
      phone: "",
      status: "active",
      comment: "",
      segmentIds: [],
    });
  };

  // Open edit dialog
  const openEditDialog = (contact: Contact) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name,
      email: contact.email || "",
      phone: contact.phone,
      status: contact.status,
      comment: contact.comment || "",
      segmentIds: contact.segments.map((s) => s.id),
    });
    setContactDialogOpen(true);
  };

  // Open edit segment dialog
  const openEditSegmentDialog = (segment: Segment) => {
    setEditingSegment(segment);
    setSegmentForm({ name: segment.name });
    setSegmentDialogOpen(true);
  };

  // Open view dialog
  const openViewDialog = (contact: Contact) => {
    setViewingContact(contact);
    setViewDialogOpen(true);
  };

  // Export contacts
  const handleExport = () => {
    const csvContent = [
      "Name,Email,Phone,Status,Comment,Segments,Created At",
      ...contacts.map((contact) =>
        [
          contact.name,
          contact.email || "",
          contact.phone,
          contact.status,
          contact.comment || "",
          contact.segments.map((s) => s.name).join("; "),
          new Date(contact.createdAt).toLocaleDateString(),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground">
            Manage your WhatsApp contacts and segments
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Contacts</DialogTitle>
                <DialogDescription>
                  Paste CSV data with columns: Name, Email, Phone, Status,
                  Comment
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Name,Email,Phone,Status,Comment&#10;John Doe,john@example.com,+1234567890,active,Test contact"
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  rows={10}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setImportDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleBulkImport} disabled={importLoading}>
                  {importLoading && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Import
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          <Dialog open={segmentDialogOpen} onOpenChange={setSegmentDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Tag className="w-4 h-4 mr-2" />
                Segments
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSegment ? "Edit Segment" : "Create Segment"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="segmentName">Segment Name</Label>
                  <Input
                    id="segmentName"
                    value={segmentForm.name}
                    onChange={(e) => setSegmentForm({ name: e.target.value })}
                    placeholder="Enter segment name"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSegmentDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={
                    editingSegment ? handleUpdateSegment : handleCreateSegment
                  }
                  disabled={segmentCreateLoading || segmentUpdateLoading}
                >
                  {(segmentCreateLoading || segmentUpdateLoading) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingSegment ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingContact ? "Edit Contact" : "Add New Contact"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={contactForm.name}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, name: e.target.value })
                    }
                    placeholder="Enter contact name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, email: e.target.value })
                    }
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={contactForm.phone}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, phone: e.target.value })
                    }
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={contactForm.status}
                    onValueChange={(value) =>
                      setContactForm({ ...contactForm, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="comment">Comment</Label>
                  <Textarea
                    id="comment"
                    value={contactForm.comment}
                    onChange={(e) =>
                      setContactForm({
                        ...contactForm,
                        comment: e.target.value,
                      })
                    }
                    placeholder="Enter comment"
                  />
                </div>
                <div>
                  <Label>Segments</Label>
                  <div className="space-y-2">
                    {segments.map((segment) => (
                      <label
                        key={segment.id}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={contactForm.segmentIds.includes(segment.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setContactForm({
                                ...contactForm,
                                segmentIds: [
                                  ...contactForm.segmentIds,
                                  segment.id,
                                ],
                              });
                            } else {
                              setContactForm({
                                ...contactForm,
                                segmentIds: contactForm.segmentIds.filter(
                                  (id) => id !== segment.id
                                ),
                              });
                            }
                          }}
                        />
                        <span>{segment.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setContactDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={
                    editingContact ? handleUpdateContact : handleCreateContact
                  }
                  disabled={createLoading || updateLoading}
                >
                  {(createLoading || updateLoading) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingContact ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="segment">Segment</Label>
              <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                <SelectTrigger>
                  <SelectValue />
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Segments Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Segments Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {segments.map((segment) => (
              <div
                key={segment.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h3 className="font-medium">{segment.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {segment._count?.contacts || 0} contacts
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditSegmentDialog(segment)}
                    disabled={segmentUpdateLoading}
                  >
                    {segmentUpdateLoading && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSegment(segment.id)}
                    disabled={segmentDeleteLoading === segment.id}
                  >
                    {segmentDeleteLoading === segment.id && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Contacts ({pagination.total})
          </CardTitle>
          <CardDescription>
            Showing {contacts.length} of {pagination.total} contacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Segments</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">
                        {contact.name}
                      </TableCell>
                      <TableCell>{contact.phone}</TableCell>
                      <TableCell>{contact.email || "-"}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(contact.status)}>
                          {contact.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {contact.segments.map((segment) => (
                            <Badge
                              key={segment.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {segment.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(contact.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewDialog(contact)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(contact)}
                            disabled={updateLoading}
                          >
                            {updateLoading && (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteContact(contact.id)}
                            disabled={deleteLoading === contact.id}
                          >
                            {deleteLoading === contact.id && (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination({
                          ...pagination,
                          page: pagination.page - 1,
                        })
                      }
                      disabled={pagination.page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination({
                          ...pagination,
                          page: pagination.page + 1,
                        })
                      }
                      disabled={pagination.page >= pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Contact Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
          </DialogHeader>
          {viewingContact && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Name</Label>
                  <p>{viewingContact.name}</p>
                </div>
                <div>
                  <Label className="font-medium">Phone</Label>
                  <p>{viewingContact.phone}</p>
                </div>
                <div>
                  <Label className="font-medium">Email</Label>
                  <p>{viewingContact.email || "-"}</p>
                </div>
                <div>
                  <Label className="font-medium">Status</Label>
                  <Badge className={getStatusColor(viewingContact.status)}>
                    {viewingContact.status}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <Label className="font-medium">Comment</Label>
                  <p>{viewingContact.comment || "-"}</p>
                </div>
                <div className="col-span-2">
                  <Label className="font-medium">Segments</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {viewingContact.segments.map((segment) => (
                      <Badge key={segment.id} variant="outline">
                        {segment.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="font-medium">Created</Label>
                  <p>{new Date(viewingContact.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="font-medium">Conversations</Label>
                  <p>{viewingContact.conversations.length}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
