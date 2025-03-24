"use client";

import { useState, useEffect } from "react";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
  TableMeta,
  RowData,
} from "@tanstack/react-table";
import { MdOutlineTextFields } from "react-icons/md";
import { FaHashtag } from "react-icons/fa";
import { AddColumnButton } from "~/app/_components/AddColumnButton";
import { Cell, Column } from "~/types/base";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  }
}

interface Props {
  tableData: {
    id: string;
    name: string;
    columns: { id: string; name: string; type: string }[];
    cells: { id: string; columnId: string; value: string; rowId: string }[];
  } | null;
  tableId: string | null;
}

interface AddColumnResponse {
  success: boolean;
  newColumn?: Column;
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

const AirTable: React.FC<Props> = ({ tableData, tableId }) => {
  const [data, setData] = useState<TableRow[]>([]);
  const [columns, setColumns] = useState<ColumnDef<TableRow>[]>([]);

  const formatTableData = (tableData: Props["tableData"]): TableRow[] => {
    if (!tableData) return [];
  
    const formattedData: Record<string, TableRow> = {};
    tableData.cells.forEach((cell) => {
      if (!formattedData[cell.rowId]) {
        formattedData[cell.rowId] = { rowId: cell.rowId } as TableRow;
      }
      formattedData[cell.rowId]![cell.columnId] = { id: cell.id, value: cell.value };
    });
  
    return Object.values(formattedData);
  };
  
  // Create columns
  const generateColumns = (columnsData: { id: string; name: string; type: string }[]) => {
    return [
      ...columnsData.map((col) => ({
        accessorKey: col.id,
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

  // Format cell data into structured row-based format
  useEffect(() => {
    if (!tableData) return;
  
    setData(formatTableData(tableData));
    setColumns(generateColumns(tableData.columns));
  }, [tableData]);

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
          const newCell = newCells.find((cell: Cell) => cell.rowId === row.rowId);
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
  

  const table = useReactTable<TableRow>({
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
