"use client";

import { memo } from "react";
import { ContactsToolbar } from "./contacts-toolbar";
import { ContactStats } from "./contact-stats";
import { type SegmentType } from "@/lib/contact-api";

interface ContactsSearchSectionProps {
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
    onRefresh: () => void;
}

export const ContactsSearchSection = memo(function ContactsSearchSection({
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
    onRefresh,
}: ContactsSearchSectionProps) {
    return (
        <>
            {/* Analytics Dashboard */}
            <ContactStats onRefresh={onRefresh} />

            {/* Toolbar */}
            <ContactsToolbar
                search={search}
                onSearchChange={onSearchChange}
                statusFilter={statusFilter}
                onStatusFilterChange={onStatusFilterChange}
                segmentFilter={segmentFilter}
                onSegmentFilterChange={onSegmentFilterChange}
                segments={segments}
                onCreateContact={onCreateContact}
                onCreateSegment={onCreateSegment}
                onImport={onImport}
                onExport={onExport}
                onAdvancedSearch={onAdvancedSearch}
                selectedContacts={selectedContacts}
                onBulkDelete={onBulkDelete}
                onClearSelection={onClearSelection}
            />
        </>
    );
});
