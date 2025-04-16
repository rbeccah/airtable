"use client";
import { useState } from "react";
import { Button } from "flowbite-react";
import { AddDefaultRows } from "~/app/_components/base/AddDefaultRows";
import { AirColumn, AirRow } from "~/types/base";
import { MdDehaze } from "react-icons/md";
import BaseFilter from "./BaseFilter";
import BaseSort from "./BaseSort";
import BaseHide from "./BaseHide";
import { MdListAlt } from "react-icons/md";
import { IoColorFillOutline } from "react-icons/io5";
import { RiShareBoxFill } from "react-icons/ri";
import { TbArrowAutofitHeight } from "react-icons/tb";

interface BaseTableNavbarProps {
  tableId: string | null;
  viewId: string | null | undefined;
  tableColumns: AirColumn[];
  searchString: string;
  setSearchString: (value: string) => void;
  handleNewRow: (newRow: AirRow[]) => void;
  handleSideBar: React.Dispatch<React.SetStateAction<boolean>>;
  handleViewApply: () => void;
}

export function BaseTableNavbar({
  tableId, 
  viewId,
  tableColumns,
  searchString, 
  setSearchString,
  handleNewRow,
  handleSideBar,
  handleViewApply
}: BaseTableNavbarProps) {

  return (
    <header className="antialiased">
      <nav className="w-full bg-white border border-t-0 border-gray py-1 dark:bg-gray-800 z-50">
        <div className="flex flex-wrap items-center items-center">
            <div className="block flex flex-row items-center">
              <div className="border-r-2 mr-1">
                {/* Views Button */}
                <Button 
                  className="bg-white text-black enabled:hover:bg-gray-100 focus:ring-white mx-1"
                  onClick={() => handleSideBar((prev: boolean) => !prev)}
                >
                  <MdDehaze className="mr-2 h-5 w-5" />
                  Views
                </Button>
              </div>

              {/* Hide Columns Button */}
              <BaseHide 
                tableId={tableId!}
                viewId={viewId!} 
                tableColumns={tableColumns}
                handleViewApply={handleViewApply}
              />

              {/* Filter Button */}
              <BaseFilter 
                tableId={tableId!}
                viewId={viewId!} 
                tableColumns={tableColumns}
                handleViewApply={handleViewApply}
              />

              <Button size="sm" className="bg-white text-black enabled:hover:bg-gray-100 focus:ring-white">
                <MdListAlt className="mr-2 h-5 w-5" />
                Group
              </Button>

              {/* Sort Button */}
              <BaseSort 
                tableId={tableId!}
                viewId={viewId!} 
                tableColumns={tableColumns}
                handleViewApply={handleViewApply}
              />

              <Button size="sm" className="bg-white text-black enabled:hover:bg-gray-100 focus:ring-white">
                <IoColorFillOutline className="mr-2 h-5 w-5" />
                Color
              </Button>

              <Button size="sm" className="bg-white text-black enabled:hover:bg-gray-100 focus:ring-white">
                <TbArrowAutofitHeight className="h-5 w-5" />
              </Button>
              
              {/* Add Default Rows Button */}
              <AddDefaultRows tableId={tableId} handleNewRow={handleNewRow} />

              <Button size="sm" className="bg-white text-black enabled:hover:bg-gray-100 focus:ring-white">
                <RiShareBoxFill className="mr-2 h-5 w-5" />
                Share and sync
              </Button>
              </div>
              <div className="ml-auto flex items-center lg:order-2">
                <label htmlFor="topbar-search" className="sr-only">Search</label>
                <div className="relative lg:w-96">
                  <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20"> <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/> </svg>
                  </div>
                  <input
                    type="text"
                    name="search"
                    id="topbar-search"
                    value={searchString}
                    onChange={(e) => setSearchString(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-9 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    placeholder="Search"
                  />
                </div>
            </div>
        </div>
      </nav>
    </header>
  )
}