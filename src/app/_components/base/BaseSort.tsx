"use client";

import { TRPCClientErrorLike } from "@trpc/client";
import { Button, CustomFlowbiteTheme, Flowbite, Label, Select } from "flowbite-react";
import { FormEvent, useEffect, useState } from "react";
import { BiSortAlt2 } from "react-icons/bi";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import { AppRouter } from "~/server/api/root";
import { api } from "~/trpc/react";
import { AirColumn } from "~/types/base";
import { TextSortConditions, NumSortConditions } from "~/types/view";

interface Props {
  tableId: string,
  viewId: string,
  tableColumns: AirColumn[];
  handleViewApply: () => void;
}

interface SortCondition {
  column: string;
  order: string;
}

const TextSortConditionsList: string[] = Object.values(TextSortConditions);
const NumSortConditionsList: string[] = Object.values(NumSortConditions);
const conditionsByType: Record<string, string[]> = {
  Text: TextSortConditionsList,
  Number: NumSortConditionsList,
};

const BaseSort: React.FC<Props> = ({ tableId, viewId, tableColumns, handleViewApply }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sorts, setSorts] = useState<SortCondition[]>([]);

  const customTheme: CustomFlowbiteTheme = {
    dropdown: {
      content: "p-3 w-64"
    },
    textInput: {
      field: {
        input: {
          colors: {
            gray: "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          }
        }
      }
    },
    select: {
      field: {
        select: {
          colors: {
            gray: "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          }
        }
      }
    }
  };

  const { data: existingConditions, isLoading, isError } = api.view.getViewById.useQuery(viewId);

  useEffect(() => {
    if (existingConditions) {
      setSorts(existingConditions.sort);
    }
  }, [existingConditions, isLoading, isError]);

  const addSort = () => {
    setSorts([...sorts, { column: "", order: "" }]);
  };

  const removeSort = (index: number) => {
    setSorts(sorts.filter((_, i) => i !== index));
  };

  const updateSort = (index: number, key: keyof SortCondition, value: string) => {
    const updatedSorts = sorts.map((filter, i) =>
      i === index ? { ...filter, [key]: value } : filter
    );
    setSorts(updatedSorts);
  };

  const addSortMutation = api.view.updateSort.useMutation({
      onSuccess: (data) => {
        handleViewApply();
      },
      onError: (error: TRPCClientErrorLike<AppRouter>) => {
        console.error("Error adding filters to view:", error);
      },
    });
  
    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      addSortMutation.mutate({ tableId: tableId, view: {viewId, sorts} });
      setIsDropdownOpen(false);
    };

  return (
    <Flowbite theme={{ theme: customTheme }}>
      <div className="relative">
        {/* Filter Button */}
        <Button 
          className="bg-white text-black enabled:hover:bg-gray-100 focus:ring-white mx-1"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
        >
          <BiSortAlt2 className="mr-2 h-5 w-5" />
          Sort
        </Button>

        {isDropdownOpen && (
          <div className="absolute mt-2 z-20 bg-white shadow-lg rounded-lg p-3 w-[600px]">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-start">
              <Label value="In this view, show records where" />

              {/* Dynamic Filters */}
              {sorts.map((sort, index) => {
                const column = tableColumns.find((col) => col.id === sort.column);
                const availableConditions = column ? conditionsByType[column.type] || [] : [];

                return (
                  <div key={index} className="flex gap-2 items-center w-full">
                    {/* Column Selector */}
                    <Select
                      value={sort.column}
                      onChange={(e) => updateSort(index, "column", e.target.value)}
                      className="w-1/3"
                      required
                    >
                      <option value="" disabled>Select Column</option>
                      {tableColumns.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.name}
                        </option>
                      ))}
                    </Select>

                    {/* Condition Selector */}
                    <Select
                      value={sort.order}
                      onChange={(e) => updateSort(index, "order", e.target.value)}
                      className="w-1/3"
                      required
                      disabled={!sort.column}
                    >
                      <option value="" disabled>Select Condition</option>
                      {availableConditions.map((cond) => (
                        <option key={cond} value={cond}>
                          {cond}
                        </option>
                      ))}
                    </Select>

                    {/* Remove Sort Button */}
                    <Button size="xs" color="red" onClick={() => removeSort(index)}>
                      <IoMdClose />
                    </Button>
                  </div>
                );
              })}

              <div className="flex flex-row self-end">
                {/* Add Sort Button */}
                <Button className="self-start mt-4 mr-5" color="white" onClick={addSort} type="button">
                  <IoMdAdd className="mr-2 h-5 w-5" />
                  Add another sort
                </Button>

                {/* Apply Filters Button */}
                <Button className="self-end mt-4" color="blue" type="submit">
                  Apply sort
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Flowbite>
  );
}

export default BaseSort;