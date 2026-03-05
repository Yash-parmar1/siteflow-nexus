import { useState, useEffect } from "react";
import api from "@/lib/api";
import { AddUserDialog } from "@/components/forms/AddUserDialog";
import { EditUserDialog } from "@/components/forms/EditUserDialog";
import { DeleteUserDialog } from "@/components/forms/DeleteUserDialog";
import { DeactivateUserDialog } from "@/components/forms/DeactivateUserDialog";
// Reset password removed as per requirements
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
  Search, Plus, Users, Shield, Settings, Bell, Database, Activity,
  MoreHorizontal, Mail, Clock, CheckCircle2, XCircle, AlertTriangle,
  Lock, Unlock, UserPlus, Edit, Trash2, RefreshCw, Download, Upload,
  Undo2, ChevronLeft, ChevronRight, Filter, Eye, AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Users are loaded from the backend via /api/admin/users
// each user: { id, username, firstName, lastName, email, role, active, createdAt }
// displayName is derived on the client


type RoleType = {
  id: number;
  name: string;
  description?: string;
};

// roles are fetched from backend




const systemSettings = [
  { name: "Two-Factor Authentication", description: "Require 2FA for all users", enabled: true },
  { name: "Session Timeout", description: "Auto logout after 30 minutes of inactivity", enabled: true },
  { name: "Email Notifications", description: "Send email alerts for critical events", enabled: true },
  { name: "Audit Logging", description: "Track all user actions in system logs", enabled: true },
  { name: "API Access", description: "Allow external API integrations", enabled: false },
  { name: "Maintenance Mode", description: "Temporarily disable user access for maintenance", enabled: false },
];

type UserType = {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  active?: boolean;
  createdAt?: string;
  lastLogin?: string;
  department?: string;
  // computed
  displayName?: string;
};


export default function Admin() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);
  const [showDeactivateUserDialog, setShowDeactivateUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserType[]>([]);
  const [auditEntries, setAuditEntries] = useState<any[]>([]);
  const [auditPage, setAuditPage] = useState(0);
  const [auditTotalPages, setAuditTotalPages] = useState(0);
  const [auditTotalElements, setAuditTotalElements] = useState(0);
  const [auditEntityFilter, setAuditEntityFilter] = useState("all");
  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [auditStatusFilter, setAuditStatusFilter] = useState("all");
  const [auditSearchQuery, setAuditSearchQuery] = useState("");
  const [auditFilterOptions, setAuditFilterOptions] = useState<{ entityTables: string[]; actions: string[] }>({ entityTables: [], actions: [] });
  const [revertingId, setRevertingId] = useState<number | null>(null);
  const [revertConfirmId, setRevertConfirmId] = useState<number | null>(null);
  const [auditDetailEntry, setAuditDetailEntry] = useState<any | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [pendingRoles, setPendingRoles] = useState<Record<string,string>>({});
  const [roles, setRoles] = useState<RoleType[]>([]);

  useEffect(() => { fetchUsers(); fetchPending(); fetchLogs(); fetchRoles(); fetchAuditFilters(); }, []);

  // Re-fetch audit logs when filters change
  useEffect(() => { fetchLogs(0); }, [auditEntityFilter, auditActionFilter, auditStatusFilter]);

  async function fetchRoles() {
    try {
      const resp = await api.get('/admin/roles');
      setRoles(resp.data || []);
    } catch (err) {
      console.error('Failed to load roles', err);
    }
  }

  async function fetchUsers() {
    try {
      setLoadingUsers(true);
      const resp = await api.get('/admin/users');
      const data = resp.data || [];
      setUsers(data.map((u: any) => ({ ...u, displayName: u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : (u.username || u.email) })));
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function fetchPending() {
    try {
      const resp = await api.get('/admin/users/pending');
      const data = resp.data || [];
      setPendingUsers(data.map((u: any) => ({ ...u, displayName: u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : (u.username || u.email) })));
    } catch (err) {
      console.error('Failed to load pending users', err);
    }
  }

  async function fetchLogs(page = 0) {
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("size", "30");
      if (auditEntityFilter !== "all") params.set("entityTable", auditEntityFilter);
      if (auditActionFilter !== "all") params.set("action", auditActionFilter);
      if (auditStatusFilter !== "all") params.set("status", auditStatusFilter);
      const resp = await api.get(`/audit/logs?${params.toString()}`);
      const data = resp.data;
      setAuditEntries(data.content || []);
      setAuditTotalPages(data.totalPages || 0);
      setAuditTotalElements(data.totalElements || 0);
      setAuditPage(data.currentPage ?? page);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    }
  }

  async function fetchAuditFilters() {
    try {
      const resp = await api.get('/audit/filters');
      setAuditFilterOptions(resp.data || { entityTables: [], actions: [] });
    } catch (err) {
      console.error('Failed to load audit filters', err);
    }
  }

  async function handleRevert(logId: number) {
    setRevertingId(logId);
    try {
      const resp = await api.post(`/audit/logs/${logId}/revert`);
      toast.success(`Reverted successfully${resp.data?.cascadeCount ? ` (${resp.data.cascadeCount} cascaded)` : ''}`);
      setRevertConfirmId(null);
      fetchLogs(auditPage);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to revert');
    } finally {
      setRevertingId(null);
    }
  }

  async function approvePendingUser(id: string, role: string = 'user') {
    try {
      await api.post(`/admin/users/${id}/approve`, { role });
      await fetchUsers();
      await fetchPending();
    } catch (err) {
      console.error('Failed to approve user', err);
    }
  }

  async function declinePendingUser(id: string) {
    try {
      await api.post(`/admin/users/${id}/decline`);
      await fetchPending();
      await fetchUsers();
    } catch (err) {
      console.error('Failed to decline user', err);
    }
  }

  async function updateUser(id: string, payload: any) {
    try {
      await api.patch(`/admin/users/${id}`, payload);
      await fetchUsers();
    } catch (err) { console.error('Failed to update user', err); }
  }

  async function deleteUserById(id: string) {
    try {
      await api.delete(`/admin/users/${id}`);
      await fetchUsers();
    } catch (err) { console.error('Failed to delete user', err); }
  }


  const filteredUsers = users.filter((user) => {
    const name = (user.displayName || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || (user.role || "").toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  const handleEditUser = (user: UserType) => { setSelectedUser(user); setShowEditUserDialog(true); };
  const handleDeleteUser = (user: UserType) => { setSelectedUser(user); setShowDeleteUserDialog(true); };

  const handleDeactivateUser = (user: UserType) => { setSelectedUser(user); setShowDeactivateUserDialog(true); };

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Admin</h1>
          <p className="text-sm text-muted-foreground mt-0.5">System settings, user management, and security</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="data-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div><div><p className="metric-value">{users.length}</p><p className="metric-label">Total Users</p></div></div></CardContent></Card>
        <Card className="data-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-success)/0.15)] flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-[hsl(var(--status-success))]" /></div><div><p className="metric-value">{users.filter(u => u.active).length}</p><p className="metric-label">Active</p></div></div></CardContent></Card>
        <Card className="data-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-warning)/0.15)] flex items-center justify-center"><Shield className="w-5 h-5 text-[hsl(var(--status-warning))]" /></div><div><p className="metric-value">{roles.length}</p><p className="metric-label">Roles</p></div></div></CardContent></Card>
        <Card className="data-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-error)/0.15)] flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-[hsl(var(--status-error))]" /></div><div><p className="metric-value">1</p><p className="metric-label">Security Alert</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-secondary/50">
          <TabsTrigger value="users"><Users className="w-4 h-4 mr-2" />Users</TabsTrigger>
          <TabsTrigger value="roles"><Shield className="w-4 h-4 mr-2" />Roles</TabsTrigger>
          <TabsTrigger value="audit"><Activity className="w-4 h-4 mr-2" />Audit Log</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2" />Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div><CardTitle className="text-lg">User Management</CardTitle><CardDescription>Manage user accounts and permissions</CardDescription></div>
                <div className="flex gap-2">
                  <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type="search" placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-[200px]" /></div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}><SelectTrigger className="w-[150px] bg-secondary/50"><SelectValue placeholder="Role" /></SelectTrigger><SelectContent className="bg-popover border-border"><SelectItem value="all">All Roles</SelectItem>{roles.map((role) => (<SelectItem key={role.name} value={role.name}>{role.name}</SelectItem>))}</SelectContent></Select>
                  <Button size="default" onClick={() => setShowAddUserDialog(true)}><UserPlus className="w-4 h-4" />Add User</Button>
                </div>
              </div>
            </CardHeader>
            <div className="p-4">
              {pendingUsers.length > 0 && (
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-sm">Pending Approvals</CardTitle>
                    <CardDescription>Approve or decline newly registered users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingUsers.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-4 p-2 border-b border-border">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8"><AvatarFallback className="bg-primary/10 text-primary text-sm">{(p.displayName || p.username || p.email || "").split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                          <div><p className="font-medium">{p.displayName || p.username || p.email}</p><p className="text-xs text-muted-foreground">{p.email}</p></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select defaultValue="user" onValueChange={(val) => setPendingRoles(prev => ({ ...prev, [p.id]: val }))}><SelectTrigger className="w-[140px] bg-secondary/50"><SelectValue placeholder="Select Role" /></SelectTrigger><SelectContent>{roles.map((r) => (<SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>))}</SelectContent></Select>
                          <Button size="sm" onClick={() => approvePendingUser(p.id, pendingRoles[p.id] || 'user')}><CheckCircle2 className="w-4 h-4 mr-2" />Approve</Button>
                          <Button variant="ghost" size="sm" className="text-[hsl(var(--status-error))]" onClick={() => declinePendingUser(p.id)}><XCircle className="w-4 h-4 mr-2" />Decline</Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="hover:bg-transparent border-border"><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Department</TableHead><TableHead>Status</TableHead><TableHead>Last Login</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/50 border-border/50">
                      <TableCell><div className="flex items-center gap-3"><Avatar className="w-9 h-9"><AvatarFallback className="bg-primary/10 text-primary text-sm">{(user.displayName || user.username || user.email || "").split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar><div><p className="font-medium text-foreground">{user.displayName || user.username || user.email}</p><p className="text-xs text-muted-foreground">{user.email}</p></div></div></TableCell>
                      <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{user.department || '-'}</TableCell>
                      <TableCell><Badge className={user.active ? "bg-[hsl(var(--status-success)/0.15)] text-[hsl(var(--status-success))] border-0" : "bg-muted text-muted-foreground border-0"}>{user.active ? 'Active' : 'Inactive'}</Badge></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{user.lastLogin || "-"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border-border">
                            <DropdownMenuItem onClick={() => handleEditUser(user)}><Edit className="w-4 h-4 mr-2" />Edit User</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { updateUser(user.id, { active: !user.active }); }}>
                              {user.active ? <><Lock className="w-4 h-4 mr-2" />Deactivate</> : <><Unlock className="w-4 h-4 mr-2" />Activate</>}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-[hsl(var(--status-error))]" onClick={() => { setSelectedUser(user); setShowDeleteUserDialog(true); }}><Trash2 className="w-4 h-4 mr-2" />Delete User</DropdownMenuItem>
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

        <TabsContent value="roles">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {roles.map((role) => {
              const count = users.filter(u => u.role === role.name).length;
              return (
                <Card key={role.name} className="data-card">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3"><Badge className={`border-0`}>{role.name}</Badge></div>
                    <p className="text-sm text-muted-foreground mb-4">{role.description}</p>
                    <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="w-4 h-4" /><span>{count} users</span></div><Button variant="outline" size="sm"><Edit className="w-4 h-4" />Edit</Button></div>
                  </CardContent>
                </Card>
              );
            })}
            <Card className="data-card border-dashed flex items-center justify-center min-h-[160px]"><Button variant="ghost" className="flex flex-col gap-2 h-auto py-6"><Plus className="w-8 h-8 text-muted-foreground" /><span className="text-sm text-muted-foreground">Add New Role</span></Button></Card>
          </div>
        </TabsContent>

        <TabsContent value="audit">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Audit Log</CardTitle>
                  <CardDescription>Track all system activities — {auditTotalElements} total entries</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => fetchLogs(auditPage)}>
                    <RefreshCw className="w-4 h-4" />Refresh
                  </Button>
                  <Button variant="outline" size="sm"><Download className="w-4 h-4" />Export</Button>
                </div>
              </div>
            </CardHeader>

            {/* Filters */}
            <div className="px-6 pb-4 flex flex-wrap gap-3">
              <Select value={auditEntityFilter} onValueChange={setAuditEntityFilter}>
                <SelectTrigger className="w-[160px] bg-secondary/50">
                  <Filter className="w-3.5 h-3.5 mr-1.5" /><SelectValue placeholder="Entity" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All Entities</SelectItem>
                  {auditFilterOptions.entityTables.map((t) => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={auditActionFilter} onValueChange={setAuditActionFilter}>
                <SelectTrigger className="w-[160px] bg-secondary/50">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All Actions</SelectItem>
                  {auditFilterOptions.actions.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={auditStatusFilter} onValueChange={setAuditStatusFilter}>
                <SelectTrigger className="w-[130px] bg-secondary/50">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="SUCCESS">Success</SelectItem>
                  <SelectItem value="FAILURE">Failure</SelectItem>
                  <SelectItem value="REVERTED">Reverted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditEntries.map((log: any) => {
                    const userName = log.performedBy
                      ? (typeof log.performedBy === "object"
                        ? (log.performedBy.firstName && log.performedBy.lastName
                          ? `${log.performedBy.firstName} ${log.performedBy.lastName}`
                          : log.performedBy.username || log.performedBy.email || "System")
                        : String(log.performedBy))
                      : "System";
                    const isReverted = log.reverted === true;
                    const isRevertable = log.revertable === true && !isReverted;
                    const actionColor = log.action === "CREATE" ? "text-[hsl(var(--status-success))]"
                      : log.action === "DELETE" ? "text-[hsl(var(--status-error))]"
                      : log.action === "REVERT" ? "text-[hsl(var(--status-warning))]"
                      : log.action === "LOGIN" || log.action === "LOGOUT" ? "text-muted-foreground"
                      : "text-primary";
                    const statusColor = log.status === "SUCCESS" ? "bg-[hsl(var(--status-success)/0.15)] text-[hsl(var(--status-success))]"
                      : log.status === "REVERTED" ? "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))]"
                      : "bg-[hsl(var(--status-error)/0.15)] text-[hsl(var(--status-error))]";
                    const ts = log.performedAt || log.timestamp;
                    const formattedTs = ts ? new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

                    return (
                      <TableRow key={log.id} className={`hover:bg-muted/50 border-border/50 ${isReverted ? 'opacity-60' : ''}`}>
                        <TableCell className="font-mono text-xs text-muted-foreground">#{log.id}</TableCell>
                        <TableCell>
                          <span className={`font-semibold text-xs ${actionColor}`}>{log.action}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium">{(log.entityTable || '').replace(/_/g, ' ')}</span>
                            {log.entityId && <span className="text-[10px] text-muted-foreground">#{log.entityId}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <p className="text-sm truncate" title={log.description}>{log.description || '-'}</p>
                        </TableCell>
                        <TableCell className="text-sm">{userName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formattedTs}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{log.ipAddress || '-'}</TableCell>
                        <TableCell>
                          <Badge className={`${statusColor} border-0`}>
                            {isReverted ? 'Reverted' : log.status || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon-sm" title="View Details" onClick={() => setAuditDetailEntry(log)}>
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            {isRevertable && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Revert this action"
                                className="text-[hsl(var(--status-warning))] hover:text-[hsl(var(--status-warning))]"
                                onClick={() => setRevertConfirmId(log.id)}
                                disabled={revertingId === log.id}
                              >
                                <Undo2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {auditEntries.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                        No audit entries found for the selected filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>

            {/* Pagination */}
            {auditTotalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  Page {auditPage + 1} of {auditTotalPages} ({auditTotalElements} entries)
                </span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={auditPage === 0} onClick={() => fetchLogs(auditPage - 1)}>
                    <ChevronLeft className="w-4 h-4" />Prev
                  </Button>
                  <Button variant="outline" size="sm" disabled={auditPage >= auditTotalPages - 1} onClick={() => fetchLogs(auditPage + 1)}>
                    Next<ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="border-border/60"><CardHeader><CardTitle className="text-lg">System Settings</CardTitle><CardDescription>Configure system-wide security and access settings</CardDescription></CardHeader>
            <CardContent><div className="space-y-4">{systemSettings.map((setting) => (<div key={setting.name} className="flex items-center justify-between p-4 rounded-lg border border-border"><div><p className="font-medium">{setting.name}</p><p className="text-sm text-muted-foreground">{setting.description}</p></div><Switch defaultChecked={setting.enabled} /></div>))}</div></CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddUserDialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog} />
      <EditUserDialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog} user={selectedUser ? { id: selectedUser.id, name: selectedUser.displayName || selectedUser.username || selectedUser.email || '', email: selectedUser.email || '', role: selectedUser.role || '', status: selectedUser.active ? 'Active' : 'Inactive' } : null} />
      <DeactivateUserDialog open={showDeactivateUserDialog} onOpenChange={setShowDeactivateUserDialog} user={selectedUser ? { id: selectedUser.id, name: selectedUser.displayName || selectedUser.username || selectedUser.email || '', email: selectedUser.email || '', status: selectedUser.active ? 'Active' : 'Inactive' } : null} />
      <DeleteUserDialog
        open={showDeleteUserDialog}
        onOpenChange={setShowDeleteUserDialog}
        user={selectedUser ? { id: selectedUser.id, name: selectedUser.displayName || selectedUser.username || selectedUser.email, email: selectedUser.email || '' } : null}
        onConfirm={() => { if (selectedUser) deleteUserById(selectedUser.id); }}
      />

      {/* Revert Confirmation Dialog */}
      <Dialog open={revertConfirmId !== null} onOpenChange={() => setRevertConfirmId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[hsl(var(--status-warning))]" />
              Confirm Revert
            </DialogTitle>
            <DialogDescription>
              This will revert audit entry #{revertConfirmId} and cascade-revert any dependent changes.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevertConfirmId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={revertingId !== null}
              onClick={() => { if (revertConfirmId) handleRevert(revertConfirmId); }}
            >
              {revertingId ? "Reverting..." : "Revert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Detail Dialog */}
      <Dialog open={auditDetailEntry !== null} onOpenChange={() => setAuditDetailEntry(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Entry #{auditDetailEntry?.id}</DialogTitle>
            <DialogDescription>
              {auditDetailEntry?.action} on {(auditDetailEntry?.entityTable || '').replace(/_/g, ' ')} #{auditDetailEntry?.entityId}
            </DialogDescription>
          </DialogHeader>
          {auditDetailEntry && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs font-medium text-muted-foreground mb-1">Action</p><Badge variant="outline">{auditDetailEntry.action}</Badge></div>
                <div><p className="text-xs font-medium text-muted-foreground mb-1">Status</p><Badge variant="outline">{auditDetailEntry.reverted ? 'REVERTED' : auditDetailEntry.status}</Badge></div>
                <div><p className="text-xs font-medium text-muted-foreground mb-1">User</p><p>{auditDetailEntry.performedBy ? (typeof auditDetailEntry.performedBy === 'object' ? (auditDetailEntry.performedBy.firstName ? `${auditDetailEntry.performedBy.firstName} ${auditDetailEntry.performedBy.lastName}` : auditDetailEntry.performedBy.username) : String(auditDetailEntry.performedBy)) : 'System'}</p></div>
                <div><p className="text-xs font-medium text-muted-foreground mb-1">IP Address</p><p className="font-mono text-xs">{auditDetailEntry.ipAddress || '-'}</p></div>
                <div><p className="text-xs font-medium text-muted-foreground mb-1">Timestamp</p><p>{auditDetailEntry.performedAt ? new Date(auditDetailEntry.performedAt).toLocaleString('en-IN') : '-'}</p></div>
                <div><p className="text-xs font-medium text-muted-foreground mb-1">Entity</p><p>{(auditDetailEntry.entityTable || '').replace(/_/g, ' ')} #{auditDetailEntry.entityId}</p></div>
              </div>
              <div><p className="text-xs font-medium text-muted-foreground mb-1">Description</p><p>{auditDetailEntry.description || '-'}</p></div>
              {auditDetailEntry.oldData && (
                <div><p className="text-xs font-medium text-muted-foreground mb-1">Old Data</p><pre className="bg-muted/50 p-3 rounded-lg text-xs overflow-x-auto max-h-40">{typeof auditDetailEntry.oldData === 'string' ? auditDetailEntry.oldData : JSON.stringify(auditDetailEntry.oldData, null, 2)}</pre></div>
              )}
              {auditDetailEntry.newData && (
                <div><p className="text-xs font-medium text-muted-foreground mb-1">New Data</p><pre className="bg-muted/50 p-3 rounded-lg text-xs overflow-x-auto max-h-40">{typeof auditDetailEntry.newData === 'string' ? auditDetailEntry.newData : JSON.stringify(auditDetailEntry.newData, null, 2)}</pre></div>
              )}
              {auditDetailEntry.reverted && (
                <div className="p-3 rounded-lg bg-[hsl(var(--status-warning)/0.1)] border border-[hsl(var(--status-warning)/0.2)]">
                  <p className="text-xs font-medium text-[hsl(var(--status-warning))]">This action was reverted{auditDetailEntry.revertedAt ? ` on ${new Date(auditDetailEntry.revertedAt).toLocaleString('en-IN')}` : ''}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
