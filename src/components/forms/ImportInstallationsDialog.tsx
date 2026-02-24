import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Loader2,
  FileText,
  Pencil,
  Trash2,
  RotateCcw,
  Download,
} from "lucide-react";
import api from "@/lib/api";
import { useAppData } from "@/context/AppDataContext";

// ── Types matching the backend UploadResponsePayload ──────────

interface RowResult {
  rowNumber: number;
  siteCode: string | null; // serialNumber in context
  status: "OK" | "WARN" | "ERROR";
  message: string;
  isError: boolean;
  rowData: Record<string, string> | null;
}

interface UploadResult {
  processed: number;
  saved: number;
  updated: number;
  warnings: number;
  errors: number;
  rowResults: RowResult[];
}

interface UploadResponse {
  sessionId: number;
  uploadResult: UploadResult;
}

// ── Editable row type ──────────────────────────────────────────

interface EditableRow extends RowResult {
  isEditing: boolean;
  editedData: Record<string, string>;
}

// ── Column labels for display ──────────────────────────────────

const COLUMN_LABELS: Record<string, string> = {
  "Column_0": "Sub Order ID",
  "Column_1": "Item Order ID",
  "Column_2": "Serial Number",
  "Column_3": "Customer Name",
  "Column_4": "Mobile",
  "Column_5": "Product",
  "Column_6": "Brand",
  "Column_7": "Category",
  "Column_8": "Size",
  "Column_9": "Model Number",
  "Column_10": "City",
  "Column_11": "State",
  "Column_12": "Upcountry",
  "Column_13": "Booking ID",
  "Column_14": "Around Item ID",
  "Column_15": "Booking Date",
  "Column_16": "Closed Date",
  "Column_17": "Sf Closed Date",
  "Column_18": "Status",
  "Column_19": "Spare Involved",
  "Column_20": "OTP Verified",
  "Column_21": "Rating",
  "Column_22": "Serial Number Image",
  // Dynamically handled beyond 22
};

function getColumnLabel(key: string): string {
  return COLUMN_LABELS[key] || key;
}

// ── Component Props ────────────────────────────────────────────

interface ImportInstallationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DialogStep = "upload" | "summary";

// ── Main Component ─────────────────────────────────────────────

export function ImportInstallationsDialog({
  open,
  onOpenChange,
}: ImportInstallationsDialogProps) {
  const { refresh } = useAppData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [step, setStep] = useState<DialogStep>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  // Summary state
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [editableRows, setEditableRows] = useState<EditableRow[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  // ── Reset ──────────────────────────────────────────────────

  const resetDialog = useCallback(() => {
    setStep("upload");
    setSelectedFile(null);
    setUploading(false);
    setUploadProgress(0);
    setSessionId(null);
    setUploadResult(null);
    setEditableRows([]);
    setActiveTab("all");
    setDragActive(false);
  }, []);

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  // ── File Selection ─────────────────────────────────────────

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) return "File size exceeds 10 MB limit";
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["csv", "xlsx", "xls"].includes(ext))
      return "Only .csv, .xlsx, .xls files are accepted";
    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    setSelectedFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = "";
  };

  // Drag & drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  // ── Upload ─────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      setUploadProgress(30);

      const resp = await api.post<UploadResponse>("/installations/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded / progressEvent.total) * 60) + 30;
            setUploadProgress(Math.min(pct, 90));
          }
        },
      });

      setUploadProgress(100);

      const data = resp.data;
      setSessionId(data.sessionId);
      setUploadResult(data.uploadResult);

      // Build editable rows
      const rows: EditableRow[] = (data.uploadResult.rowResults || []).map((r) => ({
        ...r,
        isEditing: false,
        editedData: { ...(r.rowData || {}) },
      }));
      setEditableRows(rows);

      setStep("summary");

      if (data.uploadResult.errors > 0) {
        toast.warning(
          `Import completed with ${data.uploadResult.errors} error(s). Review below.`
        );
      } else {
        toast.success(
          `Import successful! ${data.uploadResult.saved} created, ${data.uploadResult.updated} updated.`
        );
      }
    } catch (err: any) {
      console.error("[ImportInstallations] upload failed", err);
      const msg =
        err?.response?.data?.error || err?.message || "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  // ── Editable summary helpers ───────────────────────────────

  const toggleEdit = (rowNumber: number) => {
    setEditableRows((prev) =>
      prev.map((r) =>
        r.rowNumber === rowNumber ? { ...r, isEditing: !r.isEditing } : r
      )
    );
  };

  const updateField = (rowNumber: number, field: string, value: string) => {
    setEditableRows((prev) =>
      prev.map((r) =>
        r.rowNumber === rowNumber
          ? { ...r, editedData: { ...r.editedData, [field]: value } }
          : r
      )
    );
  };

  const removeRow = (rowNumber: number) => {
    setEditableRows((prev) => prev.filter((r) => r.rowNumber !== rowNumber));
    toast.info(`Row ${rowNumber} removed from results`);
  };

  // ── Filtered rows by tab ────────────────────────────────────

  const getFilteredRows = () => {
    switch (activeTab) {
      case "success":
        return editableRows.filter((r) => r.status === "OK");
      case "warnings":
        return editableRows.filter((r) => r.status === "WARN");
      case "errors":
        return editableRows.filter((r) => r.status === "ERROR");
      default:
        return editableRows;
    }
  };

  const successCount = editableRows.filter((r) => r.status === "OK").length;
  const warningCount = editableRows.filter((r) => r.status === "WARN").length;
  const errorCount = editableRows.filter((r) => r.status === "ERROR").length;

  // ── Done / close summary ────────────────────────────────────

  const handleDone = async () => {
    await refresh();
    handleClose();
    toast.success("Installation data refreshed");
  };

  // ── Render helpers ──────────────────────────────────────────

  const statusBadge = (status: string) => {
    switch (status) {
      case "OK":
        return (
          <Badge className="bg-[hsl(var(--status-success)/0.15)] text-[hsl(var(--status-success))] border-0 gap-1">
            <CheckCircle2 className="w-3 h-3" /> Success
          </Badge>
        );
      case "WARN":
        return (
          <Badge className="bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))] border-0 gap-1">
            <AlertTriangle className="w-3 h-3" /> Warning
          </Badge>
        );
      case "ERROR":
        return (
          <Badge className="bg-[hsl(var(--status-error)/0.15)] text-[hsl(var(--status-error))] border-0 gap-1">
            <AlertCircle className="w-3 h-3" /> Error
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  // ── Render ──────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : handleClose())}>
      <DialogContent
        className={
          step === "summary"
            ? "sm:max-w-[95vw] lg:max-w-[1100px] max-h-[90vh] flex flex-col"
            : "sm:max-w-[540px]"
        }
      >
        {/* ─── STEP 1: UPLOAD ─── */}
        {step === "upload" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" />
                Import Installations
              </DialogTitle>
              <DialogDescription>
                Upload a CSV or Excel file with installation records. The file will
                be parsed and matched against existing assets by serial number.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {/* Drop zone */}
              <div
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                  transition-all duration-200
                  ${dragActive
                    ? "border-primary bg-primary/5"
                    : selectedFile
                    ? "border-[hsl(var(--status-success))] bg-[hsl(var(--status-success)/0.05)]"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-secondary/30"
                  }
                `}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleInputChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="space-y-2">
                    <FileSpreadsheet className="w-10 h-10 mx-auto text-[hsl(var(--status-success))]" />
                    <p className="font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                    >
                      <X className="w-4 h-4 mr-1" /> Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                    <p className="font-medium text-foreground">
                      Drop your file here or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports .csv, .xlsx, .xls (max 10 MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Upload progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading & processing...
                    </span>
                    <span className="font-medium">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Expected format hint */}
              <div className="bg-secondary/50 rounded-lg p-4 text-sm space-y-1">
                <p className="font-medium text-foreground flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Expected File Format
                </p>
                <p className="text-muted-foreground">
                  Columns: Serial Number, Customer Name, Mobile, Size, Model Number,
                  Booking ID, Around Item ID, Booking Date, Closed Date, Status,
                  Spare Involved, OTP Verified, Rating, Serial Image URL, Evidence URLs…
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleClose} disabled={uploading}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload &amp; Import
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ─── STEP 2: EDITABLE SUMMARY ─── */}
        {step === "summary" && uploadResult && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                Import Summary
              </DialogTitle>
              <DialogDescription>
                Review the import results. You can inspect row details and errors below.
              </DialogDescription>
            </DialogHeader>

            {/* ── Stats row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 py-3">
              <StatCard label="Processed" value={uploadResult.processed} icon={<FileText className="w-4 h-4" />} color="primary" />
              <StatCard label="Created" value={uploadResult.saved} icon={<CheckCircle2 className="w-4 h-4" />} color="status-success" />
              <StatCard label="Updated" value={uploadResult.updated} icon={<RotateCcw className="w-4 h-4" />} color="status-info" />
              <StatCard label="Warnings" value={uploadResult.warnings} icon={<AlertTriangle className="w-4 h-4" />} color="status-warning" />
              <StatCard label="Errors" value={uploadResult.errors} icon={<AlertCircle className="w-4 h-4" />} color="status-error" />
            </div>

            {/* ── Tabs ── */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">
                  All ({editableRows.length})
                </TabsTrigger>
                <TabsTrigger value="success" className="gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Success ({successCount})
                </TabsTrigger>
                <TabsTrigger value="warnings" className="gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Warnings ({warningCount})
                </TabsTrigger>
                <TabsTrigger value="errors" className="gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Errors ({errorCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="flex-1 min-h-0 mt-3">
                <ScrollArea className="h-[45vh] rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/50">
                        <TableHead className="w-[60px]">Row</TableHead>
                        <TableHead className="w-[110px]">Status</TableHead>
                        <TableHead className="w-[140px]">Serial No.</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredRows().length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                            No rows in this category
                          </TableCell>
                        </TableRow>
                      ) : (
                        getFilteredRows().map((row) => (
                          <RowBlock
                            key={row.rowNumber}
                            row={row}
                            onToggleEdit={() => toggleEdit(row.rowNumber)}
                            onUpdateField={(field, val) => updateField(row.rowNumber, field, val)}
                            onRemove={() => removeRow(row.rowNumber)}
                            statusBadge={statusBadge}
                          />
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-2 pt-3">
              <Button variant="outline" onClick={() => { resetDialog(); setStep("upload"); }}>
                <Upload className="w-4 h-4" />
                Import Another
              </Button>
              <Button onClick={handleDone}>
                <CheckCircle2 className="w-4 h-4" />
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Stat Card sub-component ────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-xl border p-3 text-center space-y-1">
      <div
        className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `hsl(var(--${color}) / 0.15)` }}
      >
        <span style={{ color: `hsl(var(--${color}))` }}>{icon}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

// ── Row Block sub-component (expandable / editable) ────────────

function RowBlock({
  row,
  onToggleEdit,
  onUpdateField,
  onRemove,
  statusBadge,
}: {
  row: EditableRow;
  onToggleEdit: () => void;
  onUpdateField: (field: string, value: string) => void;
  onRemove: () => void;
  statusBadge: (status: string) => React.ReactNode;
}) {
  const hasRowData = row.rowData && Object.keys(row.rowData).length > 0;

  return (
    <>
      {/* Main row */}
      <TableRow
        className={
          row.status === "ERROR"
            ? "bg-[hsl(var(--status-error)/0.04)]"
            : row.status === "WARN"
            ? "bg-[hsl(var(--status-warning)/0.04)]"
            : ""
        }
      >
        <TableCell className="font-mono text-xs">{row.rowNumber}</TableCell>
        <TableCell>{statusBadge(row.status)}</TableCell>
        <TableCell className="font-mono text-sm">{row.siteCode ?? "—"}</TableCell>
        <TableCell className="text-sm max-w-[400px]">
          <span className="line-clamp-2">{row.message}</span>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            {hasRowData && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onToggleEdit}
                title={row.isEditing ? "Collapse" : "View / Edit"}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-[hsl(var(--status-error))]"
              onClick={onRemove}
              title="Remove row"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded editable detail */}
      {row.isEditing && hasRowData && (
        <TableRow>
          <TableCell colSpan={5} className="p-0">
            <div className="bg-secondary/30 border-t border-b p-4">
              <p className="text-xs font-medium text-muted-foreground mb-3">
                ROW {row.rowNumber} — FIELD DETAILS
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(row.editedData).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      {getColumnLabel(key)}
                    </label>
                    <Input
                      value={value}
                      onChange={(e) => onUpdateField(key, e.target.value)}
                      className="h-8 text-sm bg-background"
                    />
                  </div>
                ))}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
