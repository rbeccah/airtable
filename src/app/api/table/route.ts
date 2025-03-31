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
  numRows?: number
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

// Adds row to the table 
async function addRow(body: Pick<RequestBody, "tableId" | "numRows">) {
  try {
    const { tableId, numRows } = body;

    if (!tableId || !numRows) {
      return NextResponse.json({ success: false, error: "Missing tableId or number of rows" }, { status: 400 });
    }

    // Fetch all columns in the table, including column names
    const columns = await prisma.column.findMany({
      where: { tableId },
      select: { id: true, name: true }, // Include `name` to check column names
    });

    if (columns.length === 0) {
      return NextResponse.json({ success: false, error: "No columns found for the table" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (prisma) => {
      const allNewCells = [];
      
      for (let i = 0; i < numRows; i++) {
        const rowId = crypto.randomUUID();
        
        // Create cells for each column in this row
        const rowCells = await prisma.cell.createManyAndReturn({
          data: columns.map((column) => ({
            tableId,
            columnId: column.id,
            rowId,
            value: generateDefaultValue(column.name), // Better to use type than name
          })),
        });
        
        allNewCells.push(...rowCells);
      }
      
      return allNewCells;
    });

    return NextResponse.json({ 
      success: true, 
      newCells: result,
      message: `Successfully added ${numRows} row(s)`
    });
  } catch (error) {
    console.error("Error adding row:", error);
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