import { useState, useMemo } from "react";
import { CreateInvoiceDialog } from "@/components/forms/CreateInvoiceDialog";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/context/AppDataContext";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Tooltip } from "recharts";
import { Separator } from "@/components/ui/separator";
import GenerateInvoiceTab from "@/components/finance/GenerateInvoiceTab";

// ── Mock data aligned to DB schema ──────────────────────────────

const monthlyTrend = [
  { month: "Sep", billed: 4200000, collected: 3900000, netCash: 2650000 },
  { month: "Oct", billed: 4600000, collected: 4100000, netCash: 2800000 },
  { month: "Nov", billed: 5100000, collected: 4500000, netCash: 3100000 },
  { month: "Dec", billed: 5300000, collected: 4700000, netCash: 3200000 },
  { month: "Jan", billed: 5530000, collected: 4979000, netCash: 3500000 },
  { month: "Feb", billed: 5800000, collected: 5200000, netCash: 3700000 },
];

const siteFinancials = [
  { siteId: 1, siteCode: "MUM-001", siteName: "Andheri East Branch", installationBilled: 85000, extraMaterialsBilled: 12000, rentBilled: 180000, totalBilled: 277000, collected: 250000, outstanding: 27000, maintenanceIncluded: true, status: "On Track" },
  { siteId: 2, siteCode: "MUM-002", siteName: "BKC Tower 3", installationBilled: 120000, extraMaterialsBilled: 25000, rentBilled: 320000, totalBilled: 465000, collected: 465000, outstanding: 0, maintenanceIncluded: false, status: "Paid" },
  { siteId: 3, siteCode: "DEL-001", siteName: "Connaught Place", installationBilled: 95000, extraMaterialsBilled: 0, rentBilled: 240000, totalBilled: 335000, collected: 200000, outstanding: 135000, maintenanceIncluded: true, status: "Overdue" },
  { siteId: 4, siteCode: "DEL-002", siteName: "Nehru Place Block B", installationBilled: 110000, extraMaterialsBilled: 18000, rentBilled: 280000, totalBilled: 408000, collected: 350000, outstanding: 58000, maintenanceIncluded: false, status: "Partial" },
  { siteId: 5, siteCode: "BLR-001", siteName: "Whitefield IT Park", installationBilled: 75000, extraMaterialsBilled: 0, rentBilled: 200000, totalBilled: 275000, collected: 275000, outstanding: 0, maintenanceIncluded: true, status: "Paid" },
];

const transactions = [
  { id: 1, direction: "INBOUND", type: "Rent", invoiceRef: "INV-2025-0012", siteCode: "MUM-001", siteName: "Andheri East", amount: 180000, cgst: 16200, sgst: 16200, totalWithGst: 212400, paymentStatus: "Paid", daysOverdue: 0, pdfUrl: "/invoices/INV-2025-0012.pdf", date: "2025-02-01" },
  { id: 2, direction: "INBOUND", type: "Installation", invoiceRef: "INV-2025-0013", siteCode: "DEL-001", siteName: "Connaught Place", amount: 95000, cgst: 8550, sgst: 8550, totalWithGst: 112100, paymentStatus: "Overdue", daysOverdue: 42, pdfUrl: null, date: "2025-01-10" },
  { id: 3, direction: "OUTBOUND", type: "Vendor Payment", invoiceRef: "VND-2025-0045", siteCode: "MUM-002", siteName: "BKC Tower 3", amount: 65000, cgst: 5850, sgst: 5850, totalWithGst: 76700, paymentStatus: "Paid", daysOverdue: 0, pdfUrl: "/invoices/VND-2025-0045.pdf", date: "2025-02-05" },
  { id: 4, direction: "INBOUND", type: "Rent", invoiceRef: "INV-2025-0014", siteCode: "BLR-001", siteName: "Whitefield IT Park", amount: 200000, cgst: 18000, sgst: 18000, totalWithGst: 236000, paymentStatus: "Pending", daysOverdue: 0, pdfUrl: "/invoices/INV-2025-0014.pdf", date: "2025-02-10" },
  { id: 5, direction: "OUTBOUND", type: "Equipment Purchase", invoiceRef: "PO-2025-0088", siteCode: "DEL-002", siteName: "Nehru Place", amount: 580000, cgst: 52200, sgst: 52200, totalWithGst: 684400, paymentStatus: "Pending", daysOverdue: 0, pdfUrl: null, date: "2025-02-08" },
  { id: 6, direction: "INBOUND", type: "Extra Materials", invoiceRef: "INV-2025-0015", siteCode: "DEL-002", siteName: "Nehru Place", amount: 18000, cgst: 1620, sgst: 1620, totalWithGst: 21240, paymentStatus: "Partial", daysOverdue: 5, pdfUrl: "/invoices/INV-2025-0015.pdf", date: "2025-01-28" },
  { id: 7, direction: "OUTBOUND", type: "Logistics", invoiceRef: "LOG-2025-0033", siteCode: "MUM-001", siteName: "Andheri East", amount: 35000, cgst: 3150, sgst: 3150, totalWithGst: 41300, paymentStatus: "Paid", daysOverdue: 0, pdfUrl: null, date: "2025-02-12" },
];

const overdueAgeing = [
  { bucket: "1–30 days", amount: 58000, count: 2, color: "hsl(var(--status-warning))" },
  { bucket: "31–60 days", amount: 95000, count: 1, color: "hsl(38, 70%, 45%)" },
  { bucket: "61–90 days", amount: 40000, count: 1, color: "hsl(var(--status-error))" },
  { bucket: "90+ days", amount: 0, count: 0, color: "hsl(0, 50%, 40%)" },
];

const overdueDetails = [
  { invoiceRef: "INV-2025-0013", site: "DEL-001 – Connaught Place", client: "DLF Commercial", amount: 95000, dueDate: "2025-01-10", daysOverdue: 42, bucket: "31–60 days" },
  { invoiceRef: "INV-2025-0015", site: "DEL-002 – Nehru Place", client: "Prestige Estates", amount: 18000, dueDate: "2025-02-19", daysOverdue: 5, bucket: "1–30 days" },
  { invoiceRef: "INV-2024-0148", site: "MUM-003 – Powai", client: "Metro Properties", amount: 40000, dueDate: "2024-12-15", daysOverdue: 71, bucket: "61–90 days" },
];

const materialsCost = [
  { siteCode: "MUM-001", siteName: "Andheri East", material: "Copper Piping 1/4\"", qty: 30, unit: "ft", unitCost: 120, total: 3600, billed: true, maintenanceIncluded: true },
  { siteCode: "MUM-001", siteName: "Andheri East", material: "Drain Pipe 3/4\"", qty: 20, unit: "ft", unitCost: 85, total: 1700, billed: true, maintenanceIncluded: true },
  { siteCode: "DEL-002", siteName: "Nehru Place Block B", material: "Wall Bracket (Heavy)", qty: 4, unit: "pcs", unitCost: 1500, total: 6000, billed: true, maintenanceIncluded: false },
  { siteCode: "DEL-002", siteName: "Nehru Place Block B", material: "Electrical Wiring 2.5mm", qty: 50, unit: "m", unitCost: 45, total: 2250, billed: false, maintenanceIncluded: false },
  { siteCode: "BLR-001", siteName: "Whitefield IT Park", material: "Gas Charging R32", qty: 2, unit: "kg", unitCost: 800, total: 1600, billed: false, maintenanceIncluded: true },
  { siteCode: "DEL-001", siteName: "Connaught Place", material: "Stand (Floor)", qty: 2, unit: "pcs", unitCost: 2200, total: 4400, billed: true, maintenanceIncluded: true },
];

const gstMonthly = [
  { month: "Oct 2024", cgstCollected: 45000, sgstCollected: 45000, cgstPaid: 12000, sgstPaid: 12000 },
  { month: "Nov 2024", cgstCollected: 52000, sgstCollected: 52000, cgstPaid: 15000, sgstPaid: 15000 },
  { month: "Dec 2024", cgstCollected: 48000, sgstCollected: 48000, cgstPaid: 18000, sgstPaid: 18000 },
  { month: "Jan 2025", cgstCollected: 55000, sgstCollected: 55000, cgstPaid: 14000, sgstPaid: 14000 },
  { month: "Feb 2025", cgstCollected: 58000, sgstCollected: 58000, cgstPaid: 16500, sgstPaid: 16500 },
];

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

const formatCurrency = (amount: number) =>
  amount >= 10000000
    ? `₹${(amount / 10000000).toFixed(2)}Cr`
    : amount >= 100000
    ? `₹${(amount / 100000).toFixed(1)}L`
    : `₹${amount.toLocaleString()}`;

export default function Finance() {
  const { toast } = useToast();
  const { data: appData } = useAppData();
  const [showCreateInvoiceDialog, setShowCreateInvoiceDialog] = useState(false);
  const [txSearch, setTxSearch] = useState("");
  const [txStatusFilter, setTxStatusFilter] = useState("all");
  const [txDirectionFilter, setTxDirectionFilter] = useState("all");
  const [materialsFilter, setMaterialsFilter] = useState("All");
  const [siteSearch, setSiteSearch] = useState("");

  // ── KPI calculations ──────────────────────────────────────────
  const totalBilled = 5530000;
  const totalCollected = 4979000;
  const clientOutstanding = 551000;
  const overdueAmount = 193000;
  const overdueCount = 3;
  const totalOutboundPaid = 680000;
  const netCashPosition = totalCollected - totalOutboundPaid;
  const thisMonthRevenue = appData?.finance?.monthlyRevenue ?? 5800000;

  // ── Filtered transactions ─────────────────────────────────────
  const filteredTx = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        t.invoiceRef.toLowerCase().includes(txSearch.toLowerCase()) ||
        t.siteName.toLowerCase().includes(txSearch.toLowerCase()) ||
        t.type.toLowerCase().includes(txSearch.toLowerCase());
      const matchStatus = txStatusFilter === "all" || t.paymentStatus === txStatusFilter;
      const matchDir = txDirectionFilter === "all" || t.direction === txDirectionFilter;
      return matchSearch && matchStatus && matchDir;
    });
  }, [txSearch, txStatusFilter, txDirectionFilter]);

  // ── Filtered site financials ──────────────────────────────────
  const filteredSites = useMemo(() => {
    return siteFinancials.filter(
      (s) =>
        s.siteCode.toLowerCase().includes(siteSearch.toLowerCase()) ||
        s.siteName.toLowerCase().includes(siteSearch.toLowerCase())
    );
  }, [siteSearch]);

  // ── Filtered materials ────────────────────────────────────────
  const filteredMaterials = useMemo(() => {
    if (materialsFilter === "Billed") return materialsCost.filter((m) => m.billed);
    if (materialsFilter === "Unbilled") return materialsCost.filter((m) => !m.billed);
    return materialsCost;
  }, [materialsFilter]);

  const materialTotals = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredMaterials.forEach((m) => {
      grouped[m.material] = (grouped[m.material] || 0) + m.total;
    });
    return grouped;
  }, [filteredMaterials]);

  const handleExport = () => toast({ title: "Export started", description: "Downloading finance data..." });
  const handleImport = () => toast({ title: "Import", description: "Upload file to import transactions." });
  const handleCsvExport = (name: string) => toast({ title: "CSV Export", description: `Downloading ${name}.csv` });

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
            <KpiCard icon={CheckCircle2} iconColor="text-[hsl(var(--status-success))]" label="Total Collected" value={formatCurrency(totalCollected)} trend={`${Math.round((totalCollected / totalBilled) * 100)}% of billed`} />
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
                  <TableHead className="text-right">Installation</TableHead>
                  <TableHead className="text-right">Extra Materials</TableHead>
                  <TableHead className="text-right">Rent</TableHead>
                  <TableHead className="text-right">Total Billed</TableHead>
                  <TableHead className="text-right">Collected</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-center">Maint. Incl.</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSites.map((s) => (
                  <TableRow key={s.siteId} className="hover:bg-muted/50 border-border/50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{s.siteCode}</p>
                        <p className="text-xs text-muted-foreground">{s.siteName}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(s.installationBilled)}</TableCell>
                    <TableCell className={`text-right ${s.maintenanceIncluded ? "text-muted-foreground/40" : ""}`}>
                      {s.maintenanceIncluded ? <span className="italic">N/A</span> : formatCurrency(s.extraMaterialsBilled)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(s.rentBilled)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(s.totalBilled)}</TableCell>
                    <TableCell className="text-right text-[hsl(var(--status-success))]">{formatCurrency(s.collected)}</TableCell>
                    <TableCell className={`text-right font-medium ${s.outstanding > 0 ? "text-[hsl(var(--status-warning))]" : ""}`}>
                      {formatCurrency(s.outstanding)}
                    </TableCell>
                    <TableCell className="text-center">
                      {s.maintenanceIncluded ? (
                        <Badge className="status-success border-0 text-[10px]">Yes</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${siteStatusConfig[s.status]?.class || "status-neutral"} border-0`}>{s.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
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
          <div className="flex gap-2 items-center">
            <TabsList className="bg-secondary/50 h-8">
              {["All", "Unbilled", "Billed"].map((f) => (
                <button
                  key={f}
                  onClick={() => setMaterialsFilter(f)}
                  className={`px-3 py-1 text-xs rounded-sm font-medium transition-colors ${materialsFilter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {f}
                </button>
              ))}
            </TabsList>
          </div>

          <Card className="border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead>Site</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Billed?</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.map((m, i) => (
                  <TableRow key={i} className="hover:bg-muted/50 border-border/50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-xs">{m.siteCode}</p>
                        <p className="text-[11px] text-muted-foreground">{m.siteName}</p>
                      </div>
                    </TableCell>
                    <TableCell>{m.material}</TableCell>
                    <TableCell className="text-right">{m.qty}</TableCell>
                    <TableCell className="text-muted-foreground">{m.unit}</TableCell>
                    <TableCell className="text-right">{formatCurrency(m.unitCost)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(m.total)}</TableCell>
                    <TableCell>
                      {m.billed ? (
                        <Badge className="status-success border-0 text-[10px]">Billed</Badge>
                      ) : (
                        <Badge className="status-warning border-0 text-[10px]">Unbilled</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Aggregate footer */}
                <TableRow className="bg-muted/30 border-border font-medium">
                  <TableCell colSpan={5} className="text-right text-xs text-muted-foreground">Aggregate Totals by Material →</TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
                {Object.entries(materialTotals).map(([mat, total]) => (
                  <TableRow key={mat} className="bg-muted/20 border-border/30">
                    <TableCell colSpan={5} className="text-right text-xs">{mat}</TableCell>
                    <TableCell className="text-right font-semibold text-xs">{formatCurrency(total)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Maintenance-excluded banner for sites where maintenance is included */}
          {filteredMaterials.some((m) => m.maintenanceIncluded && !m.billed) && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(var(--status-info)/0.1)] border border-[hsl(var(--status-info)/0.2)]">
              <AlertTriangle className="w-4 h-4 text-[hsl(var(--status-info))] shrink-0" />
              <p className="text-xs text-[hsl(var(--status-info))]">
                Some sites with maintenance-included configurations have unbilled extra materials. No separate invoice was generated for these materials.
              </p>
            </div>
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
