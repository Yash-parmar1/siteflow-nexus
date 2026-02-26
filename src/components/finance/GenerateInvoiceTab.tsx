import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  X, AlertTriangle, Info, Download, Loader2, CheckCircle2, FileSpreadsheet,
  IndianRupee, Calendar, ChevronDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

// ── Mock data ──────────────────────────────────────────────────
const mockClients = [
  { id: "c1", name: "DLF Commercial" },
  { id: "c2", name: "Prestige Estates" },
  { id: "c3", name: "Metro Properties" },
];

const mockProjects: Record<string, { id: string; name: string }[]> = {
  c1: [{ id: "p1", name: "DLF Towers AC Project" }, { id: "p2", name: "DLF IT Park Phase 2" }],
  c2: [{ id: "p3", name: "Prestige HQ Retrofit" }],
  c3: [{ id: "p4", name: "Metro Mall Cooling" }],
};

const mockSubprojects: Record<string, { id: string; name: string }[]> = {
  p1: [{ id: "sp1", name: "Delhi NCR" }, { id: "sp2", name: "Gurugram" }, { id: "sp3", name: "Noida" }],
  p2: [{ id: "sp4", name: "Phase 2A" }, { id: "sp5", name: "Phase 2B" }],
  p3: [{ id: "sp6", name: "Bangalore HQ" }],
  p4: [{ id: "sp7", name: "Ground Floor" }, { id: "sp8", name: "First Floor" }],
};

const mockStates = ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Telangana"];

const mockPendingUploads = [
  { id: "pu1", message: "3 sites in 'Delhi NCR' have unprocessed material uploads from Jan 2025", severity: "amber" },
  { id: "pu2", message: "Vendor reconciliation pending for 'Gurugram' subproject – Dec 2024", severity: "amber" },
];

const mockReconciliation = [
  { month: "Oct 2024", ourAmount: 180000, vendorAmount: 180000, variance: 0, billed: true, paid: true, status: "Matched" },
  { month: "Nov 2024", ourAmount: 185000, vendorAmount: 184200, variance: 800, billed: true, paid: true, status: "Variance" },
  { month: "Dec 2024", ourAmount: 190000, vendorAmount: 189500, variance: 500, billed: true, paid: false, status: "Variance" },
  { month: "Jan 2025", ourAmount: 195000, vendorAmount: 0, variance: 195000, billed: true, paid: false, status: "Not Uploaded" },
  { month: "Feb 2025", ourAmount: 0, vendorAmount: 0, variance: 0, billed: false, paid: false, status: "Future" },
  { month: "Mar 2025", ourAmount: 0, vendorAmount: 0, variance: 0, billed: false, paid: false, status: "Future" },
];

const INVOICE_CATEGORIES = [
  { id: "installation", label: "Installation", gstNote: "18% GST on installation services" },
  { id: "extra_materials", label: "Extra Materials", gstNote: "18% GST on material supply" },
  { id: "maintenance", label: "Maintenance", gstNote: "18% GST on maintenance services" },
];

const formatCurrency = (amount: number) =>
  amount >= 100000 ? `₹${(amount / 100000).toFixed(1)}L` : `₹${amount.toLocaleString()}`;

const statusConfig: Record<string, string> = {
  Matched: "status-success",
  Variance: "status-warning",
  "Not Uploaded": "status-error",
  Future: "status-neutral",
};

export default function GenerateInvoiceTab() {
  const { toast } = useToast();

  // Notification banners
  const [dismissedBanners, setDismissedBanners] = useState<Set<string>>(new Set());
  const visibleBanners = mockPendingUploads.filter((b) => !dismissedBanners.has(b.id));

  const dismissBanner = useCallback(async (id: string) => {
    try {
      // await api.put(`/uploads/pending/${id}/dismiss`);
      setDismissedBanners((prev) => new Set(prev).add(id));
    } catch {
      toast({ title: "Error", description: "Failed to dismiss notification", variant: "destructive" });
    }
  }, [toast]);

  // ── Left Panel: Invoice Builder ──────────────────────────────
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedSubprojects, setSelectedSubprojects] = useState<string[]>([]);
  const [selectedState, setSelectedState] = useState("");
  const [billingMonth, setBillingMonth] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const projects = selectedClient ? mockProjects[selectedClient] || [] : [];
  const subprojects = selectedProject ? mockSubprojects[selectedProject] || [] : [];

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };
  const toggleSubproject = (id: string) => {
    setSelectedSubprojects((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };
  const selectAllSubprojects = () => {
    setSelectedSubprojects(selectedSubprojects.length === subprojects.length ? [] : subprojects.map((s) => s.id));
  };

  const canGenerate = selectedClient && selectedProject && selectedSubprojects.length > 0 && billingMonth && selectedCategories.length > 0;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Simulating API call
      await new Promise((r) => setTimeout(r, 2000));
      // const res = await api.post("/finance/generate-invoice", { ... }, { responseType: "blob" });
      toast({ title: "Invoice Generated", description: "Your .xlsx invoice has been downloaded" });
    } catch {
      toast({ title: "Error", description: "Failed to generate invoice", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Right Panel: Rent Report ─────────────────────────────────
  const [rentFrom, setRentFrom] = useState("");
  const [rentTo, setRentTo] = useState("");
  const [rentSubproject, setRentSubproject] = useState("");

  return (
    <div className="space-y-4">
      {/* Notification Banners */}
      {visibleBanners.map((b) => (
        <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(var(--status-warning)/0.12)] border border-[hsl(var(--status-warning)/0.3)] animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-[hsl(var(--status-warning))] shrink-0" />
          <p className="text-sm text-[hsl(var(--status-warning))] flex-1">{b.message}</p>
          <Button variant="ghost" size="icon-sm" onClick={() => dismissBanner(b.id)} className="shrink-0 text-[hsl(var(--status-warning))] hover:text-foreground">
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}

      {/* 60/40 Split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── LEFT PANEL: Invoice Builder (60%) ── */}
        <Card className="lg:col-span-3 border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              Invoice Builder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Client */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Client <span className="text-destructive">*</span></Label>
              <Select value={selectedClient} onValueChange={(v) => { setSelectedClient(v); setSelectedProject(""); setSelectedSubprojects([]); }}>
                <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {mockClients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Project */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Project <span className="text-destructive">*</span></Label>
              <Select value={selectedProject} onValueChange={(v) => { setSelectedProject(v); setSelectedSubprojects([]); }} disabled={!selectedClient}>
                <SelectTrigger className={`bg-secondary/30 ${!selectedClient ? "opacity-50" : ""}`}><SelectValue placeholder={selectedClient ? "Select project" : "Select client first"} /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Subprojects multi-select */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Subprojects <span className="text-destructive">*</span></Label>
                {subprojects.length > 0 && (
                  <button type="button" onClick={selectAllSubprojects} className="text-[10px] text-primary hover:underline">
                    {selectedSubprojects.length === subprojects.length ? "Deselect all" : "Select all"}
                  </button>
                )}
              </div>
              {!selectedProject ? (
                <p className="text-xs text-muted-foreground">Select a project first</p>
              ) : subprojects.length === 0 ? (
                <p className="text-xs text-muted-foreground">No subprojects found</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {subprojects.map((sp) => {
                      const selected = selectedSubprojects.includes(sp.id);
                      return (
                        <button
                          key={sp.id}
                          type="button"
                          onClick={() => toggleSubproject(sp.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                            selected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/40"
                          }`}
                        >
                          {sp.name}
                          {selected && <X className="w-3 h-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* State (optional) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">State <span className="text-muted-foreground">(optional)</span></Label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="bg-secondary/30"><SelectValue placeholder="All states" /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All States</SelectItem>
                  {mockStates.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Billing Month */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Billing Month <span className="text-destructive">*</span>
              </Label>
              <Input type="month" value={billingMonth} onChange={(e) => setBillingMonth(e.target.value)} className="bg-secondary/30" />
            </div>

            {/* Invoice Categories */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Invoice Categories <span className="text-destructive">*</span></Label>
              <TooltipProvider>
                <div className="flex flex-wrap gap-2">
                  {INVOICE_CATEGORIES.map((cat) => {
                    const active = selectedCategories.includes(cat.id);
                    return (
                      <Tooltip key={cat.id}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => toggleCategory(cat.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              active
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/40"
                            }`}
                          >
                            {cat.label}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          <p>{cat.gstNote}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>

              {/* Context callouts */}
              {selectedCategories.includes("extra_materials") && (
                <div className="flex items-start gap-2 p-2.5 rounded-md bg-[hsl(var(--status-warning)/0.1)] border border-[hsl(var(--status-warning)/0.2)] text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-[hsl(var(--status-warning))] shrink-0 mt-0.5" />
                  <span className="text-[hsl(var(--status-warning))]">Extra Materials invoices will include only materials marked as "unbilled" for the selected sites.</span>
                </div>
              )}
              {selectedCategories.includes("installation") && (
                <div className="flex items-start gap-2 p-2.5 rounded-md bg-muted/50 border border-border text-xs">
                  <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Installation invoices are generated for sites in "Installed" or "Live" stage only.</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Generate Button */}
            <Button onClick={handleGenerate} disabled={!canGenerate || isGenerating} className="w-full" size="lg">
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><Download className="w-4 h-4 mr-2" /> Generate Invoice (.xlsx)</>
              )}
            </Button>

            {/* Explanation card */}
            <div className="p-3 rounded-lg bg-muted/40 border border-border/50 text-xs text-muted-foreground space-y-1.5">
              <p className="font-medium text-foreground text-[11px]">Extra Materials Sheet Structure</p>
              <p>The generated .xlsx will contain columns: Site Code, Material Name, Qty, Unit, Unit Price, Total, GST %, GST Amount, Grand Total. One row per material per site, grouped by subproject.</p>
            </div>
          </CardContent>
        </Card>

        {/* ── RIGHT PANEL: Rent Report & Reconciliation (40%) ── */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-primary" />
              Rent Report & Reconciliation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Rent report form */}
            <div className="space-y-3 p-3 rounded-lg bg-secondary/20 border border-border/50">
              <p className="text-xs font-medium text-foreground">Generate Rent Report</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">From Month</Label>
                  <Input type="month" value={rentFrom} onChange={(e) => setRentFrom(e.target.value)} className="h-8 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">To Month</Label>
                  <Input type="month" value={rentTo} onChange={(e) => setRentTo(e.target.value)} className="h-8 text-xs" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Subproject</Label>
                <Select value={rentSubproject} onValueChange={setRentSubproject}>
                  <SelectTrigger className="h-8 text-xs bg-secondary/30">
                    <SelectValue placeholder={selectedSubprojects.length > 0 ? "Auto-populated" : "Select subproject"} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {(selectedProject ? mockSubprojects[selectedProject] || [] : []).map((sp) => (
                      <SelectItem key={sp.id} value={sp.id}>{sp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <Download className="w-3.5 h-3.5 mr-1.5" /> Download Rent Report
              </Button>
            </div>

            {/* Reconciliation Table */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Reconciliation</p>
              <div className="border border-border/60 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border text-[10px]">
                      <TableHead className="text-[10px] py-2">Month</TableHead>
                      <TableHead className="text-[10px] py-2 text-right">Ours</TableHead>
                      <TableHead className="text-[10px] py-2 text-right">Vendor</TableHead>
                      <TableHead className="text-[10px] py-2 text-right">Variance</TableHead>
                      <TableHead className="text-[10px] py-2 text-center">Billed</TableHead>
                      <TableHead className="text-[10px] py-2 text-center">Paid</TableHead>
                      <TableHead className="text-[10px] py-2">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockReconciliation.map((r) => {
                      const isFuture = r.status === "Future";
                      return (
                        <TableRow key={r.month} className={`border-border/50 ${isFuture ? "opacity-40" : "hover:bg-muted/50"}`}>
                          <TableCell className="text-xs py-1.5 font-medium">{r.month}</TableCell>
                          <TableCell className="text-xs py-1.5 text-right">{isFuture ? "—" : formatCurrency(r.ourAmount)}</TableCell>
                          <TableCell className="text-xs py-1.5 text-right">{isFuture ? "—" : r.vendorAmount === 0 ? "—" : formatCurrency(r.vendorAmount)}</TableCell>
                          <TableCell className={`text-xs py-1.5 text-right font-medium ${
                            isFuture ? "" :
                            r.variance === 0 ? "text-[hsl(var(--status-success))]" :
                            r.variance > 10000 ? "text-[hsl(var(--status-error))]" :
                            "text-[hsl(var(--status-warning))]"
                          }`}>
                            {isFuture ? "—" : r.variance === 0 ? <span className="text-[hsl(var(--status-success))]">—</span> : formatCurrency(r.variance)}
                          </TableCell>
                          <TableCell className="text-center py-1.5">
                            {isFuture ? <span className="text-muted-foreground">—</span> :
                              r.billed ? <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--status-success))] mx-auto" /> : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-center py-1.5">
                            {isFuture ? <span className="text-muted-foreground">—</span> :
                              r.paid ? <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--status-success))] mx-auto" /> : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="py-1.5">
                            <Badge className={`${statusConfig[r.status] || "status-neutral"} border-0 text-[9px]`}>{r.status}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
