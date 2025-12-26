import { Check, Clock, User, FileText, Image } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  stage: string;
  status: "completed" | "current" | "upcoming";
  date?: string;
  user?: string;
  notes?: string;
  hasAttachments?: boolean;
}

interface SiteTimelineProps {
  events: TimelineEvent[];
}

const stageLabels: Record<string, string> = {
  Started: "Project Started",
  WTS: "Work To Start",
  WIP: "Work In Progress",
  TIS: "Testing In Service",
  Installed: "Installation Complete",
  Live: "Site is Live",
};

const stageColors: Record<string, string> = {
  Started: "stage-started",
  WTS: "stage-wts",
  WIP: "stage-wip",
  TIS: "stage-tis",
  Installed: "stage-installed",
  Live: "stage-live",
};

export function SiteTimeline({ events }: SiteTimelineProps) {
  return (
    <div className="data-card">
      <h2 className="text-lg font-semibold text-foreground mb-6">Lifecycle Timeline</h2>

      <div className="relative">
        {events.map((event, index) => {
          const isLast = index === events.length - 1;
          const colorVar = stageColors[event.stage];

          return (
            <div key={event.id} className="relative flex gap-4 pb-8 last:pb-0">
              {/* Connector Line */}
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-4 top-10 bottom-0 w-0.5",
                    event.status === "completed"
                      ? "bg-gradient-to-b from-status-success to-status-success/30"
                      : "bg-border"
                  )}
                />
              )}

              {/* Status Icon */}
              <div
                className={cn(
                  "relative z-10 flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-all duration-300",
                  event.status === "completed" && "bg-status-success text-primary-foreground",
                  event.status === "current" &&
                    `ring-4 ring-offset-2 ring-offset-background`,
                  event.status === "upcoming" && "bg-secondary text-muted-foreground"
                )}
                style={{
                  backgroundColor:
                    event.status === "current"
                      ? `hsl(var(--${colorVar}))`
                      : undefined,
                  color: event.status === "current" ? "white" : undefined,
                  boxShadow:
                    event.status === "current"
                      ? `0 0 20px hsl(var(--${colorVar}) / 0.4)`
                      : undefined,
                }}
              >
                {event.status === "completed" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-3 mb-1">
                  <h3
                    className={cn(
                      "font-semibold",
                      event.status === "upcoming"
                        ? "text-muted-foreground"
                        : "text-foreground"
                    )}
                  >
                    {stageLabels[event.stage] || event.stage}
                  </h3>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider",
                      event.status === "completed" && "bg-status-success/15 text-status-success",
                      event.status === "current" && "bg-primary/15 text-primary",
                      event.status === "upcoming" && "bg-muted text-muted-foreground"
                    )}
                  >
                    {event.status}
                  </span>
                </div>

                {event.date && (
                  <p className="text-sm text-muted-foreground mb-2">{event.date}</p>
                )}

                {event.user && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                    <User className="w-3.5 h-3.5" />
                    <span>{event.user}</span>
                  </div>
                )}

                {event.notes && (
                  <div className="flex items-start gap-1.5 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 mt-2">
                    <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{event.notes}</span>
                  </div>
                )}

                {event.hasAttachments && (
                  <button className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 mt-2 transition-colors">
                    <Image className="w-3.5 h-3.5" />
                    <span>View Attachments</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
