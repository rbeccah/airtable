import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "~/lib/auth";
import { prisma } from "~/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();

  try {
    const base = await prisma.base.create({
      data: {
        name,
        user: { connect: { email: session.user.email } },
      },
    });

    return NextResponse.json(base);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create base" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bases = await prisma.base.findMany({
      where: {
        user: { email: session.user.email },
      },
      include: { tables: true },
    });

    return NextResponse.json(bases);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch bases" }, { status: 500 });
  }
}
