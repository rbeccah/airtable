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

export function AddDefaultRows() {
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
  };

  return (
    <Flowbite theme={{ theme: customTheme }}>
      <div className="relative">
        {/* Add Default Rows Button */}
        <Button 
          className="bg-white text-black enabled:hover:bg-gray-100 focus:ring-white mx-1"
          onClick={() => setIsDropdownOpen((prev) => !prev)} 
        >
          <MdOutlinePlaylistAdd className="mr-2 h-5 w-5" />
          Add Default Rows
        </Button>

        {isDropdownOpen && (
          <div className="absolute mt-2 z-10 bg-white shadow-lg rounded-lg p-3 w-64">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-start">
              <Label htmlFor="numRows" value="Number of default rows" />
              <TextInput 
                id="numRows" 
                type="number" 
                className="w-full font-normal" 
                placeholder="Number of rows"
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
