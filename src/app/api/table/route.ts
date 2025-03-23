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
    const body = await req.json();
    const { tableId, cellId, value } = body;

    if (!tableId || !cellId || typeof value !== "string") {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Update the single cell in Prisma
    const updatedCell = await prisma.cell.update({
      where: { id: cellId },
      data: { value },
    });

    return NextResponse.json({ success: true, updatedCell });
  } catch (error) {
    console.error("Error updating cell:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    // Extract tableId from request URL
    const { searchParams } = new URL(req.url);
    const tableId = searchParams.get("tableId");

    if (!tableId) {
      return NextResponse.json({ success: false, error: "Missing tableId" });
    }

    // Fetch table with columns and cells
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        columns: true,
        cells: true,
      },
    });

    if (!table) {
      return NextResponse.json({ success: false, error: "Table not found" });
    }

    // Format cell data into a structured row-based format
    const formattedData: Record<string, Record<string, string>> = {};

    table.cells.forEach((cell) => {
      (formattedData[cell.rowId] ||= {})[cell.columnId] = cell.value;
    });

    return NextResponse.json({
      success: true,
      table,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error fetching table:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch table",
    });
  }
}