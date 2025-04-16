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
  const [searchString, setSearchString] = useState("");
  const [newCells, setNewCells] = useState<AirRow[]>([]);
  const [sideBar, setSideBar] = useState<boolean>(false);
  const [viewApplied, setViewApplied] = useState(false);

  // View ID functionality
  const [viewMap, setViewMap] = useState<Record<string, string | null>>({});
  const selectedViewId = selectedTableId ? viewMap[selectedTableId] : null;

  const { data: baseInfo, isLoading: isBaseNameLoading } = api.base.getBaseNameById.useQuery({ baseId });

  useEffect(() => {
    // fallback if no tables
    if (tables.length === 0) return;
  
    // set default table if none selected
    let tableId = selectedTableId;
    if (!tableId || !tables.some((t) => t.id === tableId)) {
      tableId = tables[0]!.id;
      setSelectedTableId(tableId);
    }
  
    // find the actual table
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
  
    setSelectedTableData(table);
    setSelectedTableColumns(table.columns);
  
    // find view from map or default to first view
    const viewId = viewMap[table.id] ?? table.views[0]?.id ?? null;
  
    if (!viewId) return;
    setViewMap((prev) => ({ ...prev, [table.id]: viewId }));
  }, [tables, selectedTableId]);

  // Function to add a new table
  const createTableMutation = api.base.createTable.useMutation({
    onSuccess: (newTable: Table) => {
      setTables((prevTables) => [...prevTables, newTable]);
      if (newTable.views.length > 0) {
        setViewMap((prev) => ({
          ...prev,
          [newTable.id]: newTable.views[0]!.id,
        }));
      }
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
          const firstTable = data.tables[0];
          if (firstTable) {
            setSelectedTableId(firstTable.id);
            setViewMap((prev) => ({
              ...prev,
              [firstTable.id]: firstTable.views[0]?.id ?? null,  // Or any default value you prefer
            }));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching tables:", error);
    }
  };

  const handleNewRow = (newCells: AirRow[]) => {
    setNewCells(newCells);
  };

  const handleUpdatingNewColumn = (columns: AirColumn[]) => {
    setSelectedTableColumns(columns);
  }

  const handleViewApply = () => {
    setViewApplied(prev => !prev);
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

  return (
    <SaveProvider>
      <div className="h-screen flex flex-col bg-gray-100">
        {/* Navbar */}
        <div className="fixed top-0 left-0 w-full z-50">
          {baseInfo && (
            <BaseNavbar baseId={baseInfo.baseId} baseName={baseInfo.name} />
          )}
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
          searchString={searchString} 
          setSearchString={setSearchString}
          handleNewRow={handleNewRow}
          handleSideBar={setSideBar}
          tableColumns={selectedTableColumns!}
          handleViewApply={handleViewApply}
        />

        {/* Main Content */}
        <div className="flex h-full">
          {/* Sidebar Component */}
          <BaseSideBar 
            sideBar={sideBar} 
            tableId={selectedTableId!} 
            setViewMap={setViewMap}
            selectedViewId={selectedViewId!}
          />

          {/* Table Content */}
          <div className={`transition-all duration-300 h-full bg-gray-100 ${sideBar ? 'ml-56' : ''} flex-1`}>
            {selectedTableId && selectedViewId ? (
              <AirTable
                key={viewApplied ? "view-true" : "view-false"}
                tableData={selectedTableData}
                tableId={selectedTableId}
                handleTableColumns={handleUpdatingNewColumn}
                searchString={searchString}
                setSearchString={setSearchString}
                newCells={newCells}
                setNewCells={setNewCells}
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
