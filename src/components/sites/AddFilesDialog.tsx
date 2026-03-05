import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, Download, FolderUp } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Category / config definitions                                      */
/* ------------------------------------------------------------------ */

type Category = "sites" | "assets" | "installations" | "extra-materials" | "config";
type ConfigSub = "sell-price" | "cost-price" | "asset-values" | "rent-schedule";

interface CategoryMeta {
  label: string;
  description: string;
  sampleEndpoint: string;
  sampleFilename: string;
}

const CATEGORIES: Record<Category, CategoryMeta> = {
  sites: {
    label: "Sites",
    description: "Import site details (site code, location, address, contacts, etc.)",
    sampleEndpoint: "/samples/sites",
    sampleFilename: "sample_sites.csv",
  },
  assets: {
    label: "Assets",
    description: "Import asset details (AC units per site — brand, model, capacity, serial).",
    sampleEndpoint: "/samples/assets",
    sampleFilename: "sample_assets.csv",
  },
  installations: {
    label: "Installations",
    description: "Import installation records (booking, status, technician, dates).",
    sampleEndpoint: "/samples/installations",
    sampleFilename: "sample_installations.csv",
  },
  "extra-materials": {
    label: "Extra Materials",
    description: "Import extra material usage per site (copper, bracket, etc.).",
    sampleEndpoint: "/samples/extra-materials",
    sampleFilename: "sample_extra_materials.csv",
  },
  config: {
    label: "Config Files",
    description: "Upload pricing / amortisation configuration for this subproject.",
    sampleEndpoint: "", // resolved per sub-category
    sampleFilename: "",
  },
};

const CONFIG_SUBS: Record<ConfigSub, CategoryMeta> = {
  "sell-price": {
    label: "Sell Price",
    description: "Product sell prices charged to the client.",
    sampleEndpoint: "/samples/sell-price",
    sampleFilename: "sample_sell_price.csv",
  },
  "cost-price": {
    label: "Cost Price",
    description: "Product cost prices (internal procurement cost).",
    sampleEndpoint: "/samples/cost-price",
    sampleFilename: "sample_cost_price.csv",
  },
  "asset-values": {
    label: "Asset Value Breakdown",
    description: "Per-asset value breakdown for depreciation / amortisation.",
    sampleEndpoint: "/samples/asset-values",
    sampleFilename: "sample_asset_values.csv",
  },
  "rent-schedule": {
    label: "Rent Schedule",
    description: "Rent breakdown per asset per month.",
    sampleEndpoint: "/samples/rent-schedule",
    sampleFilename: "sample_rent_schedule.csv",
  },
};

/* ------------------------------------------------------------------ */
/*  Component props                                                    */
/* ------------------------------------------------------------------ */

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  subprojectId: string;
  onUploaded?: (result: any) => void;
}

/* ------------------------------------------------------------------ */
/*  AddFilesDialog                                                     */
/* ------------------------------------------------------------------ */

export default function AddFilesDialog({
  open, onOpenChange, projectId, subprojectId, onUploaded,
}: Props) {
  const [category, setCategory] = useState<Category>("sites");
  const [configSub, setConfigSub] = useState<ConfigSub>("sell-price");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [overwrite, setOverwrite] = useState<boolean>(true);

  /* ---- Resolve active meta ---- */
  const meta = category === "config" ? CONFIG_SUBS[configSub] : CATEGORIES[category];

  /* ---- Upload handler ---- */
  const handleSubmit = async () => {
    if (!file) return toast.error("Please select a file to upload");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      let endpoint = "";
      switch (category) {
        case "sites":
          fd.append("overwrite", String(overwrite));
          endpoint = `/projects/${projectId}/subprojects/${subprojectId}/uploads`;
          break;
        case "assets":
          endpoint = `/projects/${projectId}/subprojects/${subprojectId}/asset-uploads`;
          break;
        case "installations":
          fd.append("subprojectId", subprojectId);
          endpoint = `/installations/import`;
          break;
        case "extra-materials":
          fd.append("subprojectId", subprojectId);
          endpoint = `/finance/extra-materials/upload`;
          break;
        case "config":
          endpoint = `/subproject/${subprojectId}/config/${configSub}`;
          break;
      }

      const res = await api.post(endpoint, fd);
      toast.success(`${meta.label} file uploaded and parsed`);
      onOpenChange(false);
      if (onUploaded) onUploaded(res.data);
    } catch (e: any) {
      console.error("Upload error", e);
      const serverMsg =
        e?.response?.data?.error || e?.response?.data?.message || e?.message;
      toast.error(serverMsg || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  /* ---- Sample download ---- */
  const downloadSample = async () => {
    try {
      const res = await api.get(meta.sampleEndpoint, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = meta.sampleFilename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download sample file");
    }
  };

  /* ---- Render ---- */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-background border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderUp className="w-5 h-5 text-primary" />
            Add Files
          </DialogTitle>
          <DialogDescription>
            Choose a file category and upload a CSV or Excel file into this subproject.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* ---- Category radio buttons ---- */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">File Category</Label>
            <RadioGroup
              value={category}
              onValueChange={(v) => {
                setCategory(v as Category);
                setFile(null);
              }}
              className="grid grid-cols-2 gap-2 sm:grid-cols-3"
            >
              {(Object.keys(CATEGORIES) as Category[]).map((key) => (
                <div
                  key={key}
                  className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors ${
                    category === key
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                  onClick={() => { setCategory(key); setFile(null); }}
                >
                  <RadioGroupItem value={key} id={`cat-${key}`} />
                  <Label htmlFor={`cat-${key}`} className="cursor-pointer text-sm font-medium">
                    {CATEGORIES[key].label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* ---- Config sub-category ---- */}
          {category === "config" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Config Type</Label>
              <Select
                value={configSub}
                onValueChange={(v) => { setConfigSub(v as ConfigSub); setFile(null); }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CONFIG_SUBS) as ConfigSub[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {CONFIG_SUBS[key].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ---- Description + sample ---- */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg space-y-2">
            <p>{meta.description}</p>
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs text-primary"
              onClick={downloadSample}
            >
              <Download className="w-3 h-3 mr-1" />
              Download sample {meta.label.toLowerCase()} file
            </Button>
          </div>

          {/* ---- File input ---- */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Choose File</Label>
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() =>
                document.getElementById("addfiles-upload-input")?.click()
              }
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(file.size / 1024)} KB
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to select a file
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supported: .csv, .xlsx, .xls
                  </p>
                </div>
              )}
            </div>
            <input
              id="addfiles-upload-input"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </div>

          {/* ---- Overwrite checkbox (sites only) ---- */}
          {category === "sites" && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="overwrite"
                checked={overwrite}
                onCheckedChange={(v) => setOverwrite(!!v)}
              />
              <Label
                htmlFor="overwrite"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Overwrite existing sites with same EPS Site Code
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!file || uploading}>
            {uploading ? "Uploading…" : "Upload & Parse"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
