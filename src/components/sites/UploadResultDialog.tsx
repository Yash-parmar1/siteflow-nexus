import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import ManualCorrectionDialog from "./ManualCorrectionDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  subprojectId: string;
  sessionId: number | null;
  onProcessed?: () => void;
}

export default function UploadResultDialog({ open, onOpenChange, projectId, subprojectId, sessionId, onProcessed }: Props) {
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [correctionOpen, setCorrectionOpen] = useState(false);

  useEffect(() => {
    if (!sessionId || !open) return;
    setLoading(true);
    api
      .get(`/projects/${projectId}/subprojects/${subprojectId}/uploads/${sessionId}`)
      .then((res) => setSession(res.data))
      .catch((e) => {
        toast.error("Failed to fetch session");
        console.error(e);
      })
      .finally(() => setLoading(false));
  }, [sessionId, open]);

  const handleProcess = async () => {
    if (!sessionId) return;
    try {
      await api.post(`/projects/${projectId}/subprojects/${subprojectId}/uploads/${sessionId}/process`);
      toast.success("Sites created successfully");
      onOpenChange(false);
      if (onProcessed) onProcessed();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Process failed");
    }
  };

  const handleRevert = async () => {
    if (!sessionId) return;
    try {
      await api.post(`/projects/${projectId}/subprojects/${subprojectId}/uploads/${sessionId}/revert`);
      toast.success("Import reverted");
      onOpenChange(false);
      if (onProcessed) onProcessed();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Revert failed");
    }
  };

  const handleDownload = () => {
    if (!sessionId) return;
    const url = `/api/projects/${projectId}/subprojects/${subprojectId}/uploads/${sessionId}/download`;
    window.open(url, "_blank");
  };

  const rows = Array.isArray(session?.rows) ? session.rows : [];
  const hasErrors = rows.some((r: any) => r.status === 'ERROR');

  const statusBadge = (status: string) => {
    if (status === 'ERROR') return <Badge variant="destructive" className="text-[10px]">{status}</Badge>;
    if (status === 'WARNING' || status === 'SKIPPED') return <Badge className="bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))] border-0 text-[10px]">{status}</Badge>;
    return <Badge className="bg-[hsl(var(--status-success)/0.15)] text-[hsl(var(--status-success))] border-0 text-[10px]">{status}</Badge>;
  };

  return (
    <>
      <Dialog open={open && !correctionOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[720px] max-h-[80vh] overflow-y-auto bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Import Result
            </DialogTitle>
            {session && (
              <DialogDescription>
                {session.session?.originalFilename} — Uploaded {new Date(session.session?.uploadTimestamp).toLocaleString()}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4 py-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : session ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-6 gap-2">
                  <div className="p-2.5 bg-muted/50 rounded-lg text-center">
                    <p className="text-[10px] text-muted-foreground">Status</p>
                    <p className="text-sm font-semibold">{session.session?.status}</p>
                  </div>
                  <div className="p-2.5 bg-muted/50 rounded-lg text-center">
                    <p className="text-[10px] text-muted-foreground">Created</p>
                    <p className="text-sm font-semibold">{session.summary?.created ?? session.summary?.createdAssets ?? '—'}</p>
                  </div>
                  <div className="p-2.5 bg-muted/50 rounded-lg text-center">
                    <p className="text-[10px] text-muted-foreground">Updated</p>
                    <p className="text-sm font-semibold">{session.summary?.updated ?? '—'}</p>
                  </div>
                  <div className="p-2.5 bg-muted/50 rounded-lg text-center">
                    <p className="text-[10px] text-muted-foreground">Skipped</p>
                    <p className="text-sm font-semibold">{session.summary?.skipped ?? 0}</p>
                  </div>
                  <div className="p-2.5 bg-destructive/10 rounded-lg text-center">
                    <p className="text-[10px] text-destructive">Errors</p>
                    <p className="text-sm font-semibold text-destructive">{session.summary?.errors ?? 0}</p>
                  </div>
                  <div className="p-2.5 bg-[hsl(var(--status-warning)/0.1)] rounded-lg text-center">
                    <p className="text-[10px] text-[hsl(var(--status-warning))]">Warnings</p>
                    <p className="text-sm font-semibold text-[hsl(var(--status-warning))]">{session.summary?.warnings ?? 0}</p>
                  </div>
                </div>

                {/* Rows Table */}
                <div>
                  <p className="text-sm font-semibold mb-2">Rows (showing up to 50)</p>
                  <div className="max-h-64 overflow-y-auto border border-border rounded-lg">
                    <table className="w-full table-fixed text-sm">
                      <thead>
                        <tr className="text-left text-xs text-muted-foreground border-b border-border bg-muted/30">
                          <th className="w-12 py-2 px-3">#</th>
                          <th className="py-2 px-3">Site Code</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3">Message</th>
                          <th className="py-2 px-3 w-24">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r: any, idx: number) => (
                          <tr key={idx} className="border-b border-border last:border-0">
                            <td className="py-2 px-3 align-top">{r.row}</td>
                            <td className="py-2 px-3 align-top font-mono text-xs">{r.site_code || r.siteCode || '—'}</td>
                            <td className="py-2 px-3 align-top">{statusBadge(r.status)}</td>
                            <td className="py-2 px-3 align-top text-xs text-muted-foreground">{r.message || r.warningMessage || '—'}</td>
                            <td className="py-2 px-3">
                              {(r.status === 'ERROR' || r.status === 'WARNING' || r.status === 'SKIPPED') && (
                                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setCorrectionOpen(true)}>Correct</Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No session data</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
              <Download className="w-4 h-4" />
              Download Original
            </Button>
            {hasErrors && (
              <Button onClick={() => setCorrectionOpen(true)} variant="outline" size="sm">
                Correct Errors
              </Button>
            )}
            <Button onClick={handleRevert} variant="destructive" size="sm">
              Revert
            </Button>
            <Button size="sm" onClick={() => onOpenChange(false)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ManualCorrectionDialog
        open={correctionOpen}
        onOpenChange={setCorrectionOpen}
        projectId={projectId}
        subprojectId={subprojectId}
        sessionId={sessionId}
        onCorrectionComplete={() => {
          setCorrectionOpen(false);
          setSession(null);
          onOpenChange(false);
          if (onProcessed) onProcessed();
        }}
      />
    </>
  );
}
