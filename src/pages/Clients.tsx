import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AddClientDialog } from "@/components/forms/AddClientDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Plus,
  Building,
  Phone,
  Mail,
  MapPin,
  MoreHorizontal,
  TrendingUp,
  IndianRupee,
  FileText,
  Calendar,
  ExternalLink,
  Users,
  Box,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

// Mock data for clients
const mockClients = [
  {
    id: "CLT-001",
    name: "Metro Properties Ltd.",
    type: "Enterprise",
    status: "Active",
    sites: 4,
    totalUnits: 48,
    monthlyRevenue: 1250000,
    contractStart: "Jan 2023",
    contractEnd: "Dec 2025",
    contactPerson: "Anil Kapoor",
    phone: "+91 98765 11111",
    email: "anil@metroproperties.com",
    location: "Mumbai, Maharashtra",
    outstandingAmount: 125000,
    paymentStatus: "On Time",
  },
  {
    id: "CLT-002",
    name: "Phoenix Group",
    type: "Enterprise",
    status: "Active",
    sites: 3,
    totalUnits: 36,
    monthlyRevenue: 980000,
    contractStart: "Mar 2023",
    contractEnd: "Feb 2026",
    contactPerson: "Sunita Reddy",
    phone: "+91 98765 22222",
    email: "sunita@phoenixgroup.in",
    location: "Pune, Maharashtra",
    outstandingAmount: 0,
    paymentStatus: "On Time",
  },
  {
    id: "CLT-003",
    name: "DLF Commercial",
    type: "Enterprise",
    status: "Active",
    sites: 5,
    totalUnits: 62,
    monthlyRevenue: 1580000,
    contractStart: "Jun 2022",
    contractEnd: "May 2025",
    contactPerson: "Rajesh Mehra",
    phone: "+91 98765 33333",
    email: "rajesh@dlfcommercial.com",
    location: "Gurugram, Haryana",
    outstandingAmount: 316000,
    paymentStatus: "Overdue",
  },
  {
    id: "CLT-004",
    name: "Prestige Estates",
    type: "Mid-Market",
    status: "Active",
    sites: 2,
    totalUnits: 24,
    monthlyRevenue: 620000,
    contractStart: "Sep 2023",
    contractEnd: "Aug 2026",
    contactPerson: "Kavita Sharma",
    phone: "+91 98765 44444",
    email: "kavita@prestige.in",
    location: "Bangalore, Karnataka",
    outstandingAmount: 62000,
    paymentStatus: "Pending",
  },
  {
    id: "CLT-005",
    name: "Mindspace REIT",
    type: "Enterprise",
    status: "Active",
    sites: 3,
    totalUnits: 40,
    monthlyRevenue: 1100000,
    contractStart: "Nov 2023",
    contractEnd: "Oct 2026",
    contactPerson: "Vinod Patil",
    phone: "+91 98765 55555",
    email: "vinod@mindspace.co.in",
    location: "Hyderabad, Telangana",
    outstandingAmount: 0,
    paymentStatus: "On Time",
  },
  {
    id: "CLT-006",
    name: "Tech Park Ventures",
    type: "SMB",
    status: "Inactive",
    sites: 1,
    totalUnits: 8,
    monthlyRevenue: 0,
    contractStart: "Apr 2022",
    contractEnd: "Mar 2024",
    contactPerson: "Amit Jain",
    phone: "+91 98765 66666",
    email: "amit@techparkventures.com",
    location: "Chennai, Tamil Nadu",
    outstandingAmount: 48000,
    paymentStatus: "Overdue",
  },
];

const typeColors: Record<string, string> = {
  Enterprise: "bg-primary/10 text-primary",
  "Mid-Market": "bg-[hsl(var(--status-info)/0.15)] text-[hsl(var(--status-info))]",
  SMB: "bg-muted text-muted-foreground",
};

const paymentStatusColors: Record<string, string> = {
  "On Time": "text-[hsl(var(--status-success))]",
  Pending: "text-[hsl(var(--status-warning))]",
  Overdue: "text-[hsl(var(--status-error))]",
};

export default function Clients() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filteredClients = mockClients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || client.type === typeFilter;
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const types = ["all", "Enterprise", "Mid-Market", "SMB"];
  const statuses = ["all", "Active", "Inactive"];

  // Stats
  const totalClients = mockClients.filter((c) => c.status === "Active").length;
  const totalSites = mockClients.reduce((sum, c) => sum + c.sites, 0);
  const totalRevenue = mockClients.filter((c) => c.status === "Active").reduce((sum, c) => sum + c.monthlyRevenue, 0);
  const totalOutstanding = mockClients.reduce((sum, c) => sum + c.outstandingAmount, 0);

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Clients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage client relationships and contracts
          </p>
        </div>
        <Button size="default" onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4" />
          Add Client
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="data-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="metric-value">{totalClients}</p>
                <p className="metric-label">Active Clients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="data-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-info)/0.15)] flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[hsl(var(--status-info))]" />
              </div>
              <div>
                <p className="metric-value">{totalSites}</p>
                <p className="metric-label">Total Sites</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="data-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-success)/0.15)] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[hsl(var(--status-success))]" />
              </div>
              <div>
                <p className="metric-value">{formatCurrency(totalRevenue)}</p>
                <p className="metric-label">Monthly Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="data-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-warning)/0.15)] flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-[hsl(var(--status-warning))]" />
              </div>
              <div>
                <p className="metric-value">{formatCurrency(totalOutstanding)}</p>
                <p className="metric-label">Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px] bg-secondary/50">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {types.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === "all" ? "All Types" : type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] bg-secondary/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "all" ? "All Status" : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Client Table */}
      <Card className="border-border/60">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-muted-foreground font-medium">Client</TableHead>
              <TableHead className="text-muted-foreground font-medium">Type</TableHead>
              <TableHead className="text-muted-foreground font-medium">Sites / Units</TableHead>
              <TableHead className="text-muted-foreground font-medium">Monthly Revenue</TableHead>
              <TableHead className="text-muted-foreground font-medium">Outstanding</TableHead>
              <TableHead className="text-muted-foreground font-medium">Contract</TableHead>
              <TableHead className="text-muted-foreground font-medium w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client, index) => (
              <TableRow
                key={client.id}
                className="cursor-pointer hover:bg-muted/50 border-border/50 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
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
                <TableCell>
                  <Badge className={`${typeColors[client.type]} border-0`}>
                    {client.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{client.sites}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Box className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{client.totalUnits}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{formatCurrency(client.monthlyRevenue)}</span>
                </TableCell>
                <TableCell>
                  <div>
                    <span className={`font-medium ${paymentStatusColors[client.paymentStatus]}`}>
                      {formatCurrency(client.outstandingAmount)}
                    </span>
                    <p className={`text-xs ${paymentStatusColors[client.paymentStatus]}`}>
                      {client.paymentStatus}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p className="text-foreground">{client.contractEnd}</p>
                    <p className="text-xs text-muted-foreground">Since {client.contractStart}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>View Sites</DropdownMenuItem>
                      <DropdownMenuItem>View Invoices</DropdownMenuItem>
                      <DropdownMenuItem>Edit Client</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {filteredClients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
            <Building className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No clients found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      <AddClientDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </div>
  );
}
