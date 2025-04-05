import { RankingInfo, rankItem, compareItems } from '@tanstack/match-sorter-utils';
import { FilterFn, SortingFn, sortingFns } from '@tanstack/react-table';
import { TableRow } from '~/types/airtable';
import { AirRow } from '~/types/base';

export const PAGE_SIZE = 50;

export const fuzzyFilter: FilterFn<TableRow> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem((row.getValue(columnId)) ?? "", value as string);
  addMeta({ itemRank });
  return itemRank.passed;
};

export const fuzzySort: SortingFn<TableRow> = (rowA, rowB, columnId) => {
  let dir = 0;

  if (rowA.columnFiltersMeta[columnId] && rowB.columnFiltersMeta[columnId]) {
    dir = compareItems(
      rowA.columnFiltersMeta[columnId]?.itemRank ?? { ranking: 0 },
      rowB.columnFiltersMeta[columnId]?.itemRank ?? { ranking: 0 }
    );
  }

  return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir;
};

export const formatTableData = (rows: AirRow[]): TableRow[] => {
    return rows.map(row => {
      // Create a new object with rowId and the Record type
      const tableRow = {
        rowId: row.id,
        ...Object.fromEntries(
          row.cells.map(cell => [
            cell.columnId, 
            { id: cell.id, value: cell.value }
          ])
      )} as unknown as TableRow;
      
      return tableRow;
    });
  };
  