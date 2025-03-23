import NextAuth from "next-auth";
import { authOptions } from "~/lib/auth";

const handler: Request = NextAuth(authOptions) as Request;
export { handler as GET, handler as POST }