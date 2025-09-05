"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Phone, Mail, MessageSquare, Tag } from "lucide-react";
import { type ContactType } from "@/lib/contact-api";

interface ContactViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: ContactType | null;
}

export function ContactView({ open, onOpenChange, contact }: ContactViewProps) {
  if (!contact) return null;

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Note: Contact Service doesn't include conversations in the contact model
  // This would need to be fetched separately or added to the contact model

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contact Details</DialogTitle>
          <DialogDescription>
            Detailed information about {contact.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="font-medium">Name:</span>
                  <span>{contact.name}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{contact.phone}</span>
                </div>
                {contact.email && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{contact.email}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Created: {formatDate(contact.createdAt)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">
                    Status:
                  </span>
                  <Badge className={getStatusColor(contact.status)}>
                    {contact.status}
                  </Badge>
                </div>
                {contact.comment && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-gray-600">
                      Comments:
                    </span>
                    <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                      {contact.comment}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Segments */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Tag className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Segments</h3>
            </div>
            {contact.segments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {contact.segments.map((segment) => (
                  <Badge key={segment.id} variant="outline">
                    {segment.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No segments assigned</p>
            )}
          </div>

          <Separator />

          {/* Contact Statistics */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Contact Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {contact.segments.length}
                </div>
                <div className="text-sm text-blue-600">Segments</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatDate(contact.createdAt)}
                </div>
                <div className="text-sm text-green-600">Created</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
