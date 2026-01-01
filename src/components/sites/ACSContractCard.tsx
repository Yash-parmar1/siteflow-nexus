import { Box, MapPin, Calendar, Wrench, AlertCircle, Clock, IndianRupee, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

interface ACSUnitWithTenure {
  id: string;
  serialNumber: string;
  model: string;
  location: string;
  status: "operational" | "maintenance" | "pending" | "offline" | "decommissioned";
  installDate?: string;
  activationDate?: string;
  tenureMonths?: number;
  rentStartDate?: string;
  rentEndDate?: string;
  contractStatus?: "not-started" | "active" | "expiring-soon" | "expired" | "terminated";
  daysRemaining?: number;
  monthlyRent?: number;
  lastMaintenance?: string;
  hasIssue?: boolean;
  configurationVersion?: string;
}

interface ACSContractCardProps {
  unit: ACSUnitWithTenure;
  onClick?: () => void;
}

const statusConfig = {
  operational: { label: "Operational", color: "status-success" },
  maintenance: { label: "Maintenance", color: "status-warning" },
  pending: { label: "Pending Install", color: "status-info" },
  offline: { label: "Offline", color: "status-error" },
  decommissioned: { label: "Decommissioned", color: "muted-foreground" },
};

const contractStatusConfig = {
  "not-started": { label: "Not Started", color: "muted-foreground", bgColor: "bg-muted" },
  active: { label: "Active", color: "status-success", bgColor: "bg-status-success" },
  "expiring-soon": { label: "Expiring Soon", color: "status-warning", bgColor: "bg-status-warning" },
  expired: { label: "Expired", color: "status-error", bgColor: "bg-status-error" },
  terminated: { label: "Terminated", color: "status-error", bgColor: "bg-status-error" },
};

function calculateProgress(rentStartDate?: string, rentEndDate?: string): number {
  if (!rentStartDate || !rentEndDate) return 0;
  const start = new Date(rentStartDate).getTime();
  const end = new Date(rentEndDate).getTime();
  const now = Date.now();
  if (now < start) return 0;
  if (now > end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

export function ACSContractCard({ unit, onClick }: ACSContractCardProps) {
  const status = statusConfig[unit.status];
  const contractStatus = unit.contractStatus ? contractStatusConfig[unit.contractStatus] : null;
  const progress = calculateProgress(unit.rentStartDate, unit.rentEndDate);

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
              unit.status === "offline" && "bg-status-error/15",
              unit.status === "decommissioned" && "bg-muted"
            )}
          >
            <Box
              className={cn(
                "w-5 h-5",
                unit.status === "operational" && "text-status-success",
                unit.status === "maintenance" && "text-status-warning",
                unit.status === "pending" && "text-status-info",
                unit.status === "offline" && "text-status-error",
                unit.status === "decommissioned" && "text-muted-foreground"
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

        <div className="flex flex-col items-end gap-1">
          <span
            className="status-badge"
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
          {unit.configurationVersion && (
            <span className="text-[10px] text-muted-foreground">
              Config v{unit.configurationVersion}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5" />
          <span>{unit.location}</span>
        </div>
      </div>

      {/* Contract Timeline Section */}
      {unit.rentStartDate && (
        <div className="mt-3 pt-3 border-t border-border/60 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Contract Timeline</span>
            {contractStatus && (
              <span
                className="status-badge text-[10px]"
                style={{
                  backgroundColor: `hsl(var(--${contractStatus.color}) / 0.15)`,
                  color: `hsl(var(--${contractStatus.color}))`,
                }}
              >
                {contractStatus.label}
              </span>
            )}
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {unit.rentStartDate} → {unit.rentEndDate}
              </span>
              <span className="font-medium text-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-muted-foreground cursor-help">
                  <Calendar className="w-3 h-3" />
                  <span>{unit.tenureMonths}mo</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Tenure: {unit.tenureMonths} months</TooltipContent>
            </Tooltip>
            
            {unit.daysRemaining !== undefined && unit.daysRemaining > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex items-center gap-1.5 cursor-help",
                    unit.daysRemaining < 90 ? "text-status-warning" : "text-muted-foreground"
                  )}>
                    <Clock className="w-3 h-3" />
                    <span>{unit.daysRemaining}d left</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{unit.daysRemaining} days remaining</TooltipContent>
              </Tooltip>
            )}
            
            {unit.monthlyRent && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-muted-foreground cursor-help">
                    <IndianRupee className="w-3 h-3" />
                    <span>{(unit.monthlyRent / 1000).toFixed(0)}k</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>₹{unit.monthlyRent.toLocaleString("en-IN")}/month</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      )}

      {/* Pending ACS - No contract yet */}
      {!unit.rentStartDate && unit.status === "pending" && (
        <div className="mt-3 pt-3 border-t border-border/60">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>Contract starts on activation</span>
          </div>
        </div>
      )}

      {/* Maintenance info */}
      {unit.lastMaintenance && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
          <Wrench className="w-3 h-3" />
          <span>Last service: {unit.lastMaintenance}</span>
        </div>
      )}
    </button>
  );
}
