import { TableRow } from '~/types/airtable';
import { AirRow } from '~/types/base';

export const PAGE_SIZE = 50;

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
  