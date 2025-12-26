import { Box, MapPin, Calendar, Wrench, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ACSUnit {
  id: string;
  serialNumber: string;
  model: string;
  location: string;
  status: "operational" | "maintenance" | "pending" | "offline";
  installDate?: string;
  lastMaintenance?: string;
  hasIssue?: boolean;
}

interface ACSUnitCardProps {
  unit: ACSUnit;
  onClick?: () => void;
}

const statusConfig = {
  operational: { label: "Operational", color: "status-success" },
  maintenance: { label: "Maintenance", color: "status-warning" },
  pending: { label: "Pending Install", color: "status-info" },
  offline: { label: "Offline", color: "status-error" },
};

export function ACSUnitCard({ unit, onClick }: ACSUnitCardProps) {
  const status = statusConfig[unit.status];

  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-secondary/30 hover:bg-secondary/50 rounded-xl p-4 transition-all duration-200 border border-transparent hover:border-border"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg",
              unit.status === "operational" && "bg-status-success/15",
              unit.status === "maintenance" && "bg-status-warning/15",
              unit.status === "pending" && "bg-status-info/15",
              unit.status === "offline" && "bg-status-error/15"
            )}
          >
            <Box
              className={cn(
                "w-5 h-5",
                unit.status === "operational" && "text-status-success",
                unit.status === "maintenance" && "text-status-warning",
                unit.status === "pending" && "text-status-info",
                unit.status === "offline" && "text-status-error"
              )}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{unit.serialNumber}</span>
              {unit.hasIssue && <AlertCircle className="w-4 h-4 text-status-error" />}
            </div>
            <span className="text-xs text-muted-foreground">{unit.model}</span>
          </div>
        </div>

        <span
          className={cn("status-badge")}
          style={{
            backgroundColor: `hsl(var(--${status.color}) / 0.15)`,
            color: `hsl(var(--${status.color}))`,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: `hsl(var(--${status.color}))` }}
          />
          {status.label}
        </span>
      </div>

      <div className="space-y-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5" />
          <span>{unit.location}</span>
        </div>
        {unit.installDate && (
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>Installed: {unit.installDate}</span>
          </div>
        )}
        {unit.lastMaintenance && (
          <div className="flex items-center gap-2">
            <Wrench className="w-3.5 h-3.5" />
            <span>Last service: {unit.lastMaintenance}</span>
          </div>
        )}
      </div>
    </button>
  );
}
