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