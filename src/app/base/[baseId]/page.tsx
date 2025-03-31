"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { SaveProvider } from "~/app/_context/SaveContext";
import { BaseNavbar } from "~/app/_components/BaseNavbar";
import BaseTableTabsBar from "~/app/_components/BaseTableTabsBar";
import { BaseTableNavbar } from "~/app/_components/BaseTableNavbar";
import { AirTable } from "~/app/_components/AirTable";
import { Cell, Table } from "~/types/base";

interface ApiResponse {
  success: boolean;
  tables: Table[];
}

const Base = () => {
  const params = useParams();
  const baseId = params.baseId as string;

  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedTableData, setSelectedTableData] = useState<Table | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [newCells, setNewCells] = useState<Cell[]>([]);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await fetch(`/api/base?baseId=${baseId}`);
        const data: ApiResponse = await res.json() as ApiResponse;

        if (data.success) {
          setTables(data.tables);
          if (data.tables.length > 0) {
            setSelectedTableId(data.tables[0]?.id ?? null);
            setSelectedTableData(data.tables[0] ?? null);
          }
        }
      } catch (error) {
        console.error("Error fetching tables:", error);
      }
    };

    fetchTables().catch(console.error);
  }, [baseId]);

  useEffect(() => {
    if (selectedTableId) {
      const tableData = tables.find((table) => table.id === selectedTableId) ?? null;
      setSelectedTableData(tableData);
    }
  }, [selectedTableId, tables]);

  const handleNewRow = (newCells: Cell[]) => {
    setNewCells(newCells);
  };

  return (
    <SaveProvider>
      <div className="h-screen flex flex-col bg-gray-100">
        <div className="fixed top-0 left-0 w-full z-50">
          <BaseNavbar />
        </div>
        <div className="pt-14">
          <BaseTableTabsBar 
            baseId={baseId}
            tables={tables.map(({ id, name }) => ({ id, name }))}
            setSelectedTableId={setSelectedTableId}
          />
        </div>
        <BaseTableNavbar 
          tableId={selectedTableId}
          globalFilter={globalFilter} 
          setGlobalFilter={setGlobalFilter}
          handleNewRow={handleNewRow}
        />
        <div className="bg-gray-100 h-full">
        <AirTable
            tableData={selectedTableData}
            tableId={selectedTableId}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
            newRowCells={newCells}
          />
        </div>
        <div>hello</div>
      </div>
    </SaveProvider>
  );
};

export default Base;
