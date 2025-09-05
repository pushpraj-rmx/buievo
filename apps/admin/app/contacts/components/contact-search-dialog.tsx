"use client";

import { useState } from "react";
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
}

export function ContactSearchDialog({
  open,
  onOpenChange,
  onSearchResults,
}: ContactSearchDialogProps) {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFields, setSearchFields] = useState<string[]>([
    "name",
    "email",
    "phone",
  ]);
  const [fuzzySearch, setFuzzySearch] = useState(true);
  const [highlightResults, setHighlightResults] = useState(false);
  const [maxResults, setMaxResults] = useState(100);

  const availableFields = [
    { value: "name", label: "Name" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "comment", label: "Comment" },
    { value: "tags", label: "Tags" },
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    try {
      setLoading(true);

      const response = await contactApi.searchContacts({
        q: searchQuery.trim(),
        limit: maxResults,
      });

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

  const handleFieldToggle = (field: string) => {
    setSearchFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleSelectAllFields = () => {
    setSearchFields(availableFields.map((f) => f.value));
  };

  const handleDeselectAllFields = () => {
    setSearchFields([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Contact Search
          </DialogTitle>
          <DialogDescription>
            Search contacts using advanced filters and options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Query */}
          <div className="space-y-2">
            <Label htmlFor="search-query">Search Query</Label>
            <Input
              id="search-query"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter search terms..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  handleSearch();
                }
              }}
            />
          </div>

          {/* Search Fields */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Search Fields</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllFields}
                >
                  All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAllFields}
                >
                  None
                </Button>
              </div>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
              {availableFields.map((field) => (
                <div key={field.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`field-${field.value}`}
                    checked={searchFields.includes(field.value)}
                    onCheckedChange={() => handleFieldToggle(field.value)}
                  />
                  <Label htmlFor={`field-${field.value}`} className="text-sm">
                    {field.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Search Options */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-medium">Search Options</h4>

            {/* Fuzzy Search */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fuzzy-search"
                checked={fuzzySearch}
                onCheckedChange={(checked) => setFuzzySearch(checked === true)}
              />
              <Label htmlFor="fuzzy-search" className="text-sm">
                Enable fuzzy search (finds similar matches)
              </Label>
            </div>

            {/* Highlight Results */}
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

            {/* Max Results */}
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
            disabled={
              loading || !searchQuery.trim() || searchFields.length === 0
            }
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Search
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
