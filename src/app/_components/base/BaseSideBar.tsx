"use client";

import { Dispatch, SetStateAction, useState } from "react";
import { CustomFlowbiteTheme, Flowbite, Sidebar, SidebarItem, SidebarItemGroup, SidebarItems } from "flowbite-react";
import { TbLayoutGridRemove } from "react-icons/tb";
import { api } from "~/trpc/react";
import BaseCreateViewButton from "./BaseCreateViewButton";
import { SideBarView } from "~/types/base";

interface Props {
  sideBar: boolean;
  tableId: string;
  selectedViewId: string;
  setViewMap: Dispatch<SetStateAction<Record<string, string | null>>>;
}

const BaseSideBar: React.FC<Props> = ({ sideBar, tableId, selectedViewId, setViewMap }) => {
  const [views, setViews] = useState<SideBarView[]>([]);
  const { data, refetch } = api.view.getViewsForSideBar.useQuery(tableId);

  const customTheme: CustomFlowbiteTheme = {}

  const handleSelectView = (viewId: string) => {
    setViewMap((prev) => ({
      ...prev,
      [tableId]: viewId,
    }));
  };
  
  return (
    <Flowbite theme={{ theme: customTheme }}>
      <Sidebar
        aria-label="Default sidebar example"
        className={`transition-all duration-300 transform ${
          sideBar ? 'translate-x-0' : '-translate-x-full'
        } fixed top-30 left-0 h-full w-64 bg-white shadow-lg z-20 flex flex-col`}
      >
        {/* Top content */}
        <SidebarItems>
          <SidebarItemGroup>
            {data?.map((view) => (
              <SidebarItem 
                key={view.id} 
                onClick={() => handleSelectView(view.id)}
                className={view.id === selectedViewId ? "bg-blue-100 text-blue-700" : ""}
              >
                {view.name}
              </SidebarItem>
            ))}
          </SidebarItemGroup>
        </SidebarItems>

        {/* Bottom content */}
        <div className="mt-auto p-4">
          <BaseCreateViewButton tableId={tableId} refetch={refetch} />
        </div>
      </Sidebar>
    </Flowbite>
  );
}

export default BaseSideBar;