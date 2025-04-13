"use client";

import { useState } from "react";
import { Tabs } from "flowbite-react";
import type { CustomFlowbiteTheme } from "flowbite-react";
import { Flowbite } from "flowbite-react";
import { FaPlus } from "react-icons/fa6";
import { FiChevronDown } from "react-icons/fi";
import { TRPCClientErrorLike } from "@trpc/client";
import { AppRouter } from "~/server/api/root";

interface Props {
  baseId: string;
  tables: { id: string; name: string }[];
  setSelectedTableId: (id: string) => void;
  onAddTable: () => void;
}

const BaseTableTabsBar: React.FC<Props> = ({ baseId, tables, setSelectedTableId, onAddTable }) => {
  const [activeTab, setActiveTab] = useState(0);

  const customTheme: CustomFlowbiteTheme = {
    tabs: {
      base: "gap-2 mt-1",
      tablist: {
        base: "bg-blue-700 pl-4 flex items-center",
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
    <div className="bg-blue-700">
      <Flowbite theme={{ theme: customTheme }}>
        {tables.length > 0 ? (
          <div className="flex items-center">
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

            {/* Add Table Button */}
            <div className="px-3 border-r-2 border-blue-500">
              <FiChevronDown className="text-white"/>
            </div>
            <button 
              className="px-3 bg-transparent text-gray-200 hover:text-white" 
              onClick={onAddTable}
            >
              <div className="flex flex-row items-center justify-center">
                <FaPlus />
                <div className="pl-2">Add or import</div>
              </div>
            </button>
          </div>
        ) : (
          <div></div>
        )}
      </Flowbite>
    </div>
  );
}

export default BaseTableTabsBar;
