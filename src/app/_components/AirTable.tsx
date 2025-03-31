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
import { MdOutlineTextFields } from "react-icons/md";
import { FaHashtag } from "react-icons/fa";
import { AddColumnButton } from "~/app/_components/AddColumnButton";
import { Cell, AirColumn } from "~/types/base";

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

type TableRow = { 
  rowId: string 
} & Record<string, { id: string; value: string }>;

interface AirTableProps {
  tableData: {
    id: string;
    name: string;
    columns: { id: string; name: string; type: string }[];
    cells: Cell[];
  } | null;
  tableId: string | null;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  newRowCells: Cell[];
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

const formatTableData = (tableCells: Cell[]): TableRow[] => {
  const formattedData: Record<string, TableRow> = {};
  tableCells.forEach((cell) => {
    if (!formattedData[cell.rowId]) {
      formattedData[cell.rowId] = { rowId: cell.rowId } as TableRow;
    }
    formattedData[cell.rowId]![cell.columnId] = { id: cell.id, value: cell.value };
  });

  return Object.values(formattedData);
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
  <div className="flex items-center gap-2">
    {type === "Text" ? (
      <MdOutlineTextFields className="w-4 h-4 text-gray-500" />
    ) : (
      <FaHashtag className="w-4 h-4 text-gray-500" />
    )}
    {name}
  </div>
);

// Main Component
export const AirTable: React.FC<AirTableProps> = ({ 
  tableData, 
  tableId, 
  globalFilter, 
  setGlobalFilter, 
  newRowCells 
}) => {
  const [data, setData] = useState<TableRow[]>([]);
  const [columns, setColumns] = useState<ColumnDef<TableRow>[]>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Virtualised Infinite Scrolling


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
  
      updateColumns(res.newColumn);
      updateDataWithNewColumn(res.newColumn, res.newCells);
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
    setData(prevData => 
      prevData.map(row => ({
        ...row,
        [newColumn.id]: getCellForRow(row.rowId, newCells, newColumn.id)
      }))
    );
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
  useEffect(() => {
    if (!tableData) return;
    setData(formatTableData(tableData.cells));
    setColumns(generateColumns(tableData.columns));
  }, [tableData]);

  useEffect(() => {
    if (newRowCells.length > 0) {
      setData(prev => [...prev, ...formatTableData(newRowCells)]);
    }
  }, [newRowCells]);

  // Table Configuration
  const table = useReactTable({
    data,
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
        setData(prevData =>
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

  // Render
  return (
    <div className="overflow-x-auto">
      <table className="border border-gray-400">
        <thead className="bg-gray-100">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id} className="border border-gray-300 p-1">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="border border-gray-100 bg-white">
              {row.getVisibleCells()
                .filter(cell => cell.column.id !== "add-column")
                .map(cell => (
                  <td key={cell.id} className="border p-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))
              }
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};