import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
      .then((res) => {
        setSession(res.data);
      })
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
  const failedRowsCount = rows.filter((r: any) => r.status === 'ERROR' || r.status === 'WARNING' || r.status === 'SKIPPED').length;
  const hasErrors = rows.some((r: any) => r.status === 'ERROR');
  const hasWarnings = rows.some((r: any) => r.status === 'WARNING' || r.status === 'SKIPPED');

  return (
    <>
      <Dialog open={open && !correctionOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[720px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Result</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {loading ? (
              <div>Loading...</div>
            ) : session ? (
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{session.session?.originalFilename}</div>
                    <div className="text-xs text-muted-foreground">
                      Uploaded: {new Date(session.session?.uploadTimestamp).toLocaleString()}
                    </div>
                  </div>
                </div>

                <hr className="my-3" />

                <div className="space-y-2">
                  <div className="text-sm font-semibold">Summary</div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="p-2 bg-muted rounded text-center">
                      <div className="text-xs text-muted-foreground">Status</div>
                      <div className="text-sm font-medium">{session.session?.status}</div>
                    </div>
                    <div className="p-2 bg-muted rounded text-center">
                      <div className="text-xs text-muted-foreground">Created</div>
                      <div className="text-sm font-medium">{session.summary?.created ?? '—'}</div>
                    </div>
                    <div className="p-2 bg-muted rounded text-center">
                      <div className="text-xs text-muted-foreground">Updated</div>
                      <div className="text-sm font-medium">{session.summary?.updated ?? '—'}</div>
                    </div>
                    <div className="p-2 bg-muted rounded text-center">
                      <div className="text-xs text-muted-foreground">Skipped</div>
                      <div className="text-sm font-medium">{session.summary?.skipped ?? 0}</div>
                    </div>
                    {failedRowsCount > 0 && (
                      <div className="p-2 bg-destructive/10 rounded text-center">
                        <div className="text-xs text-destructive">Failed/Warnings</div>
                        <div className="text-sm font-medium text-destructive">{failedRowsCount}</div>
                      </div>
                    )}
                  </div>
                </div>

                <hr className="my-3" />
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Rows (showing up to 50)</div>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full table-fixed text-sm">
                      <thead>
                        <tr className="text-left text-xs text-muted-foreground border-b">
                          <th className="w-12 py-2">#</th>
                          <th className="py-2">Site Code</th>
                          <th className="py-2">Status</th>
                          <th className="py-2">Message</th>
                          <th className="py-2 w-24">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r: any, idx: number) => (
                          <tr key={idx} className="border-b">
                            <td className="py-2 align-top">{r.row}</td>
                            <td className="py-2 align-top font-mono text-sm">{r.site_code || r.siteCode || '—'}</td>
                            <td className="py-2 align-top">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${r.status === 'ERROR' ? 'bg-destructive/10 text-destructive' : r.status === 'WARNING' || r.status === 'SKIPPED' ? 'bg-yellow-100 text-yellow-800' : 'bg-success/10 text-success'}`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="py-2 align-top text-xs text-muted-foreground">{r.message || r.warningMessage || '—'}</td>
                            <td className="py-2">
                              {(r.status === 'ERROR' || r.status === 'WARNING' || r.status === 'SKIPPED') && (
                                <Button size="sm" variant="outline" onClick={() => setCorrectionOpen(true)}>Correct</Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No session data</div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleDownload}>
              Download Original
            </Button>
            {hasErrors && (
              <Button onClick={() => setCorrectionOpen(true)} variant="outline">
                Correct Errors
              </Button>
            )}
            <Button onClick={handleRevert} variant="destructive">
              Revert
            </Button>
            <Button onClick={() => onOpenChange(false)}>
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
