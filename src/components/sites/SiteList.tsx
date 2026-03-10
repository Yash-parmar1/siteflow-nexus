import { useState, useMemo, useEffect } from "react";
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
import { Search, Plus, Filter, Grid3X3, List, FolderKanban, X, Download } from "lucide-react";
import { useAppData } from "@/context/AppDataContext";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { normalizeStage, computeProgress } from "@/lib/stageUtils";

interface ProjectOption {
  id: string;
  name: string;
  subprojects: { id: string; name: string }[];
}

export function SiteList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: appData, loading, error } = useAppData();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  
  // Fetch projects for filter dropdowns
  useEffect(() => {
    api.get('/projects')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setProjects(data.map((p: any) => ({
          id: String(p.id),
          name: p.name,
          subprojects: (p.subprojects || []).map((s: any) => ({
            id: String(s.id),
            name: s.name,
          })),
        })));
      })
      .catch(() => {});
  }, []);
  
  // Map sites from AppDataContext into shape ProjectBoundSiteCard expects
  const sites = useMemo(() => {
    if (!appData?.sites) return [];
    return appData.sites.map(s => {
      const stage = normalizeStage(s.currentStage);
      const planned = s.acsPlanned ?? s.plannedAcsCount ?? 0;
      const installed = s.acsInstalled ?? 0;
      return {
        id: String(s.id),
        name: s.name || "Unnamed Site",
        location: s.location || s.addressJson || "",
        stage,
        progress: computeProgress(s.progress ?? 0, stage, planned, installed),
        acsPlanned: planned,
        acsInstalled: installed,
        hasDelay: s.hasDelay ?? false,
        rentStartDate: undefined as string | undefined,
        projectId: s.projectId ? String(s.projectId) : "",
        projectName: s.projectName || "",
        subprojectId: s.subprojectId ? String(s.subprojectId) : "",
        subprojectName: s.subprojectName || "",
        configVersion: "1.0",
        configuredRent: typeof s.configuredRent === 'number' ? s.configuredRent : 0,
        configuredTenure: typeof s.configuredTenure === 'number' ? s.configuredTenure : 36,
      };
    });
  }, [appData?.sites]);
  
  // Read filters from URL
  const urlProjectId = searchParams.get("projectId") || "";
  const urlSubprojectId = searchParams.get("subprojectId") || "";
  
  // If we have a subprojectId but no projectId, derive projectId from sites
  const derivedProjectId = urlSubprojectId 
    ? sites.find(s => s.subprojectId === urlSubprojectId)?.projectId || ""
    : urlProjectId;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>(derivedProjectId || "all");
  const [subprojectFilter, setSubprojectFilter] = useState<string>(urlSubprojectId || "all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [addSiteOpen, setAddSiteOpen] = useState(false);

  // Get subproject info if filtered
  const subprojectInfo = useMemo(() => {
    if (!urlSubprojectId) return null;
    for (const p of projects) {
      const sub = p.subprojects.find(s => s.id === urlSubprojectId);
      if (sub) return { project: p, subproject: sub };
    }
    return null;
  }, [urlSubprojectId, projects]);

  // Unique projects for filter
  const projectOptions = projects.map(p => ({ id: p.id, name: p.name }));
  
  // Subprojects for selected project
  const selectedProject = projects.find(p => p.id === projectFilter);
  const subprojectOptions = selectedProject?.subprojects || [];

  const filteredSites = useMemo(() => sites.filter((site) => {
    const matchesSearch =
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = stageFilter === "all" || site.stage === stageFilter;
    const matchesProject = projectFilter === "all" || site.projectId === projectFilter;
    const matchesSubproject = subprojectFilter === "all" || site.subprojectId === subprojectFilter;
    return matchesSearch && matchesStage && matchesProject && matchesSubproject;
  }), [sites, searchQuery, stageFilter, projectFilter, subprojectFilter]);

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

  if (loading) {
    return (
      <div className="p-6 animate-fade-in">
        <div className="flex items-center justify-center py-16">
          <div className="text-sm text-muted-foreground">Loading sites...</div>
        </div>
      </div>
    );
  }

  if (error && !appData) {
    return (
      <div className="p-6 animate-fade-in">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h3 className="text-lg font-medium text-destructive mb-1">Failed to load sites</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const handleExport = () => {
    const src = filteredSites;
    if (!src.length) { toast.warning("No sites to export"); return; }
    const allSites = appData?.sites ?? [];
    const rows = src.map(s => {
      const full = allSites.find(x => String(x.id) === s.id);
      return {
        "Site Code": full?.siteCode ?? "",
        "Name": s.name,
        "Location": s.location,
        "Project": s.projectName,
        "Subproject": s.subprojectName,
        "Client": full?.clientName ?? "",
        "Site Type": full?.siteType ?? "",
        "Region Type": full?.regionType ?? "",
        "Stage": s.stage,
        "Progress (%)": s.progress,
        "Status": full?.status ?? "",
        "Preferred AC Make": full?.preferredAcMake ?? "",
        "Planned ACs": s.acsPlanned,
        "ACs Installed": s.acsInstalled,
        "Has Delay": s.hasDelay ? "Yes" : "No",
        "Expected Live Date": full?.expectedLiveDate ?? "",
        "Actual Live Date": full?.actualLiveDate ?? "",
        "Configured Rent": s.configuredRent,
        "Configured Tenure": s.configuredTenure,
        "Notes": full?.notes ?? "",
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = Object.keys(rows[0]).map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sites");
    XLSX.writeFile(wb, `Sites_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(`Exported ${rows.length} sites`);
  };

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
        <div className="flex gap-2">
          <Button variant="outline" size="default" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button size="default" className="shrink-0" onClick={() => setAddSiteOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Site
          </Button>
        </div>
      </div>

      {/* Active filter banner */}
      {subprojectInfo && (
        <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FolderKanban className="w-4 h-4 text-primary" />
            <span className="text-sm">
              Showing sites for <strong>{subprojectInfo.project.name}</strong> / <strong>{subprojectInfo.subproject.name}</strong>
            </span>
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
