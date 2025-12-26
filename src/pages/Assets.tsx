import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Plus,
  Filter,
  Grid3X3,
  List,
  Box,
  MapPin,
  Calendar,
  Wrench,
  MoreHorizontal,
  Download,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data for ACS units
const mockACSUnits = [
  {
    id: "ACS-001",
    serialNumber: "SN-2024-0001",
    model: "ACS Pro X1",
    site: "Metro Tower - Block A",
    siteId: "site-001",
    location: "Floor 12, Zone A",
    status: "Operational",
    installDate: "Jan 15, 2024",
    lastMaintenance: "Dec 01, 2024",
    nextMaintenance: "Mar 01, 2025",
    warrantyExpiry: "Jan 15, 2027",
    openTickets: 0,
  },
  {
    id: "ACS-002",
    serialNumber: "SN-2024-0002",
    model: "ACS Pro X2",
    site: "Metro Tower - Block A",
    siteId: "site-001",
    location: "Floor 15, Zone B",
    status: "Under Maintenance",
    installDate: "Jan 18, 2024",
    lastMaintenance: "Nov 15, 2024",
    nextMaintenance: "Feb 15, 2025",
    warrantyExpiry: "Jan 18, 2027",
    openTickets: 1,
  },
  {
    id: "ACS-003",
    serialNumber: "SN-2024-0003",
    model: "ACS Lite",
    site: "Phoenix Mall Expansion",
    siteId: "site-002",
    location: "Atrium Level",
    status: "Operational",
    installDate: "Feb 05, 2024",
    lastMaintenance: "Oct 20, 2024",
    nextMaintenance: "Jan 20, 2025",
    warrantyExpiry: "Feb 05, 2027",
    openTickets: 0,
  },
  {
    id: "ACS-004",
    serialNumber: "SN-2024-0004",
    model: "ACS Pro X1",
    site: "Cyber Hub Tower 5",
    siteId: "site-003",
    location: "Main Lobby",
    status: "Operational",
    installDate: "Dec 10, 2023",
    lastMaintenance: "Dec 10, 2024",
    nextMaintenance: "Mar 10, 2025",
    warrantyExpiry: "Dec 10, 2026",
    openTickets: 0,
  },
  {
    id: "ACS-005",
    serialNumber: "SN-2024-0005",
    model: "ACS Pro X2",
    site: "Prestige Tech Park",
    siteId: "site-004",
    location: "Building C, Floor 3",
    status: "Faulty",
    installDate: "Mar 01, 2024",
    lastMaintenance: "Sep 01, 2024",
    nextMaintenance: "Overdue",
    warrantyExpiry: "Mar 01, 2027",
    openTickets: 2,
  },
  {
    id: "ACS-006",
    serialNumber: "SN-2024-0006",
    model: "ACS Ultra",
    site: "DLF Cyber City Phase 3",
    siteId: "site-005",
    location: "Tower A, Floor 8",
    status: "Pending Install",
    installDate: "-",
    lastMaintenance: "-",
    nextMaintenance: "-",
    warrantyExpiry: "-",
    openTickets: 0,
  },
  {
    id: "ACS-007",
    serialNumber: "SN-2024-0007",
    model: "ACS Pro X1",
    site: "Mindspace IT Park",
    siteId: "site-006",
    location: "Unassigned",
    status: "In Transit",
    installDate: "-",
    lastMaintenance: "-",
    nextMaintenance: "-",
    warrantyExpiry: "-",
    openTickets: 0,
  },
];

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  Operational: { color: "status-success", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  "Under Maintenance": { color: "status-warning", icon: <Wrench className="w-3.5 h-3.5" /> },
  Faulty: { color: "status-error", icon: <XCircle className="w-3.5 h-3.5" /> },
  "Pending Install": { color: "status-info", icon: <Clock className="w-3.5 h-3.5" /> },
  "In Transit": { color: "status-neutral", icon: <Box className="w-3.5 h-3.5" /> },
};

export default function Assets() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const filteredUnits = mockACSUnits.filter((unit) => {
    const matchesSearch =
      unit.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || unit.status === statusFilter;
    const matchesModel = modelFilter === "all" || unit.model === modelFilter;
    return matchesSearch && matchesStatus && matchesModel;
  });

  const statuses = ["all", "Operational", "Under Maintenance", "Faulty", "Pending Install", "In Transit"];
  const models = ["all", "ACS Pro X1", "ACS Pro X2", "ACS Lite", "ACS Ultra"];

  // Stats
  const totalUnits = mockACSUnits.length;
  const operationalUnits = mockACSUnits.filter((u) => u.status === "Operational").length;
  const faultyUnits = mockACSUnits.filter((u) => u.status === "Faulty").length;
  const pendingUnits = mockACSUnits.filter((u) => u.status === "Pending Install" || u.status === "In Transit").length;

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Assets (ACS Units)</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage and track all ACS units across sites
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="default">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button size="default">
            <Plus className="w-4 h-4" />
            Add Unit
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="data-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Box className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="metric-value">{totalUnits}</p>
                <p className="metric-label">Total Units</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="data-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-success)/0.15)] flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[hsl(var(--status-success))]" />
              </div>
              <div>
                <p className="metric-value">{operationalUnits}</p>
                <p className="metric-label">Operational</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="data-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-error)/0.15)] flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-[hsl(var(--status-error))]" />
              </div>
              <div>
                <p className="metric-value">{faultyUnits}</p>
                <p className="metric-label">Faulty</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="data-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-info)/0.15)] flex items-center justify-center">
                <Clock className="w-5 h-5 text-[hsl(var(--status-info))]" />
              </div>
              <div>
                <p className="metric-value">{pendingUnits}</p>
                <p className="metric-label">Pending</p>
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
            placeholder="Search by serial, site, or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-secondary/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "all" ? "All Statuses" : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={modelFilter} onValueChange={setModelFilter}>
            <SelectTrigger className="w-[140px] bg-secondary/50">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {models.map((model) => (
                <SelectItem key={model} value={model}>
                  {model === "all" ? "All Models" : model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex border border-border rounded-lg p-0.5 bg-secondary/30">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("table")}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <Card className="border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-muted-foreground font-medium">Serial Number</TableHead>
                <TableHead className="text-muted-foreground font-medium">Model</TableHead>
                <TableHead className="text-muted-foreground font-medium">Site</TableHead>
                <TableHead className="text-muted-foreground font-medium">Location</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-muted-foreground font-medium">Install Date</TableHead>
                <TableHead className="text-muted-foreground font-medium">Next Maintenance</TableHead>
                <TableHead className="text-muted-foreground font-medium w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUnits.map((unit) => (
                <TableRow
                  key={unit.id}
                  className="cursor-pointer hover:bg-muted/50 border-border/50"
                  onClick={() => navigate(`/site/${unit.siteId}`)}
                >
                  <TableCell className="font-medium">{unit.serialNumber}</TableCell>
                  <TableCell>{unit.model}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      {unit.site}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{unit.location}</TableCell>
                  <TableCell>
                    <span className={`status-badge ${statusConfig[unit.status]?.color}`}>
                      {statusConfig[unit.status]?.icon}
                      {unit.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{unit.installDate}</TableCell>
                  <TableCell>
                    <span className={unit.nextMaintenance === "Overdue" ? "text-[hsl(var(--status-error))] font-medium" : "text-muted-foreground"}>
                      {unit.nextMaintenance}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Unit</DropdownMenuItem>
                        <DropdownMenuItem>Schedule Maintenance</DropdownMenuItem>
                        <DropdownMenuItem>Create Ticket</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUnits.map((unit, index) => (
            <Card
              key={unit.id}
              className="data-card cursor-pointer animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => navigate(`/site/${unit.siteId}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-foreground">{unit.serialNumber}</p>
                    <p className="text-sm text-muted-foreground">{unit.model}</p>
                  </div>
                  <span className={`status-badge ${statusConfig[unit.status]?.color}`}>
                    {statusConfig[unit.status]?.icon}
                    {unit.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{unit.site}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Box className="w-3.5 h-3.5" />
                    <span>{unit.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Installed: {unit.installDate}</span>
                  </div>
                </div>

                {unit.openTickets > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <span className="status-badge status-warning">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {unit.openTickets} open ticket{unit.openTickets > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredUnits.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
            <Box className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No units found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}
