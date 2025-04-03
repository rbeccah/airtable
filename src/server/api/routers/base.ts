import { z } from "zod";
import { prisma } from "~/lib/db";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { faker } from "@faker-js/faker";

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
          user: { connect: { email: ctx.session.user.email! } },
        },
      });

      // Rest of your creation logic (same as in API route)
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
      const defaultData = Array.from({ length: 10 }, () => ({
        FirstName: faker.person.firstName(),
        LastName: faker.person.lastName(),
        Role: faker.person.jobTitle(),
      }));

      await prisma.$transaction(async (prisma) => {
        for (const data of defaultData) {
          const row = await prisma.row.create({
            data: {
              tableId: table.id,
            },
          });

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

      return base;
    }),
});