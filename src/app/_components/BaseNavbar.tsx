"use client";
import { useState } from "react";
import { signOut } from "next-auth/react"
import Image from "next/image";
import { IoMdArrowRoundBack } from "react-icons/io";
import { useRouter } from "next/navigation";

export function BaseNavbar() {
  const router = useRouter();
  const [userMenu, setUserMenu] = useState(false);

  const toggleUserMenu = () => {
    setUserMenu((prev) => !prev);
  };

  return (
    <header className="antialiased">
      <nav className="fixed top-0 left-0 w-full bg-blue-600 px-4 lg:px-6 py-2.5 dark:bg-gray-800 z-50">
          <div className="flex flex-wrap items-center">
          <button 
            type="button" 
            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm p-2.5 text-center inline-flex items-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 mr-5"
            onClick={() => router.push(`/home`)}
          >
            <IoMdArrowRoundBack className="h-5 w-5"/>
          </button>
              <div className="flex justify-start items-center">
                <Image src="/airtable_white.svg" width={32} height={32} alt="Airtable Logo" />
              </div>
              <div className="block">
                  <input 
                    type="text" 
                    id="default-input" 
                    className="bg-blue-600 border border-blue-600 text-white placeholder-white text-xl font-bold rounded-lg focus:ring-blue-500 focus:border-blue-300 block w-full p-1 pl-2"
                    placeholder="Untitled Base"
                  />
              </div>
              <div className="ml-auto flex items-center lg:order-2">
                <div className="relative">
                  {/* User Menu */}
                  <button 
                    type="button" 
                    className="flex mx-3 text-sm bg-gray-800 rounded-full md:mr-0 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600" 
                    id="user-menu-button" 
                    aria-expanded="false" 
                    data-dropdown-toggle="dropdown"
                    onClick={toggleUserMenu}
                  >
                      <span className="sr-only">Open user menu</span>
                      <img className="w-8 h-8 rounded-full" src="https://flowbite.com/docs/images/people/profile-picture-5.jpg" alt="user photo"/>
                  </button>

                  {/* Dropdown menu */}
                  {userMenu && (
                  <div className="absolute mt-2 -left-44 mr-64 z-50 my-4 w-56 text-base list-none bg-white rounded divide-y divide-gray-100 shadow dark:bg-gray-700 dark:divide-gray-600" id="dropdown">
                      <div className="py-3 px-4">
                          <span className="block text-sm font-semibold text-gray-900 dark:text-white">John Doe</span>
                          <span className="block text-sm text-gray-500 truncate dark:text-gray-400">name@airtable.com</span>
                      </div>
                      <ul className="py-1 text-gray-500 dark:text-gray-400" aria-labelledby="dropdown">
                          <li>
                              <a href="#" className="block py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-400 dark:hover:text-white">My profile</a>
                          </li>
                          <li>
                              <a href="#" className="block py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-400 dark:hover:text-white">Account settings</a>
                          </li>
                      </ul>
                      <ul className="py-1 text-gray-500 dark:text-gray-400" aria-labelledby="dropdown">
                          <li>
                              <a 
                                href="#" 
                                className="block py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                                onClick={() => signOut({ callbackUrl: 'http://localhost:3000' })}
                              >
                                Sign out
                              </a>
                          </li>
                      </ul>
                  </div>
                  )}
                </div>
              </div>
          </div>
      </nav>
    </header>
  )
}