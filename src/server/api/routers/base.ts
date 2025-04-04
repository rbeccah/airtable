import { z } from "zod";
import { prisma } from "~/lib/db";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { faker } from "@faker-js/faker";

type DefaultData = {
  FirstName: string;
  LastName: string;
  Role: string;
};

export const baseRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { name } = input;
      
      console.log(ctx.session.user.id);
      // Create base
      const base = await prisma.base.create({
        data: {
          name,
          user: { connect: { email: ctx.session.user.email } },
        },
      });
      
      // Create table with columns
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
      
      // Generate default data
      const defaultData: DefaultData[] = Array.from({ length: 10 }, () => ({
        FirstName: faker.person.firstName(),
        LastName: faker.person.lastName(),
        Role: faker.person.jobTitle(),
      }));
      
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
      
      return base;
    }),
});