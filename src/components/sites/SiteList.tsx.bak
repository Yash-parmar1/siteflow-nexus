import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ProjectBoundSiteCard } from "./ProjectBoundSiteCard";
import { AddSiteDialog } from "@/components/forms/AddSiteDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Filter, Grid3X3, List, FolderKanban, X } from "lucide-react";
import { mockSites, mockProjects, getSubprojectById } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";

export function SiteList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read filters from URL
  const urlProjectId = searchParams.get("projectId") || "";
  const urlSubprojectId = searchParams.get("subprojectId") || "";
  
  // If we have a subprojectId but no projectId, derive projectId from mockSites
  const derivedProjectId = urlSubprojectId 
    ? mockSites.find(s => s.subprojectId === urlSubprojectId)?.projectId || ""
    : urlProjectId;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>(derivedProjectId || "all");
  const [subprojectFilter, setSubprojectFilter] = useState<string>(urlSubprojectId || "all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [addSiteOpen, setAddSiteOpen] = useState(false);

  // Get subproject info if filtered
  const subprojectInfo = urlSubprojectId ? getSubprojectById(urlSubprojectId) : null;

  // Unique projects for filter
  const projectOptions = mockProjects.map(p => ({ id: p.id, name: p.name }));
  
  // Subprojects for selected project
  const selectedProject = mockProjects.find(p => p.id === projectFilter);
  const subprojectOptions = selectedProject?.subprojects.map(s => ({ id: s.id, name: s.name })) || [];

  const filteredSites = mockSites.filter((site) => {
    const matchesSearch =
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = stageFilter === "all" || site.stage === stageFilter;
    const matchesProject = projectFilter === "all" || site.projectId === projectFilter;
    const matchesSubproject = subprojectFilter === "all" || site.subprojectId === subprojectFilter;
    return matchesSearch && matchesStage && matchesProject && matchesSubproject;
  });

  const stages = ["all", "Started", "WTS", "WIP", "TIS", "Installed", "Live"];

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
          <h1 className="text-2xl font-semibold text-foreground">Sites</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filteredSites.length} sites{hasActiveFilters ? " (filtered)" : " across all projects"}
          </p>
        </div>
        <Button size="default" className="shrink-0" onClick={() => setAddSiteOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Site
        </Button>
      </div>

      {/* Active filter banner */}
      {subprojectInfo && (
        <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FolderKanban className="w-4 h-4 text-primary" />
            <span className="text-sm">
              Showing sites for <strong>{subprojectInfo.project.name}</strong> / <strong>{subprojectInfo.subproject.name}</strong>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search sites, projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select value={projectFilter} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-[160px] bg-secondary/50">
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
              <SelectTrigger className="w-[160px] bg-secondary/50">
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

          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[140px] bg-secondary/50">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {stages.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stage === "all" ? "All Stages" : stage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex border border-border rounded-lg p-0.5 bg-secondary/30">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Site Grid */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            : "flex flex-col gap-3"
        }
      >
        {filteredSites.map((site, index) => (
          <div
            key={site.id}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <ProjectBoundSiteCard site={site} onClick={() => navigate(`/site/${site.id}`)} />
          </div>
        ))}
      </div>

      {filteredSites.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
            <Search className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No sites found</h3>
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

      <AddSiteDialog 
        open={addSiteOpen} 
        onOpenChange={setAddSiteOpen}
        defaultProjectId={projectFilter !== "all" ? projectFilter : undefined}
        defaultSubprojectId={subprojectFilter !== "all" ? subprojectFilter : undefined}
      />
    </div>
  );
}
