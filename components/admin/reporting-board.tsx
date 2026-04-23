"use client";

import { useEffect, useState } from "react";
import { formatChf } from "@/lib/money";

type DailyPoint = {
  day: string;
  revenue: number;
  orders: number;
};

type ReportPayload = {
  daily: DailyPoint[];
  topProducts: Array<{ pizzaNameSnapshot: string; _sum: { quantity: number | null } }>;
  avgBasket: number;
  cancelled: number;
};

export function ReportingBoard() {
  const [report, setReport] = useState<ReportPayload | null>(null);

  useEffect(() => {
    fetch("/api/admin/reports", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        setReport({
          ...data,
          avgBasket: Number(data.avgBasket),
          daily: data.daily.map((item: DailyPoint) => ({
            ...item,
            revenue: Number(item.revenue),
            orders: Number(item.orders),
          })),
        });
      })
      .catch(() => setReport(null));
  }, []);

  const maxRevenue = report?.daily.length
    ? Math.max(...report.daily.map((day) => day.revenue), 1)
    : 1;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border p-4">
          <p className="text-xs text-muted-foreground">Panier moyen</p>
          <p className="text-2xl font-semibold">{formatChf(report?.avgBasket ?? 0)}</p>
        </div>
        <div className="rounded-2xl border p-4">
          <p className="text-xs text-muted-foreground">Annulations</p>
          <p className="text-2xl font-semibold">{report?.cancelled ?? 0}</p>
        </div>
        <div className="rounded-2xl border p-4">
          <p className="text-xs text-muted-foreground">Produit #1</p>
          <p className="text-base font-semibold">
            {report?.topProducts[0]?.pizzaNameSnapshot ?? "-"}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="font-display text-lg font-semibold">Ventes quotidiennes (mois en cours)</h3>
        <div className="space-y-2">
          {report?.daily.map((day) => (
            <div key={day.day} className="rounded-xl border p-3">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(day.day).toLocaleDateString("fr-CH")}</span>
                <span>
                  {day.orders} cmd • {formatChf(day.revenue)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.max(6, (day.revenue / maxRevenue) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
