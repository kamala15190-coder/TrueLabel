"use client";

import { useRouter } from "next/navigation";

export function BackBar({ title }: { title?: string }) {
  const router = useRouter();
  return (
    <div className="topbar">
      <button className="icon-btn" onClick={() => router.back()} aria-label="Zurück">
        ‹
      </button>
      {title && <span className="ttl">{title}</span>}
    </div>
  );
}
