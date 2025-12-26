import {
  MapPin,
  Box,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  DollarSign,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  onClick?: () => void;
}

function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  onClick,
}: MetricCardProps) {
  return (
    <button
      onClick={onClick}
      className="data-card text-left group hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl bg-primary/10">{icon}</div>
        {change && (
          <span
            className={cn(
              "text-xs font-semibold px-2 py-1 rounded-full",
              changeType === "positive" && "bg-status-success/15 text-status-success",
              changeType === "negative" && "bg-status-error/15 text-status-error",
              changeType === "neutral" && "bg-muted text-muted-foreground"
            )}
          >
            {change}
          </span>
        )}
      </div>
      <div className="metric-value mb-1">{value}</div>
      <div className="flex items-center justify-between">
        <span className="metric-label">{title}</span>
        <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
}

const recentActivity = [
  {
    id: 1,
    type: "installation",
    message: "4 ACS units installed at Metro Tower - Block A",
    time: "2 hours ago",
    status: "success",
  },
  {
    id: 2,
    type: "ticket",
    message: "High priority ticket opened for Cyber Hub Tower 5",
    time: "4 hours ago",
    status: "warning",
  },
  {
    id: 3,
    type: "site",
    message: "DLF Cyber City Phase 3 moved to WTS stage",
    time: "6 hours ago",
    status: "info",
  },
  {
    id: 4,
    type: "finance",
    message: "Rent collection completed for 12 sites",
    time: "1 day ago",
    status: "success",
  },
];

const alertSites = [
  { name: "Metro Tower - Block A", issue: "5 days delayed", severity: "high" },
  { name: "DLF Cyber City Phase 3", issue: "Pending approvals", severity: "medium" },
  { name: "Mindspace IT Park", issue: "Vendor confirmation required", severity: "low" },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-1">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Operations overview • Last updated: Just now
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Active Sites"
          value="24"
          change="+3 this month"
          changeType="positive"
          icon={<MapPin className="w-5 h-5 text-primary" />}
          onClick={() => navigate("/")}
        />
        <MetricCard
          title="Total ACS Units"
          value="342"
          change="+18 installed"
          changeType="positive"
          icon={<Box className="w-5 h-5 text-primary" />}
        />
        <MetricCard
          title="Open Tickets"
          value="7"
          change="2 critical"
          changeType="negative"
          icon={<AlertTriangle className="w-5 h-5 text-primary" />}
        />
        <MetricCard
          title="Monthly Revenue"
          value="₹42.5L"
          change="+12.5%"
          changeType="positive"
          icon={<DollarSign className="w-5 h-5 text-primary" />}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 data-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
            <button className="text-sm text-primary hover:text-primary/80 transition-colors">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg"
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    activity.status === "success" && "bg-status-success/15",
                    activity.status === "warning" && "bg-status-warning/15",
                    activity.status === "info" && "bg-status-info/15"
                  )}
                >
                  {activity.status === "success" && (
                    <CheckCircle2 className="w-4 h-4 text-status-success" />
                  )}
                  {activity.status === "warning" && (
                    <AlertTriangle className="w-4 h-4 text-status-warning" />
                  )}
                  {activity.status === "info" && (
                    <TrendingUp className="w-4 h-4 text-status-info" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{activity.message}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="data-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-foreground">Attention Required</h2>
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-status-warning/15 text-status-warning">
              {alertSites.length} alerts
            </span>
          </div>

          <div className="space-y-3">
            {alertSites.map((site, index) => (
              <button
                key={index}
                onClick={() => navigate("/site/site-001")}
                className="w-full text-left p-3 bg-secondary/30 hover:bg-secondary/50 rounded-lg transition-all border border-transparent hover:border-border"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      site.severity === "high" && "bg-status-error",
                      site.severity === "medium" && "bg-status-warning",
                      site.severity === "low" && "bg-status-info"
                    )}
                  />
                  <span className="font-medium text-foreground text-sm truncate">
                    {site.name}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pl-4">{site.issue}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
