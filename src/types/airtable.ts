import { FilterFn } from "@tanstack/react-table";
import { AirColumn, AirRow, Cell, Table } from "./base";
import { RankingInfo } from "@tanstack/match-sorter-utils";

export type TableRow = {
  rowId: string;
} & Record<string, { id: string; value: string }>;

export interface AirTableProps {
  tableData: Table | null;
  tableId: string | null;
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  newRows: AirRow[];
}

export interface AddColumnResponse {
  success: boolean;
  newColumn?: AirColumn;
  newCells?: Cell[];
  error?: string;
}

export interface ApiResponse {
  success: boolean;
  error?: string;
}
