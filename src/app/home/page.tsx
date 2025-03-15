import Link from "next/link";
// import { api, HydrateClient } from "~/trpc/server";
import { HomeNavbar } from "~/app/_components/HomeNavbar";
import { HomeSideBar } from "~/app/_components/HomeSidebar";
// import { useState } from "react";
import { SessionProvider } from "next-auth/react"
import { getServerSession } from "next-auth";
import { authOptions } from "~/lib/auth";

const Home = async () => {
  // const [toggleCreateBase, setToggleCreateBase] = useState<boolean>(false);

  const session = await getServerSession(authOptions);
  console.log(session);

  // const hello = await api.post.hello({ text: "from tRPC" });
  // void api.post.getLatest.prefetch();

  return (
    // <HydrateClient>
      <div className="h-screen flex flex-col">
        <div className="fixed top-0 left-0 w-full z-50">
          <HomeNavbar />
        </div>

        <div className="flex flex-row pt-16">
          <div className="fixed top-16 left-0 w-64 h-[calc(100vh-4rem)]">
            <HomeSideBar/>
          </div>

          <div className="flex-1 ml-72 pl-20 pt-16 p-8 bg-gray-100 w-full h-screen">
            <article className="prose lg:prose-xl flex flex-col items-start justify-start">
              <h2>Home</h2>
            </article>
          </div>
        </div>
      </div>
    // </HydrateClient>
  );
}

export default Home;
