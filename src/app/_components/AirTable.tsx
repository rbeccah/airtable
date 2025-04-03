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
  SortingFn,
  getSortedRowModel,
  sortingFns,
} from "@tanstack/react-table";
import { RankingInfo, rankItem, compareItems } from '@tanstack/match-sorter-utils';
import { useVirtualizer } from "@tanstack/react-virtual";
import { useInfiniteQuery } from "@tanstack/react-query";
import { MdOutlineTextFields, MdMoreVert } from "react-icons/md";
import { FaHashtag } from "react-icons/fa";
import { AddColumnButton } from "~/app/_components/AddColumnButton";
import { Cell, AirColumn, Table, AirRow } from "~/types/base";
import { api } from "~/trpc/react";

// Type Declarations
declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  }
  
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

/**
 * TableRow format:
 * {
 *   rowId: "row1",
 *   columnId1: { id: "cell1", value: "Alice" },
 *   ...
 * }
 */
type TableRow = {
  rowId: string;
} & Record<string, { id: string; value: string }>;

interface AirTableProps {
  tableData: Table | null;
  tableId: string | null;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  newRows: AirRow[];
}

interface AddColumnResponse {
  success: boolean;
  newColumn?: AirColumn;
  newCells?: Cell[];
  error?: string;
}

interface ApiResponse {
  success: boolean;
  error?: string;
}

const PAGE_SIZE = 50; // Number of rows to fetch at a time

// Utility Functions
const fuzzyFilter: FilterFn<TableRow> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem((row.getValue(columnId)) ?? "", value as string);
  addMeta({ itemRank });
  return itemRank.passed;
};

const fuzzySort: SortingFn<TableRow> = (rowA, rowB, columnId) => {
  let dir = 0;

  if (rowA.columnFiltersMeta[columnId] && rowB.columnFiltersMeta[columnId]) {
    dir = compareItems(
      rowA.columnFiltersMeta[columnId]?.itemRank ?? { ranking: 0 },
      rowB.columnFiltersMeta[columnId]?.itemRank ?? { ranking: 0 }
    );
  }

  return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir;
};

const formatTableData = (rows: AirRow[]): TableRow[] => {
  return rows.map(row => {
    // Create a new object with rowId and the Record type
    const tableRow = {
      rowId: row.id,
      ...Object.fromEntries(
        row.cells.map(cell => [
          cell.columnId, 
          { id: cell.id, value: cell.value }
        ])
    )} as unknown as TableRow;
    
    return tableRow;
  });
};

// Sub-components
interface EditableCellProps {
  cellData: { id: string; value: string };
  columnType: string;
  updateData: (value: string) => void;
  onSaveCell: (cellId: string, value: string) => void;
}

const EditableCell: React.FC<EditableCellProps> = ({
  cellData,
  columnType,
  updateData,
  onSaveCell,
}) => {
  const [value, setValue] = useState(cellData.value);

  const onBlur = () => {
    updateData(value);
    onSaveCell(cellData.id, value);
  };

  return (
    <input
      className="text-gray-900 border-transparent text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 -m-1.5"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={onBlur}
      type={columnType === "Number" ? "number" : "text"}
    />
  );
};

const ColumnHeader = ({ type, name }: { type: string; name: string }) => (
  <div className="flex items-center justify-between group">
    <div className="flex items-center gap-2">
      {type === "Text" ? (
        <MdOutlineTextFields className="w-4 h-4 text-gray-500" />
      ) : (
        <FaHashtag className="w-4 h-4 text-gray-500" />
      )}
      <span className="text-sm font-medium text-gray-800">{name}</span>
    </div>
    <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600">
      <MdMoreVert className="w-4 h-4" />
    </button>
  </div>
);

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
    return [...localRows, ...fetchedRows];
  }, [data, localRows]);

  // Flatten the data
  const flatData = useMemo(() => {
    return data?.pages.flatMap(page => page.rows) ?? [];
  }, [data]);

  const totalFetched = flatData.length;

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
          fetchNextPage();
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
    refetch();
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
      const formattedNewRows = formatTableData(newRows);
      setLocalRows(prev => [...prev, ...formattedNewRows]);
      // Refetch data to ensure consistency
      refetch();
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

  // Format data for table
  const formattedData = useMemo(() => {
    return formatTableData(flatData);
  }, [flatData]);

  // Table Configuration
  const table = useReactTable({
    data: formattedData,
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
  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0;
  const paddingBottom = virtualRows.length > 0
    ? rowVirtualizer.getTotalSize() - (virtualRows[virtualRows.length - 1]?.end || 0)
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