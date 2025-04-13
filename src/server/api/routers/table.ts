import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { prisma } from "~/lib/db";
import { FilterType, NumSortConditions, TextFilterConditions, TextSortConditions } from "~/types/view";

export const tableRouter = createTRPCRouter({
  getInfiniteRows: protectedProcedure
    .input(z.object({
      tableId: z.string(),
      cursor: z.string().nullish(),
      limit: z.number().min(1).max(100).default(50),
      viewId: z.string(),
      // search: z.string().optional(),
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

      // ************ Hidden Columns ************ //
      const hiddenColumnVis = await ctx.prisma.columnVisibility.findMany({
        where: {
          viewId,
          isVisible: false,
        },
        select: { columnId: true },
      });
      const hiddenColumnIds = hiddenColumnVis.map((c) => c.columnId);

      // ************ Filters ************ //
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

      // ************ Sorting ************ //
      // Construct sort conditions
      const sortConditions = view.sort.map(({ column, order }) => ({
        columnId: column,
        order: order,
      }));
      const sortCondition = sortConditions[0];
      let orderedRowIds: string[] = [];

      if (sortCondition) {
        const { columnId, order } = sortCondition;
        const prismaOrder = order === "A → Z" || order === "1 → 9" ? "asc" : "desc";

        const orderedCells = await ctx.prisma.cell.findMany({
          where: { columnId },
          orderBy: { value: prismaOrder },
          select: { rowId: true },
        });
        orderedRowIds = orderedCells.map((cell: { rowId: string; }) => cell.rowId);
      }

      // ************ Fetch Rows ************ //
      let rows = await ctx.prisma.row.findMany({
        where: {
          tableId,
          id: orderedRowIds.length > 0 ? { in: orderedRowIds } : undefined,
          AND: filterConditions.length > 0 ? filterConditions : undefined,
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        include: {
          cells: {
            include: { column: true },
          },
        },
      });
      // rows.forEach(row => {
      //   console.log(row);
      //   row.cells.forEach(cell => {
      //     console.log(cell);
      //   })
      // })

      // ************ Sorting Rows ************ //
      if (orderedRowIds.length > 0) {
        const rowMap = new Map(rows.map((row) => [row.id, row]));
        rows = orderedRowIds
          .map((id) => rowMap.get(id))
          .filter(Boolean) as typeof rows;
      }

      // ************ Apply Hiding Logic ************ //
      rows = rows.map((row) => ({
        ...row,
        cells: row.cells.filter((cell) => !hiddenColumnIds.includes(cell.columnId)),
      }));

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

  // Search table
  searchTable: publicProcedure
    .input(z.object({ 
      tableId: z.string(), 
      searchString: z.string() 
    }))
    .query(async ({ input, ctx }) => {
      const { tableId, searchString } = input;

      if (!searchString.trim()) {
        return []; // return nothing if search string is empty or just whitespace
      }

      const targetCells = await ctx.prisma.cell.findMany({
        where: {
          tableId,
          value: {
            contains: searchString,
            mode: "insensitive", // case-insensitive search
          },
        },
        select: {
          id: true,
          value: true,
          rowId: true,
          columnId: true,
        },
      });

      return targetCells;
    })
});