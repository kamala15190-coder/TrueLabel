"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/scoring/data";
import { scoreColor } from "@/lib/shared";

interface ListItem {
  id: string;
  barcode: string;
  checked: boolean;
  name: string;
  brand: string;
  category: string;
  total: number;
}

export function ListClient() {
  const [items, setItems] = useState<ListItem[] | null>(null);

  const reload = async () => {
    try {
      const res = await fetch("/api/lists");
      const json = await res.json();
      setItems(json.items ?? []);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const toggle = async (item: ListItem) => {
    setItems((prev) =>
      prev?.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i)) ?? null
    );
    await fetch("/api/lists", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, checked: !item.checked }),
    }).catch(() => {});
  };

  const remove = async (item: ListItem) => {
    setItems((prev) => prev?.filter((i) => i.id !== item.id) ?? null);
    await fetch(`/api/lists?id=${item.id}`, { method: "DELETE" }).catch(() => {});
  };

  if (items == null) return <div className="spinner mt32" />;

  if (items.length === 0) {
    return (
      <div className="empty">
        <span className="ico">🛒</span>
        <h2 className="h-m">Liste ist leer</h2>
        <p className="body-m t2">
          Öffne ein Produkt und tippe auf „Zur Liste“ — schon steht es hier.
        </p>
        <Link href="/" style={{ width: "100%" }}>
          <span className="btn btn-primary btn-sm">Produkt scannen</span>
        </Link>
      </div>
    );
  }

  const open = items.filter((i) => !i.checked).length;

  return (
    <div>
      <div className="row between mb16">
        <span className="micro">{open} offen · {items.length - open} erledigt</span>
        <a href="/api/export/list" className="chip">⬇︎ CSV</a>
      </div>
      {items.map((item) => (
        <div key={item.id} className="plist" style={{ opacity: item.checked ? 0.45 : 1 }}>
          <button
            onClick={() => toggle(item)}
            aria-label={item.checked ? "Als offen markieren" : "Abhaken"}
            style={{
              width: 28, height: 28, borderRadius: 9,
              border: `2px solid ${item.checked ? "var(--accent)" : "var(--border-active)"}`,
              background: item.checked ? "var(--accent)" : "transparent",
              color: "#fff", fontSize: 16, fontWeight: 700,
              cursor: "pointer", flexShrink: 0,
            }}
          >
            {item.checked ? "✓" : ""}
          </button>
          <Link href={`/product/${item.barcode}`} className="grow row gap12">
            <div className="pthumb" style={{ width: 42, height: 42, fontSize: 19 }}>
              {(CATEGORIES[item.category] ?? CATEGORIES.other).emoji}
            </div>
            <div className="grow">
              <b style={{ fontSize: 15, textDecoration: item.checked ? "line-through" : "none" }}>
                {item.name}
              </b>
              <div className="micro">{item.brand}</div>
            </div>
          </Link>
          <b className="tnum" style={{ color: scoreColor(item.total) }}>{item.total}</b>
          <button
            onClick={() => remove(item)}
            aria-label="Entfernen"
            style={{ background: "none", border: "none", color: "var(--text-3)", fontSize: 18, cursor: "pointer", padding: 4 }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
