"use client";

import { OrderStatus } from "@prisma/client";
import { useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { formatChf } from "@/lib/money";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";

type OrderRow = {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string | null;
  pickupMode: "DELIVERY" | "PICKUP";
  status: OrderStatus;
  totalChf: number;
  createdAt: string;
  printJobs: Array<{ status: string }>;
};

const statusTargets = [
  OrderStatus.PENDING,
  OrderStatus.PAID,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
  OrderStatus.PICKED_UP,
  OrderStatus.CANCELLED,
];

export function OrdersBoard() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function loadOrders() {
    setLoading(true);
    try {
      const search = new URLSearchParams();
      if (query) {
        search.set("q", query);
      }
      if (filterStatus) {
        search.set("status", filterStatus);
      }
      const response = await fetch(`/api/admin/orders?${search.toString()}`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Impossible de charger les commandes");
      }
      setOrders(
        data.orders.map((order: OrderRow) => ({
          ...order,
          totalChf: Number(order.totalChf),
          createdAt: order.createdAt,
        })),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    const search = new URLSearchParams();
    fetch(`/api/admin/orders?${search.toString()}`, {
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((data) => {
        if (!mounted) {
          return;
        }
        setOrders(
          data.orders.map((order: OrderRow) => ({
            ...order,
            totalChf: Number(order.totalChf),
            createdAt: order.createdAt,
          })),
        );
      })
      .catch(() => {
        if (mounted) {
          toast.error("Impossible de charger les commandes");
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function updateStatus(orderId: string, status: OrderStatus) {
    const response = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error ?? "Impossible de changer le statut");
      return;
    }
    toast.success("Statut mis à jour");
    await loadOrders();
  }

  const columns: ColumnDef<OrderRow>[] = [
    {
      accessorKey: "orderNumber",
      header: "Commande",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">#{row.original.orderNumber}</p>
          <p className="text-xs text-muted-foreground">{row.original.customerName}</p>
        </div>
      ),
    },
    {
      accessorKey: "pickupMode",
      header: "Mode",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.pickupMode === "DELIVERY" ? "Livraison" : "Retrait"}</Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => <Badge>{ORDER_STATUS_LABEL[row.original.status]}</Badge>,
    },
    {
      accessorKey: "totalChf",
      header: "Montant",
      cell: ({ row }) => formatChf(row.original.totalChf),
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <select
          className="h-9 rounded-xl border bg-background px-2 text-xs"
          defaultValue={row.original.status}
          onChange={(event) => updateStatus(row.original.id, event.target.value as OrderStatus)}
        >
          {statusTargets.map((status) => (
            <option key={status} value={status}>
              {ORDER_STATUS_LABEL[status]}
            </option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Recherche client / téléphone"
        />
        <select
          className="h-11 rounded-2xl border bg-background px-3 text-sm"
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value)}
        >
          <option value="">Tous les statuts</option>
          {statusTargets.map((status) => (
            <option key={status} value={status}>
              {ORDER_STATUS_LABEL[status]}
            </option>
          ))}
        </select>
        <Button onClick={loadOrders} variant="outline" disabled={loading}>
          {loading ? "Chargement..." : "Actualiser"}
        </Button>
      </div>
      <DataTable columns={columns} data={orders} emptyLabel="Aucune commande" />
    </div>
  );
}
