import Link from "next/link";

import { SignInButton } from "~/app/_components/SignInButton";
import { api, HydrateClient } from "~/trpc/server";

import Image from "next/image";
import Logo from "public/logo.png";

export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });

  void api.post.getLatest.prefetch();

  return (
    <HydrateClient>
        <div className="flex flex-row">
          <div className="bg-gradient-to-tr from-blue-200 to-rose-200 bg-linear-65 basis-3/5 w-screen h-screen">
            <div className="flex flex-col m-20 pt-48 pl-20 pr-20">
              <article className="prose lg:prose-xl flex flex-col items-start justify-start">
                <h1>Supercharge Your Workflow</h1>
                <p>🚀 Streamline your processes, enhance team collaboration, and unlock new productivity levels—all in one intuitive platform.</p>
              </article>
            </div>
          </div>
          <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 basis-2/5">
            <Image src={Logo} alt="Description" width={400} height={300} />
            <article className="prose lg:prose-xl flex flex-col items-center justify-center">
              <h2>Sign In</h2>
              <SignInButton/>
            </article>
          </div>
        </div>
    </HydrateClient>
  );
}
