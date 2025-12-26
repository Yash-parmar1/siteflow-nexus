import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Plus,
  Users,
  Shield,
  Settings,
  Key,
  Bell,
  Database,
  Activity,
  MoreHorizontal,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  UserPlus,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Upload,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data for users
const mockUsers = [
  {
    id: "USR-001",
    name: "Raj Kumar",
    email: "raj.kumar@company.com",
    role: "Admin",
    department: "Operations",
    status: "Active",
    lastLogin: "2 hours ago",
    createdAt: "Jan 15, 2023",
  },
  {
    id: "USR-002",
    name: "Priya Singh",
    email: "priya.singh@company.com",
    role: "Operations Manager",
    department: "Operations",
    status: "Active",
    lastLogin: "5 hours ago",
    createdAt: "Mar 20, 2023",
  },
  {
    id: "USR-003",
    name: "Amit Patel",
    email: "amit.patel@company.com",
    role: "Field Technician",
    department: "Maintenance",
    status: "Active",
    lastLogin: "1 day ago",
    createdAt: "Jun 10, 2023",
  },
  {
    id: "USR-004",
    name: "Sunita Reddy",
    email: "sunita.reddy@company.com",
    role: "Finance Manager",
    department: "Finance",
    status: "Active",
    lastLogin: "3 hours ago",
    createdAt: "Feb 05, 2023",
  },
  {
    id: "USR-005",
    name: "Vikram Joshi",
    email: "vikram.joshi@company.com",
    role: "Viewer",
    department: "Management",
    status: "Inactive",
    lastLogin: "2 weeks ago",
    createdAt: "Aug 15, 2023",
  },
];

const roles = [
  { name: "Admin", description: "Full system access", users: 2, color: "bg-[hsl(var(--status-error)/0.15)] text-[hsl(var(--status-error))]" },
  { name: "Operations Manager", description: "Manage sites, installations, vendors", users: 3, color: "bg-primary/10 text-primary" },
  { name: "Finance Manager", description: "Access to finance module and reports", users: 2, color: "bg-[hsl(var(--status-success)/0.15)] text-[hsl(var(--status-success))]" },
  { name: "Field Technician", description: "Update maintenance tickets and installations", users: 8, color: "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))]" },
  { name: "Viewer", description: "Read-only access to dashboards", users: 5, color: "bg-muted text-muted-foreground" },
];

const auditLogs = [
  { action: "User Login", user: "Raj Kumar", timestamp: "Dec 26, 2024 10:30 AM", ip: "192.168.1.45", status: "Success" },
  { action: "Invoice Created", user: "Sunita Reddy", timestamp: "Dec 26, 2024 09:15 AM", ip: "192.168.1.52", status: "Success" },
  { action: "Site Updated", user: "Priya Singh", timestamp: "Dec 26, 2024 08:45 AM", ip: "192.168.1.48", status: "Success" },
  { action: "Failed Login Attempt", user: "Unknown", timestamp: "Dec 26, 2024 03:22 AM", ip: "45.67.89.123", status: "Failed" },
  { action: "Ticket Resolved", user: "Amit Patel", timestamp: "Dec 25, 2024 04:30 PM", ip: "10.0.0.15", status: "Success" },
];

const systemSettings = [
  { name: "Two-Factor Authentication", description: "Require 2FA for all users", enabled: true },
  { name: "Session Timeout", description: "Auto logout after 30 minutes of inactivity", enabled: true },
  { name: "Email Notifications", description: "Send email alerts for critical events", enabled: true },
  { name: "Audit Logging", description: "Track all user actions in system logs", enabled: true },
  { name: "API Access", description: "Allow external API integrations", enabled: false },
  { name: "Maintenance Mode", description: "Temporarily disable user access for maintenance", enabled: false },
];

export default function Admin() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Admin</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            System settings, user management, and security
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="data-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="metric-value">{mockUsers.length}</p>
                <p className="metric-label">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="data-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-success)/0.15)] flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[hsl(var(--status-success))]" />
              </div>
              <div>
                <p className="metric-value">{mockUsers.filter(u => u.status === "Active").length}</p>
                <p className="metric-label">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="data-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-warning)/0.15)] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[hsl(var(--status-warning))]" />
              </div>
              <div>
                <p className="metric-value">{roles.length}</p>
                <p className="metric-label">Roles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="data-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-error)/0.15)] flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[hsl(var(--status-error))]" />
              </div>
              <div>
                <p className="metric-value">1</p>
                <p className="metric-label">Security Alert</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="w-4 h-4 mr-2" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Activity className="w-4 h-4 mr-2" />
            Audit Log
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">User Management</CardTitle>
                  <CardDescription>Manage user accounts and permissions</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-[200px]"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[150px] bg-secondary/50">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="all">All Roles</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.name} value={role.name}>{role.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="default">
                    <UserPlus className="w-4 h-4" />
                    Add User
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="text-muted-foreground font-medium">User</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Role</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Department</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Last Login</TableHead>
                    <TableHead className="text-muted-foreground font-medium w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user, index) => (
                    <TableRow
                      key={user.id}
                      className="hover:bg-muted/50 border-border/50 animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {user.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.department}</TableCell>
                      <TableCell>
                        <Badge className={user.status === "Active" 
                          ? "bg-[hsl(var(--status-success)/0.15)] text-[hsl(var(--status-success))] border-0"
                          : "bg-muted text-muted-foreground border-0"
                        }>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{user.lastLogin}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Key className="w-4 h-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              {user.status === "Active" ? (
                                <>
                                  <Lock className="w-4 h-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-4 h-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-[hsl(var(--status-error))]">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {roles.map((role, index) => (
              <Card
                key={role.name}
                className="data-card animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={`${role.color} border-0`}>{role.name}</Badge>
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{role.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{role.users} users</span>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card className="data-card border-dashed flex items-center justify-center min-h-[160px]">
              <Button variant="ghost" className="flex flex-col gap-2 h-auto py-6">
                <Plus className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Add New Role</span>
              </Button>
            </Card>
          </div>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Audit Log</CardTitle>
                  <CardDescription>Track all system activities and user actions</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="text-muted-foreground font-medium">Action</TableHead>
                    <TableHead className="text-muted-foreground font-medium">User</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Timestamp</TableHead>
                    <TableHead className="text-muted-foreground font-medium">IP Address</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log, index) => (
                    <TableRow
                      key={index}
                      className="hover:bg-muted/50 border-border/50 animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="font-medium">{log.action}</TableCell>
                      <TableCell className="text-muted-foreground">{log.user}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{log.timestamp}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">{log.ip}</TableCell>
                      <TableCell>
                        <Badge className={log.status === "Success"
                          ? "bg-[hsl(var(--status-success)/0.15)] text-[hsl(var(--status-success))] border-0"
                          : "bg-[hsl(var(--status-error)/0.15)] text-[hsl(var(--status-error))] border-0"
                        }>
                          {log.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-lg">Security Settings</CardTitle>
                <CardDescription>Configure system security options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {systemSettings.slice(0, 4).map((setting, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">{setting.name}</Label>
                      <p className="text-xs text-muted-foreground">{setting.description}</p>
                    </div>
                    <Switch checked={setting.enabled} />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-lg">System Settings</CardTitle>
                <CardDescription>General system configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {systemSettings.slice(4).map((setting, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">{setting.name}</Label>
                      <p className="text-xs text-muted-foreground">{setting.description}</p>
                    </div>
                    <Switch checked={setting.enabled} />
                  </div>
                ))}
                <Separator />
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Database Backup</Label>
                    <p className="text-xs text-muted-foreground mb-2">Last backup: 6 hours ago</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Database className="w-4 h-4" />
                        Backup Now
                      </Button>
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4" />
                        Restore
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
