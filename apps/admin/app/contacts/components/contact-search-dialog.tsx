"use client";

import { useState, memo } from "react";
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
import { Loader2, Search } from "lucide-react";
import { contactApi, type ContactType } from "@/lib/contact-api";

interface ContactSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSearchResults: (contacts: ContactType[]) => void;
  segments?: Array<{ id: string; name: string }>;
}

export const ContactSearchDialog = memo(function ContactSearchDialog({
  open,
  onOpenChange,
  onSearchResults,
  segments = [],
}: ContactSearchDialogProps) {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fuzzySearch, setFuzzySearch] = useState(true);
  const [highlightResults, setHighlightResults] = useState(false);
  const [maxResults, setMaxResults] = useState(100);

  // Advanced search fields
  const [nameSearch, setNameSearch] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [commentSearch, setCommentSearch] = useState("");
  const [segmentNameSearch, setSegmentNameSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [createdAfter, setCreatedAfter] = useState("");
  const [createdBefore, setCreatedBefore] = useState("");


  const handleSearch = async () => {
    // Check if we have any search criteria
    const hasSearchCriteria =
      searchQuery.trim() ||
      nameSearch.trim() ||
      emailSearch.trim() ||
      phoneSearch.trim() ||
      commentSearch.trim() ||
      segmentNameSearch.trim() ||
      statusFilter !== "all" ||
      segmentFilter !== "all";

    if (!hasSearchCriteria) {
      toast.error("Please enter at least one search criteria");
      return;
    }

    try {
      setLoading(true);

      // Build search parameters
      const searchParams: Record<string, string | number | boolean> = {
        limit: maxResults,
      };

      // Add search parameters if they have values
      if (searchQuery.trim()) searchParams.search = searchQuery.trim();
      if (nameSearch.trim()) searchParams.name = nameSearch.trim();
      if (emailSearch.trim()) searchParams.email = emailSearch.trim();
      if (phoneSearch.trim()) searchParams.phone = phoneSearch.trim();
      if (commentSearch.trim()) searchParams.comment = commentSearch.trim();
      if (segmentNameSearch.trim()) searchParams.segmentName = segmentNameSearch.trim();
      if (statusFilter !== "all") searchParams.status = statusFilter;
      if (segmentFilter !== "all") searchParams.segmentId = segmentFilter;
      if (includeInactive) searchParams.includeInactive = true;
      if (fuzzySearch) searchParams.fuzzySearch = true;
      if (createdAfter) searchParams.createdAfter = createdAfter;
      if (createdBefore) searchParams.createdBefore = createdBefore;

      const response = await contactApi.getContacts(searchParams);

      // Ensure we have valid data
      const searchResults = response.data || [];
      onSearchResults(searchResults);
      onOpenChange(false);

      toast.success(`Found ${searchResults.length} contacts`);
    } catch (error) {
      console.error("Search error:", error);
      toast.error(
        error instanceof Error
          ? `Search failed: ${error.message}`
          : "Failed to search contacts"
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Contact Search
          </DialogTitle>
          <DialogDescription>
            Search contacts using advanced filters including comments and segments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* General Search */}
          <div className="space-y-2">
            <Label htmlFor="search-query">General Search</Label>
            <Input
              id="search-query"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across all fields..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  handleSearch();
                }
              }}
            />
            <p className="text-xs text-gray-500">
              Searches across name, email, phone, and comments
            </p>
          </div>

          {/* Field-Specific Searches */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium">Field-Specific Searches</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name-search">Name</Label>
                <Input
                  id="name-search"
                  value={nameSearch}
                  onChange={(e) => setNameSearch(e.target.value)}
                  placeholder="Search by name..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-search">Email</Label>
                <Input
                  id="email-search"
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                  placeholder="Search by email..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone-search">Phone</Label>
                <Input
                  id="phone-search"
                  value={phoneSearch}
                  onChange={(e) => setPhoneSearch(e.target.value)}
                  placeholder="Search by phone..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment-search">Comments</Label>
                <Input
                  id="comment-search"
                  value={commentSearch}
                  onChange={(e) => setCommentSearch(e.target.value)}
                  placeholder="Search in comments..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="segment-name-search">Segment Name</Label>
                <Input
                  id="segment-name-search"
                  value={segmentNameSearch}
                  onChange={(e) => setSegmentNameSearch(e.target.value)}
                  placeholder="Search by segment name..."
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium">Filters</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
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

              <div className="space-y-2">
                <Label htmlFor="segment-filter">Segment</Label>
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

            {/* Date Range Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="created-after">Created After</Label>
                <Input
                  id="created-after"
                  type="date"
                  value={createdAfter}
                  onChange={(e) => setCreatedAfter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="created-before">Created Before</Label>
                <Input
                  id="created-before"
                  type="date"
                  value={createdBefore}
                  onChange={(e) => setCreatedBefore(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Search Options */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium">Search Options</h4>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fuzzy-search"
                  checked={fuzzySearch}
                  onCheckedChange={(checked) => setFuzzySearch(checked === true)}
                />
                <Label htmlFor="fuzzy-search" className="text-sm">
                  Enable fuzzy search (includes segment name matching)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-inactive"
                  checked={includeInactive}
                  onCheckedChange={(checked) => setIncludeInactive(checked === true)}
                />
                <Label htmlFor="include-inactive" className="text-sm">
                  Include inactive contacts
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="highlight-results"
                  checked={highlightResults}
                  onCheckedChange={(checked) =>
                    setHighlightResults(checked === true)
                  }
                />
                <Label htmlFor="highlight-results" className="text-sm">
                  Highlight matching terms in results
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-results">Maximum Results</Label>
              <Select
                value={maxResults.toString()}
                onValueChange={(value) => setMaxResults(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="250">250</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            onClick={handleSearch}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Search
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
