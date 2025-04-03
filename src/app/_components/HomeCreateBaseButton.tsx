"use client";

import Link from "next/link";
import { useSession } from "next-auth/react"
import { prisma } from "~/lib/db";
import { useRouter } from "next/navigation";
import { Base } from "~/types/base";
import { api } from "~/trpc/react";

export function HomeCreateBaseButton() {
  const router = useRouter();
  const { data: session } = useSession();

  const createBaseMutation = api.base.create.useMutation({
    onSuccess: (base: { id: any; }) => {
      console.log("Base created:", base);
      router.push(`/base/${base.id}`);
    },
    onError: (error: any) => {
      console.error("Error creating base:", error);
    },
  });

  const handleCreateBase = () => {
    if (!session?.user) {
      console.error("User not authenticated");
      return;
    }
    
    createBaseMutation.mutate({ name: "Untitled Base" });
  };

  return (
    <button 
      type="button" 
      className="flex flex-row items-center justify-center px-5 py-2.5 text-sm font-medium text-white h-8 w-full inline-flex items-center bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
      onClick={handleCreateBase}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 mr-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      Create
    </button>
  )
}