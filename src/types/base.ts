export interface Base {
  name: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  tables: Table[];
}

export interface Table {
  name: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  baseId: string;
}

export interface Column {
  id: string;
  name: string;
  type: string;
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
  columns: { id: string; name: string; type: string }[];
  cells: { id: string; columnId: string; value: string; rowId: string }[];
}