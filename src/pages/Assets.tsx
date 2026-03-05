import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Search, Plus, Grid3X3, List, Box, MapPin, Calendar, Wrench, MoreHorizontal,
  Download, AlertCircle, CheckCircle2, Clock, XCircle, FolderKanban, X, Pencil,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { AddUnitDialog } from "@/components/forms/AddUnitDialog";
import { EditAssetDialog } from "@/components/forms/EditAssetDialog";
import { useAppData, type AssetData } from "@/context/AppDataContext";
import { toast } from "sonner";
import * as XLSX from "xlsx";

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
  const { data: appData, refresh } = useAppData();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [addUnitOpen, setAddUnitOpen] = useState(false);
  const [editAssetOpen, setEditAssetOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<{ id: string; name: string } | null>(null);

  // Map live assets from backend
  const units = (appData?.assets || []).map((a: AssetData) => ({
    id: String(a.id),
    serialNumber: a.serialNumber ?? "",
    model: a.model ?? a.manufacturer ?? "Unknown",
    siteId: a.siteId != null ? String(a.siteId) : "",
    siteName: a.siteName ?? "Unassigned",
    location: a.locationInSite ?? "",
    status: a.status === "ACTIVE" ? "Operational"
      : a.status === "MAINTENANCE" ? "Under Maintenance"
      : a.status === "FAULTY" ? "Faulty"
      : a.status === "PENDING" ? "Pending Install"
      : a.status === "IN_TRANSIT" ? "In Transit"
      : a.status ?? "Operational",
    isIndoor: a.indoorAc,
    sizeInTon: a.sizeInTon,
    lastMaintenance: a.lastMaintenanceDate ?? "-",
    nextMaintenance: a.nextMaintenanceDate ?? "-",
    warrantyExpiry: a.warrantyExpiryDate ?? "-",
    configuredRent: a.monthlyRent ?? 0,
  }));

  const filteredUnits = units.filter((unit) => {
    const matchesSearch =
      unit.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || unit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = ["all", "Operational", "Under Maintenance", "Faulty", "Pending Install", "In Transit"];

  const totalUnits = filteredUnits.length;
  const operationalUnits = filteredUnits.filter((u) => u.status === "Operational").length;
  const faultyUnits = filteredUnits.filter((u) => u.status === "Faulty").length;
  const pendingUnits = filteredUnits.filter((u) => u.status === "Pending Install" || u.status === "In Transit").length;

  const handleEditAsset = (assetId: string, assetSerial: string) => {
    setSelectedAsset({ id: assetId, name: assetSerial });
    setEditAssetOpen(true);
  };

  const handleExport = () => {
    const rows = (appData?.assets || []).map((a: AssetData) => ({
      "Serial Number": a.serialNumber ?? "",
      "Manufacturer": a.manufacturer ?? "",
      "Model": a.model ?? "",
      "Model Number": a.modelNumber ?? "",
      "Size (Ton)": a.sizeInTon ?? "",
      "Type": a.indoorAc ? "Indoor" : "Outdoor",
      "Site": a.siteName ?? "",
      "Project": a.projectName ?? "",
      "Subproject": a.subprojectName ?? "",
      "Location In Site": a.locationInSite ?? "",
      "Status": a.status ?? "",
      "Monthly Rent": a.monthlyRent ?? "",
      "First Month Rent": a.firstMonthRent ?? "",
      "Purchase Cost": a.purchaseCost ?? "",
      "Warranty Expiry": a.warrantyExpiryDate ?? "",
      "Next Maintenance": a.nextMaintenanceDate ?? "",
      "Last Maintenance": a.lastMaintenanceDate ?? "",
      "Insurance Threshold": a.insuranceThreshold ?? "",
      "Maintenance Supported": a.maintenanceSupported ? "Yes" : "No",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Assets");
    XLSX.writeFile(wb, `assets_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(`Exported ${rows.length} assets`);
  };

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Assets (ACS Units)</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{totalUnits} units across all sites</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="default" onClick={handleExport}><Download className="w-4 h-4" />Export</Button>
          <Button size="default" onClick={() => setAddUnitOpen(true)}><Plus className="w-4 h-4" />Add Unit</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="data-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Box className="w-5 h-5 text-primary" /></div><div><p className="metric-value">{totalUnits}</p><p className="metric-label">Total Units</p></div></div></CardContent></Card>
        <Card className="data-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-success)/0.15)] flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-[hsl(var(--status-success))]" /></div><div><p className="metric-value">{operationalUnits}</p><p className="metric-label">Operational</p></div></div></CardContent></Card>
        <Card className="data-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-error)/0.15)] flex items-center justify-center"><AlertCircle className="w-5 h-5 text-[hsl(var(--status-error))]" /></div><div><p className="metric-value">{faultyUnits}</p><p className="metric-label">Faulty</p></div></div></CardContent></Card>
        <Card className="data-card"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-info)/0.15)] flex items-center justify-center"><Clock className="w-5 h-5 text-[hsl(var(--status-info))]" /></div><div><p className="metric-value">{pendingUnits}</p><p className="metric-label">Pending</p></div></div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input type="search" placeholder="Search by serial, site, or model..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-secondary/50"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {statuses.map((status) => (<SelectItem key={status} value={status}>{status === "all" ? "All Statuses" : status}</SelectItem>))}
            </SelectContent>
          </Select>
          <div className="flex border border-border rounded-lg p-0.5 bg-secondary/30">
            <Button variant={viewMode === "table" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setViewMode("table")}><List className="w-4 h-4" /></Button>
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setViewMode("grid")}><Grid3X3 className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <Card className="border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead>Serial Number</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUnits.map((unit) => (
                <TableRow key={unit.id} className="cursor-pointer hover:bg-muted/50 border-border/50" onClick={() => navigate(`/assets/${unit.id}`)}>
                  <TableCell className="font-medium font-mono text-xs" title={unit.serialNumber}>{unit.serialNumber.length > 20 ? `${unit.serialNumber.slice(0, 10)}...${unit.serialNumber.slice(-6)}` : unit.serialNumber}</TableCell>
                  <TableCell>{unit.model}{unit.sizeInTon ? ` (${unit.sizeInTon}T)` : ''}</TableCell>
                  <TableCell><Badge variant="outline" className={unit.isIndoor ? 'border-[hsl(var(--status-info))] text-[hsl(var(--status-info))]' : 'border-[hsl(var(--status-warning))] text-[hsl(var(--status-warning))]'}>{unit.isIndoor ? 'Indoor' : 'Outdoor'}</Badge></TableCell>
                  <TableCell><div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-muted-foreground" />{unit.siteName}</div></TableCell>
                  <TableCell><span className={`status-badge ${statusConfig[unit.status]?.color}`}>{statusConfig[unit.status]?.icon}{unit.status}</span></TableCell>
                  <TableCell className="font-medium">₹{unit.configuredRent.toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}><Button variant="ghost" size="icon-sm"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem onClick={() => navigate(`/assets/${unit.id}`)}>View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditAsset(unit.id, unit.serialNumber)}><Pencil className="w-3.5 h-3.5 mr-1.5" />Edit Asset</DropdownMenuItem>
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
          {filteredUnits.map((unit) => (
            <Card key={unit.id} className="data-card cursor-pointer" onClick={() => navigate(`/assets/${unit.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${
                      unit.status === 'Operational' ? 'bg-[hsl(var(--status-success)/0.15)]' :
                      unit.status === 'Faulty' ? 'bg-[hsl(var(--status-error)/0.15)]' :
                      unit.status === 'Under Maintenance' ? 'bg-[hsl(var(--status-warning)/0.15)]' :
                      'bg-muted'
                    }`}>
                      <Box className={`w-5 h-5 ${
                        unit.status === 'Operational' ? 'text-[hsl(var(--status-success))]' :
                        unit.status === 'Faulty' ? 'text-[hsl(var(--status-error))]' :
                        unit.status === 'Under Maintenance' ? 'text-[hsl(var(--status-warning))]' :
                        'text-muted-foreground'
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate" title={unit.serialNumber}>
                        {unit.serialNumber.length > 18 ? `${unit.serialNumber.slice(0, 8)}...${unit.serialNumber.slice(-6)}` : unit.serialNumber}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-muted-foreground">{unit.model || 'N/A'}{unit.sizeInTon ? ` · ${unit.sizeInTon}T` : ''}</span>
                        <Badge variant="outline" className={`text-[9px] h-4 px-1 ${unit.isIndoor ? 'border-[hsl(var(--status-info))] text-[hsl(var(--status-info))]' : 'border-[hsl(var(--status-warning))] text-[hsl(var(--status-warning))]'}`}>{unit.isIndoor ? 'Indoor' : 'Outdoor'}</Badge>
                      </div>
                    </div>
                  </div>
                  <span className={`status-badge shrink-0 ${statusConfig[unit.status]?.color}`}>{statusConfig[unit.status]?.icon}{unit.status}</span>
                </div>

                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{unit.siteName}</span></div>
                  {unit.location && <div className="flex items-center gap-1.5 text-xs"><FolderKanban className="w-3 h-3 shrink-0" /><span className="truncate">{unit.location}</span></div>}
                </div>

                <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Rent</p>
                    <p className="font-medium text-foreground">₹{unit.configuredRent.toLocaleString("en-IN")}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Warranty</p>
                    <p className="font-medium text-foreground">{unit.warrantyExpiry !== '-' ? new Date(unit.warrantyExpiry).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Next Maint.</p>
                    <p className="font-medium text-foreground">{unit.nextMaintenance !== '-' ? new Date(unit.nextMaintenance).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) : '-'}</p>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-border/50 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEditAsset(unit.id, unit.serialNumber); }}><Pencil className="w-3.5 h-3.5 mr-1" />Edit</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredUnits.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center"><Box className="w-7 h-7 text-muted-foreground" /></div>
          <h3 className="text-lg font-medium text-foreground mb-1">No assets found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
        </div>
      )}

      <AddUnitDialog open={addUnitOpen} onOpenChange={setAddUnitOpen} />
      {selectedAsset && (
        <EditAssetDialog
          open={editAssetOpen}
          onOpenChange={setEditAssetOpen}
          assetId={selectedAsset.id}
          assetName={selectedAsset.name}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
