import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Undo2,
  Eye,
  Clock,
  User,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Filter,
} from "lucide-react";

type AuditEntry = {
  id: number;
  entitySchema: string;
  entityTable: string;
  entityId: string;
  action: string;
  description: string;
  oldData: string | null;
  newData: string | null;
  performedBy: { id: string; username: string; firstName: string; lastName: string } | null;
  performedAt: string;
  ipAddress: string | null;
  status: string;
  revertable: boolean;
  reverted: boolean;
  revertedBy: { id: string; username: string } | null;
  revertedAt: string | null;
  revertAuditId: number | null;
};

type FilterOptions = {
  entityTables: string[];
  actions: string[];
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getActionColor(action: string): string {
  const map: Record<string, string> = {
    CREATE: "bg-emerald-500/15 text-emerald-600 border-0",
    UPDATE: "bg-blue-500/15 text-blue-600 border-0",
    DELETE: "bg-red-500/15 text-red-600 border-0",
    ACTIVATE: "bg-green-500/15 text-green-600 border-0",
    DEACTIVATE: "bg-orange-500/15 text-orange-600 border-0",
    LOGIN_SUCCESS: "bg-emerald-500/15 text-emerald-600 border-0",
    LOGIN_FAILED: "bg-red-500/15 text-red-600 border-0",
    LOGIN_PENDING: "bg-yellow-500/15 text-yellow-600 border-0",
    REGISTER: "bg-purple-500/15 text-purple-600 border-0",
    APPROVE: "bg-emerald-500/15 text-emerald-600 border-0",
    DECLINE: "bg-red-500/15 text-red-600 border-0",
    IMPORT: "bg-indigo-500/15 text-indigo-600 border-0",
    FILE_UPLOAD: "bg-cyan-500/15 text-cyan-600 border-0",
    FILE_DELETE: "bg-rose-500/15 text-rose-600 border-0",
    REVERT: "bg-amber-500/15 text-amber-600 border-0",
    CHANGE_PASSWORD: "bg-violet-500/15 text-violet-600 border-0",
  };
  return map[action] || "bg-gray-500/15 text-gray-600 border-0";
}

function getStatusBadge(status: string | null): string {
  if (!status) return "bg-muted text-muted-foreground border-0";
  switch (status.toUpperCase()) {
    case "SUCCESS":
      return "bg-[hsl(var(--status-success)/0.15)] text-[hsl(var(--status-success))] border-0";
    case "FAILED":
      return "bg-[hsl(var(--status-error)/0.15)] text-[hsl(var(--status-error))] border-0";
    default:
      return "bg-muted text-muted-foreground border-0";
  }
}

function prettyJson(jsonStr: string | null): string {
  if (!jsonStr) return "";
  try {
    const parsed = JSON.parse(jsonStr);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return jsonStr;
  }
}

export default function AuditLogViewer() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(25);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [entityTableFilter, setEntityTableFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ entityTables: [], actions: [] });

  // Detail & Revert dialogs
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showRevertDialog, setShowRevertDialog] = useState(false);
  const [revertLoading, setRevertLoading] = useState(false);

  // Entity History
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<AuditEntry[]>([]);
  const [historyTitle, setHistoryTitle] = useState("");

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = {
        page: currentPage,
        size: pageSize,
      };
      if (entityTableFilter && entityTableFilter !== "all") params.entityTable = entityTableFilter;
      if (actionFilter && actionFilter !== "all") params.action = actionFilter;
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;

      const resp = await api.get("/audit/logs", { params });
      const data = resp.data;
      setEntries(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 0);
    } catch (err) {
      console.error("Failed to load audit logs", err);
      // Fallback to legacy endpoint
      try {
        const resp = await api.get("/admin/logs");
        setEntries(resp.data || []);
        setTotalElements((resp.data || []).length);
        setTotalPages(1);
      } catch (err2) {
        console.error("Failed to load audit logs from fallback", err2);
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, entityTableFilter, actionFilter, statusFilter]);

  const fetchFilters = useCallback(async () => {
    try {
      const resp = await api.get("/audit/filters");
      setFilterOptions(resp.data || { entityTables: [], actions: [] });
    } catch (err) {
      console.error("Failed to load filter options", err);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  const handleViewDetails = (entry: AuditEntry) => {
    setSelectedEntry(entry);
    setShowDetailDialog(true);
  };

  const handleViewHistory = async (entry: AuditEntry) => {
    if (!entry.entityTable || !entry.entityId) return;
    try {
      const resp = await api.get(`/audit/entity/${entry.entityTable}/${entry.entityId}/history`);
      setHistoryEntries(resp.data || []);
      setHistoryTitle(`${entry.entityTable} #${entry.entityId}`);
      setShowHistoryDialog(true);
    } catch (err) {
      console.error("Failed to load entity history", err);
    }
  };

  const handleRevertClick = (entry: AuditEntry) => {
    setSelectedEntry(entry);
    setShowRevertDialog(true);
  };

  const handleRevertConfirm = async () => {
    if (!selectedEntry) return;
    setRevertLoading(true);
    try {
      const resp = await api.post(`/audit/logs/${selectedEntry.id}/revert`);
      const data = resp.data;
      setShowRevertDialog(false);
      setSelectedEntry(null);
      fetchLogs();

      // Show cascade result summary
      const cascadeCount = data.cascadeRevertedCount || 0;
      const msg = cascadeCount > 0
        ? `Revert successful! ${cascadeCount} dependent action(s) were also reverted.`
        : "Revert successful!";
      alert(msg);
    } catch (err: any) {
      console.error("Revert failed", err);
      alert("Revert failed: " + (err.response?.data?.error || err.message));
    } finally {
      setRevertLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params: Record<string, string | number> = { page: 0, size: 10000 };
      if (entityTableFilter && entityTableFilter !== "all") params.entityTable = entityTableFilter;
      if (actionFilter && actionFilter !== "all") params.action = actionFilter;
      if (statusFilter && statusFilter !== "all") params.status = statusFilter;

      const resp = await api.get("/audit/logs", { params });
      const allData = resp.data.content || [];

      const csvHeader = "ID,Timestamp,Action,Entity,Entity ID,Description,User,IP,Status,Revertable,Reverted\n";
      const csvRows = allData.map((e: AuditEntry) =>
        [
          e.id,
          e.performedAt,
          e.action,
          e.entityTable,
          e.entityId || "",
          `"${(e.description || "").replace(/"/g, '""')}"`,
          e.performedBy?.username || "",
          e.ipAddress || "",
          e.status || "",
          e.revertable,
          e.reverted,
        ].join(",")
      );

      const csvContent = csvHeader + csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_log_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  // Client-side search filter on description and user
  const filteredEntries = entries.filter((entry) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (entry.description || "").toLowerCase().includes(q) ||
      (entry.performedBy?.username || "").toLowerCase().includes(q) ||
      (entry.action || "").toLowerCase().includes(q) ||
      (entry.entityTable || "").toLowerCase().includes(q) ||
      (entry.entityId || "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Audit Log
              </CardTitle>
              <CardDescription>
                Track all system activities • {totalElements} total records
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => fetchLogs()} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Filters */}
        <div className="px-6 pb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={entityTableFilter} onValueChange={(v) => { setEntityTableFilter(v); setCurrentPage(0); }}>
            <SelectTrigger className="w-[150px] bg-secondary/50">
              <SelectValue placeholder="Entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {filterOptions.entityTables.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setCurrentPage(0); }}>
            <SelectTrigger className="w-[150px] bg-secondary/50">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {filterOptions.actions.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(0); }}>
            <SelectTrigger className="w-[130px] bg-secondary/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="SUCCESS">Success</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {loading ? "Loading..." : "No audit records found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className={`hover:bg-muted/50 border-border/50 ${entry.reverted ? "opacity-50" : ""}`}
                  >
                    <TableCell className="text-xs text-muted-foreground font-mono">{entry.id}</TableCell>
                    <TableCell>
                      <Badge className={getActionColor(entry.action)}>
                        {entry.action}
                      </Badge>
                      {entry.reverted && (
                        <Badge variant="outline" className="ml-1 text-[10px]">Reverted</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono">
                        {entry.entityTable}
                        {entry.entityId && (
                          <span className="text-muted-foreground"> #{entry.entityId.substring(0, 8)}</span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate text-sm">
                      {entry.description || "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.performedBy
                        ? entry.performedBy.firstName
                          ? `${entry.performedBy.firstName} ${entry.performedBy.lastName || ""}`
                          : entry.performedBy.username
                        : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                      {formatDate(entry.performedAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {entry.ipAddress || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(entry.status)}>
                        {entry.status || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="View Details"
                          onClick={() => handleViewDetails(entry)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {entry.entityId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="View History"
                            onClick={() => handleViewHistory(entry)}
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {entry.revertable && !entry.reverted && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-amber-600 hover:text-amber-700"
                            title="Revert"
                            onClick={() => handleRevertClick(entry)}
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Audit Entry #{selectedEntry?.id}
            </DialogTitle>
            <DialogDescription>
              Full details of this audit record
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Action</p>
                  <Badge className={getActionColor(selectedEntry.action)}>{selectedEntry.action}</Badge>
                  {selectedEntry.reverted && <Badge variant="outline" className="ml-2">Reverted</Badge>}
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Status</p>
                  <Badge className={getStatusBadge(selectedEntry.status)}>{selectedEntry.status}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Entity</p>
                  <p className="font-mono">{selectedEntry.entityTable} #{selectedEntry.entityId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Performed By</p>
                  <p>{selectedEntry.performedBy?.username || "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Timestamp</p>
                  <p>{formatDate(selectedEntry.performedAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">IP Address</p>
                  <p className="font-mono">{selectedEntry.ipAddress || "-"}</p>
                </div>
              </div>

              {selectedEntry.description && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Description</p>
                  <p className="text-sm bg-muted/50 p-2 rounded">{selectedEntry.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Previous State (Old Data)
                  </p>
                  <pre className="text-xs bg-red-50 dark:bg-red-950/20 p-3 rounded border border-red-200 dark:border-red-900 overflow-auto max-h-[200px] whitespace-pre-wrap">
                    {prettyJson(selectedEntry.oldData) || "(none)"}
                  </pre>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> New State (New Data)
                  </p>
                  <pre className="text-xs bg-green-50 dark:bg-green-950/20 p-3 rounded border border-green-200 dark:border-green-900 overflow-auto max-h-[200px] whitespace-pre-wrap">
                    {prettyJson(selectedEntry.newData) || "(none)"}
                  </pre>
                </div>
              </div>

              {selectedEntry.reverted && (
                <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded border border-amber-200 dark:border-amber-900">
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <Undo2 className="w-4 h-4" /> This action was reverted
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Reverted by: {selectedEntry.revertedBy?.username || "Unknown"} •
                    At: {formatDate(selectedEntry.revertedAt || null)} •
                    Revert audit #{selectedEntry.revertAuditId}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Revert Confirmation Dialog */}
      <Dialog open={showRevertDialog} onOpenChange={setShowRevertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              Confirm Revert
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to revert this action? This will mark the audit entry as reverted.
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-3 text-sm">
              <div className="bg-muted/50 p-3 rounded space-y-1">
                <p><strong>Action:</strong> {selectedEntry.action}</p>
                <p><strong>Entity:</strong> {selectedEntry.entityTable} #{selectedEntry.entityId}</p>
                <p><strong>Description:</strong> {selectedEntry.description || "-"}</p>
                <p><strong>Performed by:</strong> {selectedEntry.performedBy?.username || "-"}</p>
                <p><strong>At:</strong> {formatDate(selectedEntry.performedAt)}</p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 rounded">
                <p className="text-amber-700 dark:text-amber-400 font-medium text-xs flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Cascading Revert Warning
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedEntry.action === "IMPORT"
                    ? "This will delete ALL records created by this import (sites, assets, installations, financial transactions), delete the uploaded file, and revert any dependent actions that were performed on those records."
                    : selectedEntry.action === "CREATE"
                    ? "This will delete the created entity. Any subsequent changes made to it will also be reverted."
                    : selectedEntry.action === "UPDATE"
                    ? "This will restore the entity to its previous state. Any subsequent changes will also be reverted."
                    : "This will undo this action and cascade to any dependent actions."}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevertDialog(false)} disabled={revertLoading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevertConfirm}
              disabled={revertLoading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {revertLoading ? "Reverting..." : "Confirm Revert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Entity History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Change History: {historyTitle}
            </DialogTitle>
            <DialogDescription>
              Complete version history for this entity ({historyEntries.length} changes)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {historyEntries.map((entry, idx) => (
              <div
                key={entry.id}
                className={`flex gap-3 p-3 rounded border ${entry.reverted ? "opacity-50 border-amber-200 dark:border-amber-900" : "border-border"}`}
              >
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full mt-1 ${entry.reverted ? "bg-amber-400" : entry.status === "FAILED" ? "bg-red-400" : "bg-primary"}`} />
                  {idx < historyEntries.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getActionColor(entry.action)}>{entry.action}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(entry.performedAt)}</span>
                    <span className="text-xs text-muted-foreground">by {entry.performedBy?.username || "system"}</span>
                    {entry.reverted && <Badge variant="outline" className="text-[10px]">Reverted</Badge>}
                  </div>
                  {entry.description && (
                    <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleViewDetails(entry)}>
                  <Eye className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
            {historyEntries.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No history found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
