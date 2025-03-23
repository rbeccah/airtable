"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { SaveProvider } from "~/app/_context/SaveContext";
import { BaseNavbar } from "~/app/_components/BaseNavbar";
import BaseTableTabsBar from "~/app/_components/BaseTableTabsBar";
import { BaseTableNavbar } from "~/app/_components/BaseTableNavbar";
import AirTable from "~/app/_components/AirTable";

const Base = () => {
  const params = useParams();
  const baseId = params.baseId as string;

  const [tables, setTables] = useState<any[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedTableData, setSelectedTableData] = useState<any>(null);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await fetch(`/api/base?baseId=${baseId}`);
        const data = await res.json();
        if (data.success) {
          setTables(data.tables);
          if (data.tables.length > 0) {
            setSelectedTableId(data.tables[0].id);
            setSelectedTableData(data.tables[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching tables:", error);
      }
    };

    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTableId) {
      const tableData = tables.find((table) => table.id === selectedTableId);
      setSelectedTableData(tableData || null);
    }
  }, [selectedTableId, tables]);

  return (
    <SaveProvider>
      <div className="h-screen flex flex-col">
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
        <BaseTableNavbar />
        <div className="bg-gray-100 h-full">
          <AirTable tableData={selectedTableData} tableId={selectedTableId}/>
        </div>
      </div>
    </SaveProvider>
  )
}

export default Base;