import { z } from "zod";
import { prisma } from "~/lib/db";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { faker } from "@faker-js/faker";

// Default data type structure
type DefaultData = {
  FirstName: string;
  LastName: string;
  Role: string;
};

// Function to generate default data for rows
const generateDefaultData = (length: number): DefaultData[] => {
  return Array.from({ length }, () => ({
    FirstName: faker.person.firstName(),
    LastName: faker.person.lastName(),
    Role: faker.person.jobTitle(),
  }));
};

// Function to create rows and cells with default data
const createTableWithDefaultData = async (baseId: string, defaultData: DefaultData[]) => {
  // Get the number of existing tables in the base
  const existingTables = await prisma.table.findMany({
    where: { baseId },
    select: { name: true },
  });

  // Determine the next table number
  const nextTableNumber = existingTables.length + 1;
  const tableName = `Table ${nextTableNumber}`; 
  
  // Create table with columns
   const table = await prisma.table.create({
    data: {
      name: tableName,
      baseId,
      columns: {
        create: [
          { name: "FirstName", type: "Text" },
          { name: "LastName", type: "Text" },
          { name: "Role", type: "Text" },
        ],
      },
    },
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
  
  // Create all rows first
  const rows = await prisma.row.createMany({
    data: defaultData.map(() => ({ tableId: table.id })),
    skipDuplicates: true,
  });
  
  // Get the created row IDs
  const createdRows = await prisma.row.findMany({
    where: { tableId: table.id },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    take: defaultData.length,
  });
  
  // Create all cells in bulk
  await prisma.cell.createMany({
    data: createdRows.flatMap((row, i) => 
      table.columns.map(column => ({
        columnId: column.id,
        rowId: row.id,
        value: String(defaultData[i]![column.name as keyof typeof defaultData[0]] || ""),
      }))
    ),
  });

  return table;
};

export const baseRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ baseName: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { baseName } = input;

      console.log(ctx.session.user.id);
      // Create base
      const base = await prisma.base.create({
        data: {
          name: baseName,
          user: { connect: { email: ctx.session.user.email } },
        },
      });

      // Generate default data
      const defaultData = generateDefaultData(10);

      // Create table with default columns
      const table = await createTableWithDefaultData(base.id, defaultData)

      return base;
    }),

  createTable: protectedProcedure
    .input(z.object({ baseId: z.string() }))
    .mutation(async ({ input }) => {
      const { baseId } = input;

      // Validate if the base exists
      const base = await prisma.base.findUnique({
        where: { id: baseId },
      });

      if (!base) {
        throw new Error("Base not found");
      }

      // Generate default data
      const defaultData = generateDefaultData(10);

      // Create table with default columns
      const table = await createTableWithDefaultData(base.id, defaultData)

      return table;
    }),
});
