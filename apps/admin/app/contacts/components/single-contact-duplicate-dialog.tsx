"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { contactApi, type ContactType } from "@/lib/contact-api";

interface SingleContactDuplicateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactData: {
    name: string;
    email?: string;
    phone: string;
    status?: "active" | "inactive" | "pending";
    comment?: string;
    segmentIds?: string[];
  };
  duplicateInfo: {
    hasDuplicates: boolean;
    duplicates: Array<{
      existingContact: ContactType;
      duplicateType: "email" | "phone" | "both";
      conflictFields: string[];
    }>;
    suggestedActions: Array<"update" | "skip" | "force-create">;
  };
  onResolved: (result: { success: boolean; contact?: ContactType; action: string; message: string }) => void;
}

export function SingleContactDuplicateDialog({
  open,
  onOpenChange,
  contactData,
  duplicateInfo,
  onResolved,
}: SingleContactDuplicateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<"update" | "skip" | "force-create">(
    duplicateInfo.suggestedActions[0] || "skip"
  );
  const [selectedContactId, setSelectedContactId] = useState<string>(
    duplicateInfo.duplicates[0]?.existingContact.id || ""
  );

  const handleResolve = async () => {
    try {
      setLoading(true);

      const resolution = {
        action: selectedAction,
        targetContactId: selectedAction === "update" ? selectedContactId : undefined,
      };

      const result = await contactApi.createWithResolution(contactData, resolution);
      
      toast.success(result.data.message);
      onResolved(result.data);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to resolve duplicate"
      );
    } finally {
      setLoading(false);
    }
  };

  const getDuplicateTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "phone":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "both":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDuplicateTypeColor = (type: string) => {
    switch (type) {
      case "email":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "phone":
        return "bg-green-100 text-green-800 border-green-200";
      case "both":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getActionDescription = (action: string) => {
    switch (action) {
      case "update":
        return "Update the existing contact with new information";
      case "skip":
        return "Skip creating this contact and keep the existing one";
      case "force-create":
        return "Create a new contact with modified identifiers";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Duplicate Contact Found
          </DialogTitle>
          <DialogDescription>
            A contact with similar information already exists. Choose how to handle this duplicate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* New Contact Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">New Contact</h4>
            <div className="space-y-1 text-sm">
              <div><strong>Name:</strong> {contactData.name}</div>
              {contactData.email && <div><strong>Email:</strong> {contactData.email}</div>}
              <div><strong>Phone:</strong> {contactData.phone}</div>
              {contactData.comment && <div><strong>Comment:</strong> {contactData.comment}</div>}
            </div>
          </div>

          {/* Existing Contacts */}
          <div className="space-y-3">
            <h4 className="font-medium">Existing Contacts</h4>
            {duplicateInfo.duplicates.map((duplicate, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-start justify-between mb-2">
                  <div className="space-y-1">
                    <div className="font-medium">{duplicate.existingContact.name}</div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {duplicate.existingContact.email && (
                        <div>📧 {duplicate.existingContact.email}</div>
                      )}
                      <div>📱 {duplicate.existingContact.phone}</div>
                      {duplicate.existingContact.comment && (
                        <div>💬 {duplicate.existingContact.comment}</div>
                      )}
                    </div>
                  </div>
                  <Badge className={getDuplicateTypeColor(duplicate.duplicateType)}>
                    {getDuplicateTypeIcon(duplicate.duplicateType)}
                    <span className="ml-1 capitalize">{duplicate.duplicateType}</span>
                  </Badge>
                </div>
                <div className="text-xs text-gray-500">
                  Created: {new Date(duplicate.existingContact.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          {/* Resolution Options */}
          <div className="space-y-4">
            <h4 className="font-medium">Resolution Options</h4>
            <RadioGroup
              value={selectedAction}
              onValueChange={(value) => setSelectedAction(value as "update" | "skip" | "force-create")}
            >
              {duplicateInfo.suggestedActions.map((action) => (
                <div key={action} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <RadioGroupItem value={action} id={action} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={action} className="font-medium cursor-pointer">
                      {action === "update" && "Update Existing Contact"}
                      {action === "skip" && "Skip This Contact"}
                      {action === "force-create" && "Force Create New Contact"}
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {getActionDescription(action)}
                    </p>
                    {action === "update" && duplicateInfo.duplicates.length > 1 && (
                      <div className="mt-2">
                        <Label className="text-sm font-medium">Select contact to update:</Label>
                        <select
                          value={selectedContactId}
                          onChange={(e) => setSelectedContactId(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                          {duplicateInfo.duplicates.map((duplicate, index) => (
                            <option key={index} value={duplicate.existingContact.id}>
                              {duplicate.existingContact.name} ({duplicate.duplicateType})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </RadioGroup>
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
          <Button onClick={handleResolve} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Resolve Duplicate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
