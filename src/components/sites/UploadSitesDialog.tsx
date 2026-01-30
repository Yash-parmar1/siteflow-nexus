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
  const [mode, setMode] = useState<'sites'|'assets'>('sites');

  const handleSubmit = async () => {
    if (!file) return toast.error("Please select a file to upload");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("overwrite", String(overwrite));
      if (mode === 'sites') {
        const res = await api.post(`/projects/${projectId}/subprojects/${subprojectId}/uploads`, fd);
        toast.success("File uploaded and parsed");
        onOpenChange(false);
        if (onUploaded) onUploaded(res.data);
      } else {
        const res = await api.post(`/projects/${projectId}/subprojects/${subprojectId}/asset-uploads`, fd);
        toast.success("Asset file uploaded and parsed");
        onOpenChange(false);
        if (onUploaded) onUploaded(res.data);
      }
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
            <label className="text-sm font-medium mb-2 block">Upload Type</label>
            <div className="flex gap-3">
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="mode" value="sites" checked={mode === 'sites'} onChange={() => setMode('sites')} />
                <span className="text-sm">Add Sites</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="mode" value="assets" checked={mode === 'assets'} onChange={() => setMode('assets')} />
                <span className="text-sm">Add Assets (CSV/Excel)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Choose file</label>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {file && <div className="text-xs text-muted-foreground mt-2">Selected: {file.name} ({Math.round(file.size/1024)} KB)</div>}
          </div>

          {mode === 'sites' && (
            <div className="flex items-center gap-2">
              <input id="overwrite" type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />
              <label htmlFor="overwrite" className="text-sm text-muted-foreground">Overwrite existing sites with same EPS Site Code</label>
            </div>
          )}

          <div className="text-xs text-muted-foreground">{mode === 'assets' ? 'CSV or Excel must follow the Asset Detail format: SITE ID in col 1, AC manufacturer in col 2, cols 3-8 for order/delivery/installation info; serial columns are dynamic starting at col 9 (indoor/outdoor alternating). Rows will be validated and assets created.' : 'The file will be parsed and a summary shown. Only failed/warning rows will be stored for edits.'}</div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!file || uploading}>{uploading ? "Uploading..." : "Upload & Parse"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
