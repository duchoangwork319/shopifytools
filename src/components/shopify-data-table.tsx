"use client"

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronsLeftIcon, ChevronLeftIcon, ChevronRightIcon, ChevronsRightIcon } from "lucide-react"
import type { AnyDataRow, ShopifyCSVContainer } from "@/types/crawl"
import { SkeletonTable } from "@/components/skeleton"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function TanstackProductDataTable<TData, TValue>({
  data,
  columns,
  fetching,
  ...props
}: DataTableProps<TData, TValue> & {
  fetching: boolean
} & React.HTMLAttributes<HTMLDivElement>) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const table = useReactTable({
    data,
    columns,
    state: {
      pagination,
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
  })

  return (
    <div {...props}>
      {
        (data.length === 0 || fetching) ? (
          <SkeletonTable />
        ) : (
          <>
            <div className="flex items-center justify-start mb-4">
              <div className="flex w-full items-center gap-8 lg:w-fit">
                <div className="hidden items-center gap-2 lg:flex">
                  <Label htmlFor="rows-per-page" className="text-sm font-medium">
                    Rows per page
                  </Label>
                  <Select
                    value={`${table.getState().pagination.pageSize}`}
                    onValueChange={(value) => {
                      table.setPageSize(Number(value))
                    }}
                  >
                    <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                      <SelectValue
                        placeholder={table.getState().pagination.pageSize}
                      />
                    </SelectTrigger>
                    <SelectContent side="top">
                      <SelectGroup>
                        {[10, 20, 30, 40, 50].map((pageSize) => (
                          <SelectItem key={pageSize} value={`${pageSize}`}>
                            {pageSize}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex w-fit items-center justify-center text-sm font-medium">
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
                </div>
                <div className="ml-auto flex items-center gap-2 lg:ml-0">
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">Go to first page</span>
                    <ChevronsLeftIcon
                    />
                  </Button>
                  <Button
                    variant="outline"
                    className="size-8"
                    size="icon"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">Go to previous page</span>
                    <ChevronLeftIcon
                    />
                  </Button>
                  <Button
                    variant="outline"
                    className="size-8"
                    size="icon"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Go to next page</span>
                    <ChevronRightIcon
                    />
                  </Button>
                  <Button
                    variant="outline"
                    className="hidden size-8 lg:flex"
                    size="icon"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Go to last page</span>
                    <ChevronsRightIcon
                    />
                  </Button>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-md border mb-4">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
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
          </>
        )
      }
    </div>
  )
}

export function DefaultProductTable({
  headers,
  data,
  fetching,
  ...props
}: Omit<ShopifyCSVContainer, "handles" | "data">
  & {
    data: AnyDataRow[]
    fetching: boolean
  }
  & React.HTMLAttributes<HTMLDivElement>) {
  const allowedHeaders = headers;
  return (
    <div {...props}>
      {
        (data.length === 0 || fetching) ? (
          <SkeletonTable />
        ) : (
          <Table>
            <TableCaption>A list of your products</TableCaption>
            <TableHeader>
              <TableRow>
                {
                  allowedHeaders.map((header) => (
                    <TableHead key={header}>{header}</TableHead>
                  ))
                }
              </TableRow>
            </TableHeader>
            <TableBody>
              {
                data.map((row, tridx) => (
                  <TableRow key={`tr-${tridx}`}>
                    {
                      allowedHeaders.map((header, tdidx) => (
                        <TableCell key={`${header}-${tridx}-${tdidx}`}
                          title={String(row[header] ?? "")}>
                          <span className="block break-all">
                            {String(row[header] ?? "")}
                          </span>
                        </TableCell>
                      ))
                    }
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        )
      }
    </div>
  )
}