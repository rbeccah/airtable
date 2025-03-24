import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "~/lib/auth";
import { prisma } from "~/lib/db";
import { faker } from "@faker-js/faker";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = (await req.json()) as { name: string };

  try {
    // Create base
    const base = await prisma.base.create({
      data: {
        name,
        user: { connect: { email: session.user.email } },
      },
    });

    // Create table with default values inside base
    const table = await prisma.table.create({
      data: {
        name: "Table 1",
        baseId: base.id,
        columns: {
          create: [
            { name: "FirstName", type: "Text" },
            { name: "LastName", type: "Text" },
            { name: "Age", type: "Number" },
            { name: "Role", type: "Text" },
          ],
        },
      },
      include: { columns: true },
    });

    // Generate 10 rows of default data using fakerjs
    const defaultData = Array.from({ length: 10 }, () => ({
      tableId: table.id,
      rowId: faker.string.uuid(),
      values: {
        FirstName: faker.person.firstName(),
        LastName: faker.person.lastName(),
        Age: faker.number.int({ min: 20, max: 60 }),
        Role: faker.person.jobTitle(),
      },
    }));

    // Get Column IDs
    const columns = table.columns;

    // Prepare Cell Data
    const fakeCells = defaultData.flatMap((row) =>
      columns.map((col) => ({
        tableId: table.id,
        columnId: col.id,
        rowId: row.rowId,
        value: String(row.values[col.name as keyof typeof row.values] || ""),
      }))
    );

    // Insert fake cell data
    await prisma.cell.createMany({
      data: fakeCells,
    });

    return NextResponse.json(base);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create base" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const baseId = searchParams.get("baseId");

  if (!baseId) {
    return NextResponse.json({ error: "Missing baseId" }, { status: 400 });
  }

  try {
    // Fetch tables with their columns and cells
    const tables = await prisma.table.findMany({
      where: { baseId },
      include: {
        columns: true,
        cells: true,
      },
    });

    return NextResponse.json({ success: true, tables });
  } catch (error) {
    console.error("Error fetching tables:", error);
    return NextResponse.json({ error: "Failed to fetch tables" }, { status: 500 });
  }
}