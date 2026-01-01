import { cn } from "@/lib/utils";
import {
  Box,
  Truck,
  MapPin,
  Wrench,
  Play,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Camera,
  FileText,
  XCircle,
  RotateCcw,
  Settings,
  Package,
} from "lucide-react";
import type { LifecycleEvent, LifecycleEventType } from "@/types/asset";

interface AssetLifecycleTimelineProps {
  events: LifecycleEvent[];
  compact?: boolean;
}

const eventConfig: Record<LifecycleEventType, { icon: React.ElementType; color: string }> = {
  "created": { icon: Box, color: "status-neutral" },
  "assigned-to-site": { icon: MapPin, color: "status-info" },
  "shipped": { icon: Truck, color: "status-info" },
  "delivered": { icon: Package, color: "status-info" },
  "installation-started": { icon: Wrench, color: "stage-wip" },
  "installation-completed": { icon: CheckCircle, color: "status-success" },
  "activated": { icon: Play, color: "status-success" },
  "rent-started": { icon: DollarSign, color: "status-success" },
  "maintenance-scheduled": { icon: Wrench, color: "status-warning" },
  "maintenance-completed": { icon: CheckCircle, color: "status-success" },
  "issue-reported": { icon: AlertCircle, color: "status-error" },
  "issue-resolved": { icon: CheckCircle, color: "status-success" },
  "part-replaced": { icon: RotateCcw, color: "status-warning" },
  "deactivated": { icon: XCircle, color: "status-neutral" },
  "rent-ended": { icon: DollarSign, color: "status-neutral" },
  "removed": { icon: XCircle, color: "status-error" },
  "decommissioned": { icon: XCircle, color: "status-error" },
  "reassigned": { icon: MapPin, color: "status-info" },
  "config-changed": { icon: Settings, color: "status-info" },
};

export function AssetLifecycleTimeline({ events, compact = false }: AssetLifecycleTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Box className="w-10 h-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">No lifecycle events yet</p>
      </div>
    );
  }

  // Sort events by timestamp (newest first for display)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

      <div className="space-y-0">
        {sortedEvents.map((event, index) => {
          const config = eventConfig[event.eventType];
          const Icon = config.icon;
          const isFirst = index === 0;

          return (
            <div key={event.id} className="relative pl-12 pb-6 last:pb-0">
              {/* Event node */}
              <div
                className={cn(
                  "absolute left-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                  isFirst ? "scale-110" : ""
                )}
                style={{
                  backgroundColor: `hsl(var(--${config.color}) / 0.15)`,
                  borderColor: `hsl(var(--${config.color}))`,
                }}
              >
                <Icon
                  className="w-4 h-4"
                  style={{ color: `hsl(var(--${config.color}))` }}
                />
              </div>

              {/* Event content */}
              <div
                className={cn(
                  "p-4 rounded-lg border transition-all",
                  isFirst
                    ? "bg-secondary/50 border-border"
                    : "bg-secondary/20 border-border/50 hover:bg-secondary/30"
                )}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h4 className="font-medium text-foreground">{event.title}</h4>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <time className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(event.timestamp).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>by {event.performedBy}</span>
                  {event.siteName && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.siteName}
                      </span>
                    </>
                  )}
                  {event.configurationVersion && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                      <span>Config v{event.configurationVersion}</span>
                    </>
                  )}
                </div>

                {/* Evidence indicators */}
                {((event.photos && event.photos.length > 0) ||
                  (event.documents && event.documents.length > 0)) && (
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
                    {event.photos && event.photos.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Camera className="w-3.5 h-3.5" />
                        {event.photos.length} photo{event.photos.length > 1 ? "s" : ""}
                      </span>
                    )}
                    {event.documents && event.documents.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <FileText className="w-3.5 h-3.5" />
                        {event.documents.length} document{event.documents.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                )}

                {/* Reference link */}
                {event.referenceId && (
                  <div className="mt-2">
                    <button className="text-xs text-primary hover:underline">
                      View {event.referenceType} details →
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
