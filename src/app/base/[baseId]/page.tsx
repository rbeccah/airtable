import { BaseNavbar } from "~/app/_components/BaseNavbar";
import { BaseTableTabsBar } from "~/app/_components/BaseTableTabsBar";
import { BaseTableNavbar } from "~/app/_components/BaseTableNavbar";

const Base = () => {
  return (
    <div className="h-screen flex flex-col">
      <div className="fixed top-0 left-0 w-full z-50">
        <BaseNavbar />
      </div>
      <div className="pt-14">
        <BaseTableTabsBar/>
      </div>
      <div className="-pt-2">
        <BaseTableNavbar/> 
      </div>
    </div>
  )
}

export default Base;