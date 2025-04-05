"use client";
import { useState } from "react";
import { Card } from "flowbite-react";

interface HomeBaseCardProps {
  id: string;
  name: string;
}

const HomeBaseCard: React.FC<HomeBaseCardProps> = ({ id, name }) => {
  const initials = name.slice(0, 2);

  return (
    <Card href={`/base/${id}`}className="max-w-sm">
      <div className="flex flex-row">
        <div className="flex w-16 h-16 items-center justify-center bg-blue-500 text-white rounded-lg text-2xl mr-5">
          {initials}
        </div>
        <div className="flex flex-col">
          <div className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
            {name}
          </div>
          <p className="font-normal text-gray-700 text-sm dark:text-gray-400">
            Base
          </p>
        </div>
      </div>
    </Card>
  )
};

export default HomeBaseCard;