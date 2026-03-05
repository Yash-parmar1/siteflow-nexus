import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, X, Pencil } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface EditAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: number | string;
  assetName: string;
  onSuccess?: () => void;
}

const EDITABLE_FIELDS = [
  { key: "status", label: "Status", type: "select", options: ["ACTIVE", "INACTIVE", "MAINTENANCE", "DECOMMISSIONED", "REPLACED"] },
  { key: "capacity", label: "Capacity (Ton)", type: "number" },
  { key: "model", label: "Model", type: "text" },
  { key: "manufacturer", label: "Manufacturer", type: "text" },
  { key: "purchaseDate", label: "Purchase Date", type: "date" },
  { key: "warrantyEndDate", label: "Warranty End Date", type: "date" },
  { key: "warrantyProvider", label: "Warranty Provider", type: "text" },
  { key: "maintenanceNotes", label: "Maintenance Notes", type: "textarea" },
  { key: "lastServiceDate", label: "Last Service Date", type: "date" },
  { key: "nextServiceDue", label: "Next Service Due", type: "date" },
];

export function EditAssetDialog({ open, onOpenChange, assetId, assetName, onSuccess }: EditAssetDialogProps) {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [values, setValues] = useState<Record<string, string>>({});
  const [changeReason, setChangeReason] = useState("");
  const [changeDescription, setChangeDescription] = useState("");
  const [evidencePhotos, setEvidencePhotos] = useState<File[]>([]);
  const [evidenceDocument, setEvidenceDocument] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleField = (key: string) => {
    const next = new Set(selectedFields);
    if (next.has(key)) next.delete(key); else next.add(key);
    setSelectedFields(next);
  };

  const handleSubmit = async () => {
    if (!changeReason.trim()) { toast.error("Change reason is required"); return; }
    if (selectedFields.size === 0) { toast.error("Select at least one field"); return; }
    setIsSubmitting(true);
    try {
      const changes: Record<string, string> = {};
      selectedFields.forEach((key) => { if (values[key]) changes[key] = values[key]; });
      const formData = new FormData();
      formData.append("changeRequest", JSON.stringify({ changes, changeReason, changeDescription }));
      evidencePhotos.forEach((f) => formData.append("evidencePhotos", f));
      if (evidenceDocument) formData.append("evidenceDocument", evidenceDocument);
      await api.put(`/assets/${assetId}/edit`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Asset updated successfully");
      onSuccess?.();
      onOpenChange(false);
      setSelectedFields(new Set()); setValues({}); setChangeReason(""); setChangeDescription(""); setEvidencePhotos([]); setEvidenceDocument(null);
    } catch (err: any) {
      toast.error(err?.response?.data || "Failed to update asset");
    } finally { setIsSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Pencil className="w-4 h-4 text-primary" />Edit Asset</DialogTitle>
          <DialogDescription>{assetName} — Select fields to change and provide a reason.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fields to Change</Label>
            <div className="grid grid-cols-1 gap-2">
              {EDITABLE_FIELDS.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={selectedFields.has(field.key)} onCheckedChange={() => toggleField(field.key)} />
                    <span className="text-sm">{field.label}</span>
                  </div>
                  {selectedFields.has(field.key) && (
                    <div className="ml-6">
                      {field.type === "select" ? (
                        <Select value={values[field.key] || ""} onValueChange={(v) => setValues((p) => ({ ...p, [field.key]: v }))}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={`Select ${field.label}`} /></SelectTrigger>
                          <SelectContent>{field.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : field.type === "date" ? (
                        <Input type="date" className="h-8 text-xs" value={values[field.key] || ""} onChange={(e) => setValues((p) => ({ ...p, [field.key]: e.target.value }))} />
                      ) : field.type === "textarea" ? (
                        <Textarea className="text-xs" placeholder={field.label} value={values[field.key] || ""} onChange={(e) => setValues((p) => ({ ...p, [field.key]: e.target.value }))} rows={2} />
                      ) : (
                        <Input type={field.type === "number" ? "number" : "text"} className="h-8 text-xs" placeholder={field.label} value={values[field.key] || ""} onChange={(e) => setValues((p) => ({ ...p, [field.key]: e.target.value }))} />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Change Reason <span className="text-destructive">*</span></Label>
            <Input placeholder="e.g., Scheduled maintenance" value={changeReason} onChange={(e) => setChangeReason(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Change Description</Label>
            <Textarea placeholder="Detailed explanation..." value={changeDescription} onChange={(e) => setChangeDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Evidence Photos (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {evidencePhotos.map((f, i) => (
                <Badge key={i} variant="outline" className="gap-1 text-xs">{f.name.slice(0, 20)}<X className="w-3 h-3 cursor-pointer" onClick={() => setEvidencePhotos((p) => p.filter((_, idx) => idx !== i))} /></Badge>
              ))}
              <label className="inline-flex items-center gap-1 px-2 py-1 rounded border border-dashed border-border text-xs text-muted-foreground cursor-pointer hover:border-primary/40">
                <Upload className="w-3 h-3" /> Add Photos
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) setEvidencePhotos((p) => [...p, ...Array.from(e.target.files!)]); }} />
              </label>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Evidence Document (optional)</Label>
            {evidenceDocument ? (
              <Badge variant="outline" className="gap-1 text-xs">{evidenceDocument.name.slice(0, 30)}<X className="w-3 h-3 cursor-pointer" onClick={() => setEvidenceDocument(null)} /></Badge>
            ) : (
              <label className="inline-flex items-center gap-1 px-2 py-1 rounded border border-dashed border-border text-xs text-muted-foreground cursor-pointer hover:border-primary/40">
                <Upload className="w-3 h-3" /> Upload Document
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setEvidenceDocument(e.target.files[0]); }} />
              </label>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || selectedFields.size === 0}>
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin mr-1" />Saving...</> : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
