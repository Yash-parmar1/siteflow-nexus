import { useState, useEffect } from "react";
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
} from "lucide-react";

interface Notification {
  notificationId: string;
  issueType: string;
  message: string;
  reference: { type: string; id: string };
  createdAt?: string;
}

const issueTypeConfig: Record<string, { icon: React.ElementType; color: string; label: string; route?: string }> = {
  MAINTENANCE_DUE: { icon: Wrench, color: "text-[hsl(var(--status-warning))]", label: "Maintenance", route: "/maintenance" },
  MAINTENANCE_OVERDUE: { icon: AlertTriangle, color: "text-destructive", label: "Overdue", route: "/maintenance" },
  TICKET_RAISED: { icon: Wrench, color: "text-[hsl(var(--status-info))]", label: "Ticket", route: "/maintenance" },
  TICKET_CLOSED: { icon: Wrench, color: "text-[hsl(var(--status-success))]", label: "Resolved", route: "/maintenance" },
  PAYMENT_OVERDUE: { icon: IndianRupee, color: "text-destructive", label: "Payment", route: "/finance" },
  PAYMENT_RECEIVED: { icon: IndianRupee, color: "text-[hsl(var(--status-success))]", label: "Payment", route: "/finance" },
  INVOICE_GENERATED: { icon: FileText, color: "text-primary", label: "Invoice", route: "/finance" },
  SITE_STAGE_CHANGE: { icon: Building, color: "text-primary", label: "Site Update", route: "/projects" },
  SITE_DELAY: { icon: Clock, color: "text-[hsl(var(--status-warning))]", label: "Delay", route: "/projects" },
  SITE_LIVE: { icon: Building, color: "text-[hsl(var(--status-success))]", label: "Site Live", route: "/projects" },
  ASSET_WARRANTY_EXPIRY: { icon: Package, color: "text-[hsl(var(--status-warning))]", label: "Warranty", route: "/assets" },
  ASSET_ISSUE: { icon: Package, color: "text-destructive", label: "Asset Issue", route: "/assets" },
  USER_DEACTIVATED: { icon: UserX, color: "text-destructive", label: "User", route: "/admin" },
  SECURITY_ALERT: { icon: ShieldAlert, color: "text-destructive", label: "Security" },
  IMPORT_COMPLETE: { icon: FileText, color: "text-[hsl(var(--status-success))]", label: "Import" },
  IMPORT_FAILED: { icon: FileText, color: "text-destructive", label: "Import Failed" },
};

const defaultConfig: { icon: React.ElementType; color: string; label: string; route?: string } = { icon: Info, color: "text-muted-foreground", label: "Info" };

interface NotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationDialog({ open, onOpenChange }: NotificationDialogProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);

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
      setNotifications(
        notifications.filter((n) => n.notificationId !== notificationId)
      );
    });
  };

  const markAllAsRead = () => {
    if (!profile) return;
    api.post(`/notifications/read-all/${profile.username}`).then(() => {
      setNotifications([]);
    });
  };

  const handleAction = (n: Notification) => {
    const config = issueTypeConfig[n.issueType] || defaultConfig;
    markAsRead(n.notificationId);
    if (config.route) {
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
    return `${diffDays}d ago`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
          </DialogTitle>
          <DialogDescription>
            {notifications.length > 0
              ? `${notifications.length} unread notification${notifications.length > 1 ? "s" : ""}`
              : "You're all caught up"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 mb-3 rounded-full bg-muted flex items-center justify-center">
                  <Inbox className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No unread notifications</p>
              </div>
            ) : (
              notifications.map((n) => {
                const config = issueTypeConfig[n.issueType] || defaultConfig;
                const Icon = config.icon;
                return (
                  <div
                    key={n.notificationId}
                    className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={() => handleAction(n)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center ${config.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                            {config.label}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mt-1 leading-snug">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {n.reference.type} #{n.reference.id}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => { e.stopPropagation(); markAsRead(n.notificationId); }}
                        className="text-muted-foreground hover:text-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={notifications.length === 0}
            className="gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            Mark All as Read
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
