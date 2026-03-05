import { useState, useMemo, useCallback, useEffect } from "react";
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

// ── Types matching backend DTOs ────────────────────────────────

interface DropdownItem { id: number; name: string }
interface ProjectItem { id: number; name: string; clientId: number }
interface SubprojectItem { id: number; name: string; projectId: number }

interface FormData {
  clients: DropdownItem[];
  projects: ProjectItem[];
  subprojects: SubprojectItem[];
  states: string[];
  invoiceTypes: string[];
}

interface ReconciliationRow {
  month: string;
  ourAmount: number;
  vendorAmount: number;
  variance: number;
  billed: boolean;
  paid: boolean;
  status: string;
}

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

  // ── Form data from backend ───────────────────────────────────
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loadingFormData, setLoadingFormData] = useState(false);

  // Notification banners
  const [pendingNotifications, setPendingNotifications] = useState<{ id: number; message: string; severity: string }[]>([]);
  const [dismissedBanners, setDismissedBanners] = useState<Set<number>>(new Set());
  const visibleBanners = pendingNotifications.filter((b) => !dismissedBanners.has(b.id));

  // Load form data on mount
  useEffect(() => {
    const loadFormData = async () => {
      setLoadingFormData(true);
      try {
        const res = await api.get('/finance/invoice/form-data');
        setFormData(res.data);
      } catch {
        toast({ title: "Error", description: "Failed to load form data", variant: "destructive" });
      } finally {
        setLoadingFormData(false);
      }
    };
    loadFormData();

    // Also load pending notifications
    api.get('/finance/notifications/pending')
      .then(res => {
        const items = (res.data || []).map((n: any) => ({
          id: n.id,
          message: n.message || n.content || 'Pending upload notification',
          severity: 'amber',
        }));
        setPendingNotifications(items);
      })
      .catch(() => {});
  }, []);

  const dismissBanner = useCallback(async (id: number) => {
    try {
      await api.put(`/finance/notifications/${id}/read`);
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

  // Cascade: filter projects by selected client, subprojects by selected project
  const clients = formData?.clients || [];
  const projects = useMemo(() => {
    if (!formData?.projects) return [];
    if (!selectedClient) return [];
    return formData.projects.filter(p => String(p.clientId) === selectedClient);
  }, [formData?.projects, selectedClient]);

  const subprojects = useMemo(() => {
    if (!formData?.subprojects) return [];
    if (!selectedProject) return [];
    return formData.subprojects.filter(s => String(s.projectId) === selectedProject);
  }, [formData?.subprojects, selectedProject]);

  const states = formData?.states || [];

  // Re-fetch projects when client changes
  useEffect(() => {
    if (selectedClient && formData) {
      api.get(`/finance/invoice/form-data?clientId=${selectedClient}`)
        .then(res => {
          setFormData(prev => prev ? { ...prev, projects: res.data.projects, subprojects: res.data.subprojects } : prev);
        })
        .catch(() => {});
    }
  }, [selectedClient]);

  // Re-fetch subprojects when project changes
  useEffect(() => {
    if (selectedProject && formData) {
      api.get(`/finance/invoice/form-data?projectId=${selectedProject}`)
        .then(res => {
          setFormData(prev => prev ? { ...prev, subprojects: res.data.subprojects } : prev);
        })
        .catch(() => {});
    }
  }, [selectedProject]);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  };
  const toggleSubproject = (id: string) => {
    setSelectedSubprojects((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };
  const selectAllSubprojects = () => {
    setSelectedSubprojects(selectedSubprojects.length === subprojects.length ? [] : subprojects.map((s) => String(s.id)));
  };

  const canGenerate = selectedClient && selectedProject && selectedSubprojects.length > 0 && billingMonth && selectedCategories.length > 0;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Format billing month from "2025-01" to "Jan'25"
      const [y, m] = billingMonth.split('-');
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const formattedMonth = `${monthNames[parseInt(m, 10) - 1]}'${y.slice(2)}`;

      // Map category IDs to backend invoice type names
      const typeMap: Record<string, string> = {
        installation: 'INSTALLATION',
        extra_materials: 'EXTRA_MATERIALS',
        maintenance: 'MAINTENANCE',
      };

      const res = await api.post('/finance/invoice/generate', {
        clientId: Number(selectedClient),
        projectId: Number(selectedProject),
        subprojectIds: selectedSubprojects.map(Number),
        stateFilter: selectedState && selectedState !== 'all' ? selectedState : null,
        invoiceTypes: selectedCategories.map(c => typeMap[c] || c.toUpperCase()),
        billingMonth: formattedMonth,
      }, { responseType: 'blob' });

      // Check if the response is an error message (small JSON response)
      const blob = new Blob([res.data]);
      if (blob.size < 2000) {
        // Might be a "No Data" sheet only - warn user
        toast({
          title: "Invoice Generated - Possibly Empty",
          description: "The file was generated but may contain only headers. Check that selected sites have unbilled installations, extra materials with sell prices configured, or closed maintenance tickets.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Invoice Generated", description: "Your .xlsx invoice has been downloaded" });
      }

      // Download the file regardless
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${formattedMonth}_${selectedCategories.join('-')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
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
  const [reconciliation, setReconciliation] = useState<ReconciliationRow[]>([]);
  const [isDownloadingRent, setIsDownloadingRent] = useState(false);

  // Load reconciliation when rent subproject changes
  useEffect(() => {
    if (rentSubproject) {
      api.get(`/finance/rent-report/reconciliation?subprojectId=${rentSubproject}`)
        .then(res => setReconciliation(res.data || []))
        .catch(() => setReconciliation([]));
    }
  }, [rentSubproject]);

  const handleDownloadRentReport = async () => {
    if (!rentSubproject || !rentFrom || !rentTo) {
      toast({ title: "Missing fields", description: "Select subproject and date range", variant: "destructive" });
      return;
    }
    setIsDownloadingRent(true);
    try {
      const res = await api.post(
        `/finance/rent-report/generate?subprojectId=${rentSubproject}&fromMonth=${rentFrom}&toMonth=${rentTo}`,
        null,
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `RentReport_${rentSubproject}_${rentFrom}_to_${rentTo}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Report Downloaded", description: "Rent report Excel downloaded" });
    } catch {
      toast({ title: "Error", description: "Failed to generate rent report", variant: "destructive" });
    } finally {
      setIsDownloadingRent(false);
    }
  };

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
                  {clients.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Project */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Project <span className="text-destructive">*</span></Label>
              <Select value={selectedProject} onValueChange={(v) => { setSelectedProject(v); setSelectedSubprojects([]); }} disabled={!selectedClient}>
                <SelectTrigger className={`bg-secondary/30 ${!selectedClient ? "opacity-50" : ""}`}><SelectValue placeholder={selectedClient ? "Select project" : "Select client first"} /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {projects.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
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
                      const selected = selectedSubprojects.includes(String(sp.id));
                      return (
                        <button
                          key={sp.id}
                          type="button"
                          onClick={() => toggleSubproject(String(sp.id))}
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
                  {states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                    <SelectValue placeholder={subprojects.length > 0 ? "Select subproject" : "Select project first"} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {subprojects.map((sp) => (
                      <SelectItem key={sp.id} value={String(sp.id)}>{sp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={handleDownloadRentReport} disabled={isDownloadingRent || !rentSubproject || !rentFrom || !rentTo}>
                {isDownloadingRent ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Generating...</> : <><Download className="w-3.5 h-3.5 mr-1.5" /> Download Rent Report</>}
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
                    {reconciliation.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-6">
                          Select a subproject to view reconciliation data
                        </TableCell>
                      </TableRow>
                    )}
                    {reconciliation.map((r) => {
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
