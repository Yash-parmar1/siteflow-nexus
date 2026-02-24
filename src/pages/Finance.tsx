import { useState, useMemo } from "react";
import { CreateInvoiceDialog } from "@/components/forms/CreateInvoiceDialog";
import { ImportFinancialDialog } from "@/components/forms/ImportFinancialDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Search, Download, Plus, TrendingUp, ArrowUpRight, CheckCircle2, Clock, Wallet, MoreHorizontal, Eye, Send, Upload, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/context/AppDataContext";

// Transaction types that are invoices (billed TO client)
const INVOICE_TYPES = ["MONTHLY_RENT_BILL", "EXTRA_MATERIALS", "FINAL_INVOICE"];
// Transaction types that are expenses (costs incurred)
const EXPENSE_TYPES = ["INSTALLATION_INVOICE", "INSTALLATION_MATERIALS", "PAYMENT_RECEIVED", "ADJUSTMENT"];

const statusConfig: Record<string, { color: string; bgColor: string }> = {
  PAID: { color: "text-[hsl(var(--status-success))]", bgColor: "bg-[hsl(var(--status-success)/0.15)]" },
  PENDING: { color: "text-[hsl(var(--status-warning))]", bgColor: "bg-[hsl(var(--status-warning)/0.15)]" },
  PARTIAL: { color: "text-[hsl(var(--status-warning))]", bgColor: "bg-[hsl(var(--status-warning)/0.15)]" },
  OVERDUE: { color: "text-[hsl(var(--status-error))]", bgColor: "bg-[hsl(var(--status-error)/0.15)]" },
  CANCELLED: { color: "text-muted-foreground", bgColor: "bg-muted/50" },
};

function mapPaymentStatus(status: string): string {
  if (!status) return "PENDING";
  return status.toUpperCase();
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
  } catch { return dateStr; }
}

function formatTransactionType(type: string): string {
  const map: Record<string, string> = {
    INSTALLATION_INVOICE: "Installation Invoice",
    INSTALLATION_MATERIALS: "Installation Materials",
    MONTHLY_RENT_BILL: "Monthly Rent",
    EXTRA_MATERIALS: "Extra Materials",
    FINAL_INVOICE: "Final Invoice",
    PAYMENT_RECEIVED: "Payment Received",
    ADJUSTMENT: "Adjustment",
  };
  return map[type] || type?.replace(/_/g, " ") || "Unknown";
}

export default function Finance() {
  const { toast } = useToast();
  const { data: appData } = useAppData();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateInvoiceDialog, setShowCreateInvoiceDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  const transactions = appData?.financialTransactions ?? [];

  // Split transactions into invoices (billed to clients) and expenses
  const invoices = useMemo(() =>
    transactions.filter(t => INVOICE_TYPES.includes(t.transactionType)),
    [transactions]
  );
  const expenses = useMemo(() =>
    transactions.filter(t => EXPENSE_TYPES.includes(t.transactionType)),
    [transactions]
  );

  // Build financial summary from backend data
  const financialSummary = useMemo(() => {
    const finance = appData?.finance;
    if (!finance) return { monthlyRevenue: 0, outstanding: 0, collected: 0, costs: 0, netProfit: 0, profitMargin: 0 };

    const revenue = finance.monthlyRevenue ?? 0;
    const costs = (finance.totalMaintenanceCost ?? 0) + (finance.totalInstallationCost ?? 0);
    const net = finance.netProfit ?? revenue - costs;
    const collected = finance.collected ?? 0;
    const outstanding = finance.outstanding ?? 0;

    return {
      monthlyRevenue: revenue,
      outstanding,
      collected,
      costs,
      netProfit: net,
      profitMargin: revenue > 0 ? Math.round((net / revenue) * 1000) / 10 : 0,
    };
  }, [appData?.finance]);

  const pendingInvoiceCount = invoices.filter(i => mapPaymentStatus(i.paymentStatus) !== "PAID" && mapPaymentStatus(i.paymentStatus) !== "CANCELLED").length;

  const formatCurrency = (amount: number) => amount >= 10000000 ? `₹${(amount / 10000000).toFixed(2)}Cr` : amount >= 100000 ? `₹${(amount / 100000).toFixed(1)}L` : `₹${amount.toLocaleString()}`;

  const filteredInvoices = useMemo(() => invoices.filter((tx) => {
    const status = mapPaymentStatus(tx.paymentStatus);
    const matchesSearch =
      (tx.invoiceNumber || tx.transactionRef || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.siteName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || status === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  }), [invoices, searchQuery, statusFilter]);

  const filteredExpenses = useMemo(() => expenses.filter((tx) => {
    const matchesSearch =
      (tx.transactionRef || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.siteName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.remarks || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || mapPaymentStatus(tx.paymentStatus) === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  }), [expenses, searchQuery, statusFilter]);

  const handleViewInvoice = (id: string) => toast({ title: "Opening invoice", description: `Viewing ${id}` });
  const handleSendReminder = (id: string) => toast({ title: "Reminder sent", description: `Payment reminder sent for ${id}` });
  const handleDownloadPDF = (id: string) => toast({ title: "Download started", description: `Downloading ${id}.pdf` });

  const revenueVal = financialSummary.monthlyRevenue || 1; // avoid division by zero

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div><h1 className="text-2xl font-semibold text-foreground">Finance</h1><p className="text-sm text-muted-foreground mt-0.5">Revenue, invoicing, and financial tracking</p></div>
        <div className="flex gap-2"><Button variant="outline" size="default"><Download className="w-4 h-4" />Export</Button><Button variant="outline" size="default" onClick={() => setShowImportDialog(true)}><Upload className="w-4 h-4" />Import Data</Button><Button size="default" onClick={() => setShowCreateInvoiceDialog(true)}><Plus className="w-4 h-4" />Create Invoice</Button></div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="data-card col-span-2 lg:col-span-1"><CardContent className="p-4"><div className="flex items-center justify-between mb-2"><p className="metric-label">Monthly Revenue</p><div className="w-8 h-8 rounded-lg bg-[hsl(var(--status-success)/0.15)] flex items-center justify-center"><TrendingUp className="w-4 h-4 text-[hsl(var(--status-success))]" /></div></div><p className="metric-value text-2xl">{formatCurrency(financialSummary.monthlyRevenue)}</p><div className="flex items-center gap-1 mt-1 text-xs text-[hsl(var(--status-success))]"><ArrowUpRight className="w-3 h-3" /><span>{transactions.length} transactions</span></div></CardContent></Card>
        <Card className="data-card"><CardContent className="p-4"><div className="flex items-center justify-between mb-2"><p className="metric-label">Collected</p><CheckCircle2 className="w-4 h-4 text-[hsl(var(--status-success))]" /></div><p className="metric-value">{formatCurrency(financialSummary.collected)}</p><p className="text-xs text-muted-foreground mt-1">{revenueVal > 0 ? Math.round((financialSummary.collected / revenueVal) * 100) : 0}% of revenue</p></CardContent></Card>
        <Card className="data-card"><CardContent className="p-4"><div className="flex items-center justify-between mb-2"><p className="metric-label">Outstanding</p><Clock className="w-4 h-4 text-[hsl(var(--status-warning))]" /></div><p className="metric-value text-[hsl(var(--status-warning))]">{formatCurrency(financialSummary.outstanding)}</p><p className="text-xs text-muted-foreground mt-1">{pendingInvoiceCount} invoices pending</p></CardContent></Card>
        <Card className="data-card"><CardContent className="p-4"><div className="flex items-center justify-between mb-2"><p className="metric-label">Net Profit</p><Wallet className="w-4 h-4 text-primary" /></div><p className="metric-value">{formatCurrency(financialSummary.netProfit)}</p><p className="text-xs text-[hsl(var(--status-success))] mt-1">{financialSummary.profitMargin}% margin</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="data-card lg:col-span-2"><CardHeader className="pb-2"><CardTitle className="text-base">Revenue vs Costs</CardTitle></CardHeader><CardContent><div className="space-y-4"><div><div className="flex items-center justify-between text-sm mb-1"><span className="text-muted-foreground">Revenue</span><span className="font-medium">{formatCurrency(financialSummary.monthlyRevenue)}</span></div><Progress value={100} className="h-3" /></div><div><div className="flex items-center justify-between text-sm mb-1"><span className="text-muted-foreground">Costs</span><span className="font-medium">{formatCurrency(financialSummary.costs)}</span></div><div className="relative"><Progress value={100} className="h-3 bg-muted" /><div className="absolute inset-y-0 left-0 bg-[hsl(var(--status-error))] rounded-full" style={{ width: `${revenueVal > 0 ? (financialSummary.costs / revenueVal) * 100 : 0}%` }} /></div></div><div><div className="flex items-center justify-between text-sm mb-1"><span className="text-muted-foreground">Net Profit</span><span className="font-medium text-[hsl(var(--status-success))]">{formatCurrency(financialSummary.netProfit)}</span></div><div className="relative"><Progress value={100} className="h-3 bg-muted" /><div className="absolute inset-y-0 left-0 bg-[hsl(var(--status-success))] rounded-full" style={{ width: `${revenueVal > 0 ? (financialSummary.netProfit / revenueVal) * 100 : 0}%` }} /></div></div></div></CardContent></Card>
        <Card className="data-card"><CardHeader className="pb-2"><CardTitle className="text-base">Collection Status</CardTitle></CardHeader><CardContent><div className="flex items-center justify-center py-4"><div className="relative w-32 h-32"><svg className="w-full h-full transform -rotate-90"><circle className="text-muted stroke-current" strokeWidth="12" fill="transparent" r="56" cx="64" cy="64" /><circle className="text-[hsl(var(--status-success))] stroke-current" strokeWidth="12" strokeLinecap="round" fill="transparent" r="56" cx="64" cy="64" strokeDasharray={`${revenueVal > 0 ? (financialSummary.collected / revenueVal) * 352 : 0} 352`} /></svg><div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><p className="text-2xl font-semibold">{revenueVal > 0 ? Math.round((financialSummary.collected / revenueVal) * 100) : 0}%</p><p className="text-xs text-muted-foreground">Collected</p></div></div></div></div><div className="grid grid-cols-2 gap-2 mt-2"><div className="text-center p-2 rounded-lg bg-muted/50"><p className="text-sm font-medium text-[hsl(var(--status-success))]">{formatCurrency(financialSummary.collected)}</p><p className="text-xs text-muted-foreground">Collected</p></div><div className="text-center p-2 rounded-lg bg-muted/50"><p className="text-sm font-medium text-[hsl(var(--status-warning))]">{formatCurrency(financialSummary.outstanding)}</p><p className="text-xs text-muted-foreground">Pending</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
            <TabsTrigger value="expenses">Expenses ({expenses.length})</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input type="search" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-[180px]" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px] bg-secondary/50"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="invoices">
          {filteredInvoices.length === 0 ? (
            <Card className="border-border/60 p-8">
              <div className="text-center text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-lg font-medium mb-1">No invoices found</p>
                <p className="text-sm">{transactions.length === 0 ? "Import financial data to see invoices here." : "No invoices match the current filters."}</p>
                {transactions.length === 0 && <Button className="mt-4" variant="outline" onClick={() => setShowImportDialog(true)}><Upload className="w-4 h-4 mr-2" />Import Financial Data</Button>}
              </div>
            </Card>
          ) : (
            <Card className="border-border/60"><Table><TableHeader><TableRow className="hover:bg-transparent border-border"><TableHead>Invoice</TableHead><TableHead>Site</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader><TableBody>{filteredInvoices.map((tx) => {
              const status = mapPaymentStatus(tx.paymentStatus);
              const cfg = statusConfig[status] || statusConfig.PENDING;
              return (
                <TableRow key={tx.id} className="cursor-pointer hover:bg-muted/50 border-border/50">
                  <TableCell><div><p className="font-medium">{tx.invoiceNumber || tx.transactionRef}</p><p className="text-xs text-muted-foreground">Issued: {formatDate(tx.transactionDate)}</p></div></TableCell>
                  <TableCell><div><p className="text-foreground">{tx.siteName || "—"}</p>{tx.billingPeriod && <p className="text-xs text-muted-foreground">Period: {tx.billingPeriod}</p>}</div></TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{formatTransactionType(tx.transactionType)}</Badge></TableCell>
                  <TableCell><span className="font-semibold">{formatCurrency(tx.totalAmount)}</span>{tx.paidAmount != null && tx.paidAmount > 0 && tx.paidAmount < tx.totalAmount && <p className="text-xs text-muted-foreground">Paid: {formatCurrency(tx.paidAmount)}</p>}</TableCell>
                  <TableCell><span className={status === "OVERDUE" ? "text-[hsl(var(--status-error))]" : ""}>{formatDate(tx.dueDate)}</span>{tx.daysOverdue != null && tx.daysOverdue > 0 && <p className="text-xs text-[hsl(var(--status-error))]">{tx.daysOverdue}d overdue</p>}</TableCell>
                  <TableCell><Badge className={`${cfg.bgColor} ${cfg.color} border-0`}>{status}</Badge></TableCell>
                  <TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="bg-popover border-border"><DropdownMenuItem onClick={() => handleViewInvoice(tx.invoiceNumber || tx.transactionRef)}><Eye className="w-4 h-4 mr-2" />View Invoice</DropdownMenuItem><DropdownMenuItem onClick={() => handleSendReminder(tx.invoiceNumber || tx.transactionRef)}><Send className="w-4 h-4 mr-2" />Send Reminder</DropdownMenuItem><DropdownMenuItem onClick={() => handleDownloadPDF(tx.invoiceNumber || tx.transactionRef)}><Download className="w-4 h-4 mr-2" />Download PDF</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
                </TableRow>
              );
            })}</TableBody></Table></Card>
          )}
        </TabsContent>

        <TabsContent value="expenses">
          {filteredExpenses.length === 0 ? (
            <Card className="border-border/60 p-8">
              <div className="text-center text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-lg font-medium mb-1">No expenses found</p>
                <p className="text-sm">{transactions.length === 0 ? "Import financial data to see expenses here." : "No expenses match the current filters."}</p>
              </div>
            </Card>
          ) : (
            <Card className="border-border/60"><Table><TableHeader><TableRow className="hover:bg-transparent border-border"><TableHead>Reference</TableHead><TableHead>Type</TableHead><TableHead>Site</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{filteredExpenses.map((tx) => {
              const status = mapPaymentStatus(tx.paymentStatus);
              const cfg = statusConfig[status] || statusConfig.PENDING;
              return (
                <TableRow key={tx.id} className="hover:bg-muted/50 border-border/50">
                  <TableCell><p className="font-medium">{tx.transactionRef}</p>{tx.remarks && <p className="text-xs text-muted-foreground line-clamp-1">{tx.remarks}</p>}</TableCell>
                  <TableCell><Badge variant="outline">{formatTransactionType(tx.transactionType)}</Badge></TableCell>
                  <TableCell>{tx.siteName || "—"}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(tx.totalAmount)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(tx.transactionDate)}</TableCell>
                  <TableCell><Badge className={`${cfg.bgColor} ${cfg.color} border-0`}>{status}</Badge></TableCell>
                </TableRow>
              );
            })}</TableBody></Table></Card>
          )}
        </TabsContent>
      </Tabs>

      <CreateInvoiceDialog open={showCreateInvoiceDialog} onOpenChange={setShowCreateInvoiceDialog} />
      <ImportFinancialDialog open={showImportDialog} onOpenChange={setShowImportDialog} />
    </div>
  );
}
