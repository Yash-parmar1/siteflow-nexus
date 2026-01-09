import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AddInstallationDialog } from "@/components/forms/AddInstallationDialog";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Plus,
  Filter,
  Truck,
  Package,
  MapPin,
  Calendar,
  User,
  MoreHorizontal,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  FileText,
  Camera,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data for installations
const mockInstallations = [
  {
    id: "INS-001",
    docketId: "DOC-2024-0045",
    site: "Metro Tower - Block A",
    siteId: "site-001",
    units: 3,
    status: "In Transit",
    progress: 40,
    shipmentDate: "Dec 20, 2024",
    eta: "Dec 26, 2024",
    installer: "TechServe Solutions",
    installerContact: "+91 98765 43210",
    priority: "High",
    notes: "Expedited shipping requested",
  },
  {
    id: "INS-002",
    docketId: "DOC-2024-0044",
    site: "Phoenix Mall Expansion",
    siteId: "site-002",
    units: 5,
    status: "Scheduled",
    progress: 15,
    shipmentDate: "Dec 18, 2024",
    eta: "Dec 28, 2024",
    installer: "AirCool Installers",
    installerContact: "+91 98765 12345",
    priority: "Medium",
    notes: "",
  },
  {
    id: "INS-003",
    docketId: "DOC-2024-0043",
    site: "DLF Cyber City Phase 3",
    siteId: "site-005",
    units: 8,
    status: "Installing",
    progress: 75,
    shipmentDate: "Dec 10, 2024",
    eta: "Dec 22, 2024",
    installer: "ProInstall Inc.",
    installerContact: "+91 87654 32109",
    priority: "High",
    notes: "6 of 8 units installed",
  },
  {
    id: "INS-004",
    docketId: "DOC-2024-0042",
    site: "Prestige Tech Park",
    siteId: "site-004",
    units: 4,
    status: "Completed",
    progress: 100,
    shipmentDate: "Dec 05, 2024",
    eta: "Dec 15, 2024",
    installer: "TechServe Solutions",
    installerContact: "+91 98765 43210",
    priority: "Low",
    notes: "Installation completed ahead of schedule",
  },
  {
    id: "INS-005",
    docketId: "DOC-2024-0041",
    site: "Mindspace IT Park",
    siteId: "site-006",
    units: 10,
    status: "Pending Dispatch",
    progress: 5,
    shipmentDate: "-",
    eta: "Jan 05, 2025",
    installer: "AirCool Installers",
    installerContact: "+91 98765 12345",
    priority: "Medium",
    notes: "Awaiting site readiness confirmation",
  },
  {
    id: "INS-006",
    docketId: "DOC-2024-0040",
    site: "Cyber Hub Tower 5",
    siteId: "site-003",
    units: 2,
    status: "Delayed",
    progress: 30,
    shipmentDate: "Dec 08, 2024",
    eta: "Dec 30, 2024",
    installer: "ProInstall Inc.",
    installerContact: "+91 87654 32109",
    priority: "High",
    notes: "Delay due to site access issues",
  },
];

const statusConfig: Record<string, { color: string; bgColor: string }> = {
  "Pending Dispatch": { color: "text-muted-foreground", bgColor: "bg-muted" },
  "In Transit": { color: "text-[hsl(var(--status-info))]", bgColor: "bg-[hsl(var(--status-info)/0.15)]" },
  Scheduled: { color: "text-[hsl(var(--status-info))]", bgColor: "bg-[hsl(var(--status-info)/0.15)]" },
  Installing: { color: "text-[hsl(var(--status-warning))]", bgColor: "bg-[hsl(var(--status-warning)/0.15)]" },
  Completed: { color: "text-[hsl(var(--status-success))]", bgColor: "bg-[hsl(var(--status-success)/0.15)]" },
  Delayed: { color: "text-[hsl(var(--status-error))]", bgColor: "bg-[hsl(var(--status-error)/0.15)]" },
};

const priorityConfig: Record<string, string> = {
  High: "text-[hsl(var(--status-error))]",
  Medium: "text-[hsl(var(--status-warning))]",
  Low: "text-muted-foreground",
};

export default function Installations() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const filteredInstallations = mockInstallations.filter((inst) => {
    const matchesSearch =
      inst.docketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.installer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || inst.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = ["all", "Pending Dispatch", "In Transit", "Scheduled", "Installing", "Completed", "Delayed"];

  // Stats
  const totalInstallations = mockInstallations.length;
  const inProgress = mockInstallations.filter((i) => ["In Transit", "Installing", "Scheduled"].includes(i.status)).length;
  const completed = mockInstallations.filter((i) => i.status === "Completed").length;
  const delayed = mockInstallations.filter((i) => i.status === "Delayed").length;

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Installations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track shipments and installation progress
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="default">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button size="default" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4" />
            New Installation
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="data-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="metric-value">{totalInstallations}</p>
                <p className="metric-label">Total Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="data-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-warning)/0.15)] flex items-center justify-center">
                <Truck className="w-5 h-5 text-[hsl(var(--status-warning))]" />
              </div>
              <div>
                <p className="metric-value">{inProgress}</p>
                <p className="metric-label">In Progress</p>
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
                <p className="metric-value">{completed}</p>
                <p className="metric-label">Completed</p>
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
                <p className="metric-value">{delayed}</p>
                <p className="metric-label">Delayed</p>
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
            placeholder="Search by docket, site, or installer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-secondary/50">
            <Filter className="w-4 h-4 mr-2" />
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
      </div>

      {/* Installation Cards */}
      <div className="space-y-4">
        {filteredInstallations.map((inst, index) => (
          <Card
            key={inst.id}
            className="data-card cursor-pointer animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => navigate(`/site/${inst.siteId}`)}
          >
            <CardContent className="p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Section */}
                <div className="flex-1">
                  <div className="flex items-start justify-between lg:justify-start gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{inst.docketId}</span>
                        <span className={`text-xs font-medium ${priorityConfig[inst.priority]}`}>
                          {inst.priority} Priority
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        {inst.site}
                      </div>
                    </div>
                    <Badge className={`${statusConfig[inst.status]?.bgColor} ${statusConfig[inst.status]?.color} border-0`}>
                      {inst.status}
                    </Badge>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{inst.progress}%</span>
                    </div>
                    <Progress value={inst.progress} className="h-2" />
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-0.5">Units</p>
                      <p className="font-medium">{inst.units} ACS</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-0.5">Shipped</p>
                      <p className="font-medium">{inst.shipmentDate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-0.5">ETA</p>
                      <p className={`font-medium ${inst.status === "Delayed" ? "text-[hsl(var(--status-error))]" : ""}`}>
                        {inst.eta}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-0.5">Installer</p>
                      <p className="font-medium">{inst.installer}</p>
                    </div>
                  </div>

                  {inst.notes && (
                    <p className="mt-3 text-sm text-muted-foreground italic">
                      "{inst.notes}"
                    </p>
                  )}
                </div>

                {/* Right Section - Actions */}
                <div className="flex lg:flex-col gap-2 shrink-0">
                  <Button variant="outline" size="sm" className="flex-1 lg:flex-none" onClick={(e) => e.stopPropagation()}>
                    <FileText className="w-4 h-4" />
                    Documents
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 lg:flex-none" onClick={(e) => e.stopPropagation()}>
                    <Camera className="w-4 h-4" />
                    Evidence
                  </Button>
                  <Button size="sm" className="flex-1 lg:flex-none" onClick={(e) => e.stopPropagation()}>
                    View Site
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInstallations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
            <Truck className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No installations found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}

      <AddInstallationDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </div>
  );
}
