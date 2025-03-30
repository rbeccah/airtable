"use client";

import { useState, useEffect, useReducer } from "react";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
  RowData,
  getFilteredRowModel,
  filterFns,
  Row,
  Column,
  FilterFn,
  SortingFn,
  getSortedRowModel,
  sortingFns,
} from "@tanstack/react-table";
import {
  RankingInfo,
  rankItem,
  compareItems,
} from '@tanstack/match-sorter-utils'
import { MdOutlineTextFields } from "react-icons/md";
import { FaHashtag } from "react-icons/fa";
import { AddColumnButton } from "~/app/_components/AddColumnButton";
import { Cell, AirColumn } from "~/types/base";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  }
}

declare module '@tanstack/react-table' {
  //add fuzzy filter to the filterFns
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

declare module '@tanstack/react-table' {
  //add fuzzy filter to the filterFns
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

// Define a custom fuzzy filter function that will apply ranking info to rows (using match-sorter utils)
const fuzzyFilter: FilterFn<TableRow> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem((row.getValue(columnId)) ?? "", value as string);
  addMeta({ itemRank });
  return itemRank.passed;
};

// Define a custom fuzzy sort function that will sort by rank if the row has ranking information
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

interface AirTableProps {
  tableData: {
    id: string;
    name: string;
    columns: { id: string; name: string; type: string }[];
    cells: { id: string; columnId: string; value: string; rowId: string }[];
  } | null;
  tableId: string | null;
  globalFilter: string; // Add globalFilter prop
  setGlobalFilter: (value: string) => void; // Add setGlobalFilter prop
  newRowCells: Cell[]
}

interface AddColumnResponse {
  success: boolean;
  newColumn?: AirColumn;
  newCells?: Cell[];
  error?: string;
}

/**
 * TableRow format:
 * {
 *   rowId: "row1",
 *   columnId1: { id: "cell1", value: "Alice" },
 *   ...
 * }
 */
type TableRow = { rowId: string } & Record<string, { id: string; value: string }>;

const AirTable: React.FC<AirTableProps> = ({ tableData, tableId, globalFilter, setGlobalFilter, newRowCells }) => {
  const [data, setData] = useState<TableRow[]>([]);
  const [columns, setColumns] = useState<ColumnDef<TableRow>[]>([]);

  useEffect(() => {
    if (!tableData) return;
    
    // Format and set initial table data
    setData(formatTableData(tableData.cells));
    setColumns(generateColumns(tableData.columns));
  }, [tableData]);

  useEffect(() => {
    if (newRowCells.length > 0) {
      // Format and add new rows to the data
      const rowData = formatTableData(newRowCells);
      setData(prevData => [...prevData, ...rowData]);
    }
  }, [newRowCells]);

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
  
  // Create column header from columns data
  const generateColumns = (columnsData: { id: string; name: string; type: string }[]): ColumnDef<TableRow>[] => {
    return [
      ...columnsData.map((col): ColumnDef<TableRow> => ({
        accessorKey: col.id,
        filterFn: fuzzyFilter,
        accessorFn: (row) => row[col.id]?.value ?? "",
        sortingFn: fuzzySort,
        header: () => (
          <div className="flex items-center gap-2">
            {col.type === "Text" ? (
              <MdOutlineTextFields className="w-4 h-4 text-gray-500" />
            ) : (
              <FaHashtag className="w-4 h-4 text-gray-500" />
            )}
            {col.name}
          </div>
        ),
        cell: ({ row, column, table }) => {
          const cellData = row.original[column.id]; // Correctly typed access
          const columnType = columnsData.find((c) => c.id === column.id)?.type ?? "Text";
  
          return (
            <EditableCell
              cellData={cellData ?? { id: "", value: "" }}
              columnType={columnType}
              updateData={(newValue) => {
                table.options.meta?.updateData?.(row.index, column.id, newValue);
              }}
            />
          );
        },
      })),
      {
        accessorKey: "add-column",
        header: () => <AddColumnButton onAddColumn={handleAddColumn} />,
        enableSorting: false,
        enableColumnFilter: false,
        enableResizing: false,
        cell: () => null,
      },
    ];
  };

  // Create editable cell
  const EditableCell: React.FC<{
    cellData: { id: string; value: string };
    columnType: string;
    updateData: (value: string) => void;
  }> = ({ cellData, columnType, updateData }) => {
    const [value, setValue] = useState(cellData.value);

    const onBlur = () => {
      updateData(value);
      void saveCellData(cellData.id, value);
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

  const defaultColumn: Partial<ColumnDef<TableRow>> = {
    cell: ({ getValue, row, column, table }) => {
      const cellData = getValue() as { id: string; value: string };
      const columnType = tableData?.columns.find((c) => c.id === column.id)?.type ?? "Text";

      return (
        <EditableCell
          cellData={cellData}
          columnType={columnType}
          updateData={(newValue) => {
            table.options.meta?.updateData(row.index, column.id, newValue);
          }}
        />
      );
    },
  };

  /** APIs */
  // Saving an individual cell data to db
  const saveCellData = async (cellId: string, value: string) => {
    try {
      const response = await fetch("/api/table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "updateCell",
          tableId: tableId, 
          cellId: cellId, 
          value: value 
        }),
      });

      const result = (await response.json()) as { success: boolean; error?: string };
      if (!result.success) {
        console.error("Failed to update cell:", result.error);
      }
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  // Adding a column to db
  const handleAddColumn = async (columnName: string, columnType: string) => {
    if (!tableData) return;
  
    try {
      const response = await fetch("/api/table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addColumn",
          tableId: tableId,
          columnName: columnName,
          columnType: columnType,
        }),
      });
  
      const res: AddColumnResponse = await response.json() as AddColumnResponse;
      if (!res.success || !res.newColumn || !res.newCells) {
        console.error("Failed to add column:", res.error);
        return;
      }
  
      const newColumn = res.newColumn; // { id: "new_col_id", name: "New Column", type: "Text" }
      const newCells = res.newCells;   // Array of new cells [{ rowId, columnId, id, value }, ...]

      // Update columns state
      setColumns((prevColumns) => {
        const filteredColumns = prevColumns.length > 1 ? prevColumns.slice(0, -1) : prevColumns;
  
        return [
          ...filteredColumns,
          {
            accessorKey: newColumn.id,
            header: () => (
              <div className="flex items-center gap-2">
                {newColumn.type === "Text" ? (
                  <MdOutlineTextFields className="w-4 h-4 text-gray-500" />
                ) : (
                  <FaHashtag className="w-4 h-4 text-gray-500" />
                )}
                {newColumn.name}
              </div>
            ),
          },
          prevColumns[prevColumns.length - 1], // Re-add the "Add Column" button
        ].filter(Boolean) as ColumnDef<TableRow>[];
      });
  
      // Update data state to include new column's cells for each row
      setData((prevData) => {
        return prevData.map((row) => {
          const newCell = newCells.find((cell: Cell) => cell.rowId === row.rowId)!;
          return {
            ...row,
            [newColumn.id]: newCell
              ? { id: newCell.id, value: newCell.value }
              : { id: "", value: "" }, // Fallback in case a cell is missing
          } as TableRow;
        });
      });
    } catch (error) {
      console.error("Error adding column:", error);
    }
  };
  
  // Adding new row to db
  const handleNewRow = (newRow: TableRow) => {
    setData((prevData) => [...prevData, newRow]); // Append new row
  };

  const table = useReactTable({
    data,
    columns,
    defaultColumn,
    getCoreRowModel: getCoreRowModel(),
    meta: {
      updateData: (rowIndex, columnId, value) => {
        setData((prevData) =>
          prevData.map((rowData, index) =>
            index === rowIndex
              ? {
                  ...rowData,
                  [columnId]: {
                    id: rowData[columnId]?.id ?? "",
                    value: String(value),
                  },
                }
              : rowData
          )
        );
      },
    },
    filterFns: {
      fuzzy: fuzzyFilter, // Register fuzzy filter globally
    },
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter, // Update filter when it changes
    globalFilterFn: fuzzyFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto">
      <table className="border border-gray-400">
        <thead className="bg-gray-100">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="border border-gray-300 p-1">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border border-gray-100 bg-white">
              {row.getVisibleCells().map((cell) => {
                if (cell.column.id === "add-column") return null;

                return (
                  <td key={cell.id} className="border p-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AirTable;
