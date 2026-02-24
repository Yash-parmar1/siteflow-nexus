import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Eye, FileText, Inbox, Loader2, Trash2, MapPin, Box, AlertTriangle, Truck, DollarSign } from "lucide-react";
import api from "@/lib/api";
import UploadResultDialog from "./UploadResultDialog";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  subprojectId: string;
  onProcessed?: () => void;
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  UPLOADED: { bg: "bg-blue-500/15", text: "text-blue-500", label: "Uploaded" },
  PROCESSING: { bg: "bg-yellow-500/15", text: "text-yellow-500", label: "Processing" },
  COMPLETED: { bg: "bg-green-500/15", text: "text-green-500", label: "Completed" },
  PENDING_CORRECTION: { bg: "bg-orange-500/15", text: "text-orange-500", label: "Needs Correction" },
  FAILED: { bg: "bg-red-500/15", text: "text-red-500", label: "Failed" },
};

const fileTypeLabel: Record<string, string> = {
  SITE_IMPORT: "sites",
  ASSET_IMPORT: "assets",
  INSTALLATION_IMPORT: "installations",
  FINANCIAL_IMPORT: "financial transactions",
  INSTALLATION_MATERIALS: "installation materials",
  INSTALLATION_INVOICES: "installation invoices",
  EXTRA_MATERIALS: "extra materials",
  MONTHLY_RENT_BILLS: "monthly rent bills",
  FINAL_INVOICE: "final invoices",
};

export default function ViewImportsDialog({ open, onOpenChange, projectId, subprojectId, onProcessed }: Props) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string; type: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("sites");

  useEffect(() => {
    if (!open) return;
    loadSessions();
  }, [open]);

  const loadSessions = () => {
    setLoading(true);
    api.get(`/projects/${projectId}/subprojects/${subprojectId}/uploads`).then((res) => {
      setSessions(res.data);
    }).catch(() => {
      toast.error("Failed to list imports");
    }).finally(() => setLoading(false));
  };

  const openResult = (id: number) => {
    setSelectedSession(id);
    setResultOpen(true);
  };

  const confirmDelete = (s: any) => {
    setDeleteTarget({ id: s.id, name: s.originalFilename, type: s.fileType || "SITE_IMPORT" });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.post(`/projects/${projectId}/subprojects/${subprojectId}/uploads/${deleteTarget.id}/revert`);
      toast.success("Import reverted successfully", {
        description: `${deleteTarget.name} and all associated data have been removed.`,
      });
      loadSessions();
      onProcessed?.();
    } catch (err: any) {
      toast.error("Failed to revert import", {
        description: err?.response?.data?.message || "An error occurred while reverting.",
      });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const FINANCIAL_TYPES = ["FINANCIAL_IMPORT", "INSTALLATION_MATERIALS", "INSTALLATION_INVOICES", "EXTRA_MATERIALS", "MONTHLY_RENT_BILLS", "FINAL_INVOICE"];
  const siteSessions = sessions.filter((s) => s.fileType === "SITE_IMPORT" || !s.fileType);
  const assetSessions = sessions.filter((s) => s.fileType === "ASSET_IMPORT");
  const installSessions = sessions.filter((s) => s.fileType === "INSTALLATION_IMPORT");
  const financeSessions = sessions.filter((s) => FINANCIAL_TYPES.includes(s.fileType));

  // Find the latest (current/active) session per category
  const getLatestId = (items: any[]) => {
    if (items.length === 0) return null;
    const sorted = [...items].sort((a, b) => new Date(b.uploadTimestamp).getTime() - new Date(a.uploadTimestamp).getTime());
    return sorted[0]?.id ?? null;
  };

  const latestIds: Record<string, number | null> = {
    sites: getLatestId(siteSessions),
    assets: getLatestId(assetSessions),
    installations: getLatestId(installSessions),
    financial: getLatestId(financeSessions),
  };

  const renderSessionList = (items: any[], category: string) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
        </div>
      );
    }
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 mb-3 rounded-full bg-muted flex items-center justify-center">
            <Inbox className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No imports found in this category.</p>
        </div>
      );
    }
    // Sort newest first
    const sorted = [...items].sort((a, b) => new Date(b.uploadTimestamp).getTime() - new Date(a.uploadTimestamp).getTime());

    return sorted.map((s: any) => {
      const st = statusColors[s.status] || statusColors.UPLOADED;
      const isCurrent = s.id === latestIds[category];
      return (
        <div
          key={s.id}
          className={`p-3 rounded-lg border transition-colors ${
            isCurrent
              ? "border-yellow-500 bg-yellow-500/5 hover:bg-yellow-500/10"
              : "border-border hover:bg-muted/50"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{s.originalFilename}</p>
                  {isCurrent && (
                    <Badge className="bg-yellow-500/15 text-yellow-600 border-yellow-500/30 border text-[10px] px-1.5 py-0">
                      Current
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {new Date(s.uploadTimestamp).toLocaleString()}
                  </span>
                  <Badge className={`${st.bg} ${st.text} border-0 text-[10px] px-1.5 py-0`}>
                    {st.label}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button onClick={() => openResult(s.id)} variant="outline" size="sm" className="gap-1.5 text-xs h-7">
                <Eye className="w-3.5 h-3.5" />
                View
              </Button>
              <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs h-7">
                <a href={`/api/projects/${projectId}/subprojects/${subprojectId}/uploads/${s.id}/download`} target="_blank">
                  <Download className="w-3.5 h-3.5" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs h-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => confirmDelete(s)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[720px] max-h-[80vh] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Import History
            </DialogTitle>
            <DialogDescription>
              View all file imports for this subproject. You can view results, download files, or revert imports.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-secondary/50 w-full grid grid-cols-4">
              <TabsTrigger value="sites" className="gap-1.5 text-xs">
                <MapPin className="w-3.5 h-3.5" />
                Sites ({siteSessions.length})
              </TabsTrigger>
              <TabsTrigger value="assets" className="gap-1.5 text-xs">
                <Box className="w-3.5 h-3.5" />
                Assets ({assetSessions.length})
              </TabsTrigger>
              <TabsTrigger value="installations" className="gap-1.5 text-xs">
                <Truck className="w-3.5 h-3.5" />
                Install ({installSessions.length})
              </TabsTrigger>
              <TabsTrigger value="financial" className="gap-1.5 text-xs">
                <DollarSign className="w-3.5 h-3.5" />
                Finance ({financeSessions.length})
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="max-h-[380px] mt-3 pr-2">
              <TabsContent value="sites" className="mt-0 space-y-2">
                {renderSessionList(siteSessions, "sites")}
              </TabsContent>
              <TabsContent value="assets" className="mt-0 space-y-2">
                {renderSessionList(assetSessions, "assets")}
              </TabsContent>
              <TabsContent value="installations" className="mt-0 space-y-2">
                {renderSessionList(installSessions, "installations")}
              </TabsContent>
              <TabsContent value="financial" className="mt-0 space-y-2">
                {renderSessionList(financeSessions, "financial")}
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter>
            <Button size="sm" onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Revert Import?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong> and all{" "}
              {fileTypeLabel[deleteTarget?.type ?? ""] ?? "records"} created from this import.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Revert & Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UploadResultDialog open={resultOpen} onOpenChange={setResultOpen} projectId={projectId} subprojectId={subprojectId} sessionId={selectedSession} onProcessed={onProcessed} />
    </>
  );
}
