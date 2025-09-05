"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import {
  contactApi,
  type DuplicateInfoType,
  type ContactType,
} from "@/lib/contact-api";

interface DuplicateResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicates: DuplicateInfoType[];
  onResolved: (resolved: ContactType[]) => void;
}

export function DuplicateResolutionDialog({
  open,
  onOpenChange,
  duplicates,
  onResolved,
}: DuplicateResolutionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [resolutions, setResolutions] = useState<
    Record<string, "update" | "skip" | "force-create">
  >({});

  const handleResolutionChange = (
    duplicateIndex: number,
    action: "update" | "skip" | "force-create"
  ) => {
    setResolutions((prev) => ({
      ...prev,
      [duplicateIndex]: action,
    }));
  };

  const handleResolve = async () => {
    const unresolvedDuplicates = duplicates.filter(
      (_, index) => !resolutions[index]
    );
    if (unresolvedDuplicates.length > 0) {
      toast.error("Please resolve all duplicates before proceeding");
      return;
    }

    try {
      setLoading(true);

      const resolutionData = {
        duplicates: duplicates.map((duplicate, index) => ({
          ...duplicate,
          action: resolutions[index] || "skip",
        })),
        action: "update" as const, // This will be overridden by individual actions
      };

      const result = await contactApi.resolveDuplicates(resolutionData);
      toast.success(
        `Resolved ${result.data.resolved.length} duplicates successfully`
      );
      onResolved(result.data.resolved);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to resolve duplicates"
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
        return "bg-blue-100 text-blue-800";
      case "phone":
        return "bg-green-100 text-green-800";
      case "both":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Resolve Duplicate Contacts
          </DialogTitle>
          <DialogDescription>
            {duplicates.length} duplicate contacts were found during import.
            Choose how to handle each duplicate below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <strong>Resolution Options:</strong>
            <ul className="mt-2 space-y-1">
              <li>
                • <strong>Update:</strong> Update the existing contact with new
                data
              </li>
              <li>
                • <strong>Skip:</strong> Skip this contact and keep the existing
                one
              </li>
              <li>
                • <strong>Force Create:</strong> Create a new contact despite
                the duplicate
              </li>
            </ul>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>New Contact</TableHead>
                  <TableHead>Existing Contact</TableHead>
                  <TableHead>Conflict Type</TableHead>
                  <TableHead>Resolution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {duplicates.map((duplicate, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {duplicate.contact.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {duplicate.contact.email && (
                            <div>📧 {duplicate.contact.email}</div>
                          )}
                          <div>📱 {duplicate.contact.phone}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {duplicate.existingContact.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {duplicate.existingContact.email && (
                            <div>📧 {duplicate.existingContact.email}</div>
                          )}
                          <div>📱 {duplicate.existingContact.phone}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getDuplicateTypeColor(
                          duplicate.duplicateType
                        )}
                      >
                        {getDuplicateTypeIcon(duplicate.duplicateType)}
                        <span className="ml-1 capitalize">
                          {duplicate.duplicateType}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <RadioGroup
                        value={resolutions[index] || ""}
                        onValueChange={(value) =>
                          handleResolutionChange(
                            index,
                            value as "update" | "skip" | "force-create"
                          )
                        }
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="update"
                            id={`update-${index}`}
                          />
                          <Label
                            htmlFor={`update-${index}`}
                            className="text-sm"
                          >
                            Update
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="skip" id={`skip-${index}`} />
                          <Label htmlFor={`skip-${index}`} className="text-sm">
                            Skip
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="force-create"
                            id={`force-${index}`}
                          />
                          <Label htmlFor={`force-${index}`} className="text-sm">
                            Force Create
                          </Label>
                        </div>
                      </RadioGroup>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
            Resolve Duplicates
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
