import Link from "next/link";

import { api, HydrateClient } from "~/trpc/server";
import { HomeNavbar } from "~/app/_components/HomeNavbar";
import { HomeSideBar } from "~/app/_components/HomeSidebar";

export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });

  void api.post.getLatest.prefetch();

  return (
    <HydrateClient>
        <div className="flex flex-row">
          <HomeNavbar/>
          <div className="pt-64">
            <HomeSideBar/>
          </div>
        </div>
    </HydrateClient>
  );
}
