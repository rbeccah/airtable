import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { prisma } from "~/lib/db";
import { FilterType, TextFilterConditions } from "~/types/view";

export const tableRouter = createTRPCRouter({
  getInfiniteRows: protectedProcedure
    .input(z.object({
      tableId: z.string(),
      cursor: z.string().nullish(),
      limit: z.number().min(1).max(100).default(50),
      viewId: z.string()
    }))
    .query(async ({ input, ctx }) => {
      const { tableId, cursor, limit, viewId } = input;

      // Do row filtering for views
      // Fetch view data (filters, sorting)
      const view = await ctx.prisma.view.findUnique({
        where: { id: viewId },
        select: { filters: true, sort: true },
      });

      if (!view) {
        throw new Error("View not found");
      }

      // Parse filters
      const filters: FilterType[] = view.filters
        ? (Array.isArray(view.filters)
          ? view.filters
          : typeof view.filters === "string"
          ? JSON.parse(view.filters)
          : [])
        : [];

      // Construct filter conditions
      const filterConditions = filters.map(({ column, condition, value }) => {
        let filter: any = {};

        switch (condition) {
          case TextFilterConditions.CONTAINS:
            filter = { contains: value };
            break;
          case TextFilterConditions.DOES_NOT_CONTAIN:
            filter = { not: { contains: value } };
            break;
          case TextFilterConditions.IS_EQUAL_TO:
            filter = { equals: value };
            break;
          case TextFilterConditions.IS_EMPTY:
            filter = { equals: "" };
            break;
          case TextFilterConditions.IS_NOT_EMPTY:
            filter = { not: "" };
            break;
          default:
            throw new Error("Unknown filter condition");
        }

        return {
          cells: {
            some: {
              columnId: column,
              value: filter,
            },
          },
        };
      });

      
      const rows = await ctx.prisma.row.findMany({
        where: { 
          tableId,
          AND: filterConditions.length > 0 ? filterConditions : undefined,
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