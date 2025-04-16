"use client";

import { Button, CustomFlowbiteTheme, Flowbite, Label, Select, TextInput } from "flowbite-react";
import { FormEvent, useEffect, useState } from "react";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import { IoFilterOutline } from "react-icons/io5";
import { AirColumn } from "~/types/base";
import { api } from "~/trpc/react";
import { TRPCClientErrorLike } from "@trpc/client";
import { AppRouter } from "~/server/api/root";
import { TextFilterConditions } from "~/types/view";

interface Props {
  tableId: string,
  viewId: string,
  tableColumns: AirColumn[];
  handleViewApply: () => void;
}

const TextFilterConditionsList: string[] = Object.values(TextFilterConditions);
const conditionsByType: Record<string, string[]> = {
  Text: TextFilterConditionsList,
  Number: [">", "<"],
};

interface FilterCondition {
  column: string;
  condition: string;
  value: string;
}

const BaseFilter: React.FC<Props> = ({ tableId, viewId, tableColumns, handleViewApply }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filters, setFilters] = useState<FilterCondition[]>([]);

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
  const hasActiveFilters = !!existingConditions?.filters?.length;

  useEffect(() => {
    if (existingConditions) {
      setFilters(existingConditions.filters);
    }
  }, [existingConditions, isLoading, isError]);

  const addFilter = () => {
    setFilters([...filters, { column: "", condition: "", value: "" }]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, key: keyof FilterCondition, value: string) => {
    const updatedFilters = filters.map((filter, i) =>
      i === index ? { ...filter, [key]: value } : filter
    );
    setFilters(updatedFilters);
  };

  const utils = api.useUtils();
  const addFilterViewMutation = api.view.updateFilter.useMutation({
    onSuccess: (data) => {
      void utils.view.getViewById.invalidate(viewId);
      handleViewApply();
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      console.error("Error adding filters to view:", error);
    },
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    addFilterViewMutation.mutate({ viewId: viewId, view: {viewId, filters} });
    setIsDropdownOpen(false);
  };

  return (
    <Flowbite theme={{ theme: customTheme }}>
      <div className="relative">
        {/* Filter Button */}
        <Button
          size="sm"
          className={`enabled:hover:bg-gray-100 focus:ring-white mx-0.5 ${
            hasActiveFilters ? "bg-green-100 text-green-700" : "bg-white text-black"
          }`}
          onClick={() => setIsDropdownOpen((prev) => !prev)}
        >
          <IoFilterOutline className="mr-2 h-5 w-5" />
          Filter
        </Button>

        {isDropdownOpen && (
          <div className="absolute mt-2 z-40 bg-white shadow-lg rounded-lg p-3 w-[600px]">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-start">
              <Label value="In this view, show records where" />

              {/* Dynamic Filters */}
              {filters.map((filter, index) => {
                const column = tableColumns.find((col) => col.id === filter.column);
                const availableConditions = column ? conditionsByType[column.type] ?? [] : [];

                return (
                  <div key={index} className="flex gap-2 items-center w-full">
                    {/* Column Selector */}
                    <Select
                      value={filter.column}
                      onChange={(e) => updateFilter(index, "column", e.target.value)}
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
                      value={filter.condition}
                      onChange={(e) => updateFilter(index, "condition", e.target.value)}
                      className="w-1/3"
                      required
                      disabled={!filter.column}
                    >
                      <option value="" disabled>Select Condition</option>
                      {availableConditions.map((cond) => (
                        <option key={cond} value={cond}>
                          {cond}
                        </option>
                      ))}
                    </Select>

                    {/* Value Input */}
                    <TextInput
                      type={column?.type === "Number" ? "number" : "text"}
                      value={filter.value}
                      onChange={(e) => updateFilter(index, "value", e.target.value)}
                      className="w-1/3"
                      required={!["is empty", "is not empty"].includes(filter.condition)}
                      disabled={["is empty", "is not empty"].includes(filter.condition)}
                    />

                    {/* Remove Filter Button */}
                    <Button size="xs" color="red" onClick={() => removeFilter(index)}>
                      <IoMdClose />
                    </Button>
                  </div>
                );
              })}

              <div className="flex flex-row self-end">
                {/* Add Filter Button */}
                <Button className="self-start mt-4 mr-5" color="white" onClick={addFilter} type="button">
                  <IoMdAdd className="mr-2 h-5 w-5" />
                  Add Filter
                </Button>

                {/* Apply Filters Button */}
                <Button className="self-end mt-4" color="blue" type="submit">
                  Apply Filters
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Flowbite>
  );
}

export default BaseFilter;