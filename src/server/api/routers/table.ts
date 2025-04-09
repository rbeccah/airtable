import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { prisma } from "~/lib/db";

export const tableRouter = createTRPCRouter({
  getInfiniteRows: protectedProcedure
    .input(z.object({
      tableId: z.string(),
      cursor: z.string().nullish(),
      limit: z.number().min(1).max(100).default(50),
      globalFilter: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const { tableId, cursor, limit } = input;
      
      const rows = await ctx.prisma.row.findMany({
        where: { 
          tableId,
          // Add filtering based on globalFilter if needed
        },
        take: limit + 1, // get an extra item for next cursor
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "asc" },
        include: {
          cells: {
            include: {
              column: true,
            },
          },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (rows.length > limit) {
        const nextRow = rows.pop();
        nextCursor = nextRow?.id;
      }

      return {
        rows,
        nextCursor,
      };
    }),

  // Get table by id
  getTableById: protectedProcedure
    .input(z.object({ tableId: z.string() }))
    .query(async ({ input, ctx }) => {
      const table = await ctx.prisma.table.findUnique({
        where: { id: input.tableId },
        include: {
          columns: true, // Include column definitions
        },
      });

      if (!table) {
        throw new Error("Table not found");
      }

      return table;
    }),
});