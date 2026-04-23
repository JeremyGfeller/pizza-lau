import { OrderStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ORDER_STATUS_LABEL, statusProgress } from "@/lib/order-status";
import { cn } from "@/lib/utils";

const steps: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PAID,
  OrderStatus.PREPARING,
  OrderStatus.READY,
];

export function OrderStatusTimeline({
  status,
  pickupMode,
}: {
  status: OrderStatus;
  pickupMode: "DELIVERY" | "PICKUP";
}) {
  const finalStep = pickupMode === "DELIVERY" ? OrderStatus.DELIVERED : OrderStatus.PICKED_UP;
  const fullSteps = [...steps, pickupMode === "DELIVERY" ? OrderStatus.OUT_FOR_DELIVERY : OrderStatus.PICKED_UP];
  const currentIndex = fullSteps.indexOf(status);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant={status === OrderStatus.CANCELLED ? "destructive" : "default"}>
          {ORDER_STATUS_LABEL[status]}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {pickupMode === "DELIVERY" ? "Mode livraison" : "Mode retrait"}
        </span>
      </div>
      <Progress value={status === finalStep ? 100 : statusProgress(status)} />
      <div className="grid gap-2">
        {fullSteps.map((step, index) => (
          <div key={step} className="flex items-center gap-3">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full border border-border",
                index <= currentIndex && "border-primary bg-primary",
              )}
            />
            <p className={cn("text-sm text-muted-foreground", index <= currentIndex && "text-foreground")}>
              {ORDER_STATUS_LABEL[step]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
