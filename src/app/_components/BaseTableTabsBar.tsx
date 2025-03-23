"use client";

import { useState, useEffect } from "react";
import { Tabs } from "flowbite-react";
import type { CustomFlowbiteTheme } from "flowbite-react";
import { Flowbite } from "flowbite-react";

interface Props {
  baseId: string;
  tables: { id: string; name: string }[];
  setSelectedTableId: (id: string) => void;
}

const BaseTableTabsBar: React.FC<Props> = ({ baseId, tables, setSelectedTableId }) => {
  const [activeTab, setActiveTab] = useState(0);

  const customTheme: CustomFlowbiteTheme = {
    tabs: {
      base: "gap-0",
      tablist: {
        base: "bg-blue-700",
        tabitem: {
          base: "py-2 px-4 border-x-1",
          variant: {
            default: {
              base: "rounded-t-lg border-0",
              active: {
                on: "bg-white text-black dark:bg-black dark:text-white",
                off: "bg-blue-700 text-white hover:bg-blue-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              }
            }
          }
        }
      },
      tabpanel: "py-0"
    },
  };
  
  return (
    <div>
      <Flowbite theme={{ theme: customTheme }}>
        {tables.length > 0 ? (
          <Tabs
            aria-label="Table Tabs"
            variant="default"
            onActiveTabChange={(index) => {
              if (tables[index]) {
                setActiveTab(index);
                setSelectedTableId(tables[index].id);
              }
            }}
          >
            {tables.map((table, index) => (
              <Tabs.Item key={table.id} title={table.name} active={index === activeTab} />
            ))}
          </Tabs>
        ) : (
          <p className="text-white p-4">No tables found</p>
        )}
      </Flowbite>
    </div>
  );
}

export default BaseTableTabsBar;