import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, FileText, Download, Loader2 } from "lucide-react";
import api from "@/lib/api";

const UPLOAD_TYPES = [
  { id: "invoices-per-site", label: "Invoices Per Site", endpoint: "/finance/invoices-per-site/upload", sampleEndpoint: "/samples/invoices-per-site", sampleFile: "sample_invoices_per_site.csv" },
  { id: "final-invoice", label: "Final Invoice", endpoint: "/finance/final-invoice/upload", sampleEndpoint: "/samples/final-invoice", sampleFile: "sample_final_invoice.csv" },
  { id: "bill-finance", label: "Bill Finance (Rent)", endpoint: "/finance/rent-bills/upload", sampleEndpoint: "/samples/bill-finance", sampleFile: "sample_bill_finance.csv" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded?: () => void;
}

export default function FinancialImportDialog({ open, onOpenChange, onUploaded }: Props) {
  const [uploadType, setUploadType] = useState("");
  const [subprojectId, setSubprojectId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const selectedType = UPLOAD_TYPES.find((t) => t.id === uploadType);

  const handleDownloadSample = async () => {
    if (!selectedType) return;
    try {
      const res = await api.get(selectedType.sampleEndpoint, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = selectedType.sampleFile;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download sample file");
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedType) return toast.error("Select a file and upload type");
    if (!subprojectId) return toast.error("Enter a subproject ID");

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("subprojectId", subprojectId);
      await api.post(selectedType.endpoint, fd);
      toast.success(`${selectedType.label} uploaded and processed`);
      onOpenChange(false);
      setFile(null);
      setUploadType("");
      setSubprojectId("");
      onUploaded?.();
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.response?.data?.message || e?.message || "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Import Financial Data
          </DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import financial records.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Upload Type */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Data Type</Label>
            <Select value={uploadType} onValueChange={setUploadType}>
              <SelectTrigger><SelectValue placeholder="Select type of data to import" /></SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {UPLOAD_TYPES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subproject ID */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Subproject ID</Label>
            <Input
              type="number"
              placeholder="Enter subproject ID"
              value={subprojectId}
              onChange={(e) => setSubprojectId(e.target.value)}
            />
          </div>

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

          {/* Sample download + hint */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg space-y-2">
            <p>The file will be parsed and validated. Rows with errors will be flagged for review.</p>
            {selectedType && (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                onClick={handleDownloadSample}
              >
                <Download className="w-3 h-3" />
                Download sample {selectedType.label} file
              </button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!file || !uploadType || !subprojectId || uploading}>
            {uploading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Uploading...</> : "Upload & Process"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
