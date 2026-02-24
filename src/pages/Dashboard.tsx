import { MapPin, Box, AlertTriangle, TrendingUp, Clock, CheckCircle2, ArrowUpRight, DollarSign, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAppData } from "@/context/AppDataContext";

interface MetricCardProps { title: string; value: string | number; change?: string; changeType?: "positive" | "negative" | "neutral"; icon: React.ReactNode; onClick?: () => void; }

function MetricCard({ title, value, change, changeType = "neutral", icon, onClick }: MetricCardProps) {
  return (
    <button onClick={onClick} className="data-card text-left group hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl bg-primary/10">{icon}</div>
        {change && <span className={cn("text-xs font-semibold px-2 py-1 rounded-full", changeType === "positive" && "bg-status-success/15 text-status-success", changeType === "negative" && "bg-status-error/15 text-status-error", changeType === "neutral" && "bg-muted text-muted-foreground")}>{change}</span>}
      </div>
      <div className="metric-value mb-1">{value}</div>
      <div className="flex items-center justify-between"><span className="metric-label">{title}</span><ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" /></div>
    </button>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, loading } = useAppData();

  const activeSites = data?.dashboard?.activeSites ?? 0;
  const totalAcs = data?.dashboard?.totalAcsUnits ?? 0;
  const openTickets = data?.dashboard?.openTickets ?? 0;
  const monthlyRevenue = data?.dashboard?.monthlyRevenue ?? 0;

  const formatRevenue = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${val.toLocaleString("en-IN")}`;
  };

  // Build alert sites from live data (sites with delays)
  const alertSites = (data?.sites ?? [])
    .filter(s => s.hasDelay)
    .slice(0, 5)
    .map(s => ({ name: s.name, issue: "Delayed", severity: "high" as const, siteId: String(s.id) }));

  // Build recent activity from live notifications/tickets
  const recentActivity: { id: number; type: string; message: string; time: string; status: string; link: string }[] = [];
  // Add recent open tickets
  (data?.maintenanceTickets ?? [])
    .filter(t => t.status !== "CLOSED" && t.status !== "REPAIRED")
    .slice(0, 4)
    .forEach((t, i) => {
      recentActivity.push({
        id: i + 1,
        type: "ticket",
        message: `Ticket #${t.id} — ${t.issueType ?? "Maintenance"} at site ${t.siteId}`,
        time: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "",
        status: t.priority === "HIGH" || t.priority === "CRITICAL" ? "warning" : "info",
        link: "/maintenance",
      });
    });

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-8"><h1 className="text-2xl font-semibold text-foreground mb-1">Dashboard</h1><p className="text-sm text-muted-foreground">Operations overview • Last updated: Just now</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Active Sites" value={activeSites} change={`${activeSites} total`} changeType="positive" icon={<MapPin className="w-5 h-5 text-primary" />} onClick={() => navigate("/projects")} />
        <MetricCard title="Total ACS Units" value={totalAcs} change={`${totalAcs} total`} changeType="positive" icon={<Box className="w-5 h-5 text-primary" />} onClick={() => navigate("/assets")} />
        <MetricCard title="Open Tickets" value={openTickets} change={`${openTickets} open`} changeType="negative" icon={<AlertTriangle className="w-5 h-5 text-primary" />} onClick={() => navigate("/maintenance")} />
        <MetricCard title="Monthly Revenue" value={formatRevenue(monthlyRevenue)} change="Live" changeType="positive" icon={<DollarSign className="w-5 h-5 text-primary" />} onClick={() => navigate("/finance")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 data-card">
          <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-semibold text-foreground">Recent Activity</h2><button onClick={() => navigate("/maintenance")} className="text-sm text-primary hover:text-primary/80 transition-colors">View All</button></div>
          <div className="space-y-3">
            {recentActivity.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Inbox className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
            {recentActivity.map((activity) => (
              <div key={activity.id} onClick={() => navigate(activity.link)} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", activity.status === "success" && "bg-status-success/15", activity.status === "warning" && "bg-status-warning/15", activity.status === "info" && "bg-status-info/15")}>
                  {activity.status === "success" && <CheckCircle2 className="w-4 h-4 text-status-success" />}
                  {activity.status === "warning" && <AlertTriangle className="w-4 h-4 text-status-warning" />}
                  {activity.status === "info" && <TrendingUp className="w-4 h-4 text-status-info" />}
                </div>
                <div className="flex-1 min-w-0"><p className="text-sm text-foreground">{activity.message}</p><p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Clock className="w-3 h-3" />{activity.time}</p></div>
              </div>
            ))}
          </div>
        </div>

        <div className="data-card">
          <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-semibold text-foreground">Attention Required</h2><span className="text-xs font-semibold px-2 py-1 rounded-full bg-status-warning/15 text-status-warning">{alertSites.length} alerts</span></div>
          <div className="space-y-3">
            {alertSites.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">All clear — no alerts</p>
              </div>
            )}
            {alertSites.map((site, index) => (
              <button key={index} onClick={() => navigate(`/site/${site.siteId}`)} className="w-full text-left p-3 bg-secondary/30 hover:bg-secondary/50 rounded-lg transition-all border border-transparent hover:border-border">
                <div className="flex items-center gap-2 mb-1"><span className={cn("w-2 h-2 rounded-full", site.severity === "high" && "bg-status-error", site.severity === "medium" && "bg-status-warning", site.severity === "low" && "bg-status-info")} /><span className="font-medium text-foreground text-sm truncate">{site.name}</span></div>
                <p className="text-xs text-muted-foreground pl-4">{site.issue}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
