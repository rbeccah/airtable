import Link from "next/link";
// import { api, HydrateClient } from "~/trpc/server";
import { SessionProvider } from "next-auth/react"
import { getServerSession } from "next-auth";
import { authOptions } from "~/lib/auth";

import { HomeNavbar } from "~/app/_components/home/HomeNavbar";
import { HomeSideBar } from "~/app/_components/home/HomeSidebar";
import { HomeMainSection } from "~/app/_components/home/HomeMainSection";

const Home = async () => {
  const session = await getServerSession(authOptions);

  // const hello = await api.post.hello({ text: "from tRPC" });
  // void api.post.getLatest.prefetch();

  return (
    <div className="h-screen flex flex-col">
      <div className="fixed top-0 left-0 w-full z-50">
        <HomeNavbar />
      </div>

      <div className="flex flex-row pt-16">
        <div className="fixed top-16 left-0 w-64 h-[calc(100vh-4rem)]">
          <HomeSideBar/>
        </div>

        <div className="flex-1 ml-72 pl-16 pr-12 pt-16 p-8 bg-gray-100 w-full h-screen">
          <HomeMainSection/>
        </div>
      </div>
    </div>
  );
}

export default Home;
