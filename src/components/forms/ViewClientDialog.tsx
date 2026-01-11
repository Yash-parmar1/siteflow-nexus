import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
} from "lucide-react";

interface ClientData {
  id: string;
  name: string;
  type: string;
  status: string;
  sites: number;
  totalUnits: number;
  monthlyRevenue: number;
  contractStart: string;
  contractEnd: string;
  contactPerson: string;
  phone: string;
  email: string;
  location: string;
  outstandingAmount: number;
  paymentStatus: string;
}

interface ViewClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientData | null;
}

const typeColors: Record<string, string> = {
  Enterprise: "bg-primary/10 text-primary",
  "Mid-Market": "bg-[hsl(var(--status-info)/0.15)] text-[hsl(var(--status-info))]",
  SMB: "bg-muted text-muted-foreground",
};

const paymentStatusColors: Record<string, string> = {
  "On Time": "bg-[hsl(var(--status-success)/0.15)] text-[hsl(var(--status-success))]",
  Pending: "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))]",
  Overdue: "bg-[hsl(var(--status-error)/0.15)] text-[hsl(var(--status-error))]",
};

export function ViewClientDialog({ open, onOpenChange, client }: ViewClientDialogProps) {
  if (!client) return null;

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-background border-border">
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
                <Badge className={`${typeColors[client.type]} border-0`}>
                  {client.type}
                </Badge>
                <Badge variant={client.status === "Active" ? "default" : "secondary"}>
                  {client.status}
                </Badge>
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
                  <p className="text-sm font-medium">{client.location}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Business Metrics */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Business Metrics</h3>
            <div className="grid grid-cols-4 gap-4">
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
      </DialogContent>
    </Dialog>
  );
}
