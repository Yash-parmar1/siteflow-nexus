import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AddClientDialog } from "@/components/forms/AddClientDialog";
import { ViewClientDialog } from "@/components/forms/ViewClientDialog";
import { ViewSitesDialog } from "@/components/forms/ViewSitesDialog";
import { ViewInvoicesDialog } from "@/components/forms/ViewInvoicesDialog";
import { EditClientDialog } from "@/components/forms/EditClientDialog";
import { DeactivateClientDialog } from "@/components/forms/DeactivateClientDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Plus,
  Building,
  MapPin,
  MoreHorizontal,
  TrendingUp,
  IndianRupee,
  Users,
  Box,
  Briefcase,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import api from "@/lib/api";
import { Client } from "@/types/client";

const paymentStatusColors: Record<string, string> = { "On Time": "text-[hsl(var(--status-success))]", Pending: "text-[hsl(var(--status-warning))]", Overdue: "text-[hsl(var(--status-error))]" };

export default function ClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showSitesDialog, setShowSitesDialog] = useState(false);
  const [showInvoicesDialog, setShowInvoicesDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      const response = await api.get("/clients");
      const formattedData = response.data.map((client: any) => ({
        ...client,
        id: `CLT-${client.id.toString().padStart(3, "0")}`,
        sites: client.sites || 0,
        totalUnits: client.totalUnits || 0,
        projects: client.projects || 0,
        monthlyRevenue: client.monthlyRevenue || 0,
        status: client.active ? "Active" : "Inactive",
        contractStart: client.contractStartDate ? new Date(client.contractStartDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'N/A',
        contractEnd: client.contractEndDate ? new Date(client.contractEndDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'N/A',
        address: client.address,
        paymentStatus: client.paymentStatus || 'On Time',
      }));
      setClients(formattedData);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleClientAdded = () => {
    fetchClients();
  };

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        (client.name && client.name.toLowerCase().includes(q)) ||
        (client.contactPerson && client.contactPerson.toLowerCase().includes(q)) ||
        (client.address && client.address.toLowerCase().includes(q));
      const matchesStatus = statusFilter === "all" || client.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchQuery, statusFilter]);

  const { totalClients, totalSites, totalRevenue, totalOutstanding } = useMemo(() => {
    const activeClients = clients.filter((c) => c.status === "Active");
    return {
      totalClients: activeClients.length,
      totalSites: clients.reduce((sum, c) => sum + (c.sites || 0), 0),
      totalRevenue: activeClients.reduce((sum, c) => sum + (c.monthlyRevenue || 0), 0),
      totalOutstanding: clients.reduce((sum, c) => sum + (c.outstandingAmount || 0), 0),
    };
  }, [clients]);

  const formatCurrency = (amount?: number) => {
    if (!amount) return "₹0";
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  const handleViewDetails = (client: Client) => { setSelectedClient(client); setShowViewDialog(true); };
  const handleViewSites = (client: Client) => { setSelectedClient(client); setShowSitesDialog(true); };
  const handleViewInvoices = (client: Client) => { setSelectedClient(client); setShowInvoicesDialog(true); };
  const handleEditClient = (client: Client) => { setSelectedClient(client); setShowEditDialog(true); };
  const handleDeactivateClick = (client: Client) => {
    setSelectedClient(client);
    setShowDeactivateDialog(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!selectedClient) return;

    const isActive = selectedClient.status === 'Active';
    const endpoint = isActive ? 'deactivate' : 'activate';
    const successMessage = isActive ? 'Client deactivated successfully.' : 'Client activated successfully.';
    const errorMessage = isActive ? 'An error occurred while deactivating the client.' : 'An error occurred while activating the client.';

    try {
      await api.patch(`/clients/${selectedClient.id.replace('CLT-', '')}/${endpoint}`);
      toast.success(successMessage);
      fetchClients();
    } catch (error) {
      toast.error(errorMessage);
    } finally {
      setShowDeactivateDialog(false);
    }
  };

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div><h1 className="text-2xl font-semibold text-foreground">Clients</h1><p className="text-sm text-muted-foreground mt-0.5">Manage client relationships and contracts</p></div>
        <Button size="default" onClick={() => setShowAddDialog(true)}><Plus className="w-4 h-4" />Add Client</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="data-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Building className="w-5 h-5 text-primary" /></div><div><p className="metric-value">{totalClients}</p><p className="metric-label">Active Clients</p></div></div></CardContent></Card>
        <Card className="data-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-info)/0.15)] flex items-center justify-center"><MapPin className="w-5 h-5 text-[hsl(var(--status-info))]" /></div><div><p className="metric-value">{totalSites}</p><p className="metric-label">Total Sites</p></div></div></CardContent></Card>
        <Card className="data-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-success)/0.15)] flex items-center justify-center"><TrendingUp className="w-5 h-5 text-[hsl(var(--status-success))]" /></div><div><p className="metric-value">{formatCurrency(totalRevenue)}</p><p className="metric-label">Monthly Revenue</p></div></div></CardContent></Card>
        <Card className="data-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-warning)/0.15)] flex items-center justify-center"><IndianRupee className="w-5 h-5 text-[hsl(var(--status-warning))]" /></div><div><p className="metric-value">{formatCurrency(totalOutstanding)}</p><p className="metric-label">Outstanding</p></div></div></CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type="search" placeholder="Search clients..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[130px] bg-secondary/50"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent className="bg-popover border-border">{["all", "Active", "Inactive"].map((status) => (<SelectItem key={status} value={status}>{status === "all" ? "All Status" : status}</SelectItem>))}</SelectContent></Select>
        </div>
      </div>

      <Card className="border-border/60">
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent border-border"><TableHead>Client</TableHead><TableHead>Sites / Units / Projects</TableHead><TableHead>Monthly Revenue</TableHead><TableHead>Outstanding</TableHead><TableHead>Contract</TableHead><TableHead className="w-[50px]"></TableHead></TableRow></TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id} className="cursor-pointer hover:bg-muted/50 border-border/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${client.status === 'Active' ? 'bg-green-600' : 'bg-red-600'}`}></span>
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {client.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{client.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {client.contactPerson}
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell><div className="flex items-center gap-3"><div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-muted-foreground" /><span>{client.sites}</span></div><div className="flex items-center gap-1"><Box className="w-3.5 h-3.5 text-muted-foreground" /><span>{client.totalUnits}</span></div><div className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-muted-foreground" /><span>{client.projects}</span></div></div></TableCell>
                <TableCell><span className="font-medium">{formatCurrency(client.monthlyRevenue)}</span></TableCell>
                <TableCell><div><span className={`font-medium ${paymentStatusColors[client.paymentStatus]}`}>{formatCurrency(client.outstandingAmount)}</span><p className={`text-xs ${paymentStatusColors[client.paymentStatus]}`}>{client.paymentStatus}</p></div></TableCell>
                <TableCell><div className="text-sm"><p className="text-foreground">{client.contractEnd}</p><p className="text-xs text-muted-foreground">Since {client.contractStart}</p></div></TableCell>
                <TableCell>
                  <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                      <DropdownMenuItem onClick={() => handleViewDetails(client)}>View Details</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleViewSites(client)}>View Sites</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleViewInvoices(client)}>View Invoices</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditClient(client)}>Edit Client</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDeactivateClick(client)}>
                        {client.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {filteredClients.length === 0 && (<div className="flex flex-col items-center justify-center py-16 text-center"><div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center"><Building className="w-7 h-7 text-muted-foreground" /></div><h3 className="text-lg font-medium text-foreground mb-1">No clients found</h3><p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria, or add a new client.</p></div>)}

      <AddClientDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSubmit={handleClientAdded} />
      <ViewClientDialog open={showViewDialog} onOpenChange={setShowViewDialog} client={selectedClient} onClientUpdate={fetchClients} />
      <ViewSitesDialog open={showSitesDialog} onOpenChange={setShowSitesDialog} client={selectedClient} />
      <ViewInvoicesDialog open={showInvoicesDialog} onOpenChange={setShowInvoicesDialog} client={selectedClient} />
      <EditClientDialog open={showEditDialog} onOpenChange={setShowEditDialog} client={selectedClient} onClientUpdate={fetchClients} />
      {selectedClient && (
        <DeactivateClientDialog
          open={showDeactivateDialog}
          onOpenChange={setShowDeactivateDialog}
          onConfirm={handleConfirmDeactivate}
          clientName={selectedClient.name}
          isActive={selectedClient.status === 'Active'}
        />
      )}
    </div>
  );
}
