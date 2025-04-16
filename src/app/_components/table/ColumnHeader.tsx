import { MdOutlineTextFields, MdMoreVert } from "react-icons/md";
import { FaHashtag } from "react-icons/fa";
import { FaAngleDown } from "react-icons/fa6";

interface ColumnHeaderProps {
  type: string;
  name: string;
}

export const ColumnHeader = ({ type, name }: ColumnHeaderProps) => (
  <div className="flex items-center justify-between w-full group">
    <div className="flex items-center gap-2">
      {type === "Text" ? (
        <MdOutlineTextFields className="w-4 h-4 text-gray-500" />
      ) : (
        <FaHashtag className="w-4 h-4 text-gray-500" />
      )}
      <span className="text-sm font-medium text-gray-800">{name}</span>
    </div>
    <button className="opacity-100 text-gray-400 hover:text-gray-600">
      <FaAngleDown className="w-4 h-4" />
    </button>
  </div>
);