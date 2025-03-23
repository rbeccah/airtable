import { NextApiHandler } from "next";
import NextAuth from "next-auth";
import { authOptions } from "~/lib/auth"

const handler: NextApiHandler = NextAuth(authOptions);

export { handler as GET, handler as POST }