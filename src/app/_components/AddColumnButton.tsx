"use client";

import { useState, useEffect } from "react";
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

export function AddColumnButton() {
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
  }

  return (
    <Flowbite theme={{ theme: customTheme }}>
      <Dropdown label="" dismissOnClick={false} 
        renderTrigger={() => 
          <button 
            // onClick={handleAddColumn} 
            className="flex items-center justify-center w-28 h-6 hover:bg-gray-300 rounded-full"
          >
            <IoMdAdd className="w-4 h-4 text-gray-600 " />
          </button>
        }>
        <form className="flex max-w-md flex flex-col gap-4 items-start">
          <Label htmlFor="columnType" value="Field name" />
          <TextInput id="fieldName" type="text" className="w-full font-normal focus:ring-blue-500 focus:border-blue-500" placeholder="Field name" required />
          <div className="block">
          <Label htmlFor="columnType" value="Select column type" />
          </div>
          <Select id="columnType" className="w-full font-normal" required>
            <option>Text</option>
            <option>Number</option>
          </Select>
          <Button className="self-end" color="blue" type="submit">Create field</Button>
        </form>
      </Dropdown>
    </Flowbite>
  );
}