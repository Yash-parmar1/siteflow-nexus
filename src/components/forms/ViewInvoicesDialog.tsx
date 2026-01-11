import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Download, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ClientData {
  id: string;
  name: string;
}

// Mock invoices data for demonstration
const mockClientInvoices = [
  {
    id: "INV-2024-0156",
    amount: 1250000,
    dueDate: "Jan 05, 2025",
    status: "Pending",
    issuedDate: "Dec 20, 2024",
  },
  {
    id: "INV-2024-0145",
    amount: 1250000,
    dueDate: "Dec 05, 2024",
    status: "Paid",
    issuedDate: "Nov 20, 2024",
  },
  {
    id: "INV-2024-0134",
    amount: 1250000,
    dueDate: "Nov 05, 2024",
    status: "Paid",
    issuedDate: "Oct 20, 2024",
  },
  {
    id: "INV-2024-0123",
    amount: 1200000,
    dueDate: "Oct 05, 2024",
    status: "Paid",
    issuedDate: "Sep 20, 2024",
  },
];

interface ViewInvoicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientData | null;
}

const statusColors: Record<string, string> = {
  Paid: "bg-[hsl(var(--status-success)/0.15)] text-[hsl(var(--status-success))]",
  Pending: "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))]",
  Overdue: "bg-[hsl(var(--status-error)/0.15)] text-[hsl(var(--status-error))]",
};

export function ViewInvoicesDialog({ open, onOpenChange, client }: ViewInvoicesDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!client) return null;

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  const handleDownload = (invoiceId: string) => {
    // TODO: Integrate with backend
    toast({
      title: "Download started",
      description: `Downloading ${invoiceId}.pdf`,
    });
  };

  const handleViewInvoice = (invoiceId: string) => {
    onOpenChange(false);
    navigate("/finance");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Invoices - {client.name}
          </DialogTitle>
          <DialogDescription>
            Invoice history for this client
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-muted-foreground font-medium">Invoice</TableHead>
                <TableHead className="text-muted-foreground font-medium">Amount</TableHead>
                <TableHead className="text-muted-foreground font-medium">Issued</TableHead>
                <TableHead className="text-muted-foreground font-medium">Due Date</TableHead>
                <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                <TableHead className="text-muted-foreground font-medium w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockClientInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="border-border/50">
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">{invoice.issuedDate}</TableCell>
                  <TableCell className={invoice.status === "Overdue" ? "text-[hsl(var(--status-error))]" : ""}>
                    {invoice.dueDate}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[invoice.status]} border-0`}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleViewInvoice(invoice.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDownload(invoice.id)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => navigate("/finance")}>
            View All in Finance
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
