"use client";

import { Tabs } from "flowbite-react";
import type { CustomFlowbiteTheme } from "flowbite-react";
import { Flowbite } from "flowbite-react";

export function BaseTableTabsBar() {
  const customTheme: CustomFlowbiteTheme = {
    tabs: {
      base: "gap-0",
      tablist: {
        base: "bg-blue-700",
        tabitem: {
          base: "py-2 px-4 border-x-1",
          variant: {
            default: {
              base: "rounded-t-lg border-0",
              active: {
                on: "bg-white text-black dark:bg-black dark:text-white",
                off: "bg-blue-700 text-white hover:bg-blue-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              }
            }
          }
        }
      },
      tabpanel: "py-0"
    },
  };
  
  return (
    <div>
      <Flowbite theme={{ theme: customTheme }}>
        <Tabs aria-label="Default tabs" variant="default">
          <Tabs.Item active title="Table 1">
            {/* This is <span className="font-medium text-gray-800 dark:text-white">Profile tab's associated content</span>.
            Clicking another tab will toggle the visibility of this one for the next. The tab JavaScript swaps classes to
            control the content visibility and styling. */}
          </Tabs.Item>
          <Tabs.Item title="Table 2">
            {/* This is <span className="font-medium text-gray-800 dark:text-white">Dashboard tab's associated content</span>.
            Clicking another tab will toggle the visibility of this one for the next. The tab JavaScript swaps classes to
            control the content visibility and styling. */}
          </Tabs.Item>
          <Tabs.Item title="Table 3">
            {/* This is <span className="font-medium text-gray-800 dark:text-white">Settings tab's associated content</span>.
            Clicking another tab will toggle the visibility of this one for the next. The tab JavaScript swaps classes to
            control the content visibility and styling. */}
          </Tabs.Item>
          <Tabs.Item title="Table 4">
            {/* This is <span className="font-medium text-gray-800 dark:text-white">Contacts tab's associated content</span>.
            Clicking another tab will toggle the visibility of this one for the next. The tab JavaScript swaps classes to
            control the content visibility and styling. */}
          </Tabs.Item>
        </Tabs>
      </Flowbite>
    </div>
  )
}
