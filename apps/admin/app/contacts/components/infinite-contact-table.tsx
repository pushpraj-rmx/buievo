"use client";

import { memo, useMemo, useEffect, useRef } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    flexRender,
    createColumnHelper,
    type SortingState,
    type ColumnFiltersState,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, Trash2, Eye, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { type ContactType } from '@/lib/contact-api';

interface InfiniteContactTableProps {
    contacts: ContactType[];
    onEdit: (contact: ContactType) => void;
    onView: (contact: ContactType) => void;
    onDelete: (id: string) => void;
    loading?: boolean;
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    onLoadMore?: () => void;
    onSortingChange?: (updater: SortingState | ((old: SortingState) => SortingState)) => void;
    onColumnFiltersChange?: (updater: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState)) => void;
    sorting?: SortingState;
    columnFilters?: ColumnFiltersState;
}

const columnHelper = createColumnHelper<ContactType>();

export const InfiniteContactTable = memo(function InfiniteContactTable({
    contacts,
    onEdit,
    onView,
    onDelete,
    loading = false,
    hasNextPage = false,
    isFetchingNextPage = false,
    onLoadMore,
    onSortingChange,
    onColumnFiltersChange,
    sorting = [],
    columnFilters = [],
}: InfiniteContactTableProps) {
    const tableRef = useRef<HTMLDivElement>(null);
    const loadingRef = useRef<HTMLDivElement>(null);

    const columns = useMemo(
        () => [
            columnHelper.accessor('name', {
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="h-auto p-0 font-semibold"
                    >
                        Name
                        {column.getIsSorted() === 'asc' ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                        ) : column.getIsSorted() === 'desc' ? (
                            <ArrowDown className="ml-2 h-4 w-4" />
                        ) : (
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                    </Button>
                ),
                cell: ({ getValue }) => {
                    const name = getValue();
                    return (
                        <div className="font-medium">
                            {name || 'Unknown'}
                        </div>
                    );
                },
            }),
            columnHelper.accessor('email', {
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="h-auto p-0 font-semibold"
                    >
                        Email
                        {column.getIsSorted() === 'asc' ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                        ) : column.getIsSorted() === 'desc' ? (
                            <ArrowDown className="ml-2 h-4 w-4" />
                        ) : (
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                    </Button>
                ),
                cell: ({ getValue }) => {
                    const email = getValue();
                    return (
                        <div className="text-sm text-muted-foreground">
                            {email || 'No email'}
                        </div>
                    );
                },
            }),
            columnHelper.accessor('phone', {
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="h-auto p-0 font-semibold"
                    >
                        Phone
                        {column.getIsSorted() === 'asc' ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                        ) : column.getIsSorted() === 'desc' ? (
                            <ArrowDown className="ml-2 h-4 w-4" />
                        ) : (
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                    </Button>
                ),
                cell: ({ getValue }) => {
                    const phone = getValue();
                    return (
                        <div className="font-mono text-sm">
                            {phone}
                        </div>
                    );
                },
            }),
            columnHelper.accessor('status', {
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="h-auto p-0 font-semibold"
                    >
                        Status
                        {column.getIsSorted() === 'asc' ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                        ) : column.getIsSorted() === 'desc' ? (
                            <ArrowDown className="ml-2 h-4 w-4" />
                        ) : (
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                    </Button>
                ),
                cell: ({ getValue }) => {
                    const status = getValue();
                    const statusColors = {
                        active: 'bg-green-100 text-green-800',
                        inactive: 'bg-red-100 text-red-800',
                        pending: 'bg-yellow-100 text-yellow-800',
                    };
                    return (
                        <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
                            {status}
                        </Badge>
                    );
                },
            }),
            columnHelper.accessor('segments', {
                header: 'Segments',
                cell: ({ getValue }) => {
                    const segments = getValue();
                    if (!segments || segments.length === 0) {
                        return <span className="text-muted-foreground text-sm">No segments</span>;
                    }
                    return (
                        <div className="flex flex-wrap gap-1">
                            {segments.slice(0, 2).map((segment) => (
                                <Badge key={segment.id} variant="secondary" className="text-xs">
                                    {segment.name}
                                </Badge>
                            ))}
                            {segments.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                    +{segments.length - 2}
                                </Badge>
                            )}
                        </div>
                    );
                },
            }),
            columnHelper.accessor('createdAt', {
                header: ({ column }) => (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        className="h-auto p-0 font-semibold"
                    >
                        Created
                        {column.getIsSorted() === 'asc' ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                        ) : column.getIsSorted() === 'desc' ? (
                            <ArrowDown className="ml-2 h-4 w-4" />
                        ) : (
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                    </Button>
                ),
                cell: ({ getValue }) => {
                    const date = new Date(getValue());
                    return (
                        <div className="text-sm text-muted-foreground">
                            {date.toLocaleDateString()}
                        </div>
                    );
                },
            }),
            columnHelper.display({
                id: 'actions',
                header: 'Actions',
                cell: ({ row }) => {
                    const contact = row.original;
                    return (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onView(contact)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onEdit(contact)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onDelete(contact.id)}
                                    className="text-red-600"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                },
            }),
        ],
        [onEdit, onView, onDelete]
    );

    const table = useReactTable({
        data: contacts,
        columns,
        state: {
            sorting,
            columnFilters,
        },
        onSortingChange,
        onColumnFiltersChange,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableSorting: true,
        enableColumnFilters: true,
        manualSorting: true,
        manualFiltering: true,
    });

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const currentRef = loadingRef.current;
        if (!currentRef) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const target = entries[0];
                if (target.isIntersecting && hasNextPage && !isFetchingNextPage && onLoadMore) {
                    onLoadMore();
                }
            },
            {
                threshold: 0.1,
                rootMargin: '100px',
            }
        );

        observer.observe(currentRef);

        return () => {
            observer.unobserve(currentRef);
        };
    }, [hasNextPage, isFetchingNextPage, onLoadMore]);

    if (loading && contacts.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading contacts...</p>
                </div>
            </div>
        );
    }

    return (
        <div ref={tableRef} className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No contacts found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Infinite scroll loading indicator */}
            {hasNextPage && (
                <div ref={loadingRef} className="flex justify-center py-4">
                    {isFetchingNextPage ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Loading more contacts...</span>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={onLoadMore}
                            disabled={isFetchingNextPage}
                        >
                            Load More
                        </Button>
                    )}
                </div>
            )}

            {/* End of data indicator */}
            {!hasNextPage && contacts.length > 0 && (
                <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                        You&apos;ve reached the end of the contact list.
                    </p>
                </div>
            )}
        </div>
    );
});
