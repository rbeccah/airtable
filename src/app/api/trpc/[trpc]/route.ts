import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const handler = async (req: NextRequest) => {
  console.log("Incoming request to tRPC");
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ req, headers: req.headers }),
  });
};

export { handler as GET, handler as POST };