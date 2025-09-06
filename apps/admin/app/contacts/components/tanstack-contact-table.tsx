"use client";

import { useMemo, useState } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    flexRender,
    createColumnHelper,
    type SortingState,
    type ColumnFiltersState,
    type PaginationState,
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
import { Edit, Trash2, Eye, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { type ContactType } from '@/lib/contact-api';

interface TanStackContactTableProps {
    data: ContactType[];
    onEdit: (contact: ContactType) => void;
    onView: (contact: ContactType) => void;
    onDelete: (id: string) => void;
    loading?: boolean;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    onPaginationChange?: (pagination: PaginationState) => void;
    onSortingChange?: (sorting: SortingState) => void;
    onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
    sorting?: SortingState;
    columnFilters?: ColumnFiltersState;
}

const columnHelper = createColumnHelper<ContactType>();

export function TanStackContactTable({
    data,
    onEdit,
    onView,
    onDelete,
    loading = false,
    pagination,
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
    sorting = [],
    columnFilters = [],
}: TanStackContactTableProps) {
    const [rowSelection] = useState({});

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
                cell: ({ getValue }) => (
                    <div className="font-medium">{getValue()}</div>
                ),
            }),
            columnHelper.accessor('phone', {
                header: 'Phone',
                cell: ({ getValue }) => getValue(),
            }),
            columnHelper.accessor('email', {
                header: 'Email',
                cell: ({ getValue }) => getValue() || '-',
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
                    const getStatusColor = (status: string) => {
                        switch (status) {
                            case 'active':
                                return 'bg-green-100 text-green-800';
                            case 'inactive':
                                return 'bg-gray-100 text-gray-800';
                            case 'pending':
                                return 'bg-yellow-100 text-yellow-800';
                            default:
                                return 'bg-gray-100 text-gray-800';
                        }
                    };
                    return (
                        <Badge className={getStatusColor(status)}>
                            {status}
                        </Badge>
                    );
                },
            }),
            columnHelper.accessor('segments', {
                header: 'Segments',
                cell: ({ getValue }) => {
                    const segments = getValue();
                    return (
                        <div className="flex flex-wrap gap-1">
                            {segments.length > 0 ? (
                                segments.map((segment) => (
                                    <Badge
                                        key={segment.id}
                                        variant="outline"
                                        className="text-xs"
                                    >
                                        {segment.name}
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-gray-400 text-sm">No segments</span>
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
                    return date.toLocaleDateString();
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
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onView(contact)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
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
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        enableRowSelection: true,
        enableSorting: true,
        enableColumnFilters: true,
        onSortingChange: (updater) => {
            const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
            onSortingChange?.(newSorting);
        },
        onColumnFiltersChange: (updater) => {
            const newFilters = typeof updater === 'function' ? updater(columnFilters) : updater;
            onColumnFiltersChange?.(newFilters);
        },
        onPaginationChange: (updater) => {
            const newPagination = typeof updater === 'function' ? updater({
                pageIndex: (pagination?.page || 1) - 1,
                pageSize: pagination?.limit || 10,
            }) : updater;
            onPaginationChange?.(newPagination);
        },
        state: {
            sorting,
            columnFilters,
            rowSelection,
            pagination: {
                pageIndex: (pagination?.page || 1) - 1,
                pageSize: pagination?.limit || 10,
            },
        },
        pageCount: pagination?.totalPages || -1,
        manualPagination: true, // Enable server-side pagination
        manualSorting: true, // Enable server-side sorting
        manualFiltering: true, // Enable server-side filtering
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading contacts...</p>
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No contacts found. Create your first contact to get started.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
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
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                        {pagination.total} contacts
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </Button>
                        <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                const page = i + 1;
                                return (
                                    <Button
                                        key={page}
                                        variant={pagination.page === page ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => table.setPageIndex(page - 1)}
                                    >
                                        {page}
                                    </Button>
                                );
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
