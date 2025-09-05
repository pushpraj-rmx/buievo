"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { contactApi, type SegmentType } from "@/lib/contact-api";

interface SegmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSegment: SegmentType | null;
  onSuccess: () => void;
}

export function SegmentForm({
  open,
  onOpenChange,
  editingSegment,
  onSuccess,
}: SegmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (editingSegment) {
      setFormData({
        name: editingSegment.name,
        description: editingSegment.description || "",
      });
    } else {
      setFormData({ name: "", description: "" });
    }
  }, [editingSegment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Segment name is required");
      return;
    }

    try {
      setLoading(true);
      
      const segmentData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      };

      if (editingSegment) {
        await contactApi.updateSegment(editingSegment.id, segmentData);
        toast.success("Segment updated successfully");
      } else {
        await contactApi.createSegment(segmentData);
        toast.success("Segment created successfully");
      }

      onOpenChange(false);
      setFormData({ name: "", description: "" });
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save segment"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingSegment ? "Edit Segment" : "Create New Segment"}
          </DialogTitle>
          <DialogDescription>
            {editingSegment
              ? "Update the segment name below."
              : "Create a new segment to organize your contacts."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="segmentName">Segment Name *</Label>
            <Input
              id="segmentName"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter segment name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="segmentDescription">Description</Label>
            <Input
              id="segmentDescription"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Enter segment description (optional)"
            />
          </div>

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
              {editingSegment ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

