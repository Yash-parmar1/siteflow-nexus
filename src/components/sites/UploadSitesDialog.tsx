import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  subprojectId: string;
  onUploaded?: (result: any) => void;
}

export default function UploadSitesDialog({ open, onOpenChange, projectId, subprojectId, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [overwrite, setOverwrite] = useState<boolean>(true);

  const handleSubmit = async () => {
    if (!file) return toast.error("Please select a file to upload");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("overwrite", String(overwrite));
      const res = await api.post(`/projects/${projectId}/subprojects/${subprojectId}/uploads`, fd);
      toast.success("File uploaded and parsed");
      onOpenChange(false);
      if (onUploaded) onUploaded(res.data);
    } catch (e: any) {
      console.error('Upload error', e);
      const serverMsg = e?.response?.data?.error || e?.response?.data?.message || e?.message;
      toast.error(serverMsg || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Add Sites (Upload)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Choose Excel/CSV file</label>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {file && <div className="text-xs text-muted-foreground mt-2">Selected: {file.name} ({Math.round(file.size/1024)} KB)</div>}
          </div>
          <div className="flex items-center gap-2">
            <input id="overwrite" type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
            <label htmlFor="overwrite" className="text-sm text-muted-foreground">Overwrite existing sites with same EPS Site Code</label>
          </div>
          <div className="text-xs text-muted-foreground">The file will be parsed and a summary shown. Only failed/warning rows will be stored for edits.</div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!file || uploading}>{uploading ? "Uploading..." : "Upload & Parse"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
