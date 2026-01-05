import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, Plus, Filter, Building2, FolderKanban, 
  ChevronRight, Lock, IndianRupee, Calendar, Box,
  MoreHorizontal, Eye, Archive, FileText, MapPin
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
import { mockProjects, getProjectStats, getSubprojectStats } from "@/data/mockData";
import { AddProjectDialog } from "@/components/forms/AddProjectDialog";
import { AddSubprojectDialog } from "@/components/forms/AddSubprojectDialog";

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
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [addSubprojectOpen, setAddSubprojectOpen] = useState(false);
  const [selectedProjectForSubproject, setSelectedProjectForSubproject] = useState<{ id: string; name: string } | null>(null);

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

  const handleAddSubproject = (projectId: string, projectName: string) => {
    setSelectedProjectForSubproject({ id: projectId, name: projectName });
    setAddSubprojectOpen(true);
  };

  const handleSubprojectClick = (projectId: string, subprojectId: string) => {
    // Navigate to sites filtered by this subproject
    navigate(`/?projectId=${projectId}&subprojectId=${subprojectId}`);
  };

  const handleViewAssets = (projectId: string, subprojectId: string) => {
    navigate(`/assets?projectId=${projectId}&subprojectId=${subprojectId}`);
  };

  // Stats
  const totalProjects = mockProjects.length;
  const activeProjects = mockProjects.filter(p => p.status === "active").length;
  const totalMonthlyRevenue = mockProjects.reduce((sum, p) => {
    const stats = getProjectStats(p.id);
    return sum + stats.monthlyRevenue;
  }, 0);
  const totalACS = mockProjects.reduce((sum, p) => {
    const stats = getProjectStats(p.id);
    return sum + stats.totalACS;
  }, 0);

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
        <Button size="default" className="shrink-0" onClick={() => setAddProjectOpen(true)}>
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
          const projectStats = getProjectStats(project.id);
          
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
                        {formatCurrency(projectStats.monthlyRevenue)}
                      </div>
                      <div className="text-xs text-muted-foreground">Monthly Revenue</div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-lg font-semibold text-foreground">
                        {projectStats.activeACS}<span className="text-sm text-muted-foreground">/{projectStats.totalACS}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Active ACS</div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-lg font-semibold text-foreground">{projectStats.totalSites}</div>
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
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAddSubproject(project.id, project.name)}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Subproject
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {project.subprojects.map((subproject) => {
                        const subStats = getSubprojectStats(subproject.id);
                        return (
                          <div
                            key={subproject.id}
                            className="bg-background rounded-lg border border-border p-4 hover:border-primary/30 transition-colors cursor-pointer"
                            onClick={() => handleSubprojectClick(project.id, subproject.id)}
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
                                  <span>{subStats.sitesCount} sites</span>
                                  <span>{subStats.acsCount} ACS units</span>
                                  <span>Created by {subproject.createdBy}</span>
                                </div>
                              </div>
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon-sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-popover border-border">
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleSubprojectClick(project.id, subproject.id);
                                  }}>
                                    <MapPin className="w-4 h-4 mr-2" />
                                    View Sites
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewAssets(project.id, subproject.id);
                                  }}>
                                    <Box className="w-4 h-4 mr-2" />
                                    View Assets
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                    <Archive className="w-4 h-4 mr-2" />
                                    Archive Subproject
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        );
                      })}
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

      {/* Dialogs */}
      <AddProjectDialog 
        open={addProjectOpen} 
        onOpenChange={setAddProjectOpen} 
      />
      
      {selectedProjectForSubproject && (
        <AddSubprojectDialog 
          open={addSubprojectOpen} 
          onOpenChange={setAddSubprojectOpen}
          projectId={selectedProjectForSubproject.id}
          projectName={selectedProjectForSubproject.name}
        />
      )}
    </div>
  );
}
