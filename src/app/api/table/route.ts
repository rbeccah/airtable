import { NextResponse } from "next/server";
import { prisma } from "~/lib/db";

interface ColumnInput {
  name: string;
  type: "Text" | "Number";
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

interface RequestBody {
  action: string;
  tableId?: string | null;
  cellId?: string;
  value?: string;
  columnName?: string;
  columnType?: "Text" | "Number";
}

export async function POST(req: Request) {
  try {
    const body: RequestBody & { action: string } = await req.json();

    if (!body.action) {
      return NextResponse.json({ success: false, error: "Missing action type" }, { status: 400 });
    }

    switch (body.action) {
      case "updateCell":
        return await updateCell(body);

      case "addColumn":
        return await addColumn(body);

      default:
        return NextResponse.json({ success: false, error: "Invalid action type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error handling request:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// Updates for a single cell
async function updateCell(body: Pick<RequestBody, "tableId" | "cellId" | "value">) {
  try {
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

// Add a new column to the table
// Add a new column and create cells for existing rows
async function addColumn(body: Pick<RequestBody, "tableId" | "columnName" | "columnType">) {
  try {
    const { tableId, columnName, columnType } = body;

    if (!tableId || !columnName || !columnType) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Create the new column
    const newColumn = await prisma.column.create({
      data: {
        tableId,
        name: columnName,
        type: columnType,
      },
    });

    // Fetch all rows in the table
    const rows = await prisma.cell.findMany({
      where: { tableId },
      select: { rowId: true },
      distinct: ["rowId"], // Get unique row IDs
    });

    // Create new cells for each row in the new column
    const newCells = await prisma.cell.createManyAndReturn({
      data: rows.map((row) => ({
        tableId,
        columnId: newColumn.id,
        rowId: row.rowId,
        value: "", // Default empty value for new cells
      })),
    });

    return NextResponse.json({ success: true, newColumn, newCells });
  } catch (error) {
    console.error("Error adding new column and cells:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}


// Gets the tables including all the columns and cells
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