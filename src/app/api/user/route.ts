import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "~/lib/auth";
import { prisma } from "~/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);  
  const session = await getServerSession(authOptions);
  const type = searchParams.get("type");

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (type === "bases") {
      const bases = await prisma.base.findMany({
        where: {
          user: { email: session.user.email },
        },
        include: { tables: true },
      });
      return NextResponse.json(bases);
    }

    return NextResponse.json({ success: false, error: "Invalid request type" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch bases" }, { status: 500 });
  }
}