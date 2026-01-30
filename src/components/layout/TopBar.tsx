import { Bell, Search, Moon, Sun, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ChangePasswordDialog } from "@/components/forms/ChangePasswordDialog";
import { NotificationDialog } from "./NotificationDialog";
import api from "@/lib/api";

export function TopBar() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const { profile, logout } = useAuth();
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const fetchCount = () => {
      if (profile) {
        api.get(`/notifications/count/${profile.username}`)
          .then(res => setNotificationCount(res.data.count))
          .catch(console.error);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [profile]);


  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 bg-background/80 backdrop-blur-xl border-b border-border">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search sites, assets, tickets..."
            className="pl-10 bg-secondary/50 border-transparent focus:border-border focus:bg-background"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsDark(!isDark)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpenNotifications(true)}
            className="relative text-muted-foreground hover:text-foreground"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-xs text-white bg-red-500 rounded-full">
                {notificationCount}
              </span>
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="ml-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.username || 'Guest'}</p>
                  <p className="text-xs text-muted-foreground">{profile?.role || ''}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setOpenChangePassword(true)}>Profile Settings</DropdownMenuItem>
              <DropdownMenuItem>Team Management</DropdownMenuItem>
              <DropdownMenuSeparator />
              <ChangePasswordDialog open={openChangePassword} onOpenChange={setOpenChangePassword} />
              <DropdownMenuItem onClick={() => logout()} className="text-status-error">Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <NotificationDialog open={openNotifications} onOpenChange={setOpenNotifications} />
    </>
  );
}
