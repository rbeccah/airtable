"use client";

import { useState, FormEvent } from "react";
import { 
  Dropdown,
  Button, 
  Label, 
  TextInput,
  CustomFlowbiteTheme,
  Flowbite,
  Select,
} from "flowbite-react";
import { MdOutlinePlaylistAdd } from "react-icons/md"
import { IoMdAdd } from "react-icons/io";
import { AirRow, Cell } from "~/types/base";

interface AddDefaultRowsProps {
  tableId: string | null;
  handleNewRow: (newRow: AirRow[]) => void;
}

interface ApiResponse {
  success: boolean;
  newRows?: AirRow[];
  error?: string;
}

export function AddDefaultRows({ tableId, handleNewRow }: AddDefaultRowsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [numRows, setNumRows] = useState(0);

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (numRows <= 0) return;

    const response = await fetch("/api/table", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "addRow",
        tableId,
        numRows,
      }),
    });

    const result = await response.json() as ApiResponse;
    if (result.success && result.newRows) {
      handleNewRow(result.newRows); // Update table when new row is added
    }

    setIsDropdownOpen(false);
  };

  return (
    <Flowbite theme={{ theme: customTheme }}>
      <div className="relative">
        {/* Add Default Rows Button */}
        <Button 
          className="bg-white text-black enabled:hover:bg-gray-100 focus:ring-white"
          onClick={() => setIsDropdownOpen((prev) => !prev)} 
        >
          <MdOutlinePlaylistAdd className="mr-2 h-5 w-5" />
          Add Default Rows
        </Button>

        {isDropdownOpen && (
          <div className="absolute mt-2 z-40 bg-white shadow-lg rounded-lg p-3 w-64">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-start">
              <Label htmlFor="numRows" value="Number of default rows" />
              <TextInput 
                id="numRows" 
                type="number" 
                className="w-full font-normal" 
                placeholder="Number of rows"
                min={1}
                max={10000}
                onKeyDown={(e) => e.stopPropagation()}
                onChange={(e) => setNumRows(parseInt(e.target.value))}
                required 
              />
              <Button className="self-end" color="blue" type="submit">
                <IoMdAdd className="mr-2 h-5 w-5" />
                Add rows
              </Button>
            </form>
          </div>
        )}
      </div>
    </Flowbite>
  );
}