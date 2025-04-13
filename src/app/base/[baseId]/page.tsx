"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { SaveProvider } from "~/app/_context/SaveContext";
import { BaseNavbar } from "~/app/_components/base/BaseNavbar";
import BaseTableTabsBar from "~/app/_components/base/BaseTableTabsBar";
import { BaseTableNavbar } from "~/app/_components/base/BaseTableNavbar";
import { AirTable } from "~/app/_components/table/AirTable";
import { AirColumn, AirRow, Cell, Table } from "~/types/base";
import { api } from "~/trpc/react";
import BaseSideBar from "~/app/_components/base/BaseSideBar";

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
  const [selectedTableColumns, setSelectedTableColumns] = useState<AirColumn[]>();
  const [selectedViewId, setSelectedViewId] = useState<string | null>();
  const [globalFilter, setGlobalFilter] = useState("");
  const [newCells, setNewCells] = useState<AirRow[]>([]);
  const [sideBar, setSideBar] = useState<boolean>(false);
  const [viewApplied, setViewApplied] = useState(false);

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
          setSelectedViewId(data.tables[0]?.views[0]?.id ?? null);
        }
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
    }
  };

  useEffect(() => {
    fetchTables().catch(console.error);
  }, [baseId, selectedTableId, selectedViewId]);

  useEffect(() => {
    if (selectedTableId) {
      const tableData = tables.find((table) => table.id === selectedTableId) ?? null;
      setSelectedTableData(tableData);
      setSelectedTableColumns(tableData?.columns);
    }
  }, [selectedTableId, tables]);

  const handleNewRow = (newCells: AirRow[]) => {
    setNewCells(newCells);
  };

  const handleUpdatingNewColumn = (newColumn: AirColumn) => {
    setSelectedTableColumns(selectedTableColumns?.concat(newColumn));
  }

  const handleViewApply = () => {
    setViewApplied(prev => !prev);
  };

  return (
    <SaveProvider>
      <div className="h-screen flex flex-col bg-gray-100">
        {/* Navbar */}
        <div className="fixed top-0 left-0 w-full z-50">
          <BaseNavbar />
        </div>

        {/* Table Tabs Bar */}
        <div className="pt-14">
          <BaseTableTabsBar 
            baseId={baseId}
            tables={tables.map(({ id, name }) => ({ id, name }))}
            setSelectedTableId={setSelectedTableId}
            onAddTable={handleAddTable}
          />
        </div>

        {/* Base Table Navbar */}
        <BaseTableNavbar 
          tableId={selectedTableId}
          viewId={selectedViewId}
          globalFilter={globalFilter} 
          setGlobalFilter={setGlobalFilter}
          handleNewRow={handleNewRow}
          handleSideBar={setSideBar}
          tableColumns={selectedTableColumns!}
          handleViewApply={handleViewApply}
        />

        {/* Main Content */}
        <div className="flex">
          {/* Sidebar Component */}
          <BaseSideBar sideBar={sideBar} />

          {/* Table Content */}
          <div className={`transition-all duration-300 h-full bg-gray-100 ${sideBar ? 'ml-64' : ''} flex-1`}>
            {selectedTableId && selectedViewId ? (
              <AirTable
                // key={viewApplied ? "view-true" : "view-false"}
                tableData={selectedTableData}
                tableId={selectedTableId}
                handleTableColumns={handleUpdatingNewColumn}
                globalFilter={globalFilter}
                setGlobalFilter={setGlobalFilter}
                newRows={newCells}
                viewId={selectedViewId}
                viewApply={viewApplied}
              />
            ) : (
              <div className="flex justify-center items-center h-full text-gray-500">
                Loading table...
              </div>
            )}
          </div>
        </div>
      </div>
    </SaveProvider>
  );
};

export default Base;
