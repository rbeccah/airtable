import { useState } from "react";

interface EditableCellProps {
  cellData: { id: string; value: string };
  columnType: string;
  updateData: (value: string) => void;
  onSaveCell: (cellId: string, value: string) => void;
  isMatched?: boolean;
}

export const EditableCell = ({
  cellData,
  columnType,
  updateData,
  onSaveCell,
  isMatched = false,
}: EditableCellProps) => {
  const [value, setValue] = useState(cellData.value);

  const onBlur = () => {
    updateData(value);
    onSaveCell(cellData.id, value);
  };

  return (
    <input
      className={`text-gray-900 border-transparent text-sm rounded-sm block w-full focus:ring-blue-500 focus:border-blue-500
        ${isMatched ? "bg-amber-200" : "bg-transparent"}
      `}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={onBlur}
      type={columnType === "Number" ? "number" : "text"}
    />
  );
};