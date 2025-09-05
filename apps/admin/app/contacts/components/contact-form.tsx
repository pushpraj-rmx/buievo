"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  contactApi,
  type ContactType,
  type SegmentType,
} from "@/lib/contact-api";

interface ContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingContact: ContactType | null;
  segments: SegmentType[];
  onSuccess: () => void;
}

export function ContactForm({
  open,
  onOpenChange,
  editingContact,
  segments,
  onSuccess,
}: ContactFormProps) {
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [phoneValid, setPhoneValid] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "active" as "active" | "inactive" | "pending",
    comment: "",
    segmentIds: [] as string[],
  });

  useEffect(() => {
    if (editingContact) {
      setFormData({
        name: editingContact.name,
        email: editingContact.email || "",
        phone: editingContact.phone,
        status: editingContact.status,
        comment: editingContact.comment || "",
        segmentIds: editingContact.segments.map((s) => s.id),
      });
    } else {
      resetForm();
    }
  }, [editingContact]);

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      status: "active",
      comment: "",
      segmentIds: [],
    });
    setPhoneError("");
    setPhoneValid(false);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, "");

    // Standard phone number should be exactly 10 digits
    return cleanPhone.length === 10;
  };

  const handlePhoneChange = (value: string) => {
    setFormData((prev) => ({ ...prev, phone: value }));

    // Real-time validation
    if (value.trim() === "") {
      setPhoneError("");
      setPhoneValid(false);
    } else {
      const cleanPhone = value.replace(/\D/g, "");
      const digitCount = cleanPhone.length;

      if (digitCount < 10) {
        setPhoneError(
          `Phone number must be exactly 10 digits (currently ${digitCount})`
        );
        setPhoneValid(false);
      } else if (digitCount > 10) {
        setPhoneError(
          `Phone number should be exactly 10 digits (currently ${digitCount})`
        );
        setPhoneValid(false);
      } else {
        setPhoneError("");
        setPhoneValid(true);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }

    if (!validatePhoneNumber(formData.phone)) {
      toast.error("Phone number must be at least 10 digits long");
      return;
    }

    try {
      setLoading(true);

      const contactData = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim(),
        status: formData.status,
        comment: formData.comment.trim() || undefined,
        segmentIds: formData.segmentIds,
      };

      if (editingContact) {
        await contactApi.updateContact(editingContact.id, contactData);
        toast.success("Contact updated successfully");
      } else {
        await contactApi.createContact(contactData);
        toast.success("Contact created successfully");
      }

      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save contact"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSegmentToggle = (segmentId: string) => {
    setFormData((prev) => ({
      ...prev,
      segmentIds: prev.segmentIds.includes(segmentId)
        ? prev.segmentIds.filter((id) => id !== segmentId)
        : [...prev.segmentIds, segmentId],
    }));
  };

  const handleSelectAllSegments = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      segmentIds: checked ? segments.map((s) => s.id) : [],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingContact ? "Edit Contact" : "Create New Contact"}
          </DialogTitle>
          <DialogDescription>
            {editingContact
              ? "Update the contact information below."
              : "Add a new contact to your database."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter contact name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="Enter email address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="Enter phone number (e.g., +1234567890)"
              required
              className={
                phoneError
                  ? "border-red-500"
                  : phoneValid
                    ? "border-green-500"
                    : ""
              }
            />
            {phoneError && <p className="text-sm text-red-500">{phoneError}</p>}
            {phoneValid && (
              <p className="text-sm text-green-500">✓ Valid phone number</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "active" | "inactive" | "pending") =>
                setFormData((prev) => ({ ...prev, status: value }))
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

          <div className="space-y-2">
            <Label htmlFor="comment">Comments</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, comment: e.target.value }))
              }
              placeholder="Add a comment or note"
              rows={3}
            />
          </div>

          {segments.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Segments</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    handleSelectAllSegments(
                      formData.segmentIds.length !== segments.length
                    )
                  }
                >
                  {formData.segmentIds.length === segments.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                {segments.map((segment) => (
                  <div key={segment.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={segment.id}
                      checked={formData.segmentIds.includes(segment.id)}
                      onCheckedChange={() => handleSegmentToggle(segment.id)}
                    />
                    <Label htmlFor={segment.id} className="text-sm flex-1">
                      {segment.name}
                    </Label>
                    <span className="text-xs text-gray-500">
                      ({segment._count?.contacts || 0})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingContact ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
