"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Upload,
  Download,
  Filter,
  X,
} from "lucide-react";
import { type SegmentType } from "@/lib/contact-api";
import { EnhancedSearchInput } from "./enhanced-search-input";

interface ContactsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  segmentFilter: string;
  onSegmentFilterChange: (value: string) => void;
  segments: SegmentType[];
  onCreateContact: () => void;
  onCreateSegment: () => void;
  onImport: () => void;
  onExport: () => void;
  onAdvancedSearch: () => void;
  selectedContacts: string[];
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

export function ContactsToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  segmentFilter,
  onSegmentFilterChange,
  segments,
  onCreateContact,
  onCreateSegment,
  onImport,
  onExport,
  onAdvancedSearch,
  selectedContacts,
  onBulkDelete,
  onClearSelection,
}: ContactsToolbarProps) {
  const hasActiveFilters =
    statusFilter !== "all" || segmentFilter !== "all" || search;

  const clearFilters = () => {
    onSearchChange("");
    onStatusFilterChange("all");
    onSegmentFilterChange("all");
  };

  return (
    <div className="space-y-4">
      {/* Main Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={onCreateContact} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Contact
          </Button>
          <Button
            variant="outline"
            onClick={onCreateSegment}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Create Segment
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onImport}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button
            variant="outline"
            onClick={onExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <EnhancedSearchInput
            value={search}
            onChange={onSearchChange}
            onAdvancedSearch={onAdvancedSearch}
            placeholder="Search contacts by name, phone, or email..."
          />
        </div>

        <div className="flex gap-3">
          <div className="space-y-2">
            <Label htmlFor="status-filter" className="text-xs text-gray-600">
              Status
            </Label>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger id="status-filter" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="segment-filter" className="text-xs text-gray-600">
              Segment
            </Label>
            <Select value={segmentFilter} onValueChange={onSegmentFilterChange}>
              <SelectTrigger id="segment-filter" className="w-40">
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
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Active filters:</span>
          {search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: &quot;{search}&quot;
              <button
                onClick={() => onSearchChange("")}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Status: {statusFilter}
              <button
                onClick={() => onStatusFilterChange("all")}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {segmentFilter !== "all" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Segment: {segments.find((s) => s.id === segmentFilter)?.name}
              <button
                onClick={() => onSegmentFilterChange("all")}
                className="ml-1 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-600 hover:text-gray-800"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedContacts.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {selectedContacts.length} selected
            </Badge>
            <span className="text-sm text-gray-600">
              Select actions to perform on these contacts
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClearSelection}>
              Clear Selection
            </Button>
            <Button variant="destructive" size="sm" onClick={onBulkDelete}>
              Delete Selected
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
