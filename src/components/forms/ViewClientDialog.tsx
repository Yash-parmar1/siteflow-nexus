import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Building,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  IndianRupee,
  Box,
  FileText,
  Download,
  Eye,
  Trash2,
  Edit,
  UserX,
  Folder,
} from "lucide-react";
import { useEffect, useState } from "react";
import * as XLSX from 'xlsx';
import { toast } from "sonner";
import { EditClientDialog } from "./EditClientDialog";
import { DeactivateClientDialog } from "./DeactivateClientDialog";
import { DeleteClientDialog } from "./DeleteClientDialog";
import api from "@/lib/api";

// site import dialogs
import UploadSitesDialog from "@/components/sites/UploadSitesDialog";
import UploadResultDialog from "@/components/sites/UploadResultDialog";
import ViewImportsDialog from "@/components/sites/ViewImportsDialog";

interface Project {
  id: string;
  name: string;
  subprojects: any[];
  monthlyRevenue?: number;
  totalSites?: number;
  totalACS?: number;
}

interface ClientData {
  id: string;
  name: string;
  status: string;
  sites: number;
  totalUnits: number;
  monthlyRevenue: number;
  contractStart: string;
  contractEnd: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  outstandingAmount: number;
  paymentStatus: string;
  gstNumber?: string;
  tradeName?: string;
  notes?: string;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
}

interface ViewClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientData | null;
  onClientUpdate: () => void;
}



const paymentStatusColors: Record<string, string> = {
  "On Time": "bg-[hsl(var(--status-success)/0.15)] text-[hsl(var(--status-success))]",
  Pending: "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))]",
  Overdue: "bg-[hsl(var(--status-error)/0.15)] text-[hsl(var(--status-error))]",
};

export function ViewClientDialog({ open, onOpenChange, client, onClientUpdate }: ViewClientDialogProps) {
  const [documents, setDocuments] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [excelData, setExcelData] = useState<any[][] | null>([]);
  const [excelModalOpen, setExcelModalOpen] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // import flow state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [importViewOpen, setImportViewOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeSubprojectId, setActiveSubprojectId] = useState<string | null>(null);
  const [lastSessionId, setLastSessionId] = useState<number | null>(null);
  const [resultOpen, setResultOpen] = useState(false);

  useEffect(() => {
    if (open && client) {
      const clientId = client.id.replace('CLT-', '');
      api.get(`/clients/${clientId}/documents`)
        .then((res) => setDocuments(res.data))
        .catch(() => setDocuments([]));
      api.get(`/clients/${clientId}/projects`)
        .then((res) => setProjects(res.data))
        .catch(() => setProjects([]));
    }
  }, [open, client]);

  const handleViewExcel = async (docName: string) => {
    try {
      const clientId = client.id.replace('CLT-', '');
      const response = await api.get(`/clients/${clientId}/documents/${docName}`, {
        responseType: 'arraybuffer',
      });
      const workbook = XLSX.read(response.data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        alert('No sheets found in the Excel file.');
        return;
      }
      const sheet = workbook.Sheets[sheetName];
      const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      setExcelData(data);
      setExcelModalOpen(true);
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      alert('Failed to load Excel file. Please try downloading it instead.');
    }
  };

  const handleToggleActiveState = async () => {
    if (!client) return;

    const isActive = client.status === 'Active';
    const endpoint = isActive ? 'deactivate' : 'activate';
    const successMessage = isActive ? 'Client deactivated successfully.' : 'Client activated successfully.';
    const errorMessage = isActive ? 'An error occurred while deactivating the client.' : 'An error occurred while activating the client.';

    try {
      await api.patch(`/clients/${client.id.replace('CLT-', '')}/${endpoint}`);
      toast.success(successMessage);
      onClientUpdate();
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage);
    } finally {
      setShowDeactivateDialog(false);
    }
  };

  const handleDelete = async () => {
    if (!client) return;
    try {
      await api.delete(`/clients/${client.id.replace('CLT-', '')}`);
      toast.success("Client deleted successfully.");
      onClientUpdate();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to delete client.");
    } finally {
      setShowDeleteDialog(false);
    }
  };


  if (!client) return null;

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  const clientId = client.id.replace('CLT-', '');

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-border">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14">
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                  {client.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-xl">{client.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">

                  <Badge variant={client.status === "Active" ? "default" : "secondary"}>
                    {client.status}
                  </Badge>
                  {client.status !== 'Active' && (
                    <div className="text-xs text-muted-foreground ml-2">Note: This client is inactive — projects under this client are archived and cannot be activated until the client is reactivated.</div>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Contact Person</p>
                    <p className="text-sm font-medium">{client.contactPerson}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{client.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{client.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm font-medium">{client.address}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Business Metrics */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Business Metrics</h3>
              <div className="grid grid-cols-5 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 mx-auto mb-2">
                    <Folder className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-lg font-semibold">{projects.length}</p>
                  <p className="text-xs text-muted-foreground">Projects</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 mx-auto mb-2">
                    <Building className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-lg font-semibold">{client.sites}</p>
                  <p className="text-xs text-muted-foreground">Sites</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[hsl(var(--status-info)/0.15)] mx-auto mb-2">
                    <Box className="w-4 h-4 text-[hsl(var(--status-info))]" />
                  </div>
                  <p className="text-lg font-semibold">{client.totalUnits}</p>
                  <p className="text-xs text-muted-foreground">Units</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[hsl(var(--status-success)/0.15)] mx-auto mb-2">
                    <IndianRupee className="w-4 h-4 text-[hsl(var(--status-success))]" />
                  </div>
                  <p className="text-lg font-semibold">{formatCurrency(client.monthlyRevenue)}</p>
                  <p className="text-xs text-muted-foreground">Monthly</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg text-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg mx-auto mb-2 ${paymentStatusColors[client.paymentStatus]?.split(' ')[0]}`}>
                    <FileText className={`w-4 h-4 ${paymentStatusColors[client.paymentStatus]?.split(' ')[1]}`} />
                  </div>
                  <p className="text-lg font-semibold">{formatCurrency(client.outstandingAmount)}</p>
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Projects Hierarchy */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Projects Hierarchy</h3>
              <div className="space-y-2">
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <div key={project.id} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                      <p className="font-semibold">{project.name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="text-right">
                          <div className="text-sm font-semibold text-foreground">{project.monthlyRevenue ? formatCurrency(project.monthlyRevenue) : '—'}</div>
                          <div className="text-xs">Monthly Revenue</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-foreground">{project.totalACS ?? '—'}</div>
                          <div className="text-xs">ACS Units</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-foreground">{project.totalSites ?? '—'}</div>
                          <div className="text-xs">Sites</div>
                        </div>
                      </div>
                    </div>
                    {project.subprojects && project.subprojects.length > 0 && (
                        <div className="pl-4 mt-2 space-y-2">
                          {project.subprojects.map((subproject: any) => (
                            <div key={subproject.id} className="p-2 bg-muted rounded-lg">
                              <div className="flex items-center justify-between">
                                <p className="font-medium">{subproject.name}</p>
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => { setActiveProjectId(project.id); setActiveSubprojectId(subproject.id); setUploadOpen(true); }}>Add Sites</Button>
                                  <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={() => { setActiveProjectId(project.id); setActiveSubprojectId(subproject.id); setImportViewOpen(true); }}>View Imports</Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No projects found.</p>
                )}
              </div>
            </div>


            <Separator />

            {/* Import dialogs */}
            <UploadSitesDialog open={uploadOpen} onOpenChange={setUploadOpen} projectId={activeProjectId ?? ''} subprojectId={activeSubprojectId ?? ''} onUploaded={(res) => {
              // open result dialog
              setLastSessionId(res.sessionId);
              setResultOpen(true);
            }} />

            <UploadResultDialog open={resultOpen} onOpenChange={setResultOpen} projectId={activeProjectId ?? ''} subprojectId={activeSubprojectId ?? ''} sessionId={lastSessionId} onProcessed={() => { setResultOpen(false); setImportViewOpen(false); /* refresh projects list */ api.get(`/clients/${client?.id?.replace('CLT-','')}/projects`).then((r)=>setProjects(r.data)); }} />

            <ViewImportsDialog open={importViewOpen} onOpenChange={setImportViewOpen} projectId={activeProjectId ?? ''} subprojectId={activeSubprojectId ?? ''} onProcessed={() => { setImportViewOpen(false); api.get(`/clients/${client?.id?.replace('CLT-','')}/projects`).then((r)=>setProjects(r.data)); }} />

            {/* Uploaded Documents */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Uploaded Documents</h3>
              <div className="space-y-2">
                {documents.length > 0 ? (
                  documents.map((docName) => (
                    <div key={docName} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium">{docName}</span>
                      <div className="flex gap-2">
                        {docName.toLowerCase().endsWith('.xlsx') || docName.toLowerCase().endsWith('.xls') ? (
                          <button
                            onClick={() => handleViewExcel(docName)}
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        ) : (
                          <a
                            href={`/api/clients/${clientId}/documents/${docName}?action=view`}
                            target="_blank"
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </a>
                        )}
                        <a
                          href={`/api/clients/${clientId}/documents/${docName}`}
                          download
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No documents found.</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Contract Details */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Contract Details</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 flex-1 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Contract Start</p>
                    <p className="text-sm font-medium">{client.contractStart}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-1 p-3 bg-muted/50 rounded-lg">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Contract End</p>
                    <p className="text-sm font-medium">{client.contractEnd}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <span className="text-sm text-muted-foreground">Payment Status</span>
              <Badge className={`${paymentStatusColors[client.paymentStatus]} border-0`}>
                {client.paymentStatus}
              </Badge>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pt-4 border-t border-border">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowEditDialog(true)}>
                <Edit className="w-4 h-4" />
                Edit Client
              </Button>
              <Button variant="outline" size="sm" className="text-destructive gap-2 hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive" onClick={() => setShowDeactivateDialog(true)}>
                <UserX className="w-4 h-4" />
                {client.status === 'Active' ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
            <Button variant="destructive" size="sm" className="gap-2" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="w-4 h-4" />
              Delete Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {client && (
        <>
          <EditClientDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            client={client}
            onClientUpdate={() => {
              onClientUpdate();
              onOpenChange(false);
            }}
          />
          <DeactivateClientDialog
            open={showDeactivateDialog}
            onOpenChange={setShowDeactivateDialog}
            clientName={client.name}
            onConfirm={handleToggleActiveState}
            isActive={client.status === 'Active'}
          />
          <DeleteClientDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            clientName={client.name}
            onConfirm={handleDelete}
          />
        </>
      )}


      {/* Excel Viewer Modal */}
      <Dialog open={excelModalOpen} onOpenChange={setExcelModalOpen}>
        <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Excel Document</DialogTitle>
          </DialogHeader>
          {excelData && (
            <div className="max-h-[70vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {excelData[0]?.map((header, index) => (
                      <TableHead key={index}>{header || `Column ${index + 1}`}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {excelData.slice(1).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
