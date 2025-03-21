"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSave } from "~/app/_context/SaveContext";
import {
  Column,
  Table,
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  RowData,
} from '@tanstack/react-table'
import { faker } from "@faker-js/faker";
declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void
  }
}

export function AirTable() {
  const params = useParams();
  const baseId = params.baseId as string;
  const { setSaveHandler } = useSave();

  type TableData = {
    id: number;
    name: string;
    age: number;
    role: string;
  };
  
  // Generate default data using Faker.js
  const generateDefaultData = (count: number): TableData[] => {
    return Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      name: faker.person.fullName(),
      age: faker.number.int({ min: 20, max: 60 }),
      role: faker.person.jobTitle(),
    }));
  };


  const [data, setData] = useState<TableData[]>(generateDefaultData(10));

  // Update cell data
  const handleInputChange = (rowIndex: number, columnId: string, value: string) => {
    setData((prevData) =>
      prevData.map((row, index) =>
        index === rowIndex ? { ...row, [columnId]: value } : row
      )
    );
  };

  const defaultColumn: Partial<ColumnDef<TableData>> = {
    cell: ({ getValue, row: { index }, column: { id }, table }) => {
      const initialValue = getValue()
      // We need to keep and update the state of the cell normally
      const [value, setValue] = useState(initialValue)
  
      // When the input is blurred, we'll call our table meta's updateData function
      const onBlur = () => {
        table.options.meta?.updateData(index, id, value)
      }
  
      // If the initialValue is changed external, sync it up with our state
      useEffect(() => {
        setValue(initialValue)
      }, [initialValue])
  
      return (
        <input
          className="text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          value={value as string}
          onChange={e => setValue(e.target.value)}
          onBlur={onBlur}
        />
      )
    },
  }

  const columns: ColumnDef<TableData>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ getValue }) => <span>{getValue<number>()}</span>,
    },
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "age",
      header: "Age",
    },
    {
      accessorKey: "role",
      header: "Role",
      // cell: ({ row, column, getValue }) => (
      //   <input
      //     type="text"
      //     className="w-full h-full border-none outline-none bg-transparent text-left"
      //     value={getValue<string>()}
      //     onChange={(e) => handleInputChange(row.index, column.id, e.target.value)}
      //   />
      // ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    defaultColumn,
    getCoreRowModel: getCoreRowModel(),
  });

  const saveData = async () => {
    try {
      const response = await fetch("/api/table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseId, data }),
      });

      const result = await response.json();
      if (result.success) {
        alert("Data inserted successfully!");
      } else {
        alert("Failed to insert data: " + result.error);
      }
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  useEffect(() => {
    setSaveHandler(() => () => saveData());
  }, [setSaveHandler]);

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
}