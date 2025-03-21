import { SaveProvider } from "~/app/_context/SaveContext";
import { BaseNavbar } from "~/app/_components/BaseNavbar";
import { BaseTableTabsBar } from "~/app/_components/BaseTableTabsBar";
import { BaseTableNavbar } from "~/app/_components/BaseTableNavbar";
import { AirTable } from "~/app/_components/AirTable";

const Base = () => {
  return (
    <SaveProvider>
      <div className="h-screen flex flex-col">
        <div className="fixed top-0 left-0 w-full z-50">
          <BaseNavbar />
        </div>
        <div className="pt-14">
          <BaseTableTabsBar />
        </div>
        <BaseTableNavbar />
        <AirTable />
      </div>
    </SaveProvider>
  )
}

export default Base;