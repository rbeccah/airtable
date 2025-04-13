"use client";

import { TRPCClientErrorLike } from "@trpc/client";
import { Button, CustomFlowbiteTheme, Flowbite, Label, ToggleSwitch } from "flowbite-react";
import { FormEvent, useEffect, useState } from "react";
import { FaRegEyeSlash } from "react-icons/fa6";
import { AppRouter } from "~/server/api/root";
import { api } from "~/trpc/react";
import { AirColumn } from "~/types/base";

interface Props {
  tableId: string,
  viewId: string,
  tableColumns: AirColumn[];
  handleViewApply: () => void;
}

const BaseHide: React.FC<Props> = ({ tableId, viewId, tableColumns, handleViewApply }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (tableColumns) {
      setHiddenColumns(() =>
        Object.fromEntries(tableColumns.map((col) => [col.id, false]))
      );
    }
  }, [tableColumns]);

  const customTheme: CustomFlowbiteTheme = {
    dropdown: {
      content: "p-3 w-64"
    },
    toggleSwitch: {
      toggle: {
        checked: {
          color: {
            default: ""
          }
        }
      }
    }
  };

  const { data: existingConditions, isLoading, isError } = api.view.getViewById.useQuery(viewId);

  useEffect(() => {
    if (existingConditions?.columnVisibility) {
      const visibilityMap = Object.fromEntries(
        existingConditions.columnVisibility.map((c) => [c.columnId, !c.isVisible])
      );
      setHiddenColumns(visibilityMap);
    }
  }, [existingConditions, isLoading, isError]);

  const toggleColumnVisibility = (columnId: string) => {
    setHiddenColumns((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  const addHiddenViewMutation = api.view.updateHide.useMutation({
      onSuccess: (data) => {
        handleViewApply();
      },
      onError: (error: TRPCClientErrorLike<AppRouter>) => {
        console.error("Error adding filters to view:", error);
      },
    });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    addHiddenViewMutation.mutate({ tableId: tableId, view: { viewId, hiddenColumns } });
    setIsDropdownOpen(false);
  };
  
  return (
    <Flowbite theme={{ theme: customTheme }}>
      <div className="relative">
        {/* Hide Button */}
        <Button 
          className="bg-white text-black enabled:hover:bg-gray-100 focus:ring-white mx-1"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
        >
          <FaRegEyeSlash className="mr-2 h-5 w-5" />
          Hide fields
        </Button>

        {isDropdownOpen && (
          <div className="absolute mt-2 z-40 bg-white shadow-lg rounded-lg p-3 w-[300px]">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-start">
              <Label value="In this view, show following columns" />

              {/* Column Toggle List */}
              <div className="flex flex-col gap-2 w-full">
                {tableColumns.map((col) => (
                  <div key={col.id} className="flex items-center px-2 py-1">
                    <ToggleSwitch
                      checked={!hiddenColumns[col.id]}
                      label={col.name}
                      onChange={() => toggleColumnVisibility(col.id)}
                      className="w-4 h-4 mr-10" // Small toggle & margin for spacing
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-row self-end">
                {/* Apply Hiding Columns Button */}
                <Button className="self-end mt-4" color="blue" type="submit">
                  Apply hiding fields
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Flowbite>
  );
}

export default BaseHide;