import { MapPin, Camera, Pencil, Eye, AlertTriangle, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface InstallationCardProps {
  installation: {
    id: string;
    docketId: string;
    site: string;
    status: string;
    progress: number;
    shipmentDate: string;
    eta: string;
    hasEvidence: boolean;
    priority: string;
  };
  onViewSite: () => void;
  onEdit: () => void;
  onViewEvidence: () => void;
}

const statusConfig: Record<string, { color: string; bgColor: string }> = {
  "Pending Dispatch": { color: "text-muted-foreground", bgColor: "bg-muted" },
  "In Transit": { color: "text-[hsl(var(--status-info))]", bgColor: "bg-[hsl(var(--status-info)/0.15)]" },
  Scheduled: { color: "text-[hsl(var(--status-info))]", bgColor: "bg-[hsl(var(--status-info)/0.15)]" },
  Installing: { color: "text-[hsl(var(--status-warning))]", bgColor: "bg-[hsl(var(--status-warning)/0.15)]" },
  Completed: { color: "text-[hsl(var(--status-success))]", bgColor: "bg-[hsl(var(--status-success)/0.15)]" },
  Delayed: { color: "text-[hsl(var(--status-error))]", bgColor: "bg-[hsl(var(--status-error)/0.15)]" },
};

const priorityConfig: Record<string, string> = {
  High: "text-[hsl(var(--status-error))]",
  Medium: "text-[hsl(var(--status-warning))]",
  Low: "text-muted-foreground",
};

export function InstallationCard({
  installation,
  onViewSite,
  onEdit,
  onViewEvidence,
}: InstallationCardProps) {
  return (
    <div className="data-card hover:shadow-lg transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 pb-3 border-b border-border/60">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-foreground truncate">
              {installation.docketId}
            </h3>
            <Badge
              className={`${statusConfig[installation.status]?.bgColor} ${statusConfig[installation.status]?.color} border-0 shrink-0`}
            >
              {installation.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{installation.site}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground font-medium">Progress</span>
          <span className="font-semibold text-foreground">{installation.progress}%</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 bg-primary"
            style={{ width: `${installation.progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div>
          <p className="text-muted-foreground mb-0.5 text-xs">Shipped</p>
          <p className="font-semibold text-foreground">{installation.shipmentDate}</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-0.5 text-xs">ETA</p>
          <p className={`font-semibold ${installation.status === "Delayed" ? "text-[hsl(var(--status-error))]" : "text-foreground"}`}>
            {installation.eta}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground mb-0.5 text-xs">Priority</p>
          <p className={`font-semibold ${priorityConfig[installation.priority]}`}>
            {installation.priority}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-border/60">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs h-8"
          onClick={(e) => {
            e.stopPropagation();
            onViewSite();
          }}
        >
          <Eye className="w-3.5 h-3.5" />
          View Site
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs h-8"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </Button>
        {installation.hasEvidence && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-8"
            onClick={(e) => {
              e.stopPropagation();
              onViewEvidence();
            }}
          >
            <Camera className="w-3.5 h-3.5" />
            Evidence
          </Button>
        )}
      </div>
    </div>
  );
}
