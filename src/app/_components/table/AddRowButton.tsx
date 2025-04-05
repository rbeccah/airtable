import { FaPlus } from "react-icons/fa6";
import { AirRow } from "~/types/base";

interface AddRowProp {
  tableId: string | null;
  handleNewRow: (newRow: AirRow[]) => void;
}

interface ApiResponse {
  success: boolean;
  newRows?: AirRow[];
  error?: string;
}

export function  AddRowButton({ tableId, handleNewRow }: AddRowProp) {
  const addNewRow = async () => {
    const response = await fetch("/api/table", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "addRow",
        tableId,
        numRows: 1,
      }),
    });

    const result = await response.json() as ApiResponse;
    if (result.success && result.newRows) {
      handleNewRow(result.newRows); // Update table when new row is added
    }
  };

  return (
    <button
      onClick={addNewRow}
      className="flex h-full items-center text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 p-2 rounded w-full transition-colors"
    >
      <FaPlus className="h-4 w-4" />
    </button>
  );
};