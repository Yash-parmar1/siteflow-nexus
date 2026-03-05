import { useState, useEffect } from "react";
import { MapPin, Box, AlertTriangle, TrendingUp, Clock, CheckCircle2, ArrowUpRight, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAppData } from "@/context/AppDataContext";
import api from "@/lib/api";

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

interface AuditLog {
  id: number;
  action: string;
  entityTable: string;
  entityId: number;
  description: string;
  performedBy: string;
  timestamp: string;
}

const entityTypeToIcon: Record<string, "success" | "warning" | "info"> = {
  sites: "info",
  installations: "success",
  assets: "info",
  maintenance_tickets: "warning",
  clients: "info",
  projects: "info",
};

const entityTypeToRoute: Record<string, string> = {
  sites: "/projects",
  installations: "/installations",
  assets: "/assets",
  maintenance_tickets: "/maintenance",
  clients: "/clients",
  projects: "/projects",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, loading } = useAppData();
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);

  useEffect(() => {
    api.get('/audit/logs?page=0&size=10')
      .then((res) => {
        const logs = res.data?.content || res.data || [];
        setRecentActivity(Array.isArray(logs) ? logs.slice(0, 6) : []);
      })
      .catch(() => {});
  }, []);

  const activeSites = data?.dashboard?.activeSites ?? 0;
  const totalAcs = data?.dashboard?.totalAcsUnits ?? 0;
  const openTickets = data?.dashboard?.openTickets ?? 0;
  const monthlyRevenue = data?.dashboard?.monthlyRevenue ?? 0;

  const formatRevenue = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return `₹${val.toLocaleString("en-IN")}`;
  };

  const alertSites = data?.sites
    ? data.sites.filter(s => s.hasDelay).slice(0, 5).map(s => ({ name: s.name, issue: "Delayed", severity: "high" as const, siteId: String(s.id) }))
    : [];

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-8"><h1 className="text-2xl font-semibold text-foreground mb-1">Dashboard</h1><p className="text-sm text-muted-foreground">Operations overview • Last updated: Just now</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Active Sites" value={activeSites} change={`${activeSites} total`} changeType="positive" icon={<MapPin className="w-5 h-5 text-primary" />} onClick={() => navigate("/projects")} />
        <MetricCard title="Total ACS Units" value={totalAcs} change={`${totalAcs} total`} changeType="positive" icon={<Box className="w-5 h-5 text-primary" />} onClick={() => navigate("/assets")} />
        <MetricCard title="Open Tickets" value={openTickets} change={`${openTickets} open`} changeType={openTickets > 0 ? "negative" : "neutral"} icon={<AlertTriangle className="w-5 h-5 text-primary" />} onClick={() => navigate("/maintenance")} />
        <MetricCard title="Monthly Revenue" value={formatRevenue(monthlyRevenue)} change="Live" changeType="positive" icon={<DollarSign className="w-5 h-5 text-primary" />} onClick={() => navigate("/finance")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 data-card">
          <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-semibold text-foreground">Recent Activity</h2><button onClick={() => navigate("/maintenance")} className="text-sm text-primary hover:text-primary/80 transition-colors">View All</button></div>
          <div className="space-y-3">
            {recentActivity.length > 0 ? recentActivity.map((log) => {
              const statusType = entityTypeToIcon[log.entityTable] || "info";
              const route = entityTypeToRoute[log.entityTable] || "/dashboard";
              return (
                <div key={log.id} onClick={() => navigate(route)} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", statusType === "success" && "bg-status-success/15", statusType === "warning" && "bg-status-warning/15", statusType === "info" && "bg-status-info/15")}>
                    {statusType === "success" && <CheckCircle2 className="w-4 h-4 text-status-success" />}
                    {statusType === "warning" && <AlertTriangle className="w-4 h-4 text-status-warning" />}
                    {statusType === "info" && <TrendingUp className="w-4 h-4 text-status-info" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{log.description || `${log.action} on ${log.entityTable}`}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Clock className="w-3 h-3" />{formatTime(log.timestamp)}{log.performedBy && <span> · {typeof log.performedBy === 'string' ? log.performedBy : (log.performedBy.firstName ? `${log.performedBy.firstName} ${log.performedBy.lastName}` : log.performedBy.username)}</span>}</p>
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            )}
          </div>
        </div>

        <div className="data-card">
          <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-semibold text-foreground">Attention Required</h2><span className="text-xs font-semibold px-2 py-1 rounded-full bg-status-warning/15 text-status-warning">{alertSites.length} alerts</span></div>
          <div className="space-y-3">
            {alertSites.length > 0 ? alertSites.map((site, index) => (
              <button key={index} onClick={() => navigate(`/site/${site.siteId}`)} className="w-full text-left p-3 bg-secondary/30 hover:bg-secondary/50 rounded-lg transition-all border border-transparent hover:border-border">
                <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-status-error" /><span className="font-medium text-foreground text-sm truncate">{site.name}</span></div>
                <p className="text-xs text-muted-foreground pl-4">{site.issue}</p>
              </button>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4">No alerts</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
