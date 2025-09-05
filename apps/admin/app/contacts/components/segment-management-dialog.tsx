"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Loader2, Users, Plus, Minus } from "lucide-react";
import {
  contactApi,
  type ContactType,
  type SegmentType,
} from "@/lib/contact-api";

interface SegmentManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segment: SegmentType | null;
  onSuccess: () => void;
}

export function SegmentManagementDialog({
  open,
  onOpenChange,
  segment,
  onSuccess,
}: SegmentManagementDialogProps) {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<ContactType[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [action, setAction] = useState<"add" | "remove">("add");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (open && segment) {
      fetchContacts();
    }
  }, [open, segment]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await contactApi.getContacts({ limit: 1000 });
      setContacts(response.data);
    } catch (error) {
      toast.error("Failed to fetch contacts");
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!segment || selectedContacts.length === 0) {
      toast.error("Please select contacts to perform the action");
      return;
    }

    try {
      setLoading(true);

      if (action === "add") {
        await contactApi.addContactsToSegment(segment.id, selectedContacts);
        toast.success(
          `Added ${selectedContacts.length} contacts to ${segment.name}`
        );
      } else {
        await contactApi.removeContactsFromSegment(
          segment.id,
          selectedContacts
        );
        toast.success(
          `Removed ${selectedContacts.length} contacts from ${segment.name}`
        );
      }

      onSuccess();
      onOpenChange(false);
      setSelectedContacts([]);
    } catch (error) {
      toast.error(`Failed to ${action} contacts`);
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    const filteredContacts = getFilteredContacts();
    setSelectedContacts(filteredContacts.map((c) => c.id));
  };

  const handleDeselectAll = () => {
    setSelectedContacts([]);
  };

  const getFilteredContacts = () => {
    if (!searchQuery.trim()) return contacts;

    const query = searchQuery.toLowerCase();
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.phone.includes(query)
    );
  };

  const filteredContacts = getFilteredContacts();

  if (!segment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action === "add" ? (
              <>
                <Plus className="h-5 w-5" />
                Add Contacts to {segment.name}
              </>
            ) : (
              <>
                <Minus className="h-5 w-5" />
                Remove Contacts from {segment.name}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {action === "add"
              ? `Add contacts to the "${segment.name}" segment`
              : `Remove contacts from the "${segment.name}" segment`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Action Selection */}
          <div className="space-y-2">
            <Label>Action</Label>
            <Select
              value={action}
              onValueChange={(value: "add" | "remove") => setAction(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Add Contacts to Segment</SelectItem>
                <SelectItem value="remove">
                  Remove Contacts from Segment
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Contacts</Label>
            <Input
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or phone..."
            />
          </div>

          {/* Selection Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={filteredContacts.length === 0}
              >
                Select All ({filteredContacts.length})
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
                disabled={selectedContacts.length === 0}
              >
                Deselect All
              </Button>
            </div>
            <div className="text-sm text-gray-500">
              {selectedContacts.length} selected
            </div>
          </div>

          {/* Contacts List */}
          <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading contacts...</span>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery
                  ? "No contacts found matching your search"
                  : "No contacts available"}
              </div>
            ) : (
              filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                >
                  <Checkbox
                    id={`contact-${contact.id}`}
                    checked={selectedContacts.includes(contact.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedContacts([...selectedContacts, contact.id]);
                      } else {
                        setSelectedContacts(
                          selectedContacts.filter((id) => id !== contact.id)
                        );
                      }
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{contact.name}</div>
                    <div className="text-sm text-gray-500 truncate">
                      {contact.email && `${contact.email} • `}
                      {contact.phone}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">{contact.status}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            disabled={loading || selectedContacts.length === 0}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {action === "add" ? "Add to Segment" : "Remove from Segment"}
            {selectedContacts.length > 0 && ` (${selectedContacts.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
