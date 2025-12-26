import { Package, Truck, User, Calendar, FileCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Installation {
  id: string;
  docketId: string;
  shipmentStatus: "pending" | "shipped" | "in-transit" | "delivered" | "installed";
  eta?: string;
  installer?: string;
  unitsCount: number;
  hasEvidence: boolean;
}

interface InstallationTrackingProps {
  installations: Installation[];
}

const shipmentStatusConfig = {
  pending: { label: "Pending", color: "status-neutral", icon: Clock },
  shipped: { label: "Shipped", color: "status-info", icon: Package },
  "in-transit": { label: "In Transit", color: "stage-wip", icon: Truck },
  delivered: { label: "Delivered", color: "stage-tis", icon: FileCheck },
  installed: { label: "Installed", color: "status-success", icon: FileCheck },
};

export function InstallationTracking({ installations }: InstallationTrackingProps) {
  return (
    <div className="data-card">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-foreground">Installation Tracking</h2>
        <span className="text-sm text-muted-foreground">
          {installations.length} shipments
        </span>
      </div>

      <div className="space-y-3">
        {installations.map((installation) => {
          const config = shipmentStatusConfig[installation.shipmentStatus];
          const Icon = config.icon;

          return (
            <div
              key={installation.id}
              className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl border border-transparent hover:border-border transition-all"
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
                style={{
                  backgroundColor: `hsl(var(--${config.color}) / 0.15)`,
                }}
              >
                <Icon
                  className="w-5 h-5"
                  style={{ color: `hsl(var(--${config.color}))` }}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">
                    {installation.docketId}
                  </span>
                  <span
                    className={cn("status-badge")}
                    style={{
                      backgroundColor: `hsl(var(--${config.color}) / 0.15)`,
                      color: `hsl(var(--${config.color}))`,
                    }}
                  >
                    {config.label}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" />
                    {installation.unitsCount} units
                  </span>
                  {installation.eta && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      ETA: {installation.eta}
                    </span>
                  )}
                  {installation.installer && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {installation.installer}
                    </span>
                  )}
                </div>
              </div>

              {installation.hasEvidence && (
                <button className="text-sm text-primary hover:text-primary/80 shrink-0 transition-colors">
                  View Evidence
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
