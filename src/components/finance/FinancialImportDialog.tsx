import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, FileText, Download, Loader2, Info } from "lucide-react";
import api from "@/lib/api";

interface SubprojectOption {
  id: number;
  name: string;
  projectName?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded?: () => void;
}

export default function FinancialImportDialog({ open, onOpenChange, onUploaded }: Props) {
  const [subprojectId, setSubprojectId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [subprojects, setSubprojects] = useState<SubprojectOption[]>([]);
  const [loadingSps, setLoadingSps] = useState(false);

  // Fetch subprojects and auto-select if only one
  useEffect(() => {
    if (!open) return;
    setLoadingSps(true);
    api.get("/finance/invoice/form-data")
      .then(res => {
        const sps = (res.data?.subprojects ?? []).map((s: any) => ({
          id: s.id, name: s.name, projectName: s.projectName,
        }));
        setSubprojects(sps);
        if (sps.length === 1) setSubprojectId(String(sps[0].id));
      })
      .catch(() => {})
      .finally(() => setLoadingSps(false));
  }, [open]);

  const handleDownloadSample = async () => {
    try {
      const res = await api.get("/samples/bill-finance", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sample_bill_finance.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download sample file");
    }
  };

  const handleUpload = async () => {
    if (!file) return toast.error("Select a file");
    if (!subprojectId) return toast.error("Select a subproject");

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("subprojectId", subprojectId);
      await api.post("/finance/rent-bills/upload", fd);
      toast.success("Bill finance file uploaded and processed");
      onOpenChange(false);
      setFile(null);
      setSubprojectId("");
      onUploaded?.();
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.response?.data?.message || e?.message || "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const needsSubprojectPicker = subprojects.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Import Bill Finance (Rent)
          </DialogTitle>
          <DialogDescription>
            Upload the vendor's rent bill to track billed amounts, payment status, and reconcile against our schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* How it works */}
          <div className="text-xs bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Info className="w-3.5 h-3.5 text-primary" />
              How Bill Finance works
            </div>
            <p className="text-muted-foreground">The vendor sends a rent bill listing their billed amounts per month. We track which months are billed, which payments are received, and flag any amount mismatches (variance) against our internal rent schedule.</p>
          </div>

          {/* Subproject dropdown — only shown when multiple exist */}
          {needsSubprojectPicker && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Which contract is this bill for?</Label>
              <Select value={subprojectId} onValueChange={setSubprojectId}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingSps ? "Loading..." : "Select contract"} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border max-h-60">
                  {subprojects.map((sp) => (
                    <SelectItem key={sp.id} value={String(sp.id)}>
                      {sp.name}{sp.projectName ? ` (${sp.projectName})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* File Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Choose File</Label>
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById("finance-import-input")?.click()}
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
            <input
              id="finance-import-input"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </div>

          {/* Sample download */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg space-y-2">
            <p>Columns: MONTHS, BILLING DATE, AMOUNT, CGST, SGST, TOTAL, BILLED, PAYMENT STATUS. Months with variance will be flagged.</p>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              onClick={handleDownloadSample}
            >
              <Download className="w-3 h-3" />
              Download sample bill finance file
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!file || !subprojectId || uploading}>
            {uploading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Uploading...</> : "Upload & Process"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
