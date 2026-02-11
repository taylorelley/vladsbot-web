"use client";

import React, { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { A2UITableProps, A2UITableColumn } from "@/types/a2ui";
import { A2UIComponentWrapper, A2UIActions } from "./A2UIComponentWrapper";
import { registerComponent, A2UIRendererProps } from "./A2UIRegistry";
import { ArrowUp, ArrowDown, Search, ChevronLeft, ChevronRight } from "lucide-react";

// ============================================================
// Table Component
// ============================================================

function Table({ component, onAction }: A2UIRendererProps) {
  const props = component.props as A2UITableProps;
  const {
    headers,
    columns,
    rows,
    sortable = false,
    searchable = false,
    pagination = false,
    pageSize = 10,
    actions,
    emptyMessage = "No data available",
    striped = true,
    compact = false,
  } = props;

  // State
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Determine columns from headers or columns prop
  const tableColumns = useMemo((): A2UITableColumn[] => {
    if (columns) return columns;
    if (headers) {
      return headers.map((header, index) => ({
        key: index.toString(),
        label: header,
        sortable: sortable,
      }));
    }
    return [];
  }, [columns, headers, sortable]);

  // Normalize rows to array format
  const normalizedRows = useMemo(() => {
    return rows.map((row) => {
      if (Array.isArray(row)) {
        return row.map((cell) => String(cell ?? ""));
      }
      return tableColumns.map((col) => String((row as Record<string, unknown>)[col.key] ?? ""));
    });
  }, [rows, tableColumns]);

  // Filter rows by search
  const filteredRows = useMemo(() => {
    if (!searchQuery) return normalizedRows;
    const query = searchQuery.toLowerCase();
    return normalizedRows.filter((row) =>
      row.some((cell) => cell.toLowerCase().includes(query))
    );
  }, [normalizedRows, searchQuery]);

  // Sort rows
  const sortedRows = useMemo(() => {
    if (!sortColumn) return filteredRows;
    const colIndex = parseInt(sortColumn, 10);
    if (isNaN(colIndex)) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      const aVal = a[colIndex] || "";
      const bVal = b[colIndex] || "";
      const comparison = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredRows, sortColumn, sortDirection]);

  // Paginate rows
  const paginatedRows = useMemo(() => {
    if (!pagination) return sortedRows;
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, pagination, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedRows.length / pageSize);

  // Handle sort
  const handleSort = useCallback((columnIndex: string) => {
    setSortColumn((prev) => {
      if (prev === columnIndex) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        return columnIndex;
      }
      setSortDirection("asc");
      return columnIndex;
    });
  }, []);

  const handleAction = useCallback(
    (action: string) => {
      if (onAction) {
        onAction({
          type: "action",
          componentId: component.id,
          action,
          timestamp: Date.now(),
        });
      }
    },
    [component.id, onAction]
  );

  return (
    <A2UIComponentWrapper component={component} onAction={onAction}>
      {/* Search */}
      {searchable && (
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-black/20 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              {tableColumns.map((col, index) => (
                <th
                  key={col.key}
                  className={cn(
                    "text-left font-medium px-4",
                    compact ? "py-2" : "py-3",
                    col.sortable && sortable && "cursor-pointer hover:bg-white/5 select-none",
                    col.align === "center" && "text-center",
                    col.align === "right" && "text-right"
                  )}
                  style={{ width: col.width }}
                  onClick={() => {
                    if (col.sortable && sortable) {
                      handleSort(index.toString());
                    }
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.label}</span>
                    {col.sortable && sortable && sortColumn === index.toString() && (
                      sortDirection === "asc" ? (
                        <ArrowUp className="w-3 h-3" />
                      ) : (
                        <ArrowDown className="w-3 h-3" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={tableColumns.length}
                  className="text-center py-8 text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn(
                    "border-b border-white/5 transition-colors hover:bg-white/5",
                    striped && rowIndex % 2 === 0 && "bg-white/[0.02]"
                  )}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={cn(
                        "px-4",
                        compact ? "py-2" : "py-3",
                        tableColumns[cellIndex]?.align === "center" && "text-center",
                        tableColumns[cellIndex]?.align === "right" && "text-right"
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {currentPage} of {totalPages} ({sortedRows.length} items)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg glass-button-secondary disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg glass-button-secondary disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="mt-4">
          <A2UIActions actions={actions} onAction={handleAction} />
        </div>
      )}
    </A2UIComponentWrapper>
  );
}

// ============================================================
// Register Component
// ============================================================

registerComponent("Table", Table, "Table");

export { Table };
export default Table;
