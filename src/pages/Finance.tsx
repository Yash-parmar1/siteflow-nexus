import { useState } from "react";
import { CreateInvoiceDialog } from "@/components/forms/CreateInvoiceDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Search, Download, Plus, TrendingUp, ArrowUpRight, CheckCircle2, Clock, Wallet, MoreHorizontal, Eye, Send } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/context/AppDataContext";

// Hardcoded fallback data (kept for reference)
const fallbackFinancialSummary = { monthlyRevenue: 5530000, outstanding: 551000, collected: 4979000, costs: 1250000, netProfit: 4280000, profitMargin: 77.4 };
const invoices = [
  { id: "INV-2024-0156", client: "Metro Properties Ltd.", amount: 1250000, dueDate: "Jan 05, 2025", status: "Pending", issuedDate: "Dec 20, 2024", sites: 4 },
  { id: "INV-2024-0155", client: "Phoenix Group", amount: 980000, dueDate: "Dec 28, 2024", status: "Overdue", issuedDate: "Dec 13, 2024", sites: 3 },
  { id: "INV-2024-0154", client: "DLF Commercial", amount: 1580000, dueDate: "Jan 10, 2025", status: "Pending", issuedDate: "Dec 25, 2024", sites: 5 },
  { id: "INV-2024-0153", client: "Prestige Estates", amount: 620000, dueDate: "Dec 20, 2024", status: "Paid", issuedDate: "Dec 05, 2024", sites: 2 },
  { id: "INV-2024-0152", client: "Mindspace REIT", amount: 1100000, dueDate: "Dec 25, 2024", status: "Paid", issuedDate: "Dec 10, 2024", sites: 3 },
];
const expenses = [
  { id: "EXP-001", category: "Vendor Payments", description: "TechServe Solutions - Installation", amount: 245000, date: "Dec 24, 2024", status: "Paid" },
  { id: "EXP-002", category: "Equipment", description: "ACS Units - Batch Order", amount: 580000, date: "Dec 22, 2024", status: "Pending" },
  { id: "EXP-003", category: "Logistics", description: "Elite Logistics - Shipping", amount: 85000, date: "Dec 20, 2024", status: "Paid" },
  { id: "EXP-004", category: "Maintenance", description: "Spare Parts - CoolTech", amount: 125000, date: "Dec 18, 2024", status: "Paid" },
];
const statusConfig: Record<string, { color: string; bgColor: string }> = { Paid: { color: "text-[hsl(var(--status-success))]", bgColor: "bg-[hsl(var(--status-success)/0.15)]" }, Pending: { color: "text-[hsl(var(--status-warning))]", bgColor: "bg-[hsl(var(--status-warning)/0.15)]" }, Overdue: { color: "text-[hsl(var(--status-error))]", bgColor: "bg-[hsl(var(--status-error)/0.15)]" } };

export default function Finance() {
  const { toast } = useToast();
  const { data: appData } = useAppData();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateInvoiceDialog, setShowCreateInvoiceDialog] = useState(false);

  // Build live financial summary from backend data, fallback to hardcoded
  const liveFinancialSummary = appData?.finance
    ? (() => {
        const revenue = appData.finance.monthlyRevenue ?? 0;
        const costs = (appData.finance.totalMaintenanceCost ?? 0) + (appData.finance.totalInstallationCost ?? 0);
        const net = appData.finance.netProfit ?? revenue - costs;
        const collected = revenue > 0 ? revenue - (revenue * 0.1) : 0; // estimate 90% collected
        const outstanding = revenue - collected;
        return {
          monthlyRevenue: revenue,
          outstanding,
          collected,
          costs,
          netProfit: net,
          profitMargin: revenue > 0 ? Math.round((net / revenue) * 1000) / 10 : 0,
        };
      })()
    : null;

  const financialSummary = liveFinancialSummary ?? fallbackFinancialSummary;

  const formatCurrency = (amount: number) => amount >= 10000000 ? `₹${(amount / 10000000).toFixed(2)}Cr` : amount >= 100000 ? `₹${(amount / 100000).toFixed(1)}L` : `₹${amount.toLocaleString()}`;
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) || invoice.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewInvoice = (id: string) => toast({ title: "Opening invoice", description: `Viewing ${id}` });
  const handleSendReminder = (id: string) => toast({ title: "Reminder sent", description: `Payment reminder sent for ${id}` });
  const handleDownloadPDF = (id: string) => toast({ title: "Download started", description: `Downloading ${id}.pdf` });

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div><h1 className="text-2xl font-semibold text-foreground">Finance</h1><p className="text-sm text-muted-foreground mt-0.5">Revenue, invoicing, and financial tracking</p></div>
        <div className="flex gap-2"><Button variant="outline" size="default"><Download className="w-4 h-4" />Export</Button><Button size="default" onClick={() => setShowCreateInvoiceDialog(true)}><Plus className="w-4 h-4" />Create Invoice</Button></div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="data-card col-span-2 lg:col-span-1"><CardContent className="p-4"><div className="flex items-center justify-between mb-2"><p className="metric-label">Monthly Revenue</p><div className="w-8 h-8 rounded-lg bg-[hsl(var(--status-success)/0.15)] flex items-center justify-center"><TrendingUp className="w-4 h-4 text-[hsl(var(--status-success))]" /></div></div><p className="metric-value text-2xl">{formatCurrency(financialSummary.monthlyRevenue)}</p><div className="flex items-center gap-1 mt-1 text-xs text-[hsl(var(--status-success))]"><ArrowUpRight className="w-3 h-3" /><span>+8.2% vs last month</span></div></CardContent></Card>
        <Card className="data-card"><CardContent className="p-4"><div className="flex items-center justify-between mb-2"><p className="metric-label">Collected</p><CheckCircle2 className="w-4 h-4 text-[hsl(var(--status-success))]" /></div><p className="metric-value">{formatCurrency(financialSummary.collected)}</p><p className="text-xs text-muted-foreground mt-1">{Math.round((financialSummary.collected / financialSummary.monthlyRevenue) * 100)}% of target</p></CardContent></Card>
        <Card className="data-card"><CardContent className="p-4"><div className="flex items-center justify-between mb-2"><p className="metric-label">Outstanding</p><Clock className="w-4 h-4 text-[hsl(var(--status-warning))]" /></div><p className="metric-value text-[hsl(var(--status-warning))]">{formatCurrency(financialSummary.outstanding)}</p><p className="text-xs text-muted-foreground mt-1">3 invoices pending</p></CardContent></Card>
        <Card className="data-card"><CardContent className="p-4"><div className="flex items-center justify-between mb-2"><p className="metric-label">Net Profit</p><Wallet className="w-4 h-4 text-primary" /></div><p className="metric-value">{formatCurrency(financialSummary.netProfit)}</p><p className="text-xs text-[hsl(var(--status-success))] mt-1">{financialSummary.profitMargin}% margin</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="data-card lg:col-span-2"><CardHeader className="pb-2"><CardTitle className="text-base">Revenue vs Costs</CardTitle></CardHeader><CardContent><div className="space-y-4"><div><div className="flex items-center justify-between text-sm mb-1"><span className="text-muted-foreground">Revenue</span><span className="font-medium">{formatCurrency(financialSummary.monthlyRevenue)}</span></div><Progress value={100} className="h-3" /></div><div><div className="flex items-center justify-between text-sm mb-1"><span className="text-muted-foreground">Costs</span><span className="font-medium">{formatCurrency(financialSummary.costs)}</span></div><div className="relative"><Progress value={100} className="h-3 bg-muted" /><div className="absolute inset-y-0 left-0 bg-[hsl(var(--status-error))] rounded-full" style={{ width: `${(financialSummary.costs / financialSummary.monthlyRevenue) * 100}%` }} /></div></div><div><div className="flex items-center justify-between text-sm mb-1"><span className="text-muted-foreground">Net Profit</span><span className="font-medium text-[hsl(var(--status-success))]">{formatCurrency(financialSummary.netProfit)}</span></div><div className="relative"><Progress value={100} className="h-3 bg-muted" /><div className="absolute inset-y-0 left-0 bg-[hsl(var(--status-success))] rounded-full" style={{ width: `${(financialSummary.netProfit / financialSummary.monthlyRevenue) * 100}%` }} /></div></div></div></CardContent></Card>
        <Card className="data-card"><CardHeader className="pb-2"><CardTitle className="text-base">Collection Status</CardTitle></CardHeader><CardContent><div className="flex items-center justify-center py-4"><div className="relative w-32 h-32"><svg className="w-full h-full transform -rotate-90"><circle className="text-muted stroke-current" strokeWidth="12" fill="transparent" r="56" cx="64" cy="64" /><circle className="text-[hsl(var(--status-success))] stroke-current" strokeWidth="12" strokeLinecap="round" fill="transparent" r="56" cx="64" cy="64" strokeDasharray={`${(financialSummary.collected / financialSummary.monthlyRevenue) * 352} 352`} /></svg><div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><p className="text-2xl font-semibold">{Math.round((financialSummary.collected / financialSummary.monthlyRevenue) * 100)}%</p><p className="text-xs text-muted-foreground">Collected</p></div></div></div></div><div className="grid grid-cols-2 gap-2 mt-2"><div className="text-center p-2 rounded-lg bg-muted/50"><p className="text-sm font-medium text-[hsl(var(--status-success))]">{formatCurrency(financialSummary.collected)}</p><p className="text-xs text-muted-foreground">Collected</p></div><div className="text-center p-2 rounded-lg bg-muted/50"><p className="text-sm font-medium text-[hsl(var(--status-warning))]">{formatCurrency(financialSummary.outstanding)}</p><p className="text-xs text-muted-foreground">Pending</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <TabsList className="bg-secondary/50"><TabsTrigger value="invoices">Invoices</TabsTrigger><TabsTrigger value="expenses">Expenses</TabsTrigger><TabsTrigger value="payments">Payments</TabsTrigger></TabsList>
          <div className="flex gap-2"><div className="relative max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type="search" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-[180px]" /></div><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[120px] bg-secondary/50"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent className="bg-popover border-border"><SelectItem value="all">All Status</SelectItem><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Overdue">Overdue</SelectItem></SelectContent></Select></div>
        </div>

        <TabsContent value="invoices"><Card className="border-border/60"><Table><TableHeader><TableRow className="hover:bg-transparent border-border"><TableHead>Invoice</TableHead><TableHead>Client</TableHead><TableHead>Amount</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader><TableBody>{filteredInvoices.map((invoice) => (<TableRow key={invoice.id} className="cursor-pointer hover:bg-muted/50 border-border/50"><TableCell><div><p className="font-medium">{invoice.id}</p><p className="text-xs text-muted-foreground">Issued: {invoice.issuedDate}</p></div></TableCell><TableCell><div><p className="text-foreground">{invoice.client}</p><p className="text-xs text-muted-foreground">{invoice.sites} sites</p></div></TableCell><TableCell><span className="font-semibold">{formatCurrency(invoice.amount)}</span></TableCell><TableCell><span className={invoice.status === "Overdue" ? "text-[hsl(var(--status-error))]" : ""}>{invoice.dueDate}</span></TableCell><TableCell><Badge className={`${statusConfig[invoice.status]?.bgColor} ${statusConfig[invoice.status]?.color} border-0`}>{invoice.status}</Badge></TableCell><TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="bg-popover border-border"><DropdownMenuItem onClick={() => handleViewInvoice(invoice.id)}><Eye className="w-4 h-4 mr-2" />View Invoice</DropdownMenuItem><DropdownMenuItem onClick={() => handleSendReminder(invoice.id)}><Send className="w-4 h-4 mr-2" />Send Reminder</DropdownMenuItem><DropdownMenuItem onClick={() => handleDownloadPDF(invoice.id)}><Download className="w-4 h-4 mr-2" />Download PDF</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell></TableRow>))}</TableBody></Table></Card></TabsContent>

        <TabsContent value="expenses"><Card className="border-border/60"><Table><TableHeader><TableRow className="hover:bg-transparent border-border"><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{expenses.map((expense) => (<TableRow key={expense.id} className="hover:bg-muted/50 border-border/50"><TableCell><Badge variant="outline">{expense.category}</Badge></TableCell><TableCell>{expense.description}</TableCell><TableCell className="font-medium">{formatCurrency(expense.amount)}</TableCell><TableCell className="text-muted-foreground">{expense.date}</TableCell><TableCell><Badge className={`${statusConfig[expense.status]?.bgColor} ${statusConfig[expense.status]?.color} border-0`}>{expense.status}</Badge></TableCell></TableRow>))}</TableBody></Table></Card></TabsContent>

        <TabsContent value="payments"><Card className="border-border/60 p-8"><div className="text-center text-muted-foreground"><p className="text-lg font-medium mb-2">Payment Gateway Integration</p><p className="text-sm">Connect your payment gateway to track incoming payments automatically.</p><Button className="mt-4" variant="outline">Configure Payment Gateway</Button></div></Card></TabsContent>
      </Tabs>

      <CreateInvoiceDialog open={showCreateInvoiceDialog} onOpenChange={setShowCreateInvoiceDialog} />
    </div>
  );
}
