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
  visibleColumns: z.array(z.string()).optional(),
});

export const viewRouter = createTRPCRouter({
  // Create view 
  createView: publicProcedure
    .input(
      z.object({
        tableId: z.string(),
        name: z.string(),
        filters: z
          .array(
            z.object({
              column: z.string(),
              value: z.string(),
              operator: z.string(),
            })
          )
          .default([]),
        sort: z
          .array(
            z.object({
              column: z.string(),
              order: z.string(),
            })
          )
          .default([]),
        columnVisibility: z
          .array(
            z.object({
              columnId: z.string(),
              isVisible: z.boolean(),
            })
          )
          .default([]),
      })
    )
    .mutation(async ({ input }) => {
      const { tableId, name, filters, sort, columnVisibility } = input;

      // Create the view record first
      const view = await prisma.view.create({
        data: {
          name,
          tableId,
        },
      });

      // Insert filter conditions into the FilterCondition table
      await prisma.filterCondition.createMany({
        data: filters.map((filter) => ({
          viewId: view.id,
          column: filter.column,
          condition: filter.operator,
          value: filter.value,
        })),
      });

      // Insert sort conditions into the SortCondition table
      await prisma.sortCondition.createMany({
        data: sort.map((sortItem) => ({
          viewId: view.id,
          column: sortItem.column,
          order: sortItem.order,
        })),
      });

      // Insert column visibility into the ColumnVisibility table
      await prisma.columnVisibility.createMany({
        data: columnVisibility.map((colVisibility) => ({
          viewId: view.id,
          columnId: colVisibility.columnId,
          isVisible: colVisibility.isVisible,
        })),
      });

      return view;
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
      tableId: z.string(),
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
      tableId: z.string(),
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
