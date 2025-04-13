import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { prisma } from "~/lib/db";
import { Prisma } from "@prisma/client";
import { FilterType, TextFilterConditions } from "~/types/view";

export const viewSchema = z.object({
  viewId: z.string(),
  search: z.string().optional(),
  filters: z.array(
    z.object({
      column: z.string(),
      condition: z.string(),
      value: z.string().optional(),
    })
  ).optional(),
  sorts: z.array(
    z.object({
      column: z.string(),
      order: z.string(),
    })
  ).optional(),
  hiddenColumns: z.record(z.boolean()).optional(),
});

export const viewRouter = createTRPCRouter({
  // Create view 
  createView: publicProcedure
  .input(
    z.object({
      tableId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const { tableId } = input;

    // Count current number of views for the table
    const viewCount = await prisma.view.count({
      where: { tableId },
    });

    // Create the new view with incremented name
    await prisma.view.create({
      data: {
        name: `Grid view ${viewCount + 1}`,
        tableId,
      },
    });
  }),

  // Fetch views for a specific table
  getViewsByTableId: publicProcedure
    .input(z.string()) // Table ID as input
    .query(async ({ input }) => {
      const views = await prisma.view.findMany({
        where: {
          tableId: input, // Filter views by table ID
        },
        include: {
          filters: true,
          sort: true,
          columnVisibility: true,
        }
      });

      return views;
    }),

  // Fetch views for a specific table
  getViewsForSideBar: publicProcedure
    .input(z.string()) // Table ID as input
    .query(async ({ input }) => {
      const views = await prisma.view.findMany({
        where: {
          tableId: input, // Filter views by table ID
        },
      });

      return views;
    }),
  
  getViewById: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const view = await prisma.view.findUnique({
        where: {
          id: input,
        },
        include: {
          filters: true,
          sort: true,
          columnVisibility: true,
        }
      });
      return view;
    }),
  
  // Add filter conditions
  updateFilter: publicProcedure
    .input(z.object({
      viewId: z.string(),
      view: viewSchema,
    }))
    .mutation(async ({ input }) => {
      const { view } = input;
      const { viewId, filters } = view;

      // First, delete existing filters
      await prisma.filterCondition.deleteMany({
        where: { viewId },
      });

      // Insert the new filter conditions
      await prisma.filterCondition.createMany({
        data: filters!
          .filter((filter) => filter.value !== undefined) // Filter out undefined values
          .map((filter) => ({
            viewId: view.viewId,
            column: filter.column,
            condition: filter.condition,
            value: filter.value!, // You can safely assert value as string here
          })),
      });
    }),
  
  // Update sort conditions
  updateSort: publicProcedure
    .input(z.object({
      viewId: z.string(),
      view: viewSchema,
    }))
    .mutation(async ({ input }) => {
      const { view } = input;
      const { viewId, sorts } = view;

      // First, delete existing filters
      await prisma.sortCondition.deleteMany({
        where: { viewId },
      });

      // Insert the new filter conditions
      await prisma.sortCondition.createMany({
        data: sorts!
          .map((sort) => ({
            viewId: view.viewId,
            column: sort.column,
            order: sort.order,
          })),
      });
    }),

  // Update hide conditions
  updateHide: publicProcedure
  .input(z.object({
    tableId: z.string(),
    view: viewSchema,
  }))
  .mutation(async ({ input }) => {
    const { tableId, view } = input;
    const { viewId, hiddenColumns } = view;

    if (hiddenColumns) {
      // Delete existing visibility rules for this view
      await prisma.columnVisibility.deleteMany({
        where: { viewId },
      });

      // Fetch all columns for the given table
      const columns = await prisma.column.findMany({
        where: { tableId },
        select: { id: true },
      });

      // Build visibility data using hiddenColumns
      const visibilityData = columns.map((column) => ({
        viewId,
        columnId: column.id,
        isVisible: !hiddenColumns[column.id], // false means hidden
      }));

      // Insert new visibility records
      await prisma.columnVisibility.createMany({
        data: visibilityData,
      });
    }

    return { success: true };
  }),

  // Apply view
  applyView: publicProcedure
    .input(z.object({
      viewId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { viewId } = input;

      // Fetch view data (filters, sorting, visibleColumns)
      const view = await prisma.view.findUnique({
        where: { id: viewId },
        select: { filters: true, sort: true, columnVisibility: true },
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

      // Check if filters, sorting, or visibleColumns are empty
      const hasFilters = filters.length > 0;
      const hasSorting = Array.isArray(view.sort) && view.sort.length > 0;
      const hasVisibleColumns = Array.isArray(view.columnVisibility) && view.columnVisibility.length > 0;

      if (!hasFilters && !hasSorting && !hasVisibleColumns) {
        // If no search, filter, sort, or visible columns → return early
        return [];
      }

      // Construct filter queries
      const filterQueries = filters.map(({ column, condition, value }) => {
        let filterParameter: any = {};

        switch (condition) {
          case TextFilterConditions.CONTAINS:
            filterParameter = { contains: value };
            break;
          case TextFilterConditions.DOES_NOT_CONTAIN:
            filterParameter = { not: { contains: value } };
            break;
          case TextFilterConditions.IS_EQUAL_TO:
            filterParameter = { equals: value };
            break;
          case TextFilterConditions.IS_EMPTY:
            filterParameter = { equals: "" };
            break;
          case TextFilterConditions.IS_NOT_EMPTY:
            filterParameter = { not: "" };
            break;
          default:
            throw new Error("Unknown filter condition");
        }

        return prisma.cell.findMany({
          where: {
            columnId: column,
            value: filterParameter,
          },
          include: { 
            row: {
              include: {
                cells: true
              }
            }
          },
        });
      });

      // Await all filter queries
      const filteredCellsResults = await Promise.all(filterQueries);

      // Flatten and extract unique rows
      const allFilteredCells = filteredCellsResults.flat();
      const filteredRows = Array.from(
        new Map(allFilteredCells.map((cell) => [cell.row.id, cell.row])).values()
      );
      filteredRows.forEach(row => {
        row.cells.forEach(cell => {
          console.log(cell);
        })
      })

      return filteredRows;
    })
});
