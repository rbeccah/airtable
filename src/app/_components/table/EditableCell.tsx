import { useState } from "react";

interface EditableCellProps {
  cellData: { id: string; value: string };
  columnType: string;
  updateData: (value: string) => void;
  onSaveCell: (cellId: string, value: string) => void;
}

export const EditableCell = ({
  cellData,
  columnType,
  updateData,
  onSaveCell,
}: EditableCellProps) => {
  const [value, setValue] = useState(cellData.value);

  const onBlur = () => {
    updateData(value);
    onSaveCell(cellData.id, value);
  };

  return (
    <input
      className="text-gray-900 border-transparent text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 -m-1.5"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={onBlur}
      type={columnType === "Number" ? "number" : "text"}
    />
  );
};