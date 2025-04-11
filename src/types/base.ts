import { Prisma } from "@prisma/client";

export interface Base {
  name: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  tables: Table[];
}

export interface AirColumn {
  id: string;
  name: string;
  type: string;
}

export interface AirRow {
  id: string;
  cells: Cell[]
}

export interface Cell {
  id: string;
  columnId: string;
  value: string;
  rowId: string;
}

export interface Table {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  baseId: string;
  columns: AirColumn[];
  rows: AirRow[];
  views: View[];
}

export interface View {
  id: string,
  name: string,
  tableId: string;
  sort: SortCondition[];
  filters: FilterCondition[];
  columnVisibility: ColumnVisibility[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SortCondition {
  id: string,
  column: string,
  order: string,
  viewId: string,
  createdAt: Date,
  updatedAt: Date,
}

export interface FilterCondition {
  id: string,
  column: string,
  value: string,
  condition: string,
  viewId: string,
  createdAt: Date,
  updatedAt: Date,
}

export interface ColumnVisibility {
  columnId: string, 
  isVisible: boolean,
}