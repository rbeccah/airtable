import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "~/lib/db";

interface ColumnInput {
  name: string;
  type: "TEXT" | "NUMBER";
}

interface CellInput {
  columnName: string;
  value: string;
}

interface TableInput {
  name: string;
  columns: ColumnInput[];
  cells: CellInput[];
}

export async function POST(req: Request) {
  try {
    const { baseId, tableId, data } = await req.json();

    if (!baseId || !data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ success: false, error: "Invalid input" });
    }

    // Extract column names and types
    const firstRow = data[0];
    const columns: ColumnInput[] = Object.keys(firstRow).map((key) => ({
      name: key,
      type: typeof firstRow[key] === "number" ? "NUMBER" : "TEXT",
    }));

    let table;

    if (tableId) {
      // Find the specific table
      table = await prisma.table.findUnique({
        where: { id: tableId, baseId },
        include: { columns: true },
      });

      if (!table) {
        return NextResponse.json({ success: false, error: "Table not found" });
      }
    } else {
      // If no tableId is provided, create a new table
      table = await prisma.table.create({
        data: {
          name: `New Table`,
          baseId,
          columns: {
            create: columns,
          },
        },
        include: { columns: true },
      });
    }

    // Map existing columns
    const columnMap = table.columns.reduce(
      (acc, col) => ({ ...acc, [col.name]: col.id }),
      {} as Record<string, string>
    );

    // Add new columns if needed
    const newColumns = columns.filter((col) => !columnMap[col.name]);

    if (newColumns.length > 0) {
      const createdColumns = await prisma.column.createMany({
        data: newColumns.map((col) => ({ ...col, tableId: table!.id })),
      });

      // Refresh table with new columns
      table = await prisma.table.findUnique({
        where: { id: table.id },
        include: { columns: true },
      });

      if (!table) {
        throw Error;
      }

      table.columns.forEach((col) => {
        columnMap[col.name] = col.id;
      });
    }

    // Insert or update cell data
    const cellRecords = data.flatMap((row) =>
      Object.entries(row).map(([key, value]) => ({
        tableId: table!.id,
        columnId: columnMap[key]!,
        value: String(value),
      }))
    );

    await prisma.cell.createMany({
      data: cellRecords,
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true, tableId: table.id });
  } catch (error) {
    console.error("Error inserting/updating data:", error);
    return NextResponse.json({ success: false, error: "Failed to insert or update data" });
  }
}
