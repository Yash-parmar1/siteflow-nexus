import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, FileText } from "lucide-react";
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
  const [mode, setMode] = useState<'sites' | 'assets'>('sites');

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Add Sites
          </DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import sites or assets into this subproject.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Upload Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Upload Type</Label>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'sites' | 'assets')} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="sites" id="mode-sites" />
                <Label htmlFor="mode-sites" className="cursor-pointer text-sm">Add Sites</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="assets" id="mode-assets" />
                <Label htmlFor="mode-assets" className="cursor-pointer text-sm">Add Assets (CSV/Excel)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* File Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Choose File</Label>
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById('site-upload-input')?.click()}
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{Math.round(file.size / 1024)} KB</p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Click to select a file</p>
                  <p className="text-xs text-muted-foreground mt-1">Supported: .csv, .xlsx, .xls</p>
                </div>
              )}
            </div>
            <input id="site-upload-input" type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
          </div>

          {/* Overwrite checkbox (sites mode only) */}
          {mode === 'sites' && (
            <div className="flex items-center gap-2">
              <Checkbox id="overwrite" checked={overwrite} onCheckedChange={(v) => setOverwrite(!!v)} />
              <Label htmlFor="overwrite" className="text-sm text-muted-foreground cursor-pointer">
                Overwrite existing sites with same EPS Site Code
              </Label>
            </div>
          )}

          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            {mode === 'assets'
              ? 'CSV/Excel must follow the Asset Detail format. Rows will be validated and assets created.'
              : 'The file will be parsed and a summary shown. Only failed/warning rows will be stored for edits.'}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!file || uploading}>
            {uploading ? "Uploading..." : "Upload & Parse"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
