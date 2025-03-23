"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSave } from "~/app/_context/SaveContext";
import {
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  flexRender,
  TableMeta,
  RowData,
} from "@tanstack/react-table";

declare module '@tanstack/react-table' {
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

/**
 * {
      rowId: "row1",
      columnId1: { cellId: "cell1", value: "Alice" },
      ...
    }
 */
type TableRow = { rowId: string } & Record<string, { id: string; value: string }>;

const AirTable: React.FC<Props> = ({ tableData, tableId }) => {
  const [data, setData] = useState<TableRow[]>([]);
  const [columns, setColumns] = useState<ColumnDef<TableRow>[]>([]);

  // Format cell data into structured row-based format
  useEffect(() => {
    if (!tableData) return;

    // Group cells by rowId
    const formattedData: Record<string, TableRow> = {};
    tableData.cells.forEach((cell) => {
      if (!formattedData[cell.rowId]) {
        formattedData[cell.rowId] = { rowId: cell.rowId } as TableRow;
      }
      (formattedData[cell.rowId] as TableRow)[cell.columnId] = { id: cell.id, value: cell.value };
    });

    // Convert the grouped object into an array
    setData(Object.values(formattedData));

    setColumns(
      tableData.columns.map((col) => ({
        accessorKey: col.id,
        header: col.name,
      }))
    );
  }, [tableData]);

  const defaultColumn: Partial<ColumnDef<TableRow>> = {
    cell: ({ getValue, row: { index }, column: { id }, table }) => {
      const cellData = getValue() as { id: string; value: string };
      const [value, setValue] = useState(cellData?.value || "");
  
      const onBlur = () => {
        if (table.options.meta?.updateData) {
          table.options.meta.updateData(index, id, value);
        }
  
        // Save using the correct cell ID
        saveCellData(cellData.id, value);
      };
  
      useEffect(() => {
        setValue(cellData?.value || "");
      }, [cellData]);
  
      return (
        <input
          className="text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 -m-2"
          value={value as string}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onBlur}
        />
      )
    },
  }  

  // Save data function
  const saveCellData = async (cellId: string, value: string) => {
    try {
      const response = await fetch("/api/table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId, cellId, value }),
      });
  
      const result = await response.json();
      if (result.success) {
        console.log("Cell updated successfully!");
      } else {
        console.error("Failed to update cell:", result.error);
      }
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  // React Table instance
  const table = useReactTable<TableRow>({
    data,
    columns,
    defaultColumn,
    getCoreRowModel: getCoreRowModel(),
    // Provide our updateData function to our table meta
    meta: {
      updateData: (rowIndex, columnId, value) => {
        setData((prevData) =>
          prevData.map((rowData, index) =>
            index === rowIndex
              ? {
                  ...rowData,
                  [columnId]: { 
                    id: rowData[columnId]!.id, // Preserve ID or generate a new one
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
      <table className="min-w-full border border-gray-400">
        <thead className="bg-gray-200">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="border border-gray-300 p-2">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border p-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AirTable;
