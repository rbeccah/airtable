import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "~/lib/auth";
import { prisma } from "~/lib/db";
import { faker } from "@faker-js/faker";

// Create base with table and default data
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

    // Create table with default columns
    const table = await prisma.table.create({
      data: {
        name: "Table 1",
        baseId: base.id,
        columns: {
          create: [
            { name: "FirstName", type: "Text" },
            { name: "LastName", type: "Text" },
            { name: "Role", type: "Text" },
          ],
        },
      },
      include: { columns: true },
    });

    // Generate 10 rows of default data using fakerjs
    const defaultData = Array.from({ length: 10 }, () => ({
      FirstName: faker.person.firstName(),
      LastName: faker.person.lastName(),
      Role: faker.person.jobTitle(),
    }));

    // Create rows and cells in a transaction
    await prisma.$transaction(async (prisma) => {
      for (const data of defaultData) {
        // First create the row
        const row = await prisma.row.create({
          data: {
            tableId: table.id,
          },
        });

        // Then create cells for each column
        await Promise.all(
          table.columns.map((column) =>
            prisma.cell.create({
              data: {
                columnId: column.id,
                rowId: row.id,
                value: String(data[column.name as keyof typeof data] || ""),
              },
            })
          )
        );
      }
    });

    return NextResponse.json(base);
  } catch (error) {
    console.error("Error creating base:", error);
    return NextResponse.json(
      { error: "Failed to create base" },
      { status: 500 }
    );
  }
}

// Fetch all tables with given baseId 
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const baseId = searchParams.get("baseId");

  if (!baseId) {
    return NextResponse.json({ error: "Missing baseId" }, { status: 400 });
  }

  try {
    // Fetch tables with their columns, rows, and cells
    const tables = await prisma.table.findMany({
      where: { baseId },
      include: {
        columns: true,
        rows: {
          include: {
            cells: {
              include: {
                column: true,
              },
            },
          },
        },
        views: true,
      },
    });

    // Format the data for easier consumption by the frontend
    const formattedTables = tables.map((table) => ({
      ...table,
      cells: table.rows.flatMap((row) =>
        row.cells.map((cell) => ({
          ...cell,
          rowId: row.id,
          tableId: table.id,
        }))
      ),
    }));

    return NextResponse.json({ success: true, tables: formattedTables });
  } catch (error) {
    console.error("Error fetching tables:", error);
    return NextResponse.json(
      { error: "Failed to fetch tables" },
      { status: 500 }
    );
  }
}