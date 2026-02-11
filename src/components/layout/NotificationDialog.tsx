import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Bell, X } from "lucide-react";

export function NotificationDialog({ open, onOpenChange }) {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (open && profile) {
      api.get(`/notifications/unread/${profile.username}`).then((response) => {
        setNotifications(response.data);
      }).catch(error => {
        console.error("Failed to fetch notifications:", error);
      });
    }
  }, [open, profile]);

  const markAsRead = (notificationId) => {
    api.post(`/notifications/${notificationId}/read`).then(() => {
      setNotifications(
        notifications.filter((n) => n.notificationId !== notificationId)
      );
    });
  };

  const markAllAsRead = () => {
    api.post(`/notifications/read-all/${profile.username}`).then(() => {
      setNotifications([]);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <span>Unread Notifications</span>
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-muted-foreground">No unread notifications.</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.notificationId}
                className="p-3 rounded-lg bg-secondary/50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{n.issueType}</p>
                    <p className="text-sm text-muted-foreground">
                      {n.message} ({n.reference.type}: {n.reference.id})
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => markAsRead(n.notificationId)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={markAllAsRead}
            disabled={notifications.length === 0}
          >
            Mark All as Read
          </Button>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
