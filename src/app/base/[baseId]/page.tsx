"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { SaveProvider } from "~/app/_context/SaveContext";
import { BaseNavbar } from "~/app/_components/base/BaseNavbar";
import BaseTableTabsBar from "~/app/_components/base/BaseTableTabsBar";
import { BaseTableNavbar } from "~/app/_components/base/BaseTableNavbar";
import { AirTable } from "~/app/_components/table/AirTable";
import { AirRow, Cell, Table } from "~/types/base";
import { api } from "~/trpc/react";

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
  const [newCells, setNewCells] = useState<AirRow[]>([]);

  // Function to add a new table
  const createTableMutation = api.base.createTable.useMutation({
    onSuccess: (newTable: Table) => {
      setTables((prevTables) => [...prevTables, newTable]);
    },
    onError: (error) => {
      console.error("Error creating table:", error);
    },
  });

  const handleAddTable = () => {
    createTableMutation.mutate({ baseId });
  };

  const fetchTables = async () => {
    try {
      const res = await fetch(`/api/base?baseId=${baseId}`);
      const data: ApiResponse = await res.json();

      if (data.success) {
        setTables(data.tables);
        if (!selectedTableId || !data.tables.some((t) => t.id === selectedTableId)) {
          setSelectedTableId(data.tables[0]?.id ?? null);
        }
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
    }
  };

  useEffect(() => {
    fetchTables().catch(console.error);
  }, [baseId, selectedTableId]);

  useEffect(() => {
    if (selectedTableId) {
      const tableData = tables.find((table) => table.id === selectedTableId) ?? null;
      setSelectedTableData(tableData);
    }
  }, [selectedTableId, tables]);

  const handleNewRow = (newCells: AirRow[]) => {
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
            onAddTable={handleAddTable}
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
            newRows={newCells}
          />
        </div>
      </div>
    </SaveProvider>
  );
};

export default Base;
