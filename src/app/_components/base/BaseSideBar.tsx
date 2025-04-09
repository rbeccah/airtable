"use client";

import { useState } from "react";
import { CustomFlowbiteTheme, Flowbite, Sidebar, SidebarItem, SidebarItemGroup, SidebarItems } from "flowbite-react";
import { TbLayoutGridRemove } from "react-icons/tb";

interface Props {
  sideBar: boolean,
}

const BaseSideBar: React.FC<Props> = ({ sideBar }) => {

  const customTheme: CustomFlowbiteTheme = {
    
  }
  
  return (
    <Flowbite theme={{ theme: customTheme }}>
      <Sidebar 
        aria-label="Default sidebar example"
        className={`transition-all duration-300 transform ${sideBar ? 'translate-x-0' : '-translate-x-full'} fixed top-30 left-0 h-full w-64 bg-white shadow-lg z-50`}
      >
        <SidebarItems>
          <SidebarItemGroup>
            <SidebarItem href="#" icon={TbLayoutGridRemove}>
              Grid view
            </SidebarItem>
          </SidebarItemGroup>
        </SidebarItems>
      </Sidebar>
    </Flowbite>
  );
}

export default BaseSideBar;