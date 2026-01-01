import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, Plus, Filter, Building2, FolderKanban, 
  ChevronRight, Lock, IndianRupee, Calendar, Box,
  MoreHorizontal, Eye, Archive, FileText
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Mock data
const mockProjects = [
  {
    id: "proj-001",
    name: "Dava India",
    description: "National ATM network deployment for Dava banking consortium",
    clientId: "client-001",
    clientName: "Dava Banking Group",
    status: "active" as const,
    createdAt: "2023-06-15",
    createdBy: "Rajesh Kumar",
    totalSites: 45,
    totalACS: 180,
    activeACS: 156,
    monthlyRevenue: 2250000,
    subprojects: [
      {
        id: "subproj-001",
        name: "Dava India Delhi",
        projectId: "proj-001",
        configuration: {
          id: "config-001",
          version: "1.0",
          createdAt: "2023-06-15",
          createdBy: "Rajesh Kumar",
          baseMonthlyRent: 12500,
          tenureMonths: 36,
          installationChargeable: false,
          maintenanceIncluded: true,
        },
        createdAt: "2023-06-15",
        createdBy: "Rajesh Kumar",
        status: "active" as const,
        sitesCount: 18,
        acsCount: 72,
      },
      {
        id: "subproj-002",
        name: "Dava India Mumbai",
        projectId: "proj-001",
        configuration: {
          id: "config-002",
          version: "1.0",
          createdAt: "2023-07-01",
          createdBy: "Priya Sharma",
          baseMonthlyRent: 15000,
          tenureMonths: 36,
          installationChargeable: true,
          installationCharge: 25000,
          maintenanceIncluded: true,
        },
        createdAt: "2023-07-01",
        createdBy: "Priya Sharma",
        status: "active" as const,
        sitesCount: 15,
        acsCount: 60,
      },
      {
        id: "subproj-003",
        name: "Dava India Bangalore",
        projectId: "proj-001",
        configuration: {
          id: "config-003",
          version: "1.0",
          createdAt: "2023-08-15",
          createdBy: "Amit Verma",
          baseMonthlyRent: 14000,
          tenureMonths: 48,
          installationChargeable: false,
          maintenanceIncluded: true,
        },
        createdAt: "2023-08-15",
        createdBy: "Amit Verma",
        status: "active" as const,
        sitesCount: 12,
        acsCount: 48,
      },
    ],
  },
  {
    id: "proj-002",
    name: "TechBank National",
    description: "Nationwide cooling infrastructure for TechBank ATMs",
    clientId: "client-002",
    clientName: "TechBank Ltd",
    status: "active" as const,
    createdAt: "2023-09-01",
    createdBy: "Suresh Patel",
    totalSites: 28,
    totalACS: 112,
    activeACS: 98,
    monthlyRevenue: 1568000,
    subprojects: [
      {
        id: "subproj-004",
        name: "TechBank Tier-1 Cities",
        projectId: "proj-002",
        configuration: {
          id: "config-004",
          version: "1.0",
          createdAt: "2023-09-01",
          createdBy: "Suresh Patel",
          baseMonthlyRent: 16000,
          tenureMonths: 36,
          installationChargeable: true,
          installationCharge: 30000,
          maintenanceIncluded: false,
          maintenanceCharge: 2000,
        },
        createdAt: "2023-09-01",
        createdBy: "Suresh Patel",
        status: "active" as const,
        sitesCount: 20,
        acsCount: 80,
      },
      {
        id: "subproj-005",
        name: "TechBank Tier-2 Cities",
        projectId: "proj-002",
        configuration: {
          id: "config-005",
          version: "1.0",
          createdAt: "2023-10-15",
          createdBy: "Suresh Patel",
          baseMonthlyRent: 12000,
          tenureMonths: 48,
          installationChargeable: false,
          maintenanceIncluded: true,
        },
        createdAt: "2023-10-15",
        createdBy: "Suresh Patel",
        status: "active" as const,
        sitesCount: 8,
        acsCount: 32,
      },
    ],
  },
  {
    id: "proj-003",
    name: "Metro Finance",
    description: "Metro Finance branch and ATM cooling solutions",
    clientId: "client-003",
    clientName: "Metro Finance Corp",
    status: "on-hold" as const,
    createdAt: "2024-01-10",
    createdBy: "Priya Sharma",
    totalSites: 8,
    totalACS: 24,
    activeACS: 0,
    monthlyRevenue: 0,
    subprojects: [
      {
        id: "subproj-006",
        name: "Metro Finance Phase 1",
        projectId: "proj-003",
        configuration: {
          id: "config-006",
          version: "1.0",
          createdAt: "2024-01-10",
          createdBy: "Priya Sharma",
          baseMonthlyRent: 11000,
          tenureMonths: 24,
          installationChargeable: false,
          maintenanceIncluded: true,
        },
        createdAt: "2024-01-10",
        createdBy: "Priya Sharma",
        status: "active" as const,
        sitesCount: 8,
        acsCount: 24,
      },
    ],
  },
];

const statusColors = {
  active: "bg-status-success/15 text-status-success",
  "on-hold": "bg-status-warning/15 text-status-warning",
  completed: "bg-status-info/15 text-status-info",
  archived: "bg-muted text-muted-foreground",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Projects() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(["proj-001"]));

  const filteredProjects = mockProjects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  // Stats
  const totalProjects = mockProjects.length;
  const activeProjects = mockProjects.filter(p => p.status === "active").length;
  const totalMonthlyRevenue = mockProjects.reduce((sum, p) => sum + p.monthlyRevenue, 0);
  const totalACS = mockProjects.reduce((sum, p) => sum + p.totalACS, 0);

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Commercial agreements and pricing configurations
          </p>
        </div>
        <Button size="default" className="shrink-0">
          <Plus className="w-4 h-4" />
          New Project
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="data-card">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <FolderKanban className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-foreground">{totalProjects}</div>
              <div className="text-xs text-muted-foreground">Total Projects</div>
            </div>
          </div>
        </div>
        <div className="data-card">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-status-success/10">
              <Building2 className="w-5 h-5 text-status-success" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-foreground">{activeProjects}</div>
              <div className="text-xs text-muted-foreground">Active Projects</div>
            </div>
          </div>
        </div>
        <div className="data-card">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent/10">
              <IndianRupee className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-foreground">
                {formatCurrency(totalMonthlyRevenue)}
              </div>
              <div className="text-xs text-muted-foreground">Monthly Revenue</div>
            </div>
          </div>
        </div>
        <div className="data-card">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-status-info/10">
              <Box className="w-5 h-5 text-status-info" />
            </div>
            <div>
              <div className="text-2xl font-semibold text-foreground">{totalACS}</div>
              <div className="text-xs text-muted-foreground">Total ACS Units</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search projects or clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] bg-secondary/50">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on-hold">On Hold</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.map((project) => {
          const isExpanded = expandedProjects.has(project.id);
          
          return (
            <div key={project.id} className="data-card p-0 overflow-hidden">
              {/* Project Header */}
              <button
                onClick={() => toggleProject(project.id)}
                className="w-full text-left p-5 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                      <FolderKanban className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-foreground">{project.name}</h3>
                        <Badge variant="outline" className={cn("text-xs", statusColors[project.status])}>
                          {project.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{project.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" />
                          {project.clientName}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Created {project.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                      <div className="text-lg font-semibold text-foreground">
                        {formatCurrency(project.monthlyRevenue)}
                      </div>
                      <div className="text-xs text-muted-foreground">Monthly Revenue</div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-lg font-semibold text-foreground">
                        {project.activeACS}<span className="text-sm text-muted-foreground">/{project.totalACS}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Active ACS</div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-lg font-semibold text-foreground">{project.totalSites}</div>
                      <div className="text-xs text-muted-foreground">Sites</div>
                    </div>
                    <ChevronRight className={cn(
                      "w-5 h-5 text-muted-foreground transition-transform duration-200",
                      isExpanded && "rotate-90"
                    )} />
                  </div>
                </div>
              </button>

              {/* Subprojects */}
              {isExpanded && (
                <div className="border-t border-border bg-secondary/20">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                        Subprojects & Configurations
                      </h4>
                      <Button variant="outline" size="sm">
                        <Plus className="w-3.5 h-3.5" />
                        Add Subproject
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {project.subprojects.map((subproject) => (
                        <div
                          key={subproject.id}
                          className="bg-background rounded-lg border border-border p-4 hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h5 className="font-medium text-foreground">{subproject.name}</h5>
                                <Badge variant="outline" className="text-xs bg-muted/50">
                                  Config v{subproject.configuration.version}
                                </Badge>
                              </div>
                              
                              {/* Configuration Details */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="space-y-1">
                                  <div className="text-xs text-muted-foreground">Base Rent</div>
                                  <div className="font-medium text-foreground flex items-center gap-1">
                                    <IndianRupee className="w-3.5 h-3.5" />
                                    {subproject.configuration.baseMonthlyRent.toLocaleString("en-IN")}/mo
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs text-muted-foreground">Tenure</div>
                                  <div className="font-medium text-foreground flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {subproject.configuration.tenureMonths} months
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs text-muted-foreground">Installation</div>
                                  <div className="font-medium text-foreground">
                                    {subproject.configuration.installationChargeable 
                                      ? `₹${subproject.configuration.installationCharge?.toLocaleString("en-IN")}`
                                      : <span className="text-status-success">Included</span>
                                    }
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs text-muted-foreground">Maintenance</div>
                                  <div className="font-medium text-foreground">
                                    {subproject.configuration.maintenanceIncluded 
                                      ? <span className="text-status-success">Included</span>
                                      : `₹${subproject.configuration.maintenanceCharge?.toLocaleString("en-IN")}/mo`
                                    }
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                                <span>{subproject.sitesCount} sites</span>
                                <span>{subproject.acsCount} ACS units</span>
                                <span>Created by {subproject.createdBy}</span>
                              </div>
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-popover border-border">
                                <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}/subprojects/${subproject.id}`)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileText className="w-4 h-4 mr-2" />
                                  View Sites
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Archive className="w-4 h-4 mr-2" />
                                  Archive Subproject
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
            <FolderKanban className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No projects found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}
