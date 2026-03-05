import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import {
  Bell,
  X,
  CheckCheck,
  Inbox,
  AlertTriangle,
  Wrench,
  IndianRupee,
  Building,
  Package,
  FileText,
  UserX,
  Clock,
  ShieldAlert,
  Info,
  Eye,
  BellRing,
  Activity,
  ArrowRight,
} from "lucide-react";

interface Notification {
  notificationId: string;
  issueType: string;
  message: string;
  reference: { type: string; id: string };
  createdAt?: string;
}

type TabCategory = "all" | "alerts" | "updates" | "actions";

const issueTypeConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string; route?: string; category: "alerts" | "updates" | "actions" }> = {
  MAINTENANCE_DUE:       { icon: Wrench,        color: "text-[hsl(var(--status-warning))]",  bgColor: "bg-[hsl(var(--status-warning)/0.15)]",  label: "Maintenance Due",    route: "/maintenance", category: "actions" },
  MAINTENANCE_OVERDUE:   { icon: AlertTriangle,  color: "text-destructive",                   bgColor: "bg-destructive/15",                     label: "Maintenance Overdue",route: "/maintenance", category: "alerts" },
  TICKET_RAISED:         { icon: Wrench,        color: "text-[hsl(var(--status-info))]",     bgColor: "bg-[hsl(var(--status-info)/0.15)]",     label: "Ticket Raised",      route: "/maintenance", category: "actions" },
  TICKET_CLOSED:         { icon: Wrench,        color: "text-[hsl(var(--status-success))]",  bgColor: "bg-[hsl(var(--status-success)/0.15)]",  label: "Ticket Resolved",    route: "/maintenance", category: "updates" },
  PAYMENT_OVERDUE:       { icon: IndianRupee,   color: "text-destructive",                   bgColor: "bg-destructive/15",                     label: "Payment Overdue",    route: "/finance",     category: "alerts" },
  PAYMENT_RECEIVED:      { icon: IndianRupee,   color: "text-[hsl(var(--status-success))]",  bgColor: "bg-[hsl(var(--status-success)/0.15)]",  label: "Payment Received",   route: "/finance",     category: "updates" },
  INVOICE_GENERATED:     { icon: FileText,      color: "text-primary",                       bgColor: "bg-primary/15",                         label: "Invoice Generated",  route: "/finance",     category: "updates" },
  SITE_STAGE_CHANGE:     { icon: Building,      color: "text-primary",                       bgColor: "bg-primary/15",                         label: "Site Stage Changed", route: "/projects",    category: "updates" },
  SITE_DELAY:            { icon: Clock,         color: "text-[hsl(var(--status-warning))]",  bgColor: "bg-[hsl(var(--status-warning)/0.15)]",  label: "Site Delayed",       route: "/projects",    category: "alerts" },
  SITE_LIVE:             { icon: Building,      color: "text-[hsl(var(--status-success))]",  bgColor: "bg-[hsl(var(--status-success)/0.15)]",  label: "Site Live",          route: "/projects",    category: "updates" },
  ASSET_WARRANTY_EXPIRY: { icon: Package,       color: "text-[hsl(var(--status-warning))]",  bgColor: "bg-[hsl(var(--status-warning)/0.15)]",  label: "Warranty Expiring",  route: "/assets",      category: "alerts" },
  ASSET_ISSUE:           { icon: Package,       color: "text-destructive",                   bgColor: "bg-destructive/15",                     label: "Asset Issue",        route: "/assets",      category: "alerts" },
  USER_DEACTIVATED:      { icon: UserX,         color: "text-destructive",                   bgColor: "bg-destructive/15",                     label: "User Deactivated",   route: "/admin",       category: "updates" },
  SECURITY_ALERT:        { icon: ShieldAlert,   color: "text-destructive",                   bgColor: "bg-destructive/15",                     label: "Security Alert",                            category: "alerts" },
  IMPORT_COMPLETE:       { icon: FileText,      color: "text-[hsl(var(--status-success))]",  bgColor: "bg-[hsl(var(--status-success)/0.15)]",  label: "Import Complete",                           category: "updates" },
  IMPORT_FAILED:         { icon: FileText,      color: "text-destructive",                   bgColor: "bg-destructive/15",                     label: "Import Failed",                             category: "alerts" },
};

const defaultConfig: { icon: React.ElementType; color: string; bgColor: string; label: string; route?: string; category: "alerts" | "updates" | "actions" } = { icon: Info, color: "text-muted-foreground", bgColor: "bg-muted", label: "Info", category: "updates" };

interface NotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationDialog({ open, onOpenChange }: NotificationDialogProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<TabCategory>("all");

  useEffect(() => {
    if (open && profile) {
      api.get(`/notifications/unread/${profile.username}`).then((response) => {
        setNotifications(response.data);
      }).catch(error => {
        console.error("Failed to fetch notifications:", error);
      });
    }
  }, [open, profile]);

  const markAsRead = (notificationId: string) => {
    api.post(`/notifications/${notificationId}/read`).then(() => {
      setNotifications(prev => prev.filter((n) => n.notificationId !== notificationId));
    });
  };

  const markAllAsRead = () => {
    if (!profile) return;
    api.post(`/notifications/read-all/${profile.username}`).then(() => {
      setNotifications([]);
    });
  };

  const handleNavigate = (n: Notification) => {
    const config = issueTypeConfig[n.issueType] || defaultConfig;
    markAsRead(n.notificationId);
    if (config.route) {
      onOpenChange(false);
      navigate(config.route);
    }
  };

  const handleViewReference = (n: Notification) => {
    const config = issueTypeConfig[n.issueType] || defaultConfig;
    markAsRead(n.notificationId);
    const ref = n.reference;
    if (ref.type === "SITE" && ref.id) {
      onOpenChange(false);
      navigate(`/site/${ref.id}`);
    } else if (ref.type === "ASSET" && ref.id) {
      onOpenChange(false);
      navigate(`/asset/${ref.id}`);
    } else if (config.route) {
      onOpenChange(false);
      navigate(config.route);
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const categorized = useMemo(() => {
    const alerts: Notification[] = [];
    const updates: Notification[] = [];
    const actions: Notification[] = [];
    notifications.forEach(n => {
      const config = issueTypeConfig[n.issueType] || defaultConfig;
      switch (config.category) {
        case "alerts": alerts.push(n); break;
        case "actions": actions.push(n); break;
        default: updates.push(n); break;
      }
    });
    return { alerts, updates, actions };
  }, [notifications]);

  const filtered = activeTab === "all" ? notifications
    : activeTab === "alerts" ? categorized.alerts
    : activeTab === "updates" ? categorized.updates
    : categorized.actions;

  const NotificationItem = ({ n }: { n: Notification }) => {
    const config = issueTypeConfig[n.issueType] || defaultConfig;
    const Icon = config.icon;
    const isAlert = config.category === "alerts";
    const isAction = config.category === "actions";

    return (
      <div className={`p-3 rounded-lg border transition-colors group ${isAlert ? "border-destructive/30 bg-destructive/5 hover:bg-destructive/10" : "border-border hover:bg-muted/50"}`}>
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${config.bgColor}`}>
            <Icon className={`w-4 h-4 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${isAlert ? "border-destructive/40 text-destructive" : ""}`}>
                  {config.label}
                </Badge>
                {isAlert && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                  </span>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(n.createdAt)}</span>
            </div>
            <p className="text-sm text-foreground leading-snug">{n.message}</p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-muted-foreground">{n.reference.type} #{n.reference.id}</p>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {config.route && (
                  <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2 gap-1" onClick={(e) => { e.stopPropagation(); handleViewReference(n); }}>
                    <Eye className="w-3 h-3" />View
                  </Button>
                )}
                {isAction && config.route && (
                  <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2 gap-1 text-primary" onClick={(e) => { e.stopPropagation(); handleNavigate(n); }}>
                    <ArrowRight className="w-3 h-3" />Take Action
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2 gap-1 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); markAsRead(n.notificationId); }}>
                  <X className="w-3 h-3" />Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-12 h-12 mb-3 rounded-full bg-muted flex items-center justify-center">
        <Inbox className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] bg-background border-border p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
            {notifications.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{notifications.length}</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {notifications.length > 0
              ? `${categorized.alerts.length} alerts, ${categorized.actions.length} actions, ${categorized.updates.length} updates`
              : "You're all caught up"}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabCategory)}>
            <TabsList className="w-full bg-secondary/50 h-9">
              <TabsTrigger value="all" className="flex-1 text-xs gap-1.5">
                <BellRing className="w-3.5 h-3.5" />All
                {notifications.length > 0 && <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px] leading-none">{notifications.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex-1 text-xs gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />Alerts
                {categorized.alerts.length > 0 && <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[10px] leading-none">{categorized.alerts.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="actions" className="flex-1 text-xs gap-1.5">
                <Activity className="w-3.5 h-3.5" />Actions
                {categorized.actions.length > 0 && <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px] leading-none">{categorized.actions.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="updates" className="flex-1 text-xs gap-1.5">
                <Info className="w-3.5 h-3.5" />Updates
                {categorized.updates.length > 0 && <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px] leading-none">{categorized.updates.length}</Badge>}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="max-h-[420px] px-6">
          <div className="space-y-2 py-2">
            {filtered.length === 0 ? (
              <EmptyState message={activeTab === "all" ? "No unread notifications" : activeTab === "alerts" ? "No active alerts" : activeTab === "actions" ? "No pending actions" : "No new updates"} />
            ) : (
              filtered.map((n) => <NotificationItem key={n.notificationId} n={n} />)
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 pb-4 pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={notifications.length === 0} className="gap-2">
            <CheckCheck className="w-4 h-4" />Mark All as Read
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
