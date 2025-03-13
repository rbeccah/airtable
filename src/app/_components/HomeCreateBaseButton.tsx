"use client";

import { Dispatch, SetStateAction, useState } from "react";

interface HomeCreateBaseButtonProps {
  setToggleCreateBase: Dispatch<SetStateAction<boolean>>;
}

export function HomeCreateBaseButton({ setToggleCreateBase }: HomeCreateBaseButtonProps) {
  return (
    <button 
      type="button" 
      className="flex flex-row items-center justify-center px-5 py-2.5 text-sm font-medium text-white h-8 w-full inline-flex items-center bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
      onClick={() => setToggleCreateBase(prev => !prev)}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="size-6 mr-4">
        <path strokeLinecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      Create
  </button>
  )
}