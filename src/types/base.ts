export interface Base {
  name: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  tables: Table[];
}

// export interface Table {
//   name: string;
//   id: string;
//   createdAt: Date;
//   updatedAt: Date;
//   baseId: string;
// }

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
}