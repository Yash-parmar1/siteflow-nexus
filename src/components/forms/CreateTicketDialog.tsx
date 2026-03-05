import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAppData } from "@/context/AppDataContext";
import { Wrench, MapPin, Box, AlertCircle } from "lucide-react";

const ticketSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  siteId: z.string().min(1, "Please select a site"),
  acAssetId: z.string().optional(),
  priority: z.string().min(1, "Please select a priority"),
  visitingCharge: z.number().min(0).optional(),
});

type TicketFormData = z.infer<typeof ticketSchema>;

const priorities = [
  { value: "CRITICAL", label: "Critical", color: "bg-[hsl(var(--status-error)/0.15)] text-[hsl(var(--status-error))]" },
  { value: "HIGH", label: "High", color: "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))]" },
  { value: "MEDIUM", label: "Medium", color: "bg-[hsl(var(--status-info)/0.15)] text-[hsl(var(--status-info))]" },
  { value: "LOW", label: "Low", color: "bg-muted text-muted-foreground" },
];

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStatus?: string;
  onSubmit?: (data: TicketFormData) => void;
}

export function CreateTicketDialog({ open, onOpenChange, initialStatus, onSubmit }: CreateTicketDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: appData, refresh } = useAppData();

  const sites = useMemo(() => {
    return (appData?.sites || []).map((s) => ({
      id: String(s.id),
      name: s.name,
    }));
  }, [appData?.sites]);

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: "",
      description: "",
      siteId: "",
      acAssetId: "",
      priority: "",
      visitingCharge: 0,
    },
  });

  const selectedSiteId = form.watch("siteId");

  // Filter assets belonging to selected site
  const siteAssets = useMemo(() => {
    if (!selectedSiteId) return [];
    return (appData?.assets || [])
      .filter((a) => String(a.siteId) === selectedSiteId)
      .map((a) => ({
        id: String(a.id),
        serialNumber: a.serialNumber,
        model: a.model || a.manufacturer || "Unknown",
        locationInSite: a.locationInSite || "",
      }));
  }, [selectedSiteId, appData?.assets]);

  const handleSubmit = async (data: TicketFormData) => {
    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {
        title: data.title,
        description: data.description,
        siteId: Number(data.siteId),
        acAssetId: data.acAssetId ? Number(data.acAssetId) : null,
        priority: data.priority,
        status: "RAISED",
        visitingCharge: data.visitingCharge ?? 0,
      };

      await api.post("/maintenance-history", payload);
      onSubmit?.(data);
      toast.success("Ticket created successfully");
      form.reset();
      await refresh();
      onOpenChange(false);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.response?.data || "Failed to create ticket";
      toast.error(typeof msg === "string" ? msg : "Failed to create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            Create Ticket
          </DialogTitle>
          <DialogDescription>
            Create a new maintenance or service ticket.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of the issue" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed description of the issue, symptoms, and any relevant observations..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="siteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site *</FormLabel>
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v);
                        form.setValue("acAssetId", "");
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-secondary/50">
                          <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="Select site" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border">
                        {sites.map((site) => (
                          <SelectItem key={site.id} value={site.id}>
                            {site.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="acAssetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AC Unit (Optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!selectedSiteId}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-secondary/50">
                          <Box className="w-4 h-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder={selectedSiteId ? "Select unit" : "Select site first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border">
                        {siteAssets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.serialNumber}{asset.locationInSite ? ` (${asset.locationInSite})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-secondary/50">
                          <AlertCircle className="w-4 h-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border">
                        {priorities.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${priority.color.split(" ")[0]}`} />
                              {priority.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visitingCharge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visiting Charge (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Ticket"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
