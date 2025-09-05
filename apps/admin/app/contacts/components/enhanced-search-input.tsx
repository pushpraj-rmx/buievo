"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Search, X, SearchCheck, Clock } from "lucide-react";
import { contactApi } from "@/lib/contact-api";
import { cn } from "@/lib/utils";

interface EnhancedSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onAdvancedSearch: () => void;
  placeholder?: string;
  className?: string;
}

interface SearchSuggestion {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'name' | 'email' | 'phone';
}

export function EnhancedSearchInput({
  value,
  onChange,
  onAdvancedSearch,
  placeholder = "Search contacts by name, phone, or email...",
  className,
}: EnhancedSearchInputProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('contact-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse recent searches:', error);
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('contact-recent-searches', JSON.stringify(updated));
  }, [recentSearches]);

  // Debounced search suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      setIsLoading(true);
      const contacts = await contactApi.getSearchSuggestions({
        q: query,
        limit: 8,
      });

      const formattedSuggestions: SearchSuggestion[] = contacts.flatMap(contact => {
        const contactSuggestions: SearchSuggestion[] = [];
        
        if (contact.name?.toLowerCase().includes(query.toLowerCase())) {
          contactSuggestions.push({
            id: `${contact.id}-name`,
            name: contact.name,
            email: contact.email || '',
            phone: contact.phone || '',
            type: 'name'
          });
        }
        
        if (contact.email?.toLowerCase().includes(query.toLowerCase())) {
          contactSuggestions.push({
            id: `${contact.id}-email`,
            name: contact.name || '',
            email: contact.email,
            phone: contact.phone || '',
            type: 'email'
          });
        }
        
        if (contact.phone?.includes(query)) {
          contactSuggestions.push({
            id: `${contact.id}-phone`,
            name: contact.name || '',
            email: contact.email || '',
            phone: contact.phone,
            type: 'phone'
          });
        }
        
        return contactSuggestions;
      });

      // Remove duplicates and limit results
      const uniqueSuggestions = formattedSuggestions.filter((suggestion, index, self) => 
        index === self.findIndex(s => s.id === suggestion.id)
      ).slice(0, 8);

      setSuggestions(uniqueSuggestions);
    } catch (error) {
      console.error('Failed to fetch search suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change with debouncing
  const handleInputChange = useCallback((newValue: string) => {
    onChange(newValue);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  }, [onChange, fetchSuggestions]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    const searchValue = suggestion.type === 'name' ? suggestion.name :
                       suggestion.type === 'email' ? suggestion.email :
                       suggestion.phone;
    
    onChange(searchValue);
    saveRecentSearch(searchValue);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, [onChange, saveRecentSearch]);

  // Handle recent search selection
  const handleRecentSearchSelect = useCallback((query: string) => {
    onChange(query);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, [onChange]);

  // Handle search execution
  const handleSearch = useCallback(() => {
    if (value.trim()) {
      saveRecentSearch(value.trim());
      setShowSuggestions(false);
    }
  }, [value, saveRecentSearch]);

  // Handle clear
  const handleClear = useCallback(() => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, [onChange]);

  // Handle key events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [handleSearch]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const hasSuggestions = suggestions.length > 0 || recentSearches.length > 0;

  return (
    <div className={cn("relative", className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            className="pl-10 pr-10"
          />
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={onAdvancedSearch}
          title="Advanced Search"
        >
          <SearchCheck className="h-4 w-4" />
        </Button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && hasSuggestions && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-y-auto">
          <Command>
            <CommandList>
              {/* Search Suggestions */}
              {suggestions.length > 0 && (
                <CommandGroup heading="Suggestions">
                  {suggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion.id}
                      onSelect={() => handleSuggestionSelect(suggestion)}
                      className="flex items-center gap-3 p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {suggestion.name || 'No name'}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {suggestion.type}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {suggestion.email && `${suggestion.email} • `}
                          {suggestion.phone}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <CommandGroup heading="Recent Searches">
                  {recentSearches.map((query, index) => (
                    <CommandItem
                      key={index}
                      onSelect={() => handleRecentSearchSelect(query)}
                      className="flex items-center gap-2 p-3"
                    >
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{query}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {!isLoading && suggestions.length === 0 && recentSearches.length === 0 && (
                <CommandEmpty>No suggestions found</CommandEmpty>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}
