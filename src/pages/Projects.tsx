import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, Plus, Filter, Building2, FolderKanban, 
  ChevronRight, Lock, IndianRupee, Calendar, Box,
  MoreHorizontal, Eye, Archive, FileText, MapPin, Trash2
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
// Projects are fetched from the backend API instead of mock data
import { AddProjectDialog } from "@/components/forms/AddProjectDialog";
import { AddSubprojectDialog } from "@/components/forms/AddSubprojectDialog";
import api from "@/lib/api";
import UploadSitesDialog from "@/components/sites/UploadSitesDialog";
import UploadResultDialog from "@/components/sites/UploadResultDialog";
import ViewImportsDialog from "@/components/sites/ViewImportsDialog";
import { toast } from "sonner";

const statusColors = {
  active: "bg-status-success/15 text-status-success",
  "on-hold": "bg-status-warning/15 text-status-warning",
  completed: "bg-status-info/15 text-status-info",
  // Make archived more visually distinct
  archived: "bg-status-warning/15 text-status-warning",
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

  const [projects, setProjects] = useState<any[]>([]);

  // Confirmation dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState<{ kind: 'project'|'subproject'; id: string; name: string; action: 'activate'|'deactivate'|'delete' } | null>(null);

  // Clients for filter
  const [clients, setClients] = useState<any[]>([]);
  const [clientFilter, setClientFilter] = useState<string>('all');
  // Pending attachments for next create
  const [pendingProjectFiles, setPendingProjectFiles] = useState<File[]>([]);
  const [pendingSubprojectFiles, setPendingSubprojectFiles] = useState<File[]>([]);

  // Documents modal
  const [docsOpen, setDocsOpen] = useState(false);
  const [docsList, setDocsList] = useState<string[]>([]);
  const [docsEntity, setDocsEntity] = useState<{ kind: 'project'|'subproject'; id: string; name: string } | null>(null);

  // import flow state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [importViewOpen, setImportViewOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeSubprojectId, setActiveSubprojectId] = useState<string | null>(null);
  const [lastSessionId, setLastSessionId] = useState<number | null>(null);
  const [resultOpen, setResultOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      console.debug('GET /projects response', res);
      setProjects(res.data || []);
    } catch (err) {
      toast.error('Failed to load projects');
      console.error('Failed to load projects', err);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients');
      setClients(res.data || []);
    } catch (err) {
      console.error('Failed to load clients', err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchClients();
  }, []);

  useEffect(() => {
    if (!docsOpen || !docsEntity) return;
    const fetchDocs = async () => {
      try {
        if (docsEntity.kind === 'project') {
          const res = await api.get(`/projects/${docsEntity.id}/documents`);
          setDocsList(res.data || []);
        } else {
          const res = await api.get(`/projects/subprojects/${docsEntity.id}/documents`);
          setDocsList(res.data || []);
        }
      } catch (err) {
        setDocsList([]);
      }
    };
    fetchDocs();
  }, [docsOpen, docsEntity]);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.clientName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    const matchesClient = clientFilter === 'all' || String(project.clientId) === clientFilter;
    return matchesSearch && matchesStatus && matchesClient;
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

  // Format createdAt
  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch (e) {
      return iso;
    }
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

  // Project actions (activate/deactivate/delete)
  const handleProjectAction = async (projectId: string, action: 'activate'|'deactivate'|'delete', skipConfirm = false) => {
    try {
      if (!skipConfirm) {
        setConfirmPayload({ kind: 'project', id: projectId, name: String(projects.find(p => p.id === projectId)?.name ?? projectId), action });
        setConfirmOpen(true);
        return;
      }

      if (action === 'delete') {
        await api.delete(`/projects/${projectId}`);
        toast.success('Project deleted');
      } else {
        const res = await api.patch(`/projects/${projectId}/${action}`);
        // If server returned a conflict message (e.g., client inactive), surface it
        if (res && res.status === 409 && res.data) {
          toast.error(String(res.data));
        } else {
          toast.success(`Project ${action}d`);
        }
      }
      await fetchProjects();
    } catch (err: any) {
      console.error('Project action failed', err);
      const msg = err?.response?.data || err?.message || 'Action failed';
      toast.error(String(msg));
    }
  };

  // Subproject actions (activate/deactivate/delete)
  const handleSubprojectAction = async (subprojectId: string, action: 'activate'|'deactivate'|'delete', skipConfirm = false) => {
    try {
      // Prevent activating subproject if parent client is inactive
      if (action === 'activate') {
        const parentProject = projects.find(p => (p.subprojects || []).some((s:any) => s.id === subprojectId));
        if (parentProject && parentProject.clientActive === false) {
          toast.warning('Cannot activate subproject — the parent client is inactive.');
          return;
        }
      }

      if (!skipConfirm) {
        // find name for dialog
        const name = projects.flatMap(p => p.subprojects || []).find((s:any) => s.id === subprojectId)?.name ?? subprojectId;
        setConfirmPayload({ kind: 'subproject', id: subprojectId, name, action });
        setConfirmOpen(true);
        return;
      }

      if (action === 'delete') {
        await api.delete(`/projects/subprojects/${subprojectId}`);
        toast.success('Subproject deleted');
      } else {
        const res = await api.patch(`/projects/subprojects/${subprojectId}/${action}`);
        if (res && res.status === 409 && res.data) {
          toast.error(String(res.data));
        } else {
          toast.success(`Subproject ${action}d`);
        }
      }
      await fetchProjects();
    } catch (err: any) {
      console.error('Subproject action failed', err);
      const msg = err?.response?.data || err?.message || 'Action failed';
      toast.error(String(msg));
    }
  };

  // Stats
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === "active").length;
  const totalMonthlyRevenue = projects.reduce((sum, p) => sum + (Number(p.monthlyRevenue || 0)), 0);
  const totalACS = projects.reduce((sum, p) => sum + (p.totalACS || 0), 0);

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

      {/* Create project dialog */}
      <AddProjectDialog
        open={addProjectOpen}
        onOpenChange={setAddProjectOpen}
        onFilesChange={(files) => setPendingProjectFiles(files)}
        onSubmit={async (data) => {
          console.debug('Projects onSubmit called', data);
          try {
            const payload = {
              name: data.name,
              description: data.description,
              clientId: Number(data.clientId),
              status: data.status,
            };
            console.debug('POST /projects payload', payload);
            const res = await api.post('/projects', payload);
            console.debug('POST /projects response', res);
            if (res.status === 201 || res.status === 200) {
              setAddProjectOpen(false);
              const createdId = res.data && res.data.id;
              // Upload attachments if any
              if (createdId && pendingProjectFiles.length > 0) {
                try {
                  const formData = new FormData();
                  pendingProjectFiles.forEach(f => formData.append('files', f));
                  formData.append('entityType', 'PROJECT');
                  formData.append('entityId', String(createdId));
                  await api.post('/documents/upload', formData);
                  setPendingProjectFiles([]);
                } catch (uploadErr) {
                  toast.error('Project created but file upload failed');
                }
              }

              // Add created project optimistically (if returned), then refresh from server to ensure list and metrics are accurate
              if (res.data && res.data.id) {
                setProjects(prev => [
                  {
                    id: res.data.id,
                    name: res.data.name,
                    description: res.data.description,
                    clientName: res.data.client?.name || res.data.clientName || '',
                    status: res.data.status,
                    createdAt: res.data.createdAt,
                    createdBy: res.data.createdBy,
                    subprojects: res.data.subprojects || [],
                    monthlyRevenue: res.data.monthlyRevenue,
                    totalACS: res.data.totalACS,
                    totalSites: res.data.totalSites,
                  },
                  ...prev,
                ]);
              }
              // Always refresh from server to get canonical data
              await fetchProjects();
            } else {
              toast.error('Failed to create project');
              console.error('Unexpected response creating project', res);
            }
          } catch (err: any) {
            console.error('Create project error caught in Projects.tsx', err);
            const msg = err?.response?.data || err.message || 'Failed to create project';
            toast.error(String(msg));
            throw err; // rethrow so dialog can show error too
          }
        }}
      />

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={() => setConfirmOpen(false)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>{confirmPayload?.action && `${confirmPayload.action.charAt(0).toUpperCase() + confirmPayload.action.slice(1)} ${confirmPayload?.kind ? confirmPayload.kind : ''}`}</DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmPayload?.action} {confirmPayload?.kind} "{confirmPayload?.name}"?
              {confirmPayload?.action === 'deactivate' && confirmPayload?.kind === 'project' && (
                <div className="mt-2 text-xs text-muted-foreground">This will archive the project and all its subprojects. You can restore them by activating the client (if the client is active) or reactivating the project.</div>
              )}
              {confirmPayload?.action === 'deactivate' && confirmPayload?.kind === 'subproject' && (
                <div className="mt-2 text-xs text-muted-foreground">This will archive the subproject and its configuration. Sites and documents remain available.</div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button onClick={async () => {
                if (!confirmPayload) return;
                const { kind, id, action } = confirmPayload;
                try {
                  if (kind === 'project') {
                    await handleProjectAction(id, action, true);
                  } else {
                    await handleSubprojectAction(id, action, true);
                  }
                  setConfirmOpen(false);
                } catch (e) {
                  // handled in handlers
                }
              }}>{confirmPayload?.action}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Documents Modal */}
      <Dialog open={docsOpen} onOpenChange={setDocsOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Documents</DialogTitle>
            <DialogDescription>
              {docsEntity?.kind && docsEntity?.name && `${docsEntity.kind === 'project' ? 'Project' : 'Subproject'}: ${docsEntity.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {docsList.length > 0 ? (
              docsList.map(doc => (
                <div key={doc} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">{doc}</span>
                  <div className="flex gap-2">
                    <a href={docsEntity?.kind === 'project' ? `/api/projects/${docsEntity.id}/documents/${doc}?action=view` : `/api/projects/subprojects/${docsEntity.id}/documents/${doc}?action=view`} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">View</a>
                    <a href={docsEntity?.kind === 'project' ? `/api/projects/${docsEntity.id}/documents/${doc}` : `/api/projects/subprojects/${docsEntity.id}/documents/${doc}`} download className="text-sm text-primary hover:underline">Download</a>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No documents found.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              <Archive className="w-5 h-5 text-status-success" />
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

        <div className="flex items-center gap-3">
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

          <Select value={clientFilter} onValueChange={(v) => setClientFilter(v)}>
            <SelectTrigger className="w-[200px] bg-secondary/50">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.map((project) => {
          const isExpanded = expandedProjects.has(project.id);
          const projectStats = {
            monthlyRevenue: Number(project.monthlyRevenue || 0),
            activeACS: project.activeACS || 0,
            totalACS: project.totalACS || 0,
            totalSites: project.totalSites ?? 0,
          };
          
          return (
            <div key={project.id} className="data-card p-0 overflow-hidden">
              {/* Project Header */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleProject(project.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleProject(project.id); }}
                className={cn("w-full text-left p-5 hover:bg-secondary/30 transition-colors cursor-pointer", project.status === 'archived' && "border-l-4 border-status-warning/20")}
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
                          Created {formatDate(project.createdAt)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          {project.createdBy ? `Created by ${project.createdBy}` : '—'}
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

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDocsEntity({ kind: 'project', id: project.id, name: project.name }); setDocsOpen(true); }}>
                          <FileText className="w-4 h-4 mr-2" />
                          Documents
                        </DropdownMenuItem>
                        {project.status !== 'active' && (
                          project.clientActive === false ? (
                            <DropdownMenuItem disabled>
                              Activate (client inactive)
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleProjectAction(project.id, 'activate'); }}>
                              Activate
                            </DropdownMenuItem>
                          )
                        )}
                        {project.status === 'active' && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleProjectAction(project.id, 'deactivate'); }}>
                            Deactivate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleProjectAction(project.id, 'delete'); }}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <ChevronRight className={cn(
                      "w-5 h-5 text-muted-foreground transition-transform duration-200",
                      isExpanded && "rotate-90"
                    )} />
                  </div>
                </div>
              </div>

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
                        // For now backend returns minimal subproject fields. Guard configuration access.
                        const config = (subproject as any).configuration;
                        return (
                          <div
                            key={subproject.id}
                            className={cn("bg-background rounded-lg border border-border p-4 hover:border-primary/30 transition-colors cursor-pointer", subproject.status !== 'active' && "opacity-60")}
                            onClick={() => handleSubprojectClick(project.id, subproject.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h5 className="font-medium text-foreground">{subproject.name}</h5>
                                  {config?.version && (
                                    <Badge variant="outline" className="text-xs bg-muted/50">
                                      Config v{config.version}
                                    </Badge>
                                  )}
                                </div>

                                {subproject.description && (
                                  <p className="text-sm text-muted-foreground mb-2">{subproject.description}</p>
                                )}
                                
                                {/* Configuration Details (if present) */}
                                {config ? (
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div className="space-y-1">
                                      <div className="text-xs text-muted-foreground">Base Rent per asset </div>
                                      <div className="font-medium text-foreground flex items-center gap-1">
                                        <IndianRupee className="w-3.5 h-3.5" />
                                        {config.baseMonthlyRent.toLocaleString("en-IN")}/mo
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="text-xs text-muted-foreground">Tenure</div>
                                      <div className="font-medium text-foreground flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {config.tenureMonths} months
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="text-xs text-muted-foreground">Installation</div>
                                      <div className="font-medium text-foreground">
                                        {config.installationChargeable 
                                          ? `₹${config.installationCharge?.toLocaleString("en-IN")}`
                                          : <span className="text-status-success">Included</span>
                                        }
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="text-xs text-muted-foreground">Maintenance</div>
                                      <div className="font-medium text-foreground">
                                        {config.maintenanceIncluded 
                                          ? <span className="text-status-success">Included</span>
                                          : `₹${config.maintenanceCharge?.toLocaleString("en-IN")}/mo`
                                        }
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-sm text-muted-foreground">No configuration details available. This subproject does not have a locked pricing configuration yet.</div>
                                )}
                                
                                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/60 text-xs text-muted-foreground">
                                  <span>{(subproject.sitesCount ?? '—')} sites</span>
                                  <span>{(subproject.acsCount ?? '—')} ACS units</span>
                                  <span>Created by {subproject.createdBy ?? '—'}</span>
                                  {subproject.status !== 'active' && (
                                    <Badge variant="outline" className={cn("text-xs", statusColors[subproject.status] || "bg-muted text-muted-foreground")}>{subproject.status}</Badge>
                                  )}
                                </div>
                                <div className="flex gap-2 items-center mt-2">
                                  <Button 
                                    variant="default" 
                                    size="sm" 
                                    className="gap-1.5"
                                    onClick={(e) => { e.stopPropagation(); setActiveProjectId(project.id); setActiveSubprojectId(subproject.id); setUploadOpen(true); }}
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    Import Sites / Assets
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="gap-1.5"
                                    onClick={(e) => { e.stopPropagation(); setActiveProjectId(project.id); setActiveSubprojectId(subproject.id); setImportViewOpen(true); }}
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    View Imports
                                  </Button>
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
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDocsEntity({ kind: 'subproject', id: subproject.id, name: subproject.name }); setDocsOpen(true); }}>
                                    <FileText className="w-4 h-4 mr-2" />
                                    Documents
                                  </DropdownMenuItem>
                                  {subproject.status !== 'active' && (
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSubprojectAction(subproject.id, 'activate'); }}>
                                      Activate
                                    </DropdownMenuItem>
                                  )}
                                  {subproject.status === 'active' && (
                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSubprojectAction(subproject.id, 'deactivate'); }}>
                                      Deactivate
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSubprojectAction(subproject.id, 'delete'); }}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Subproject
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


      
      {/* Import dialogs */}
      <UploadSitesDialog open={uploadOpen} onOpenChange={setUploadOpen} projectId={activeProjectId ?? ''} subprojectId={activeSubprojectId ?? ''} onUploaded={(res) => { setLastSessionId(res.sessionId); setResultOpen(true); }} />

      <UploadResultDialog open={resultOpen} onOpenChange={setResultOpen} projectId={activeProjectId ?? ''} subprojectId={activeSubprojectId ?? ''} sessionId={lastSessionId} onProcessed={() => { setResultOpen(false); setImportViewOpen(false); fetchProjects(); }} />

      <ViewImportsDialog open={importViewOpen} onOpenChange={setImportViewOpen} projectId={activeProjectId ?? ''} subprojectId={activeSubprojectId ?? ''} onProcessed={() => { setImportViewOpen(false); fetchProjects(); }} />

      {selectedProjectForSubproject && (
        <AddSubprojectDialog 
          open={addSubprojectOpen} 
          onOpenChange={setAddSubprojectOpen}
          projectId={selectedProjectForSubproject.id}
          projectName={selectedProjectForSubproject.name}
          onFilesChange={(files) => setPendingSubprojectFiles(files)}
          onSubmit={async (data) => {
            try {
              const res = await api.post(`/projects/${selectedProjectForSubproject.id}/subprojects`, data);
              const createdSubId = res.data && res.data.id;

              // Upload attachments if any
              if (createdSubId && pendingSubprojectFiles.length > 0) {
                try {
                  const formData = new FormData();
                  pendingSubprojectFiles.forEach(f => formData.append('files', f));
                  formData.append('entityType', 'SUBPROJECT');
                  formData.append('entityId', String(createdSubId));
                  await api.post('/documents/upload', formData);
                  setPendingSubprojectFiles([]);
                } catch (uploadErr) {
                  toast.error('Subproject created but file upload failed');
                }
              }

              setAddSubprojectOpen(false);
              fetchProjects();
            } catch (err) {
              toast.error('Failed to create subproject');
            }
          }}
        />
      )}
    </div>
  );
}
