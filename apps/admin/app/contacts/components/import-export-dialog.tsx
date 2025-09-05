"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Upload, Download } from "lucide-react";
import {
  contactApi,
  type DuplicateInfoType,
  type ContactType,
  type SegmentType,
} from "@/lib/contact-api";
import { DuplicateResolutionDialog } from "./duplicate-resolution-dialog";

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "import" | "export";
  onSuccess: () => void;
}

export function ImportExportDialog({
  open,
  onOpenChange,
  mode,
  onSuccess,
}: ImportExportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [importData, setImportData] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateInfoType[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [segments, setSegments] = useState<SegmentType[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [defaultStatus, setDefaultStatus] = useState<
    "active" | "inactive" | "pending"
  >("active");
  const [updateExisting, setUpdateExisting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>("all");
  const [exportSegment, setExportSegment] = useState<string>("all");

  // Fetch segments when dialog opens
  useEffect(() => {
    if (open) {
      fetchSegments();
    }
  }, [open]);

  const fetchSegments = async () => {
    try {
      const response = await contactApi.getSegments();
      setSegments(response.data);
    } catch (error) {
      console.error("Failed to fetch segments:", error);
    }
  };

  const handleImport = async () => {
    if (!importData.trim() && !selectedFile) {
      toast.error("Please provide data to import");
      return;
    }

    try {
      setLoading(true);

      let contacts: Array<{
        name: string;
        email?: string;
        phone: string;
        status?: "active" | "inactive" | "pending";
        comment?: string;
      }> = [];

      if (selectedFile) {
        // Parse CSV file
        const text = await selectedFile.text();
        contacts = parseCSVData(text);
      } else {
        // Parse text input
        contacts = parseCSVData(importData);
      }

      if (contacts.length === 0) {
        toast.error("No valid contacts found in the data");
        return;
      }

      // Apply default status to contacts that don't have one
      contacts = contacts.map((contact) => ({
        ...contact,
        status: contact.status || defaultStatus,
      }));

      const result = await contactApi.bulkImportContacts({
        contacts,
        segmentIds: selectedSegments,
      });

      if (result.data.duplicates.length > 0) {
        setDuplicates(result.data.duplicates);
        setShowDuplicateDialog(true);
        toast.warning(
          `${result.data.imported.length} contacts imported, ${result.data.duplicates.length} duplicates found. Please resolve duplicates.`
        );
      } else {
        toast.success(
          `${result.data.imported.length} contacts imported successfully`
        );
        onOpenChange(false);
        setImportData("");
        setSelectedFile(null);
        onSuccess();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to import contacts"
      );
    } finally {
      setLoading(false);
    }
  };

  const parseCSVData = (
    csvText: string
  ): Array<{
    name: string;
    email?: string;
    phone: string;
    status?: "active" | "inactive" | "pending";
    comments?: string;
  }> => {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) return [];

    const contacts: Array<{
      name: string;
      email?: string;
      phone: string;
      status?: "active" | "inactive" | "pending";
      comments?: string;
    }> = [];
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      if (values.length < 3) continue; // Skip invalid lines

      const contact: {
        name: string;
        email?: string;
        phone: string;
        status?: "active" | "inactive" | "pending";
        comments?: string;
      } = {
        name: "",
        phone: "",
      };

      headers.forEach((header, index) => {
        const value = values[index];
        switch (header) {
          case "name":
            contact.name = value;
            break;
          case "email":
            contact.email = value || undefined;
            break;
          case "phone":
            contact.phone = value;
            break;
          case "status":
            contact.status =
              (value as "active" | "inactive" | "pending") || "active";
            break;
          case "comments":
          case "comment":
            contact.comments = value || undefined;
            break;
        }
      });

      if (contact.name && contact.phone) {
        contacts.push(contact);
      }
    }

    return contacts;
  };

  const handleExport = async () => {
    try {
      setLoading(true);

      const csvData = await contactApi.exportContacts({
        format: "csv",
        status: exportStatus !== "all" ? exportStatus : undefined,
        segmentId: exportSegment !== "all" ? exportSegment : undefined,
      });

      const blob = new Blob([csvData], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contacts-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Contacts exported successfully");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error("Failed to export contacts");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportData(""); // Clear text input when file is selected
    }
  };

  const handleDuplicatesResolved = (resolved: ContactType[]) => {
    setShowDuplicateDialog(false);
    setDuplicates([]);
    onOpenChange(false);
    setImportData("");
    setSelectedFile(null);
    onSuccess();
    toast.success(
      `Successfully resolved ${resolved.length} duplicate contacts`
    );
  };

  const isImport = mode === "import";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isImport ? (
              <>
                <Upload className="h-5 w-5" />
                Import Contacts
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Export Contacts
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isImport
              ? "Import contacts from a file or paste CSV data below."
              : "Export all contacts to a CSV file."}
          </DialogDescription>
        </DialogHeader>

        {isImport && (
          <div className="space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">Upload File (CSV)</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500">
                Supported formats: CSV, TXT. Max size: 5MB
              </p>
            </div>

            {/* OR Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-gray-500">Or</span>
              </div>
            </div>

            {/* Text Input */}
            <div className="space-y-2">
              <Label htmlFor="import-data">Paste CSV Data</Label>
              <Textarea
                id="import-data"
                value={importData}
                onChange={(e) => {
                  setImportData(e.target.value);
                  setSelectedFile(null); // Clear file when text is entered
                }}
                placeholder="Name,Phone,Email,Status,Comment&#10;John Doe,+1234567890,john@example.com,active,Test contact&#10;Jane Smith,+0987654321,jane@example.com,active,Another contact"
                rows={6}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500">
                Format: Name,Phone,Email,Status,Comment (one contact per line)
              </p>
            </div>

            {/* Import Options */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium">Import Options</h4>

              {/* Default Status */}
              <div className="space-y-2">
                <Label htmlFor="default-status">Default Status</Label>
                <Select
                  value={defaultStatus}
                  onValueChange={(value: "active" | "inactive" | "pending") =>
                    setDefaultStatus(value)
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
                <p className="text-xs text-gray-500">
                  Status to assign to contacts that don&apos;t have one
                  specified
                </p>
              </div>

              {/* Segment Assignment */}
              {segments.length > 0 && (
                <div className="space-y-2">
                  <Label>Assign to Segments</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                    {segments.map((segment) => (
                      <div
                        key={segment.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`segment-${segment.id}`}
                          checked={selectedSegments.includes(segment.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSegments([
                                ...selectedSegments,
                                segment.id,
                              ]);
                            } else {
                              setSelectedSegments(
                                selectedSegments.filter(
                                  (id) => id !== segment.id
                                )
                              );
                            }
                          }}
                        />
                        <Label
                          htmlFor={`segment-${segment.id}`}
                          className="text-sm flex-1"
                        >
                          {segment.name}
                        </Label>
                        <span className="text-xs text-gray-500">
                          ({segment._count?.contacts || 0})
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    All imported contacts will be added to selected segments
                  </p>
                </div>
              )}

              {/* Update Existing */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="update-existing"
                  checked={updateExisting}
                  onCheckedChange={(checked) =>
                    setUpdateExisting(checked === true)
                  }
                />
                <Label htmlFor="update-existing" className="text-sm">
                  Update existing contacts if duplicates found
                </Label>
              </div>
            </div>
          </div>
        )}

        {!isImport && (
          <div className="space-y-4">
            {/* Export Options */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Export Options</h4>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="export-status">Filter by Status</Label>
                <Select value={exportStatus} onValueChange={setExportStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Segment Filter */}
              {segments.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="export-segment">Filter by Segment</Label>
                  <Select
                    value={exportSegment}
                    onValueChange={setExportSegment}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Segments</SelectItem>
                      {segments.map((segment) => (
                        <SelectItem key={segment.id} value={segment.id}>
                          {segment.name} ({segment._count?.contacts || 0})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={isImport ? handleImport : handleExport}
            disabled={
              loading || (isImport && !importData.trim() && !selectedFile)
            }
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isImport ? "Import" : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Duplicate Resolution Dialog */}
      <DuplicateResolutionDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        duplicates={duplicates}
        onResolved={handleDuplicatesResolved}
      />
    </Dialog>
  );
}
