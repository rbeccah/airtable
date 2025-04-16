import { FilterFn } from "@tanstack/react-table";
import { AirColumn, AirRow, Cell, Table } from "./base";
import { RankingInfo } from "@tanstack/match-sorter-utils";
import { Dispatch, SetStateAction } from "react";

export type TableRow = {
  rowId: string;
} & Record<string, { id: string; value: string }>;

export interface AirTableProps {
  tableData: Table | null;
  tableId: string | null;
  handleTableColumns: (columns: AirColumn[]) => void;
  searchString: string;
  setSearchString: (value: string) => void;
  newCells: AirRow[];
  setNewCells: (newCells: AirRow[]) => void;
  viewId: string;
  viewApply: boolean;
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
