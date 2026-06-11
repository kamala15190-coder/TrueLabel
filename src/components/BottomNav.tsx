"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/",
    label: "Scan",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
        <path
          d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"
          strokeLinecap="round"
        />
        <path d="M7 12h10" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/history",
    label: "Verlauf",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/search",
    label: "Suche",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
        <circle cx="11" cy="11" r="7" />
        <path d="M16.5 16.5L21 21" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profil",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
        <circle cx="12" cy="8" r="4" />
        <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" strokeLinecap="round" />
      </svg>
    ),
  },
];

const VISIBLE_ON = new Set(["/", "/history", "/search", "/profile"]);

export function BottomNav() {
  const pathname = usePathname();
  if (!VISIBLE_ON.has(pathname)) return null;
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`nav-item${pathname === tab.href ? " active" : ""}`}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
