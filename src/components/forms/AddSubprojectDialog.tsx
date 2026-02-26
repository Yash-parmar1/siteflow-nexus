import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Lock, IndianRupee, Calendar, Wrench, Upload, FileText, Image, File, X,
  Percent, Package, ShoppingCart, Tag, Pencil, Loader2, FileSpreadsheet,
} from "lucide-react";

// ── Schema ──────────────────────────────────────────────────────
const subprojectSchema = z.object({
  name: z.string().min(2, "Subproject name must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
  baseMonthlyRent: z.number().min(100, "Minimum rent is ₹100").max(100000),
  tenureMonths: z.number().min(12, "Minimum tenure is 12 months").max(120),
  plannedAcsCount: z.number().min(1, "At least one AC").max(10, "Max 10 ACs per site"),
  installationChargeable: z.boolean(),
  stabilizerEnabled: z.boolean(),
  installationCharge: z.number().optional(),
  maintenanceIncluded: z.boolean(),
  maintenanceCharge: z.number().optional(),
  interestRate: z.number().min(0).max(50).optional(),
  interestTenureMonths: z.number().min(0).max(120).optional(),
  // locked fields (auto-filled from file)
  assetUnitCost: z.number().optional(),
  assetInstallationCost: z.number().optional(),
  assetLogisticsCost: z.number().optional(),
  assetTotalCost: z.number().optional(),
  extraMaterialCostPrice: z.number().optional(),
  extraMaterialSellPrice: z.number().optional(),
  extraMaterialRC: z.number().optional(),
});

type SubprojectFormData = z.infer<typeof subprojectSchema>;

interface AddSubprojectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  onSubmit?: (data: SubprojectFormData) => void;
  onFilesChange?: (files: File[]) => void;
}

// ── File helpers ────────────────────────────────────────────────
interface FileWithPreview { id: string; file: File }

const FILE_FORMAT_COLORS: Record<string, string> = {
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "bg-[hsl(var(--status-success))] text-white",
  "application/vnd.ms-excel": "bg-[hsl(var(--status-success))] text-white",
  "application/pdf": "bg-[hsl(var(--status-error))] text-white",
  "image/png": "bg-[hsl(var(--status-info))] text-white",
  "image/jpeg": "bg-[hsl(var(--status-info))] text-white",
  default: "bg-muted text-muted-foreground",
};

function getFileColor(type: string) {
  return FILE_FORMAT_COLORS[type] || FILE_FORMAT_COLORS.default;
}
function getFileIcon(type: string) {
  if (type.startsWith("image/")) return <Image className="h-4 w-4" />;
  if (type.includes("pdf")) return <FileText className="h-4 w-4" />;
  if (type.includes("sheet") || type.includes("excel")) return <FileSpreadsheet className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
}
function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── File Upload Chip (colored block) ────────────────────────────
function FileChip({ file, onRemove }: { file: FileWithPreview; onRemove: () => void }) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${getFileColor(file.file.type)}`}>
      {getFileIcon(file.file.type)}
      <span className="max-w-[140px] truncate">{file.file.name}</span>
      <span className="opacity-70">{formatFileSize(file.file.size)}</span>
      <button type="button" onClick={onRemove} className="ml-1 hover:opacity-80">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Dropzone for required PDFs ──────────────────────────────────
function RequiredPdfDropzone({ label, file, onFile, onRemove }: {
  label: string; file: FileWithPreview | null; onFile: (f: File) => void; onRemove: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-foreground">{label} <span className="text-destructive">*</span></p>
      {file ? (
        <FileChip file={file} onRemove={onRemove} />
      ) : (
        <div
          onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]); }}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onClick={() => ref.current?.click()}
          className={`border-dashed border-2 rounded-md p-3 text-center cursor-pointer transition-colors ${drag ? "border-primary/70 bg-primary/5" : "border-border hover:border-primary/40"}`}
        >
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Upload className="w-4 h-4" />
            <span>Drop or <span className="text-primary underline">browse</span> PDF</span>
          </div>
          <input ref={ref} type="file" accept=".pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) onFile(e.target.files[0]); }} />
        </div>
      )}
    </div>
  );
}

// ── Locked Section (file-upload → auto-fill) ────────────────────
function LockedFieldSection({ title, icon: Icon, fields, fileLabel, onProcess }: {
  title: string;
  icon: React.ElementType;
  fields: { label: string; name: string; value: number | undefined; onChange: (v: number) => void }[];
  fileLabel: string;
  onProcess?: () => void;
}) {
  const [locked, setLocked] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<FileWithPreview | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleProcess = async () => {
    if (!uploadedFile) return;
    setProcessing(true);
    // Simulate parsing file
    await new Promise((r) => setTimeout(r, 1200));
    fields.forEach((f) => f.onChange(Math.round(Math.random() * 50000 + 5000)));
    setProcessing(false);
    toast.success(`${title} fields auto-filled from file`);
  };

  const addFile = (f: File) => {
    setUploadedFile({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, file: f });
  };

  return (
    <div className="space-y-3">
      {/* File upload area */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">{fileLabel}</p>
        {uploadedFile ? (
          <div className="flex items-center gap-2 flex-wrap">
            <FileChip file={uploadedFile} onRemove={() => setUploadedFile(null)} />
            <Button type="button" size="sm" variant="outline" onClick={() => { setUploadedFile(null); fileRef.current?.click(); }} className="h-7 text-xs">
              Replace
            </Button>
            <Button type="button" size="sm" onClick={handleProcess} disabled={processing} className="h-7 text-xs">
              {processing ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing...</> : "Process"}
            </Button>
          </div>
        ) : (
          <div
            onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) addFile(e.dataTransfer.files[0]); }}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onClick={() => fileRef.current?.click()}
            className={`border-dashed border-2 rounded-md p-3 text-center cursor-pointer transition-colors ${drag ? "border-primary/70 bg-primary/5" : "border-border hover:border-primary/40"}`}
          >
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Upload className="w-4 h-4" />
              <span>Upload file to auto-fill • <span className="text-primary underline">browse</span></span>
            </div>
          </div>
        )}
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) addFile(e.target.files[0]); }} />
      </div>

      {/* Locked/unlockable fields */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {locked ? <Lock className="w-3 h-3" /> : <Pencil className="w-3 h-3 text-primary" />}
          <span>{locked ? "Fields locked – upload file to auto-fill" : "Manual editing enabled"}</span>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => setLocked(!locked)} className="h-6 text-[10px] px-2">
          {locked ? <><Pencil className="w-3 h-3 mr-1" /> Edit</> : <><Lock className="w-3 h-3 mr-1" /> Lock</>}
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {fields.map((f) => (
          <div key={f.name} className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
            <Input
              type="number"
              value={f.value ?? ""}
              onChange={(e) => f.onChange(Number(e.target.value))}
              disabled={locked}
              className={locked ? "bg-muted/50 cursor-not-allowed" : ""}
              placeholder="Auto-filled from file"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN DIALOG
// ═══════════════════════════════════════════════════════════════
export function AddSubprojectDialog({
  open, onOpenChange, projectId, projectName, onSubmit, onFilesChange,
}: AddSubprojectDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visitedSections, setVisitedSections] = useState<Set<string>>(new Set());
  const [openAccordions, setOpenAccordions] = useState<string[]>([]);

  // Required PDF files
  const [contractPdf, setContractPdf] = useState<FileWithPreview | null>(null);
  const [poPdf, setPoPdf] = useState<FileWithPreview | null>(null);
  const [piPdf, setPiPdf] = useState<FileWithPreview | null>(null);

  // Optional attachments
  const [attachments, setAttachments] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<SubprojectFormData>({
    resolver: zodResolver(subprojectSchema),
    defaultValues: {
      name: "", baseMonthlyRent: 12000, tenureMonths: 36, plannedAcsCount: 2,
      installationChargeable: false, installationCharge: 25000,
      maintenanceIncluded: true, maintenanceCharge: 2000, stabilizerEnabled: true,
      interestRate: 0, interestTenureMonths: 0,
    },
  });

  const watchInstallationChargeable = form.watch("installationChargeable");
  const watchMaintenanceIncluded = form.watch("maintenanceIncluded");

  // Track which accordion sections have been opened
  const handleAccordionChange = useCallback((value: string[]) => {
    setOpenAccordions(value);
    setVisitedSections((prev) => {
      const next = new Set(prev);
      value.forEach((v) => next.add(v));
      return next;
    });
  }, []);

  const getSectionStyle = (id: string) => {
    if (openAccordions.includes(id)) return "border-primary/60 bg-primary/5";
    if (visitedSections.has(id)) return "border-[hsl(var(--status-success))] bg-[hsl(var(--status-success)/0.05)]";
    return "border-border bg-secondary/20";
  };

  const addFiles = (files: FileList) => {
    const newFiles: FileWithPreview[] = Array.from(files).map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, file: f,
    }));
    setAttachments((prev) => {
      const merged = [...prev, ...newFiles];
      onFilesChange?.(merged.map((f) => f.file));
      return merged;
    });
  };

  const makePdfFile = (f: File): FileWithPreview => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, file: f,
  });

  const handleSubmit = async (data: SubprojectFormData) => {
    setIsSubmitting(true);
    try {
      onSubmit?.(data);
      toast.success("Subproject created with locked configuration");
      form.reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to create subproject");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Create Subproject Configuration
          </DialogTitle>
          <DialogDescription>
            for <span className="font-medium text-foreground">{projectName}</span> —
            Configuration will be locked after creation.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-4">
              {/* ── Name & Description ── */}
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Subproject Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Delhi, Mumbai, Phase 1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl><Textarea placeholder="Short description" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* ── Accordion Sections ── */}
              <Accordion type="multiple" value={openAccordions} onValueChange={handleAccordionChange} className="space-y-2">
                {/* 1. Pricing Config */}
                <AccordionItem value="pricing" className={`rounded-lg border px-4 transition-colors ${getSectionStyle("pricing")}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <IndianRupee className="w-4 h-4 text-primary" />
                      Pricing Configuration
                      {visitedSections.has("pricing") && !openAccordions.includes("pricing") && (
                        <Badge variant="outline" className="text-[9px] h-4 ml-2 border-[hsl(var(--status-success))] text-[hsl(var(--status-success))]">Done</Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <FormField control={form.control} name="baseMonthlyRent" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5"><IndianRupee className="w-3.5 h-3.5" /> Base Monthly Rent</FormLabel>
                          <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="tenureMonths" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Tenure (Months)</FormLabel>
                          <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="plannedAcsCount" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Planned ACs / Site</FormLabel>
                          <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                          <FormMessage />
                          <FormDescription>Number of AC units planned per site in this subproject</FormDescription>
                        </FormItem>
                      )} />

                      <div className="grid grid-cols-1 gap-3">
                        <FormField control={form.control} name="installationChargeable" render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel className="!mt-0 cursor-pointer">Installation Chargeable</FormLabel>
                          </FormItem>
                        )} />
                        {watchInstallationChargeable && (
                          <FormField control={form.control} name="installationCharge" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground">Installation Charge</FormLabel>
                              <FormControl><Input type="number" placeholder="25000" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                            </FormItem>
                          )} />
                        )}
                        <FormField control={form.control} name="maintenanceIncluded" render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel className="!mt-0 cursor-pointer flex items-center gap-1"><Wrench className="w-3 h-3" /> Maintenance Included</FormLabel>
                          </FormItem>
                        )} />
                        {!watchMaintenanceIncluded && (
                          <FormField control={form.control} name="maintenanceCharge" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground">Monthly Maintenance</FormLabel>
                              <FormControl><Input type="number" placeholder="2000" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                            </FormItem>
                          )} />
                        )}
                        <FormField control={form.control} name="stabilizerEnabled" render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <FormLabel className="!mt-0 cursor-pointer">Stabilizer Enabled</FormLabel>
                          </FormItem>
                        )} />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 2. Interest Factor */}
                <AccordionItem value="interest" className={`rounded-lg border px-4 transition-colors ${getSectionStyle("interest")}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Percent className="w-4 h-4 text-primary" />
                      Interest Factor
                      {visitedSections.has("interest") && !openAccordions.includes("interest") && (
                        <Badge variant="outline" className="text-[9px] h-4 ml-2 border-[hsl(var(--status-success))] text-[hsl(var(--status-success))]">Done</Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      <FormField control={form.control} name="interestRate" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Annual Interest Rate (%)</FormLabel>
                          <FormControl><Input type="number" step="0.1" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="interestTenureMonths" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interest Tenure (Months)</FormLabel>
                          <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 3. Asset Cost Breakdown (Locked) */}
                <AccordionItem value="asset-cost" className={`rounded-lg border px-4 transition-colors ${getSectionStyle("asset-cost")}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Package className="w-4 h-4 text-primary" />
                      Asset Cost Breakdown
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <LockedFieldSection
                      title="Asset Cost"
                      icon={Package}
                      fileLabel="Upload asset cost sheet (.xlsx / .csv)"
                      fields={[
                        { label: "Unit Cost (₹)", name: "assetUnitCost", value: form.watch("assetUnitCost"), onChange: (v) => form.setValue("assetUnitCost", v) },
                        { label: "Installation Cost (₹)", name: "assetInstallationCost", value: form.watch("assetInstallationCost"), onChange: (v) => form.setValue("assetInstallationCost", v) },
                        { label: "Logistics Cost (₹)", name: "assetLogisticsCost", value: form.watch("assetLogisticsCost"), onChange: (v) => form.setValue("assetLogisticsCost", v) },
                        { label: "Total Cost (₹)", name: "assetTotalCost", value: form.watch("assetTotalCost"), onChange: (v) => form.setValue("assetTotalCost", v) },
                      ]}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* 4. Extra Material Cost Price (Locked) */}
                <AccordionItem value="extra-material-cost" className={`rounded-lg border px-4 transition-colors ${getSectionStyle("extra-material-cost")}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <ShoppingCart className="w-4 h-4 text-primary" />
                      Extra Material Cost Price
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <LockedFieldSection
                      title="Extra Material Cost"
                      icon={ShoppingCart}
                      fileLabel="Upload material cost file"
                      fields={[
                        { label: "Material Cost Price (₹)", name: "extraMaterialCostPrice", value: form.watch("extraMaterialCostPrice"), onChange: (v) => form.setValue("extraMaterialCostPrice", v) },
                      ]}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* 5. Extra Material Sell Price / RC (Locked) */}
                <AccordionItem value="extra-material-sell" className={`rounded-lg border px-4 transition-colors ${getSectionStyle("extra-material-sell")}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Tag className="w-4 h-4 text-primary" />
                      Extra Material Sell Price / RC
                      <Lock className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <LockedFieldSection
                      title="Extra Material Sell"
                      icon={Tag}
                      fileLabel="Upload sell price / RC file"
                      fields={[
                        { label: "Sell Price (₹)", name: "extraMaterialSellPrice", value: form.watch("extraMaterialSellPrice"), onChange: (v) => form.setValue("extraMaterialSellPrice", v) },
                        { label: "RC Amount (₹)", name: "extraMaterialRC", value: form.watch("extraMaterialRC"), onChange: (v) => form.setValue("extraMaterialRC", v) },
                      ]}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* ── Required PDF Dropzones ── */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Required Documents</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <RequiredPdfDropzone label="Contract Pitch PDF" file={contractPdf} onFile={(f) => setContractPdf(makePdfFile(f))} onRemove={() => setContractPdf(null)} />
                  <RequiredPdfDropzone label="PO PDF" file={poPdf} onFile={(f) => setPoPdf(makePdfFile(f))} onRemove={() => setPoPdf(null)} />
                  <RequiredPdfDropzone label="PI PDF" file={piPdf} onFile={(f) => setPiPdf(makePdfFile(f))} onRemove={() => setPiPdf(null)} />
                </div>
              </div>

              {/* ── Immutability Note ── */}
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <strong>Note:</strong> Once created, this configuration cannot be edited.
                Any future pricing changes require creating a new subproject.
              </div>

              {/* ── Optional Attachments (right above footer) ── */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Optional Attachments</p>
                <div
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files); }}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  className={`border-dashed border-2 rounded-md p-3 text-center transition-colors ${isDragging ? "border-primary/70 bg-primary/5" : "border-border"}`}
                >
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Upload className="w-4 h-4" />
                    <span>Drag & drop or <button type="button" onClick={() => fileInputRef.current?.click()} className="text-primary underline">browse</button></span>
                  </div>
                  <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => { if (e.target.files) addFiles(e.target.files); }} />
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {attachments.map((a) => (
                        <FileChip key={a.id} file={a} onRemove={() => setAttachments((p) => p.filter((f) => f.id !== a.id))} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Sticky Footer ── */}
            <DialogFooter className="px-6 py-4 border-t border-border bg-card sticky bottom-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create & Lock Configuration"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
