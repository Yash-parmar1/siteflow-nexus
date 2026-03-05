import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AddInstallationDialog } from "@/components/forms/AddInstallationDialog";
import { ImportInstallationsDialog } from "@/components/forms/ImportInstallationsDialog";
import { EditInstallationDialog } from "@/components/forms/EditInstallationDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Search, Plus, Filter, Truck, Package, MapPin, Calendar, MoreHorizontal,
  Download, CheckCircle2, Clock, AlertCircle, ArrowRight, FileText, Camera, Upload, Pencil, Eye, X,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppData, type InstallationData } from "@/context/AppDataContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EvidenceGallery } from "@/components/assets/EvidenceGallery";

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
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedInst, setSelectedInst] = useState<{ id: string; name: string } | null>(null);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const [evidenceDialogData, setEvidenceDialogData] = useState<{ photos: any[]; documents: any[]; title: string }>({ photos: [], documents: [], title: "" });
  const { data: appData, refresh } = useAppData();

  // Parse evidence for an installation
  const openEvidence = (inst: InstallationData) => {
    const photos: any[] = [];
    const documents: any[] = [];
    if (inst.evidenceImagesJson) {
      try {
        const urls = JSON.parse(inst.evidenceImagesJson);
        if (Array.isArray(urls)) {
          urls.forEach((url: string, i: number) => {
            photos.push({
              id: `photo-${i}`,
              url,
              thumbnailUrl: url,
              fileName: url.split('/').pop() || `photo-${i}.jpg`,
              fileSize: 0,
              mimeType: "image/jpeg",
              uploadedAt: inst.createdAt || new Date().toISOString(),
              uploadedBy: "System",
            });
          });
        }
      } catch {}
    }
    if (inst.serialNumberImageUrl) {
      documents.push({
        id: "serial-img",
        fileUrl: inst.serialNumberImageUrl,
        fileName: "serial-number.jpg",
        fileSize: 0,
        mimeType: "image/jpeg",
        uploadedAt: inst.createdAt || new Date().toISOString(),
        uploadedBy: "System",
        documentType: "Serial Number",
        description: "Serial number image",
      });
    }
    setEvidenceDialogData({ photos, documents, title: inst.bookingId || `Installation #${inst.id}` });
    setEvidenceDialogOpen(true);
  };

  // Map live installation data from backend
  const installations = (appData?.installations || []).map((inst: InstallationData) => ({
    id: String(inst.id),
    docketId: inst.bookingId ?? `DOC-${inst.id}`,
    site: inst.siteName ?? "Unknown",
    siteId: String(inst.siteId),
    units: 1,
    status: inst.shipmentStatus === "PENDING" ? "Pending Dispatch"
      : inst.shipmentStatus === "IN_TRANSIT" ? "In Transit"
      : inst.shipmentStatus === "DELIVERED" ? "Scheduled"
      : inst.shipmentStatus === "INSTALLED" ? "Completed"
      : inst.shipmentStatus ?? "Pending Dispatch",
    progress: inst.shipmentStatus === "INSTALLED" ? 100
      : inst.shipmentStatus === "DELIVERED" ? 75
      : inst.shipmentStatus === "IN_TRANSIT" ? 40
      : 5,
    shipmentDate: inst.createdAt ? new Date(inst.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-",
    eta: inst.eta ?? "-",
    installer: "-",
    installerContact: "-",
    priority: "Medium",
    notes: inst.remarks ?? "",
    acAssetSerial: inst.acAssetSerial ?? "",
    hasEvidence: !!(inst.serialNumberImageUrl || inst.evidenceImagesJson),
    _raw: inst,
  }));

  const filteredInstallations = installations.filter((inst) => {
    const matchesSearch =
      inst.docketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.site.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || inst.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = ["all", "Pending Dispatch", "In Transit", "Scheduled", "Installing", "Completed", "Delayed"];

  const totalInstallations = installations.length;
  const inProgress = installations.filter((i) => ["In Transit", "Installing", "Scheduled"].includes(i.status)).length;
  const completed = installations.filter((i) => i.status === "Completed").length;
  const delayed = installations.filter((i) => i.status === "Delayed").length;

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Installations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track shipments and installation progress</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="default"><Download className="w-4 h-4" />Export</Button>
          <Button variant="outline" size="default" onClick={() => setShowImportDialog(true)}><Upload className="w-4 h-4" />Import</Button>
          <Button size="default" onClick={() => setShowAddDialog(true)}><Plus className="w-4 h-4" />New Installation</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="data-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Package className="w-5 h-5 text-primary" /></div><div><p className="metric-value">{totalInstallations}</p><p className="metric-label">Total Jobs</p></div></div></CardContent></Card>
        <Card className="data-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-warning)/0.15)] flex items-center justify-center"><Truck className="w-5 h-5 text-[hsl(var(--status-warning))]" /></div><div><p className="metric-value">{inProgress}</p><p className="metric-label">In Progress</p></div></div></CardContent></Card>
        <Card className="data-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-success)/0.15)] flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-[hsl(var(--status-success))]" /></div><div><p className="metric-value">{completed}</p><p className="metric-label">Completed</p></div></div></CardContent></Card>
        <Card className="data-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-error)/0.15)] flex items-center justify-center"><AlertCircle className="w-5 h-5 text-[hsl(var(--status-error))]" /></div><div><p className="metric-value">{delayed}</p><p className="metric-label">Delayed</p></div></div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input type="search" placeholder="Search by docket or site..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-secondary/50"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {statuses.map((status) => (<SelectItem key={status} value={status}>{status === "all" ? "All Statuses" : status}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {/* Installation Cards */}
      <div className="space-y-4">
        {filteredInstallations.map((inst, index) => (
          <Card key={inst.id} className="data-card cursor-pointer animate-slide-up" style={{ animationDelay: `${index * 50}ms` }} onClick={() => navigate(`/site/${inst.siteId}`)}>
            <CardContent className="p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between lg:justify-start gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{inst.docketId}</span>
                        <span className={`text-xs font-medium ${priorityConfig[inst.priority]}`}>{inst.priority} Priority</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="w-3.5 h-3.5" />{inst.site}</div>
                    </div>
                    <Badge className={`${statusConfig[inst.status]?.bgColor} ${statusConfig[inst.status]?.color} border-0`}>{inst.status}</Badge>
                  </div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1.5"><span className="text-muted-foreground">Progress</span><span className="font-medium">{inst.progress}%</span></div>
                    <Progress value={inst.progress} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div><p className="text-muted-foreground mb-0.5">Units</p><p className="font-medium">{inst.units} ACS</p></div>
                    <div><p className="text-muted-foreground mb-0.5">Shipped</p><p className="font-medium">{inst.shipmentDate}</p></div>
                    <div><p className="text-muted-foreground mb-0.5">ETA</p><p className={`font-medium ${inst.status === "Delayed" ? "text-[hsl(var(--status-error))]" : ""}`}>{inst.eta}</p></div>
                    <div><p className="text-muted-foreground mb-0.5">Asset</p><p className="font-medium">{inst.acAssetSerial || "-"}</p></div>
                  </div>
                  {inst.notes && <p className="mt-3 text-sm text-muted-foreground italic">"{inst.notes}"</p>}
                </div>
                <div className="flex lg:flex-col gap-2 shrink-0">
                  {inst.hasEvidence && (
                    <Button variant="outline" size="sm" className="flex-1 lg:flex-none" onClick={(e) => { e.stopPropagation(); openEvidence(inst._raw); }}>
                      <Camera className="w-4 h-4" />Evidence
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="flex-1 lg:flex-none" onClick={(e) => { e.stopPropagation(); setSelectedInst({ id: inst.id, name: inst.docketId }); setEditOpen(true); }}>
                    <Pencil className="w-4 h-4" />Edit
                  </Button>
                  <Button size="sm" className="flex-1 lg:flex-none" onClick={(e) => { e.stopPropagation(); navigate(`/site/${inst.siteId}`); }}>
                    View Site<ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInstallations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center"><Truck className="w-7 h-7 text-muted-foreground" /></div>
          <h3 className="text-lg font-medium text-foreground mb-1">No installations found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
        </div>
      )}

      <AddInstallationDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      <ImportInstallationsDialog open={showImportDialog} onOpenChange={setShowImportDialog} />
      {selectedInst && (
        <EditInstallationDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          installationId={selectedInst.id}
          installationName={selectedInst.name}
          onSuccess={refresh}
        />
      )}

      {/* Evidence Dialog */}
      <Dialog open={evidenceDialogOpen} onOpenChange={setEvidenceDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Installation Evidence — {evidenceDialogData.title}</DialogTitle>
          </DialogHeader>
          <EvidenceGallery
            photos={evidenceDialogData.photos}
            videos={[]}
            documents={evidenceDialogData.documents}
            readOnly
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
