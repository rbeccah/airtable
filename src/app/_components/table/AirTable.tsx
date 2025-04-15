"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
  RowData,
  getFilteredRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { AddColumnButton } from "~/app/_components/table/AddColumnButton";
import { AirColumn, AirRow } from "~/types/base";
import { api } from "~/trpc/react";
import { 
  AddColumnResponse, 
  AirTableProps, 
  ApiResponse, 
  TableRow 
} from "~/types/airtable";
import { formatTableData, PAGE_SIZE } from "~/utils/table-utils";
import { EditableCell } from "./EditableCell";
import { ColumnHeader } from "./ColumnHeader";
import { AddRowButton } from "./AddRowButton";

// Types
declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
    matchedCellMap: Set<string>;
    renderData: TableRow[];
  }
}

// Main Component
export const AirTable: React.FC<AirTableProps> = ({
  tableData, 
  tableId, 
  handleTableColumns,
  searchString,
  newCells,
  setNewCells,
  viewId,
  viewApply,
}) => {
  const [columns, setColumns] = useState<ColumnDef<TableRow>[]>([]);
  const [renderData, setRenderData] = useState<TableRow[]>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [hiddenColumns, setHiddenColumns] = useState<Record<string, boolean>>({});

  // Search functionality
  const { data: matchedCells } = api.table.searchTable.useQuery(
    {
      tableId: tableId ?? "",
      searchString,
    },
    {
      enabled: !!tableId,
    }
  );
  
  const matchedCellMap = useMemo(() => {
    const map = new Set<string>();
    if (matchedCells) {
      matchedCells.forEach((cell) => {
        map.add(`${cell.id}`);
      });
    }
    return map;
  }, [matchedCells]);

  // Virtualised Infinite Scrolling
  // tRPC infinite query
  const { data, fetchNextPage, isFetching, isLoading, refetch } = 
  api.table.getInfiniteRows.useInfiniteQuery(
    {
      tableId: tableId ?? "",
      limit: PAGE_SIZE,
      viewId,
      viewApply
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialCursor: undefined, // Remove the number or use null/undefined
      enabled: !!tableId,
    }
  );

  // Flatten the data
  useEffect(() => {
    if (data?.pages) {
      const fetchedRows = data.pages.flatMap(page => page.rows) ?? [];
  
      setRenderData((prevData) => {
        return [...formatTableData(fetchedRows)];
      });
  
      rowVirtualizer.measure(); // Ensure virtualizer updates
    }
  }, [data]);
  
  // Virtualizer
  const rowVirtualizer = useVirtualizer({
    count: renderData.length,
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
      await refetch();
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
  
      tableData.columns.push(res.newColumn);
      // Update column definitions
      updateColumns(res.newColumn);
      handleTableColumns(res.newColumn);
      
      // Invalidate & refetch table data to ensure new column updates all rows
      void refetch();
    } catch (error) {
      console.error("Error adding column:", error);
    }
  };
  
  const handleNewRow = (newCells: AirRow[]) => {
    setNewCells(newCells);
    void refetch();
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

  const createColumnDef = (col: { id: string; name: string; type: string }): ColumnDef<TableRow> => ({
    accessorKey: col.id,
    accessorFn: (row) => row[col.id]?.value ?? "",
    header: () => <ColumnHeader type={col.type} name={col.name} />,
    cell: ({ row, column, table }) => {
      const rowData = table.options.meta?.renderData[row.index]; // Access the row data using row.index
      const cellData = rowData?.[column.id];

      const columnType = tableData?.columns.find(c => c.id === column.id)?.type ?? "Text";
      const cellId = row.original[column.id]?.id;
      const isMatched = cellId ? table.options.meta?.matchedCellMap?.has(cellId) : false;

      return (
        <EditableCell
          cellData={cellData ?? { id: "", value: "" }}
          columnType={columnType}
          updateData={(newValue) => {
            table.options.meta?.updateData?.(row.index, column.id, newValue);
          }}
          onSaveCell={(cellId, value) => saveCellData(cellId, value)}
          isMatched={isMatched}
        />
      );
    },
  });

  const generateColumns = (
    columnsData: { id: string; name: string; type: string }[],
    visibilityMap: Record<string, boolean>
  ): ColumnDef<TableRow>[] => [
    ...columnsData
      .filter((col) => visibilityMap[col.id] !== false) // Only show visible columns
      .map(createColumnDef),
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
  const { data: existingConditions, isError } = api.view.getViewById.useQuery(viewId);
  useEffect(() => {
    if (!existingConditions) return;
  
    const hasSorts = existingConditions.sort?.length !== 0;
    if (newCells.length > 0 && hasSorts) {
      setRenderData([]);
    }
    void refetch();
  }, [newCells, existingConditions, refetch]);

  useEffect(() => {
    if (!tableData || !existingConditions) return;
  
    const visibilityMap = Object.fromEntries(
      existingConditions.columnVisibility.map((c) => [c.columnId, c.isVisible])
    );
  
    setHiddenColumns(visibilityMap);
    setColumns(generateColumns(tableData.columns, visibilityMap));
    void refetch();
  }, [tableData, existingConditions]);
  
  useEffect(() => {
    if (!tableData) return;
    setColumns(generateColumns(tableData.columns, hiddenColumns));
  }, [hiddenColumns, tableData]);

  useEffect(() => {
    fetchMoreOnBottomReached(tableContainerRef.current);
  }, [fetchMoreOnBottomReached]);

  useEffect(() => {
    setRenderData([]);
    void refetch();
  }, [viewApply]);

  useEffect(() => {
    if (existingConditions?.columnVisibility) {
      const visibilityMap = Object.fromEntries(
        existingConditions.columnVisibility.map((c) => [c.columnId, c.isVisible])
      );
      setHiddenColumns(visibilityMap);
    }
  }, [existingConditions]);

  // Table Configuration
  const table = useReactTable({
    data: useMemo(() => renderData, [renderData]),
    columns,
    state: {
      columnVisibility: hiddenColumns,
    },
    onColumnVisibilityChange: setHiddenColumns,
    defaultColumn: {
      cell: ({ getValue, row, column, table }) => {
        const cellData = getValue() as { id: string; value: string };
        const columnType = tableData?.columns.find(c => c.id === column.id)?.type ?? "Text";
      },
    },
    getCoreRowModel: getCoreRowModel(),
    meta: {
      updateData: (rowIndex, columnId, value) => {
        // Directly call API to update cell
        const row = table.getRowModel().rows[rowIndex]?.original;
        if (row?.[columnId]?.id) {
          void saveCellData(row[columnId].id, String(value));
        }
      },
      matchedCellMap,
      renderData,
    },
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]!.start : 0;
  const paddingBottom = virtualRows.length > 0
    ? rowVirtualizer.getTotalSize() - (virtualRows[virtualRows.length - 1]?.end ?? 0)
    : 0

  // Render
  return (
    <div 
      ref={tableContainerRef}
      key={`table-container-${viewId}-${viewApply}-${JSON.stringify(hiddenColumns)}`}
      className="overflow-auto relative h-full border border-gray-200 rounded-lg"
      onScroll={() => fetchMoreOnBottomReached(tableContainerRef.current)}
    >
      <div style={{ height: `${rowVirtualizer.getTotalSize() + 100}px` }}>
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
              if (!row) return null; // Skip rendering if row is undefined
              return (
                <tr 
                  key={row.id} 
                  className="bg-white hover:bg-gray-50"
                  style={{ height: '42px' }}
                >
                  {row.getVisibleCells().map(cell => (
                    <td 
                      key={cell.id} 
                      className={`
                        border-b border-r p-0
                        ${cell.column.id === "add-column" ? "bg-gray-100 border-gray-100" : "bg-transparent border-gray-200"}
                      `}
                    >
                      <div className="h-full w-full flex items-center">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}

            <tr className="h-[42px] bg-white">
              <td colSpan={columns.length - 1} className="h-full border-b border-gray-300">
                <div className="h-[41px] flex items-center justify-center bg-white hover:bg-gray-50">
                  <AddRowButton tableId={tableId} handleNewRow={handleNewRow}/>
                </div>
              </td>
            </tr>
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