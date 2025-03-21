"use client";
import { useState } from "react";
import { Button } from "flowbite-react";
import { FaRegEyeSlash } from "react-icons/fa6";
import { IoFilterOutline } from "react-icons/io5";
import { BiSortAlt2 } from "react-icons/bi";
import { FaSave } from "react-icons/fa";
import { useSave } from "~/app/_context/SaveContext";

export function BaseTableNavbar() {
  const { triggerSave } = useSave();

  return (
    <header className="antialiased">
      <nav className="w-full bg-white border border-t-0 border-gray px-2 lg:px-6 py-1 dark:bg-gray-800 z-50">
          <div className="flex flex-wrap items-center">
              <div className="block flex flex-row">
              <Button className="bg-white text-black enabled:hover:bg-gray-100 focus:ring-white mx-1">
                <FaRegEyeSlash className="mr-2 h-5 w-5" />
                Hide fields
              </Button>
              <Button className="bg-white text-black enabled:hover:bg-gray-100 focus:ring-white mx-1">
                <IoFilterOutline className="mr-2 h-5 w-5" />
                Filter
              </Button>
              <Button className="bg-white text-black enabled:hover:bg-gray-100 focus:ring-white mx-1">
                <BiSortAlt2 className="mr-2 h-5 w-5" />
                Sort
              </Button>
              <Button 
                className="bg-blue-600 text-white enabled:hover:bg-blue-700 focus:ring-white mx-1"
                onClick={triggerSave}
              >
                <FaSave className="mr-2 h-5 w-5" />
                Save
              </Button>
              </div>
              <div className="ml-auto flex items-center lg:order-2">
                <form action="#" method="GET" className="hidden lg:block lg:pl-2">
                  <label htmlFor="topbar-search" className="sr-only">Search</label>
                  <div className="relative lg:w-96">
                    <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20"> <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/> </svg>
                    </div>
                    <input type="text" name="email" id="topbar-search" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-9 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" placeholder="Search"/>
                  </div>
                </form>
              </div>
          </div>
      </nav>
    </header>
  )
}