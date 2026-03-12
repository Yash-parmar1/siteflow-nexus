import { useState, useMemo, useEffect, useCallback } from "react";
import { CreateInvoiceDialog } from "@/components/forms/CreateInvoiceDialog";
import FinancialImportDialog from "@/components/finance/FinancialImportDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Search, Download, Plus, Upload, TrendingUp, ArrowUpRight, ArrowDownRight, CheckCircle2,
  Clock, Wallet, IndianRupee, AlertTriangle, FileText, ExternalLink, Filter,
  ChevronDown, ChevronRight, Package, Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppData, type FinancialTransaction } from "@/context/AppDataContext";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Tooltip } from "recharts";
import { Separator } from "@/components/ui/separator";
import GenerateInvoiceTab from "@/components/finance/GenerateInvoiceTab";
import { toast as sonnerToast } from "sonner";
import * as XLSX from "xlsx";

// ── Status configs ───────────────────────────────────────────────
const paymentStatusConfig: Record<string, { class: string }> = {
  Paid: { class: "status-success" },
  Pending: { class: "status-warning" },
  Partial: { class: "status-info" },
  Overdue: { class: "status-error" },
};

const siteStatusConfig: Record<string, { class: string }> = {
  "On Track": { class: "status-success" },
  Paid: { class: "status-success" },
  Partial: { class: "status-warning" },
  Overdue: { class: "status-error" },
};

const chartConfig = {
  billed: { label: "Billed", color: "hsl(var(--primary))" },
  collected: { label: "Collected", color: "hsl(var(--status-success))" },
  netCash: { label: "Net Cash Flow", color: "hsl(var(--accent))" },
};

const formatCurrency = (amount: number | null | undefined) => {
  const val = amount ?? 0;
  return val >= 10000000
    ? `₹${(val / 10000000).toFixed(2)}Cr`
    : val >= 100000
    ? `₹${(val / 100000).toFixed(1)}L`
    : `₹${val.toLocaleString()}`;
};

export default function Finance() {
  const { toast } = useToast();
  const { data: appData } = useAppData();
  const [showCreateInvoiceDialog, setShowCreateInvoiceDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [txSearch, setTxSearch] = useState("");
  const [txStatusFilter, setTxStatusFilter] = useState("all");
  const [txDirectionFilter, setTxDirectionFilter] = useState("all");
  const [siteSearch, setSiteSearch] = useState("");

  // ── KPI calculations from live data ──────────────────────────────────
  const liveFinance = appData?.finance;
  const liveTx = appData?.financialTransactions || [];
  const inboundTx = liveTx.filter(t => t.direction === "INBOUND");
  const outboundTx = liveTx.filter(t => t.direction === "OUTBOUND");
  
  const totalBilled = inboundTx.reduce((s, t) => s + (t.amount ?? 0), 0);
  const totalCollected = inboundTx.filter(t => t.paymentStatus === "Paid").reduce((s, t) => s + (t.amount ?? 0), 0);
  const clientOutstanding = totalBilled - totalCollected;
  const overdueAmount = inboundTx.filter(t => t.paymentStatus === "Overdue").reduce((s, t) => s + (t.amount ?? 0), 0);
  const overdueCount = inboundTx.filter(t => t.paymentStatus === "Overdue").length;
  const totalOutboundPaid = outboundTx.filter(t => t.paymentStatus === "Paid").reduce((s, t) => s + (t.amount ?? 0), 0);
  const netCashPosition = totalCollected - totalOutboundPaid;
  const thisMonthRevenue = liveFinance?.monthlyRevenue ?? 0;

  // ── Derive chart data from transactions ───────────────────────────────
  const monthlyTrend = useMemo(() => {
    const monthMap: Record<string, { billed: number; collected: number; netCash: number }> = {};
    liveTx.forEach(t => {
      if (!t.date) return;
      const d = new Date(t.date);
      const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      if (!monthMap[key]) monthMap[key] = { billed: 0, collected: 0, netCash: 0 };
      if (t.direction === 'INBOUND') {
        monthMap[key].billed += (t.amount ?? 0);
        if (t.paymentStatus === 'Paid') monthMap[key].collected += (t.amount ?? 0);
      }
      monthMap[key].netCash = monthMap[key].collected - (t.direction === 'OUTBOUND' && t.paymentStatus === 'Paid' ? (t.amount ?? 0) : 0);
    });
    return Object.entries(monthMap).map(([month, data]) => ({ month, ...data }));
  }, [liveTx]);

  // ── Site financials derived from transactions ────────────────────────
  const siteFinancials = useMemo(() => {
    const siteMap: Record<string, { siteCode: string; siteName: string; totalBilled: number; collected: number; outstanding: number; status: string }> = {};
    inboundTx.forEach(t => {
      const key = t.siteCode || t.siteName || 'Unknown';
      if (!siteMap[key]) siteMap[key] = { siteCode: t.siteCode || '', siteName: t.siteName || '', totalBilled: 0, collected: 0, outstanding: 0, status: 'On Track' };
      siteMap[key].totalBilled += (t.amount ?? 0);
      if (t.paymentStatus === 'Paid') siteMap[key].collected += (t.amount ?? 0);
    });
    return Object.values(siteMap).map(s => {
      s.outstanding = s.totalBilled - s.collected;
      s.status = s.outstanding === 0 ? 'Paid' : s.outstanding > s.totalBilled * 0.5 ? 'Overdue' : 'Partial';
      return s;
    });
  }, [inboundTx]);

  // ── Overdue ageing ───────────────────────────────────────────────────
  const overdueAgeing = useMemo(() => {
    const buckets = [
      { bucket: "1–30 days", amount: 0, count: 0, color: "hsl(var(--status-warning))" },
      { bucket: "31–60 days", amount: 0, count: 0, color: "hsl(38, 70%, 45%)" },
      { bucket: "61–90 days", amount: 0, count: 0, color: "hsl(var(--status-error))" },
      { bucket: "90+ days", amount: 0, count: 0, color: "hsl(0, 50%, 40%)" },
    ];
    inboundTx.filter(t => (t.daysOverdue ?? 0) > 0).forEach(t => {
      const idx = t.daysOverdue <= 30 ? 0 : t.daysOverdue <= 60 ? 1 : t.daysOverdue <= 90 ? 2 : 3;
      buckets[idx].amount += (t.amount ?? 0);
      buckets[idx].count += 1;
    });
    return buckets;
  }, [inboundTx]);

  const overdueDetails = useMemo(() => {
    return inboundTx.filter(t => (t.daysOverdue ?? 0) > 0).map(t => ({
      invoiceRef: t.invoiceRef || '',
      site: `${t.siteCode || ''} – ${t.siteName || ''}`,
      client: t.siteName || '',
      amount: t.amount ?? 0,
      dueDate: t.date || '',
      daysOverdue: t.daysOverdue ?? 0,
      bucket: t.daysOverdue <= 30 ? '1–30 days' : t.daysOverdue <= 60 ? '31–60 days' : t.daysOverdue <= 90 ? '61–90 days' : '90+ days',
    }));
  }, [inboundTx]);

  // ── GST data derived from transactions ────────────────────────────────
  const gstMonthly = useMemo(() => {
    const gstMap: Record<string, { cgstCollected: number; sgstCollected: number; cgstPaid: number; sgstPaid: number }> = {};
    liveTx.forEach(t => {
      if (!t.date) return;
      const d = new Date(t.date);
      const key = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      if (!gstMap[key]) gstMap[key] = { cgstCollected: 0, sgstCollected: 0, cgstPaid: 0, sgstPaid: 0 };
      if (t.direction === 'INBOUND') {
        gstMap[key].cgstCollected += (t.cgst ?? 0);
        gstMap[key].sgstCollected += (t.sgst ?? 0);
      } else {
        gstMap[key].cgstPaid += (t.cgst ?? 0);
        gstMap[key].sgstPaid += (t.sgst ?? 0);
      }
    });
    return Object.entries(gstMap).map(([month, data]) => ({ month, ...data }));
  }, [liveTx]);

  // ── Transaction source (always live) ─────────────────────────────────
  const txSource = liveTx.map(t => ({
    id: t.id,
    direction: t.direction,
    type: t.type,
    invoiceRef: t.invoiceRef || "",
    siteCode: t.siteCode || "",
    siteName: t.siteName || "",
    amount: t.amount ?? 0,
    cgst: t.cgst ?? 0,
    sgst: t.sgst ?? 0,
    totalWithGst: t.totalWithGst ?? 0,
    paymentStatus: t.paymentStatus,
    daysOverdue: t.daysOverdue,
    pdfUrl: t.pdfUrl,
    date: t.date,
  }));

  const filteredTx = useMemo(() => {
    return txSource.filter((t) => {
      const matchSearch =
        t.invoiceRef.toLowerCase().includes(txSearch.toLowerCase()) ||
        t.siteName.toLowerCase().includes(txSearch.toLowerCase()) ||
        t.type.toLowerCase().includes(txSearch.toLowerCase());
      const matchStatus = txStatusFilter === "all" || t.paymentStatus === txStatusFilter;
      const matchDir = txDirectionFilter === "all" || t.direction === txDirectionFilter;
      return matchSearch && matchStatus && matchDir;
    });
  }, [txSearch, txStatusFilter, txDirectionFilter, txSource]);

  // ── Filtered site financials ──────────────────────────────────
  const filteredSites = useMemo(() => {
    return siteFinancials.filter(
      (s) =>
        s.siteCode.toLowerCase().includes(siteSearch.toLowerCase()) ||
        s.siteName.toLowerCase().includes(siteSearch.toLowerCase())
    );
  }, [siteSearch, siteFinancials]);

  // ── Materials cost data ────────────────────────────────────────
  const filteredMaterials: any[] = [];
  const materialTotals: Record<string, number> = {};

  // Materials summary state
  interface MaterialItem {
    material: string;
    totalQty: number;
    totalCost: number;
    totalSell: number;
    unitPrice: number;
    sellPrice: number;
    usageCount: number;
  }
  interface SiteDetail {
    siteId: number;
    siteCode: string;
    totalCost: number;
    totalSell: number;
    margin: number;
  }
  interface SubprojectMaterialSummary {
    subprojectId: number;
    subprojectName: string;
    projectName: string | null;
    totalSitesWithMaterials: number;
    grandTotalCost: number;
    grandTotalSell: number;
    grandMargin: number;
    materials: MaterialItem[];
    siteDetails: SiteDetail[];
  }
  const [materialsSummary, setMaterialsSummary] = useState<SubprojectMaterialSummary[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [expandedSubprojects, setExpandedSubprojects] = useState<Set<number>>(new Set());

  const fetchMaterialsSummary = useCallback(async () => {
    setMaterialsLoading(true);
    try {
      const res = await fetch("/api/finance/materials-summary");
      if (res.ok) {
        const data = await res.json();
        setMaterialsSummary(data);
      }
    } catch { /* ignore */ } finally { setMaterialsLoading(false); }
  }, []);

  useEffect(() => { fetchMaterialsSummary(); }, [fetchMaterialsSummary]);

  const toggleSubproject = (id: number) => {
    setExpandedSubprojects(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const downloadMaterialsSummary = () => {
    if (!materialsSummary.length) return;
    const rows: Record<string, unknown>[] = [];
    for (const sp of materialsSummary) {
      for (const mat of sp.materials) {
        rows.push({
          "Subproject": sp.subprojectName,
          "Project": sp.projectName ?? "",
          "Material": mat.material.replace(/_/g, " "),
          "Sites Used": mat.usageCount,
          "Total Qty": Math.round(mat.totalQty),
          "Unit Cost (₹)": mat.unitPrice,
          "Unit Sell (₹)": mat.sellPrice || "",
          "Total Cost (₹)": mat.totalCost,
          "Total Sell (₹)": mat.totalSell || "",
          "Margin (₹)": mat.totalSell > 0 ? mat.totalSell - mat.totalCost : "",
        });
      }
      rows.push({
        "Subproject": sp.subprojectName,
        "Project": sp.projectName ?? "",
        "Material": "── TOTAL ──",
        "Sites Used": sp.totalSitesWithMaterials,
        "Total Qty": "",
        "Unit Cost (₹)": "",
        "Unit Sell (₹)": "",
        "Total Cost (₹)": sp.grandTotalCost,
        "Total Sell (₹)": sp.grandTotalSell || "",
        "Margin (₹)": sp.grandTotalSell > 0 ? sp.grandMargin : "",
      });
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Object.keys(rows[0] || {}).map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Materials Summary");
    XLSX.writeFile(wb, `Materials_Summary_${new Date().toISOString().slice(0, 10)}.xlsx`);
    sonnerToast.success("Materials summary exported");
  };

  const handleExport = () => {
    const txns = appData?.financialTransactions ?? [];
    if (!txns.length) { sonnerToast.warning("No financial data to export"); return; }
    const rows = txns.map((t: FinancialTransaction) => ({
      "Direction": t.direction ?? "",
      "Type": t.type ?? "",
      "Invoice Ref": t.invoiceRef ?? "",
      "Site Code": t.siteCode ?? "",
      "Site Name": t.siteName ?? "",
      "Amount": t.amount ?? 0,
      "CGST": t.cgst ?? 0,
      "SGST": t.sgst ?? 0,
      "Total With GST": t.totalWithGst ?? 0,
      "Payment Status": t.paymentStatus ?? "",
      "Days Overdue": t.daysOverdue ?? 0,
      "Date": t.date ?? "",
      "PDF URL": t.pdfUrl ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = rows.length ? Object.keys(rows[0]).map(() => ({ wch: 18 })) : [];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Financial Transactions");
    XLSX.writeFile(wb, `Finance_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    sonnerToast.success(`Exported ${rows.length} transactions`);
  };
  const handleImport = () => setShowImportDialog(true);
  const handleCsvExport = (name: string) => {
    // Re-use the main export with a sheet named after the report
    handleExport();
  };

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Finance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Revenue, billing, collections & GST tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="default" onClick={handleImport}>
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button variant="outline" size="default" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button size="default" onClick={() => setShowCreateInvoiceDialog(true)}>
            <Plus className="w-4 h-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-secondary/50 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="site-financials">Site Financials</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="overdue">Overdue & Ageing</TabsTrigger>
          <TabsTrigger value="materials">Materials Cost</TabsTrigger>
          <TabsTrigger value="gst">GST Report</TabsTrigger>
          <TabsTrigger value="generate-invoice">Generate Invoice</TabsTrigger>
        </TabsList>

        {/* ═══════════════ TAB 1: OVERVIEW ═══════════════ */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <KpiCard icon={IndianRupee} iconColor="text-primary" label="Total Billed" sublabel="INBOUND" value={formatCurrency(totalBilled)} />
            <KpiCard icon={CheckCircle2} iconColor="text-[hsl(var(--status-success))]" label="Total Collected" value={formatCurrency(totalCollected)} trend={totalBilled > 0 ? `${Math.round((totalCollected / totalBilled) * 100)}% of billed` : "—"} />
            <KpiCard icon={Clock} iconColor="text-[hsl(var(--status-warning))]" label="Client Outstanding" value={formatCurrency(clientOutstanding)} valueColor="text-[hsl(var(--status-warning))]" />
            <KpiCard icon={AlertTriangle} iconColor="text-[hsl(var(--status-error))]" label="Overdue Amount" value={formatCurrency(overdueAmount)} valueColor="text-[hsl(var(--status-error))]" badge={`${overdueCount}`} />
            <KpiCard icon={Wallet} iconColor="text-accent" label="Net Cash Position" value={formatCurrency(netCashPosition)} trend="collected − outbound" />
            <KpiCard icon={TrendingUp} iconColor="text-[hsl(var(--status-success))]" label="This Month Revenue" value={formatCurrency(thisMonthRevenue)} trendUp="+8.2% vs last month" />
          </div>

          {/* Billed vs Collected Chart */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Monthly Billed vs Collected</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <ComposedChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis yAxisId="left" tickFormatter={(v: number) => `₹${(v / 100000).toFixed(0)}L`} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v: number) => `₹${(v / 100000).toFixed(0)}L`} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="billed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={28} name="Billed" />
                  <Bar yAxisId="left" dataKey="collected" fill="hsl(var(--status-success))" radius={[4, 4, 0, 0]} barSize={28} name="Collected" />
                  <Line yAxisId="right" type="monotone" dataKey="netCash" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 4 }} name="Net Cash Flow" />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════ TAB 2: SITE FINANCIALS ═══════════════ */}
        <TabsContent value="site-financials" className="space-y-4">
          <div className="flex gap-2 items-center">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search sites..." value={siteSearch} onChange={(e) => setSiteSearch(e.target.value)} className="pl-10" />
            </div>
          </div>
          <Card className="border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead>Site</TableHead>
                  <TableHead className="text-right">Total Billed</TableHead>
                  <TableHead className="text-right">Collected</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSites.length > 0 ? filteredSites.map((s, i) => (
                  <TableRow key={i} className="hover:bg-muted/50 border-border/50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{s.siteCode || s.siteName}</p>
                        <p className="text-xs text-muted-foreground">{s.siteName}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(s.totalBilled)}</TableCell>
                    <TableCell className="text-right text-[hsl(var(--status-success))]">{formatCurrency(s.collected)}</TableCell>
                    <TableCell className={`text-right font-medium ${s.outstanding > 0 ? "text-[hsl(var(--status-warning))]" : ""}`}>
                      {formatCurrency(s.outstanding)}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${siteStatusConfig[s.status]?.class || "status-neutral"} border-0`}>{s.status}</Badge>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No site financial data available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ═══════════════ TAB 3: TRANSACTIONS ═══════════════ */}
        <TabsContent value="transactions" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search transactions..." value={txSearch} onChange={(e) => setTxSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={txDirectionFilter} onValueChange={setTxDirectionFilter}>
              <SelectTrigger className="w-[130px] bg-secondary/50"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="INBOUND">Inbound</SelectItem>
                <SelectItem value="OUTBOUND">Outbound</SelectItem>
              </SelectContent>
            </Select>
            <Select value={txStatusFilter} onValueChange={setTxStatusFilter}>
              <SelectTrigger className="w-[130px] bg-secondary/50"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead>Direction</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Invoice Ref</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">CGST</TableHead>
                  <TableHead className="text-right">SGST</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Days O/D</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTx.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/50 border-border/50">
                    <TableCell>
                      <Badge className={`border-0 text-[10px] ${t.direction === "INBOUND" ? "status-success" : "status-error"}`}>
                        {t.direction === "INBOUND" ? "↓ IN" : "↑ OUT"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{t.type}</TableCell>
                    <TableCell className="text-muted-foreground text-xs font-mono">{t.invoiceRef}</TableCell>
                    <TableCell>
                      <span className="text-xs">{t.siteCode}</span>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(t.amount)}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{formatCurrency(t.cgst)}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{formatCurrency(t.sgst)}</TableCell>
                    <TableCell>
                      <Badge className={`${paymentStatusConfig[t.paymentStatus]?.class || "status-neutral"} border-0`}>{t.paymentStatus}</Badge>
                    </TableCell>
                    <TableCell className={`text-right text-xs ${t.daysOverdue > 0 ? "text-[hsl(var(--status-error))] font-medium" : "text-muted-foreground"}`}>
                      {t.daysOverdue > 0 ? t.daysOverdue : "—"}
                    </TableCell>
                    <TableCell>
                      {t.pdfUrl && (
                        <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-primary" onClick={() => toast({ title: "Download", description: `Opening ${t.invoiceRef}.pdf` })}>
                          <FileText className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ═══════════════ TAB 4: OVERDUE & AGEING ═══════════════ */}
        <TabsContent value="overdue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Donut Chart */}
            <Card className="border-border/60 lg:col-span-1">
              <CardHeader className="pb-2"><CardTitle className="text-base">Ageing Buckets</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="w-56 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overdueAgeing.filter((b) => b.amount > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="amount"
                        nameKey="bucket"
                      >
                        {overdueAgeing.filter((b) => b.amount > 0).map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4 w-full">
                  {overdueAgeing.map((b) => (
                    <div key={b.bucket} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: b.color }} />
                      <div>
                        <p className="font-medium">{b.bucket}</p>
                        <p className="text-muted-foreground">{formatCurrency(b.amount)} ({b.count})</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Detail Table */}
            <Card className="border-border/60 lg:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-base">Overdue Invoices</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border">
                      <TableHead>Invoice</TableHead>
                      <TableHead>Site</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Days O/D</TableHead>
                      <TableHead>Bucket</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueDetails.sort((a, b) => b.daysOverdue - a.daysOverdue).map((d) => (
                      <TableRow key={d.invoiceRef} className="hover:bg-muted/50 border-border/50">
                        <TableCell className="font-mono text-xs">{d.invoiceRef}</TableCell>
                        <TableCell className="text-xs">{d.site}</TableCell>
                        <TableCell>{d.client}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(d.amount)}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{d.dueDate}</TableCell>
                        <TableCell className="text-right text-[hsl(var(--status-error))] font-medium">{d.daysOverdue}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{d.bucket}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══════════════ TAB 5: MATERIALS COST ═══════════════ */}
        <TabsContent value="materials" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Subproject-wise extra material usage — cost price vs sell price charged to client</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadMaterialsSummary} disabled={materialsLoading || !materialsSummary.length}>
                <Download className="w-4 h-4 mr-1" />
                Download Summary
              </Button>
              <Button variant="outline" size="sm" onClick={fetchMaterialsSummary} disabled={materialsLoading}>
                {materialsLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ArrowUpRight className="w-4 h-4 mr-1" />}
                Refresh
              </Button>
            </div>
          </div>

          {materialsLoading ? (
            <Card className="border-border/60">
              <CardContent className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : materialsSummary.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Package className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Materials Data</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Upload extra material per site data for subprojects to see cost and sell price breakdowns here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Grand totals across all subprojects */}
              {materialsSummary.length > 1 && (() => {
                const allCost = materialsSummary.reduce((s, sp) => s + sp.grandTotalCost, 0);
                const allSell = materialsSummary.reduce((s, sp) => s + sp.grandTotalSell, 0);
                const allMargin = allSell - allCost;
                return (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard icon={Package} iconColor="text-primary" label="Total Cost (All)" value={formatCurrency(allCost)} />
                    <KpiCard icon={IndianRupee} iconColor="text-[hsl(var(--status-success))]" label="Total Sell (All)" value={formatCurrency(allSell)} />
                    <KpiCard icon={TrendingUp} iconColor={allMargin >= 0 ? "text-[hsl(var(--status-success))]" : "text-[hsl(var(--status-error))]"} label="Margin (All)" value={formatCurrency(allMargin)} valueColor={allMargin >= 0 ? "text-[hsl(var(--status-success))]" : "text-[hsl(var(--status-error))]"} />
                    <KpiCard icon={FileText} iconColor="text-muted-foreground" label="Subprojects" value={String(materialsSummary.length)} />
                  </div>
                );
              })()}

              {/* Per-subproject cards */}
              <div className="space-y-4">
                {materialsSummary.map(sp => {
                  const expanded = expandedSubprojects.has(sp.subprojectId);
                  return (
                    <Card key={sp.subprojectId} className="border-border/60">
                      <CardHeader
                        className="cursor-pointer hover:bg-muted/30 transition-colors pb-3"
                        onClick={() => toggleSubproject(sp.subprojectId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {expanded ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                            <div>
                              <CardTitle className="text-base">{sp.subprojectName}</CardTitle>
                              {sp.projectName && <p className="text-xs text-muted-foreground mt-0.5">{sp.projectName}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="text-right">
                              <span className="text-muted-foreground">Cost: </span>
                              <span className="font-semibold">{formatCurrency(sp.grandTotalCost)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-muted-foreground">Sell: </span>
                              <span className="font-semibold text-[hsl(var(--status-success))]">{formatCurrency(sp.grandTotalSell)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-muted-foreground">Margin: </span>
                              <span className={`font-semibold ${sp.grandMargin >= 0 ? "text-[hsl(var(--status-success))]" : "text-[hsl(var(--status-error))]"}`}>
                                {formatCurrency(sp.grandMargin)}
                              </span>
                            </div>
                            <Badge variant="outline">{sp.totalSitesWithMaterials} sites</Badge>
                          </div>
                        </div>
                      </CardHeader>

                      {expanded && (
                        <CardContent className="pt-0">
                          {/* Column explanations */}
                          <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-2.5 mb-3 space-y-0.5">
                            <p><span className="font-medium text-foreground">Sites Used</span> — number of installation sites where this material was consumed</p>
                            <p><span className="font-medium text-foreground">Total Qty</span> — total quantity across all sites (meters for pipes/wires, units for items)</p>
                            <p><span className="font-medium text-foreground">Unit Cost / Sell</span> — per-unit price we pay (cost) vs charge client (sell)</p>
                            <p><span className="font-medium text-foreground">Margin</span> — profit = Total Sell − Total Cost</p>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow className="hover:bg-transparent border-border">
                                <TableHead>Material</TableHead>
                                <TableHead className="text-right">Sites Used</TableHead>
                                <TableHead className="text-right">Total Qty</TableHead>
                                <TableHead className="text-right">Unit Cost</TableHead>
                                <TableHead className="text-right">Unit Sell</TableHead>
                                <TableHead className="text-right">Total Cost</TableHead>
                                <TableHead className="text-right">Total Sell</TableHead>
                                <TableHead className="text-right">Margin</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sp.materials.map((mat) => {
                                const margin = mat.totalSell - mat.totalCost;
                                return (
                                  <TableRow key={mat.material} className="hover:bg-muted/50 border-border/50">
                                    <TableCell className="font-medium capitalize">{mat.material.replace(/_/g, " ")}</TableCell>
                                    <TableCell className="text-right">{mat.usageCount}</TableCell>
                                    <TableCell className="text-right">{Math.round(mat.totalQty)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(mat.unitPrice)}</TableCell>
                                    <TableCell className="text-right">
                                      {mat.sellPrice > 0 ? formatCurrency(mat.sellPrice) : <span className="text-muted-foreground">—</span>}
                                    </TableCell>
                                    <TableCell className="text-right">{formatCurrency(mat.totalCost)}</TableCell>
                                    <TableCell className="text-right text-[hsl(var(--status-success))]">
                                      {mat.totalSell > 0 ? formatCurrency(mat.totalSell) : <span className="text-muted-foreground">—</span>}
                                    </TableCell>
                                    <TableCell className={`text-right font-medium ${margin >= 0 ? "text-[hsl(var(--status-success))]" : "text-[hsl(var(--status-error))]"}`}>
                                      {mat.totalSell > 0 ? formatCurrency(margin) : <span className="text-muted-foreground">—</span>}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                              {/* Totals row */}
                              <TableRow className="bg-muted/30 font-semibold border-t-2">
                                <TableCell>Total</TableCell>
                                <TableCell className="text-right">{sp.totalSitesWithMaterials}</TableCell>
                                <TableCell className="text-right">{Math.round(sp.materials.reduce((s, m) => s + Number(m.totalQty), 0))}</TableCell>
                                <TableCell />
                                <TableCell />
                                <TableCell className="text-right">{formatCurrency(sp.grandTotalCost)}</TableCell>
                                <TableCell className="text-right text-[hsl(var(--status-success))]">
                                  {sp.grandTotalSell > 0 ? formatCurrency(sp.grandTotalSell) : "—"}
                                </TableCell>
                                <TableCell className={`text-right ${sp.grandMargin >= 0 ? "text-[hsl(var(--status-success))]" : "text-[hsl(var(--status-error))]"}`}>
                                  {sp.grandTotalSell > 0 ? formatCurrency(sp.grandMargin) : "—"}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>

        {/* ═══════════════ TAB 6: GST REPORT ═══════════════ */}
        <TabsContent value="gst" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Monthly GST summary for filing</p>
            <Button variant="outline" size="sm" onClick={() => handleCsvExport("gst-report")}>
              <Download className="w-4 h-4 mr-1" />
              Export CSV
            </Button>
          </div>
          <Card className="border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">CGST Collected</TableHead>
                  <TableHead className="text-right">SGST Collected</TableHead>
                  <TableHead className="text-right">CGST Paid (Out)</TableHead>
                  <TableHead className="text-right">SGST Paid (Out)</TableHead>
                  <TableHead className="text-right">Net GST Liability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gstMonthly.map((g) => {
                  const netLiability = (g.cgstCollected + g.sgstCollected) - (g.cgstPaid + g.sgstPaid);
                  return (
                    <TableRow key={g.month} className="hover:bg-muted/50 border-border/50">
                      <TableCell className="font-medium">{g.month}</TableCell>
                      <TableCell className="text-right text-[hsl(var(--status-success))]">{formatCurrency(g.cgstCollected)}</TableCell>
                      <TableCell className="text-right text-[hsl(var(--status-success))]">{formatCurrency(g.sgstCollected)}</TableCell>
                      <TableCell className="text-right text-[hsl(var(--status-error))]">{formatCurrency(g.cgstPaid)}</TableCell>
                      <TableCell className="text-right text-[hsl(var(--status-error))]">{formatCurrency(g.sgstPaid)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(netLiability)}</TableCell>
                    </TableRow>
                  );
                })}
                {/* Total row */}
                {(() => {
                  const totals = gstMonthly.reduce(
                    (acc, g) => ({
                      cgstC: acc.cgstC + g.cgstCollected,
                      sgstC: acc.sgstC + g.sgstCollected,
                      cgstP: acc.cgstP + g.cgstPaid,
                      sgstP: acc.sgstP + g.sgstPaid,
                    }),
                    { cgstC: 0, sgstC: 0, cgstP: 0, sgstP: 0 }
                  );
                  return (
                    <TableRow className="bg-muted/30 border-border font-semibold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.cgstC)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.sgstC)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.cgstP)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totals.sgstP)}</TableCell>
                      <TableCell className="text-right">{formatCurrency((totals.cgstC + totals.sgstC) - (totals.cgstP + totals.sgstP))}</TableCell>
                    </TableRow>
                  );
                })()}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        {/* ═══════════════ TAB 7: GENERATE INVOICE ═══════════════ */}
        <TabsContent value="generate-invoice">
          <GenerateInvoiceTab />
        </TabsContent>
      </Tabs>

      <CreateInvoiceDialog open={showCreateInvoiceDialog} onOpenChange={setShowCreateInvoiceDialog} />
      <FinancialImportDialog open={showImportDialog} onOpenChange={setShowImportDialog} />
    </div>
  );
}

// ── KPI Card Component ──────────────────────────────────────────
function KpiCard({
  icon: Icon,
  iconColor,
  label,
  sublabel,
  value,
  valueColor,
  trend,
  trendUp,
  badge,
}: {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  sublabel?: string;
  value: string;
  valueColor?: string;
  trend?: string;
  trendUp?: string;
  badge?: string;
}) {
  return (
    <Card className="data-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <p className="metric-label">{label}</p>
            {sublabel && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-normal">{sublabel}</Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {badge && (
              <Badge className="status-error border-0 text-[10px] px-1.5 h-5">{badge}</Badge>
            )}
            <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center">
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
          </div>
        </div>
        <p className={`metric-value text-xl ${valueColor || ""}`}>{value}</p>
        {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
        {trendUp && (
          <div className="flex items-center gap-1 mt-1 text-xs text-[hsl(var(--status-success))]">
            <ArrowUpRight className="w-3 h-3" />
            <span>{trendUp}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
