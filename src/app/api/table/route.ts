import { NextResponse } from "next/server";
import { prisma } from "~/lib/db";
import { faker } from "@faker-js/faker";

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
  numRows?: number;
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
      case "addRow":
        return await addRow(body);
      default:
        return NextResponse.json({ success: false, error: "Invalid action type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error handling request:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// Updates for a single cell
async function updateCell(body: Pick<RequestBody, "cellId" | "value">) {
  try {
    const { cellId, value } = body;

    if (!cellId || typeof value !== "string") {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

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

// Add a new column and create cells for existing rows
async function addColumn(body: Pick<RequestBody, "tableId" | "columnName" | "columnType">) {
  try {
    const { tableId, columnName, columnType } = body;

    if (!tableId || !columnName || !columnType) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Create the new column
    const newColumn = await prisma.column.create({
      data: { tableId, name: columnName, type: columnType },
    });

    // Fetch all row IDs in the table
    const rowIds = await prisma.row.findMany({
      where: { tableId },
      select: { id: true },
    });

    if (rowIds.length === 0) {
      return NextResponse.json({ success: true, newColumn, newCells: [] });
    }

    // Batch insert new cells using createMany
    await prisma.cell.createMany({
      data: rowIds.map(row => ({
        columnId: newColumn.id,
        rowId: row.id,
        value: "", // Default empty value
      })),
    });

    // Fetch the newly created cells
    const newCells = await prisma.cell.findMany({
      where: { columnId: newColumn.id },
    });

    return NextResponse.json({ success: true, newColumn, newCells });
  } catch (error) {
    console.error("Error adding new column and cells:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// Adds row(s) to the table
async function addRow(body: Pick<RequestBody, "tableId" | "numRows">) {
  try {
    const { tableId, numRows = 1 } = body;

    if (!tableId) {
      return NextResponse.json({ success: false, error: "Missing tableId" }, { status: 400 });
    }

    // 1. Get columns (only what we need)
    const columns = await prisma.column.findMany({
      where: { tableId },
      select: { id: true, name: true }
    });

    if (columns.length === 0) {
      return NextResponse.json({ success: false, error: "No columns found" }, { status: 400 });
    }

    // 2. Create all rows at once
    const createdRowIds = await prisma.$transaction(async (tx) => {
      // Insert all rows
      await tx.row.createMany({
        data: Array(numRows).fill({ tableId }),
      });

      // Get the IDs of the newly created rows
      const createdRows = await tx.row.findMany({
        where: { tableId },
        orderBy: { createdAt: 'desc' },
        take: numRows,
        select: { id: true }
      });

      return createdRows.map(row => row.id);
    });

    // 3. Create all cells in bulk
    const cellsData = createdRowIds.flatMap(rowId =>
      columns.map(column => ({
        columnId: column.id,
        rowId,
        value: generateDefaultValue(column.name),
      }))
    );

    await prisma.cell.createMany({
      data: cellsData,
    });

    // 4. Fetch the complete created rows with their cells
    const newRows = await prisma.row.findMany({
      where: { id: { in: createdRowIds } },
      include: {
        cells: {
          select: {
            id: true,
            columnId: true,
            value: true
          }
        }
      },
      orderBy: { createdAt: 'desc' } // Maintain creation order
    });

    return NextResponse.json({ 
      success: true, 
      newRows: newRows.map(row => ({
        id: row.id,
        tableId: row.tableId,
        cells: row.cells,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
      })),
      message: `Successfully added ${numRows} row(s)`
    });

  } catch (error) {
    console.error("Error adding rows:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// Function to generate default values based on column name
function generateDefaultValue(columnName: string): string {
  switch (columnName) {
    case "FirstName":
      return faker.person.firstName();
    case "LastName":
      return faker.person.lastName();
    case "Role":
      return faker.person.jobTitle();
    default:
      return ""; // Empty by default for other columns
  }
}