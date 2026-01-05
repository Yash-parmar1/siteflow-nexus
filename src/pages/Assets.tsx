import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  FolderKanban,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { mockACSUnits, mockProjects, getSubprojectById } from "@/data/mockData";
import { AddUnitDialog } from "@/components/forms/AddUnitDialog";

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  Operational: { color: "status-success", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  "Under Maintenance": { color: "status-warning", icon: <Wrench className="w-3.5 h-3.5" /> },
  Faulty: { color: "status-error", icon: <XCircle className="w-3.5 h-3.5" /> },
  "Pending Install": { color: "status-info", icon: <Clock className="w-3.5 h-3.5" /> },
  "In Transit": { color: "status-neutral", icon: <Box className="w-3.5 h-3.5" /> },
};

export default function Assets() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read filters from URL
  const urlProjectId = searchParams.get("projectId") || "";
  const urlSubprojectId = searchParams.get("subprojectId") || "";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>(urlProjectId || "all");
  const [subprojectFilter, setSubprojectFilter] = useState<string>(urlSubprojectId || "all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [addUnitOpen, setAddUnitOpen] = useState(false);

  // Get subproject info if filtered
  const subprojectInfo = urlSubprojectId ? getSubprojectById(urlSubprojectId) : null;
  
  // Project options
  const projectOptions = mockProjects.map(p => ({ id: p.id, name: p.name }));
  
  // Subprojects for selected project
  const selectedProject = mockProjects.find(p => p.id === projectFilter);
  const subprojectOptions = selectedProject?.subprojects.map(s => ({ id: s.id, name: s.name })) || [];

  const filteredUnits = mockACSUnits.filter((unit) => {
    const matchesSearch =
      unit.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || unit.status === statusFilter;
    const matchesModel = modelFilter === "all" || unit.model === modelFilter;
    const matchesProject = projectFilter === "all" || unit.projectId === projectFilter;
    const matchesSubproject = subprojectFilter === "all" || unit.subprojectId === subprojectFilter;
    return matchesSearch && matchesStatus && matchesModel && matchesProject && matchesSubproject;
  });

  const statuses = ["all", "Operational", "Under Maintenance", "Faulty", "Pending Install", "In Transit"];
  const models = ["all", "ACS Pro X1", "ACS Pro X2", "ACS Lite", "ACS Ultra"];

  // Stats (filtered)
  const totalUnits = filteredUnits.length;
  const operationalUnits = filteredUnits.filter((u) => u.status === "Operational").length;
  const faultyUnits = filteredUnits.filter((u) => u.status === "Faulty").length;
  const pendingUnits = filteredUnits.filter((u) => u.status === "Pending Install" || u.status === "In Transit").length;

  const clearFilters = () => {
    setProjectFilter("all");
    setSubprojectFilter("all");
    setSearchParams({});
  };

  const handleProjectChange = (value: string) => {
    setProjectFilter(value);
    setSubprojectFilter("all");
    if (value === "all") {
      searchParams.delete("projectId");
      searchParams.delete("subprojectId");
    } else {
      searchParams.set("projectId", value);
      searchParams.delete("subprojectId");
    }
    setSearchParams(searchParams);
  };

  const handleSubprojectChange = (value: string) => {
    setSubprojectFilter(value);
    if (value === "all") {
      searchParams.delete("subprojectId");
    } else {
      searchParams.set("subprojectId", value);
    }
    setSearchParams(searchParams);
  };

  const hasActiveFilters = projectFilter !== "all" || subprojectFilter !== "all";

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Assets (ACS Units)</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalUnits} units{hasActiveFilters ? " (filtered)" : " across all sites"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="default">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button size="default" onClick={() => setAddUnitOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Unit
          </Button>
        </div>
      </div>

      {/* Active filter banner */}
      {subprojectInfo && (
        <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FolderKanban className="w-4 h-4 text-primary" />
            <span className="text-sm">
              Showing units for <strong>{subprojectInfo.project.name}</strong> / <strong>{subprojectInfo.subproject.name}</strong>
            </span>
            <Badge variant="outline" className="text-xs">
              ₹{subprojectInfo.subproject.configuration.baseMonthlyRent.toLocaleString("en-IN")}/mo • {subprojectInfo.subproject.configuration.tenureMonths}mo tenure
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-1" />
            Clear Filter
          </Button>
        </div>
      )}

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
          <Select value={projectFilter} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-[150px] bg-secondary/50">
              <FolderKanban className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Projects</SelectItem>
              {projectOptions.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {projectFilter !== "all" && subprojectOptions.length > 0 && (
            <Select value={subprojectFilter} onValueChange={handleSubprojectChange}>
              <SelectTrigger className="w-[140px] bg-secondary/50">
                <SelectValue placeholder="Subproject" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="all">All Subprojects</SelectItem>
                {subprojectOptions.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-secondary/50">
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
            <SelectTrigger className="w-[130px] bg-secondary/50">
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
                <TableHead className="text-muted-foreground font-medium">Project / Subproject</TableHead>
                <TableHead className="text-muted-foreground font-medium">Site</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-muted-foreground font-medium">Rent</TableHead>
                <TableHead className="text-muted-foreground font-medium">Tenure End</TableHead>
                <TableHead className="text-muted-foreground font-medium w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUnits.map((unit) => (
                <TableRow
                  key={unit.id}
                  className="cursor-pointer hover:bg-muted/50 border-border/50"
                  onClick={() => navigate(`/assets/${unit.id}`)}
                >
                  <TableCell className="font-medium">{unit.serialNumber}</TableCell>
                  <TableCell>{unit.model}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{unit.projectName}</span>
                      <span className="text-sm">{unit.subprojectName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      {unit.siteName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`status-badge ${statusConfig[unit.status]?.color}`}>
                      {statusConfig[unit.status]?.icon}
                      {unit.status}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    ₹{unit.configuredRent.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {unit.rentEndDate || "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem onClick={() => navigate(`/assets/${unit.id}`)}>
                          View Details
                        </DropdownMenuItem>
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
              onClick={() => navigate(`/assets/${unit.id}`)}
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
                    <FolderKanban className="w-3.5 h-3.5" />
                    <span>{unit.projectName} / {unit.subprojectName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{unit.siteName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>₹{unit.configuredRent.toLocaleString("en-IN")}/mo • {unit.tenureMonths}mo</span>
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
          <p className="text-sm text-muted-foreground mb-4">
            Try adjusting your search or filter criteria
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      )}

      <AddUnitDialog open={addUnitOpen} onOpenChange={setAddUnitOpen} />
    </div>
  );
}
