"use client";

import { useState, FormEvent } from "react";
import { IoMdAdd } from "react-icons/io";
import { 
  Dropdown,
  Button, 
  Label, 
  TextInput,
  CustomFlowbiteTheme,
  Flowbite,
  Select,
} from "flowbite-react";

export function AddColumnButton({ onAddColumn }: { onAddColumn: (columnName: string, columnType: string) => void }) {
  const [fieldName, setFieldName] = useState("");
  const [columnType, setColumnType] = useState("Text");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
    if (!fieldName.trim()) return;

    onAddColumn(fieldName, columnType);
    setFieldName(""); // Reset input
    setIsDropdownOpen(false); 
  };

  return (
    <Flowbite theme={{ theme: customTheme }}>
      <div className="relative">
        {/* Add Column Button */}
        <button 
          className="flex items-center justify-center w-28 h-6 hover:bg-gray-300 rounded-full"
          onClick={() => setIsDropdownOpen((prev) => !prev)} 
        >
          <IoMdAdd className="w-4 h-4 text-gray-600 " />
        </button>

        {/* Dropdown Content (Hidden when isDropdownOpen is false) */}
        {isDropdownOpen && (
          <div className="absolute mt-2 z-10 bg-white shadow-lg rounded-lg p-3 w-64">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-start">
              <Label htmlFor="fieldName" value="Field name" />
              <TextInput 
                id="fieldName" 
                type="text" 
                className="w-full font-normal" 
                placeholder="Field name"
                value={fieldName}
                onKeyDown={(e) => e.stopPropagation()}
                onChange={(e) => setFieldName(e.target.value)}
                required 
              />
              <div className="block">
                <Label htmlFor="columnType" value="Select column type" />
              </div>
              <Select 
                id="columnType" 
                className="w-full font-normal" 
                value={columnType}
                onChange={(e) => setColumnType(e.target.value)}
                required
              >
                <option>Text</option>
                <option>Number</option>
              </Select>
              <Button className="self-end" color="blue" type="submit">Create field</Button>
            </form>
          </div>
        )}
      </div>
    </Flowbite>
  );
}
