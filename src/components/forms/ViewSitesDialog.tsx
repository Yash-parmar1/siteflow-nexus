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
import { MapPin, Box, ExternalLink, Building } from "lucide-react";

interface ClientData {
  id: string;
  name: string;
  sites: number;
}

// Mock sites data for demonstration
const mockClientSites = [
  {
    id: "site-001",
    name: "Metro Tower - Block A",
    location: "Mumbai, Maharashtra",
    units: 12,
    status: "Operational",
  },
  {
    id: "site-002",
    name: "Metro Tower - Block B",
    location: "Mumbai, Maharashtra",
    units: 10,
    status: "Operational",
  },
  {
    id: "site-003",
    name: "Metro Tower - Block C",
    location: "Mumbai, Maharashtra",
    units: 14,
    status: "Under Installation",
  },
  {
    id: "site-004",
    name: "Metro Commercial Hub",
    location: "Thane, Maharashtra",
    units: 12,
    status: "Operational",
  },
];

interface ViewSitesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientData | null;
}

const statusColors: Record<string, string> = {
  Operational: "bg-[hsl(var(--status-success)/0.15)] text-[hsl(var(--status-success))]",
  "Under Installation": "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))]",
  Maintenance: "bg-[hsl(var(--status-info)/0.15)] text-[hsl(var(--status-info))]",
};

export function ViewSitesDialog({ open, onOpenChange, client }: ViewSitesDialogProps) {
  const navigate = useNavigate();

  if (!client) return null;

  const handleViewSite = (siteId: string) => {
    onOpenChange(false);
    navigate(`/site/${siteId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-primary" />
            Sites - {client.name}
          </DialogTitle>
          <DialogDescription>
            {client.sites} sites associated with this client
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-3">
            {mockClientSites.map((site) => (
              <div
                key={site.id}
                className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-foreground">{site.name}</h4>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {site.location}
                    </div>
                  </div>
                  <Badge className={`${statusColors[site.status]} border-0`}>
                    {site.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Box className="w-3.5 h-3.5" />
                    {site.units} ACS Units
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewSite(site.id)}
                    className="text-primary hover:text-primary/80"
                  >
                    View Details
                    <ExternalLink className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
