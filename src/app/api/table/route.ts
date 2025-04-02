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
      data: {
        tableId,
        name: columnName,
        type: columnType,
      },
    });

    // Fetch all rows in the table
    const rows = await prisma.row.findMany({
      where: { tableId },
      select: { id: true },
    });

    // Create new cells for each row in the new column
    const newCells = await prisma.$transaction(
      rows.map(row =>
        prisma.cell.create({
          data: {
            columnId: newColumn.id,
            rowId: row.id,
            value: "", // Default empty value
          },
        })
      )
    );

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

    // Fetch all columns in the table once
    const columns = await prisma.column.findMany({
      where: { tableId },
    });

    if (columns.length === 0) {
      return NextResponse.json({ success: false, error: "No columns found for the table" }, { status: 400 });
    }

    // Batch processing parameters
    const BATCH_SIZE = 1000; // Adjust based on your database capabilities
    const totalBatches = Math.ceil(numRows / BATCH_SIZE);
    const allNewRows = [];

    for (let batch = 0; batch < totalBatches; batch++) {
      const currentBatchSize = Math.min(BATCH_SIZE, numRows - (batch * BATCH_SIZE));
      
      const batchResult = await prisma.$transaction(async (prisma) => {
        // Create all rows in this batch at once
        const rowsData = Array(currentBatchSize).fill({ tableId });
        const newRows = await prisma.row.createMany({
          data: rowsData,
          skipDuplicates: true,
        });

        // Get the IDs of the newly created rows
        const rowIds = await prisma.row.findMany({
          where: { tableId },
          orderBy: { createdAt: 'desc' },
          take: currentBatchSize,
          select: { id: true }
        });

        // Prepare all cells for all rows in this batch
        const cellsData = rowIds.flatMap(row => 
          columns.map(column => ({
            columnId: column.id,
            rowId: row.id,
            value: generateDefaultValue(column.name),
          }))
        );

        // Create all cells in bulk
        await prisma.cell.createMany({
          data: cellsData,
          skipDuplicates: true,
        });

        // Fetch the complete data for the response
        const completeRows = await prisma.row.findMany({
          where: { id: { in: rowIds.map(r => r.id) } },
          include: { cells: true }
        });

        return completeRows.map(row => ({
          id: row.id,
          tableId: row.tableId,
          cells: row.cells.map(cell => ({
            id: cell.id,
            columnId: cell.columnId,
            value: cell.value,
            rowId: cell.rowId
          })),
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        }));
      });

      allNewRows.push(...batchResult);
    }

    return NextResponse.json({ 
      success: true, 
      newRows: allNewRows,
      message: `Successfully added ${numRows} row(s)`
    });
  } catch (error) {
    console.error("Error adding rows:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// Gets the table including all columns, rows, and cells
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tableId = searchParams.get("tableId");

    if (!tableId) {
      return NextResponse.json({ success: false, error: "Missing tableId" });
    }

    // Fetch table with columns, rows, and cells
    const table = await prisma.table.findUnique({
      where: { id: tableId },
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
      },
    });

    if (!table) {
      return NextResponse.json({ success: false, error: "Table not found" });
    }

    // Format the data into a structured format
    const formattedData = table.rows.map(row => {
      const rowData: Record<string, any> = { rowId: row.id };
      row.cells.forEach(cell => {
        rowData[cell.columnId] = {
          id: cell.id,
          value: cell.value,
          columnName: cell.column.name,
          columnType: cell.column.type,
        };
      });
      return rowData;
    });

    return NextResponse.json({
      success: true,
      table: {
        id: table.id,
        name: table.name,
        baseId: table.baseId,
        columns: table.columns,
      },
      rows: formattedData,
    });
  } catch (error) {
    console.error("Error fetching table:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch table",
    });
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