import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
    }).catch((e) => {
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
        <DialogContent className="sm:max-w-[720px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Imports for Subproject</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {loading ? (
              <div>Loading...</div>
            ) : sessions.length === 0 ? (
              <div className="text-sm text-muted-foreground">No imports found for this subproject.</div>
            ) : (
              sessions.map((s:any) => (
                <div key={s.id} className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-medium">{s.originalFilename}</div>
                    <div className="text-xs text-muted-foreground">{new Date(s.uploadTimestamp).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => openResult(s.id)} variant="outline">View Result</Button>
                    <a className="btn" href={`/api/projects/${projectId}/subprojects/${subprojectId}/uploads/${s.id}/download`} target="_blank">Download</a>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <UploadResultDialog open={resultOpen} onOpenChange={setResultOpen} projectId={projectId} subprojectId={subprojectId} sessionId={selectedSession} onProcessed={onProcessed} />
    </>
  );
}
