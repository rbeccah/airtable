"use client";

import { useEffect, useState } from "react";

import HomeBaseCard from '~/app/_components/HomeBaseCard';
import { Base } from '~/types/base';

export function HomeMainSection() {
  const [bases, setBases] = useState<{ id: string; name: string }[]>([]);

  async function fetchBases() {
    const res = await fetch("/api/user?type=bases");
    if (!res.ok) {
      console.error("Failed to fetch bases");
      return;
    }
  
    const bases = (await res.json()) as Base[];
    setBases(bases);
  }

  useEffect(() => {
    fetchBases();
  }, []);

  return (
    <div>
      <article className="prose lg:prose-xl flex flex-col items-start justify-start">
        <h2>Home</h2>
      </article>

      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bases.map((base) => (
          <HomeBaseCard key={base.id} name={base.name} id={base.id} />
        ))}
    </div>
    </div>
  )
}