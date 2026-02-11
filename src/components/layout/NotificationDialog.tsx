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
import api from "@/lib/api";
import { Bell, X, CheckCheck, Inbox } from "lucide-react";

interface Notification {
  notificationId: string;
  issueType: string;
  message: string;
  reference: { type: string; id: string };
  createdAt?: string;
}

interface NotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationDialog({ open, onOpenChange }: NotificationDialogProps) {
  const { profile } = useAuth();
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
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 mb-3 rounded-full bg-muted flex items-center justify-center">
                  <Inbox className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No unread notifications</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.notificationId}
                  className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{n.issueType}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {n.message}
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {n.reference.type}: {n.reference.id}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => markAsRead(n.notificationId)}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
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
