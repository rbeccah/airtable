"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
  RowData,
  getFilteredRowModel,
  FilterFn,
  getSortedRowModel,
} from "@tanstack/react-table";
import { RankingInfo } from '@tanstack/match-sorter-utils';
import { useVirtualizer } from "@tanstack/react-virtual";
import { AddColumnButton } from "~/app/_components/table/AddColumnButton";
import { Cell, AirColumn } from "~/types/base";
import { api } from "~/trpc/react";
import { 
  AddColumnResponse, 
  AirTableProps, 
  ApiResponse, 
  TableRow 
} from "~/types/airtable";
import { formatTableData, fuzzyFilter, fuzzySort, PAGE_SIZE } from "~/utils/table-utils";
import { EditableCell } from "./EditableCell";
import { ColumnHeader } from "./ColumnHeader";

// Types
declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  }
  
  interface FilterFns {
    fuzzy: FilterFn<unknown>;
  }
  
  interface FilterMeta {
    itemRank: RankingInfo;
  }
}

// Main Component
export const AirTable: React.FC<AirTableProps> = ({ 
  tableData, 
  tableId, 
  globalFilter, 
  setGlobalFilter, 
  newRows 
}) => {
  const [localRows, setLocalRows] = useState<TableRow[]>([]);
  const [columns, setColumns] = useState<ColumnDef<TableRow>[]>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Virtualised Infinite Scrolling
  // tRPC infinite query
  const { data, fetchNextPage, isFetching, isLoading, refetch } = 
  api.table.getInfiniteRows.useInfiniteQuery(
    {
      tableId: tableId ?? "",
      limit: PAGE_SIZE,
      globalFilter,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialCursor: undefined, // Remove the number or use null/undefined
      enabled: !!tableId,
    }
  );

  // Combine infinite query data with locally added rows
  const combinedData = useMemo(() => {
    const fetchedRows = data?.pages.flatMap(page => page.rows) ?? [];
    const formattedFetchedRows = formatTableData(fetchedRows);
    return [...localRows, ...formattedFetchedRows];
  }, [data, localRows]);

  // Flatten the data
  const flatData = useMemo(() => {
    return data?.pages.flatMap(page => page.rows) ?? [];
  }, [data]);

  // Virtualizer
  const rowVirtualizer = useVirtualizer({
    count: flatData.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 50, // row height
    overscan: 10,
  });

  // Fetch more on scroll
  const fetchMoreOnBottomReached = useCallback(
    (containerRefElement?: HTMLDivElement | null) => {
      if (containerRefElement) {
        const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
        if (
          scrollHeight - scrollTop - clientHeight < 400 &&
          !isFetching
        ) {
          void fetchNextPage();
        }
      }
    },
    [fetchNextPage, isFetching]
  );


  // API Functions
  const saveCellData = async (cellId: string, value: string) => {
    try {
      const response = await fetch("/api/table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "updateCell",
          tableId, 
          cellId, 
          value 
        }),
      });
  
      const result: ApiResponse = await response.json();
      if (!result.success) {
        console.error("Failed to update cell:", result.error);
      }
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  const handleAddColumn = async (columnName: string, columnType: string) => {
    if (!tableData) return;
  
    try {
      const response = await fetch("/api/table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addColumn",
          tableId,
          columnName,
          columnType,
        }),
      });
  
      const res: AddColumnResponse = await response.json();
      if (!res.success || !res.newColumn || !res.newCells) {
        console.error("Failed to add column:", res.error);
        return;
      }
  
      // Update column definitions
      updateColumns(res.newColumn);
      updateDataWithNewColumn(res.newColumn, res.newCells);
      
      // Invalidate & refetch table data to ensure new column updates all rows
      await refetch();
    } catch (error) {
      console.error("Error adding column:", error);
    }
  };
  

  // Helper Functions
  const updateColumns = (newColumn: AirColumn) => {
    setColumns(prevColumns => {
      const filteredColumns = prevColumns.length > 1 ? prevColumns.slice(0, -1) : prevColumns;
  
      return [
        ...filteredColumns,
        createColumnDef(newColumn),
        prevColumns[prevColumns.length - 1], // Re-add the "Add Column" button
      ].filter(Boolean) as ColumnDef<TableRow>[];
    });
  };

  const updateDataWithNewColumn = (newColumn: AirColumn, newCells: Cell[]) => {
    setLocalRows(prevData => {
      const updatedRows = prevData.map(row => ({
        ...row,
        [newColumn.id]: getCellForRow(row.rowId, newCells, newColumn.id)
      }));
  
      return [...updatedRows]; // Ensure a new array reference to trigger a state update
    });
  
    // Ensure refetch occurs to refresh all virtualized rows
    void refetch();
  };
  

  const getCellForRow = (rowId: string, newCells: Cell[], columnId: string) => {
    const newCell = newCells.find(cell => cell.rowId === rowId);
    return newCell 
      ? { id: newCell.id, value: newCell.value }
      : { id: "", value: "" };
  };

  const createColumnDef = (col: { id: string; name: string; type: string }): ColumnDef<TableRow> => ({
    accessorKey: col.id,
    filterFn: fuzzyFilter,
    accessorFn: (row) => row[col.id]?.value ?? "",
    sortingFn: fuzzySort,
    header: () => <ColumnHeader type={col.type} name={col.name} />,
    cell: ({ row, column, table }) => {
      const cellData = row.original[column.id];
      const columnType = tableData?.columns.find(c => c.id === column.id)?.type ?? "Text";
  
      return (
        <EditableCell
          cellData={cellData ?? { id: "", value: "" }}
          columnType={columnType}
          updateData={(newValue) => {
            table.options.meta?.updateData?.(row.index, column.id, newValue);
          }}
          onSaveCell={(cellId, value) => saveCellData(cellId, value)}
        />
      );
    },
  });

  const generateColumns = (columnsData: { id: string; name: string; type: string }[]): ColumnDef<TableRow>[] => [
    ...columnsData.map(createColumnDef),
    {
      accessorKey: "add-column",
      header: () => <AddColumnButton onAddColumn={handleAddColumn} />,
      enableSorting: false,
      enableColumnFilter: false,
      enableResizing: false,
      cell: () => null,
    },
  ];

  // Effects
  // Update local rows when newRows prop changes
  useEffect(() => {
    if (newRows.length > 0) {
      // Refetch data to ensure consistency
      void refetch();
    }
  }, [newRows, refetch]);

  useEffect(() => {
    if (!tableData) return;
    setLocalRows(formatTableData(tableData.rows));
    setColumns(generateColumns(tableData.columns));
  }, [tableData]);

  useEffect(() => {
    if (newRows.length > 0) {
      setLocalRows(prev => [...prev, ...formatTableData(newRows)]);
    }
  }, [newRows]);

  useEffect(() => {
    fetchMoreOnBottomReached(tableContainerRef.current);
  }, [fetchMoreOnBottomReached]);

  // Table Configuration
  const table = useReactTable({
    data: combinedData,
    columns,
    defaultColumn: {
      cell: ({ getValue, row, column, table }) => {
        const cellData = getValue() as { id: string; value: string };
        const columnType = tableData?.columns.find(c => c.id === column.id)?.type ?? "Text";

        return (
          <EditableCell
            cellData={cellData}
            columnType={columnType}
            updateData={(newValue) => {
              table.options.meta?.updateData(row.index, column.id, newValue);
            }}
            onSaveCell={(cellId, value) => saveCellData(cellId, value)}
          />
        );
      },
    },
    getCoreRowModel: getCoreRowModel(),
    meta: {
      updateData: (rowIndex, columnId, value) => {
        setLocalRows(prevData =>
          prevData.map((row, index) =>
            index === rowIndex
              ? {
                  ...row,
                  [columnId]: {
                    id: row[columnId]?.id ?? "",
                    value: String(value),
                  },
                }
              : row
          )
        );
      },
    },
    filterFns: { fuzzy: fuzzyFilter },
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: fuzzyFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualRows[0]?.start ?? 0;
  const paddingBottom = virtualRows.length > 0
    ? rowVirtualizer.getTotalSize() - (virtualRows[virtualRows.length - 1]?.end ?? 0)
    : 0;

  // Render
  return (
    <div 
      ref={tableContainerRef}
      className="overflow-auto relative h-full border border-gray-200 rounded-lg"
      onScroll={() => fetchMoreOnBottomReached(tableContainerRef.current)}
    >
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        <table className="border-collapse">
          <thead className="sticky top-0 z-10 bg-gray-100">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id} 
                    className={`
                      border-b border-r border-gray-300 p-0
                      ${header.column.id === "add-column" ? "w-12 bg-gray-100" : "min-w-[200px]"}
                    `}
                  >
                    <div className="px-3 py-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} colSpan={columns.length} />
              </tr>
            )}

            {virtualRows.map(virtualRow => {
              const row = table.getRowModel().rows[virtualRow.index]!;
              return (
                <tr 
                  key={row.id} 
                  className="hover:bg-gray-50 group"
                  style={{ height: '42px' }}
                >
                  {row.getVisibleCells().map(cell => (
                    <td 
                      key={cell.id} 
                      className={`
                        border-b border-r p-0
                        ${cell.column.id === "add-column" ? "bg-gray-100 border-gray-100" : "bg-white border-gray-200"}
                      `}
                    >
                      <div className="h-full px-3 py-2 flex items-center">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}

            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} colSpan={columns.length} />
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {isFetching && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded shadow-md border border-gray-200">
          Loading more records...
        </div>
      )}
    </div>
  );
};