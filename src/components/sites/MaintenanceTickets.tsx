import { AlertTriangle, Clock, CheckCircle2, XCircle, User, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Ticket {
  id: string;
  title: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in-progress" | "resolved" | "closed";
  assignee?: string;
  createdAt: string;
  acsUnit?: string;
}

interface MaintenanceTicketsProps {
  tickets: Ticket[];
}

const priorityConfig = {
  low: { label: "Low", color: "status-neutral" },
  medium: { label: "Medium", color: "status-info" },
  high: { label: "High", color: "status-warning" },
  critical: { label: "Critical", color: "status-error" },
};

const statusConfig = {
  open: { label: "Open", icon: AlertTriangle, color: "status-warning" },
  "in-progress": { label: "In Progress", icon: Clock, color: "status-info" },
  resolved: { label: "Resolved", icon: CheckCircle2, color: "status-success" },
  closed: { label: "Closed", icon: XCircle, color: "status-neutral" },
};

export function MaintenanceTickets({ tickets }: MaintenanceTicketsProps) {
  const openTickets = tickets.filter(
    (t) => t.status === "open" || t.status === "in-progress"
  );

  return (
    <div className="data-card">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-foreground">Maintenance & Issues</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {openTickets.length} open
          </span>
          <button className="text-sm text-primary hover:text-primary/80 transition-colors">
            View All
          </button>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 mb-3 rounded-full bg-status-success/15 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-status-success" />
          </div>
          <p className="text-sm text-muted-foreground">No open issues</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.slice(0, 5).map((ticket) => {
            const priority = priorityConfig[ticket.priority];
            const status = statusConfig[ticket.status];
            const StatusIcon = status.icon;

            return (
              <button
                key={ticket.id}
                className="w-full text-left flex items-start gap-3 p-3 bg-secondary/30 hover:bg-secondary/50 rounded-lg transition-all border border-transparent hover:border-border"
              >
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5"
                  style={{
                    backgroundColor: `hsl(var(--${status.color}) / 0.15)`,
                  }}
                >
                  <StatusIcon
                    className="w-4 h-4"
                    style={{ color: `hsl(var(--${status.color}))` }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground truncate">
                      {ticket.title}
                    </span>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase shrink-0"
                      )}
                      style={{
                        backgroundColor: `hsl(var(--${priority.color}) / 0.15)`,
                        color: `hsl(var(--${priority.color}))`,
                      }}
                    >
                      {priority.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {ticket.createdAt}
                    </span>
                    {ticket.assignee && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {ticket.assignee}
                      </span>
                    )}
                    {ticket.acsUnit && (
                      <span className="text-foreground/70">• {ticket.acsUnit}</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
