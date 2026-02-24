import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Eye, FileText, Inbox, Loader2 } from "lucide-react";
import api from "@/lib/api";
import UploadResultDialog from "./UploadResultDialog";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  subprojectId: string;
  onProcessed?: () => void;
}

export default function ViewImportsDialog({ open, onOpenChange, projectId, subprojectId, onProcessed }: Props) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [resultOpen, setResultOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.get(`/projects/${projectId}/subprojects/${subprojectId}/uploads`).then((res) => {
      setSessions(res.data);
    }).catch(() => {
      toast.error("Failed to list imports");
    }).finally(() => setLoading(false));
  }, [open]);

  const openResult = (id: number) => {
    setSelectedSession(id);
    setResultOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[640px] max-h-[80vh] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Import History
            </DialogTitle>
            <DialogDescription>
              View all file imports for this subproject.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[400px] pr-2">
            <div className="space-y-2 py-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 mb-3 rounded-full bg-muted flex items-center justify-center">
                    <Inbox className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No imports found for this subproject.</p>
                </div>
              ) : (
                sessions.map((s: any) => (
                  <div key={s.id} className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{s.originalFilename}</p>
                          <p className="text-xs text-muted-foreground">{new Date(s.uploadTimestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button onClick={() => openResult(s.id)} variant="outline" size="sm" className="gap-1.5 text-xs h-7">
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Button>
                        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs h-7">
                          <a href={`/api/projects/${projectId}/subprojects/${subprojectId}/uploads/${s.id}/download`} target="_blank">
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button size="sm" onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UploadResultDialog open={resultOpen} onOpenChange={setResultOpen} projectId={projectId} subprojectId={subprojectId} sessionId={selectedSession} onProcessed={onProcessed} />
    </>
  );
}
