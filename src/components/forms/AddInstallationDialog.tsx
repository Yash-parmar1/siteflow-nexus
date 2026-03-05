import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Package, MapPin, Box } from "lucide-react";

const installationSchema = z.object({
  siteId: z.string().min(1, "Site is required"),
  acAssetId: z.string().min(1, "AC asset is required"),
  bookingId: z.string().max(50).optional(),
  shipmentStatus: z.string().min(1, "Shipment status is required"),
  status: z.string().optional(),
  eta: z.string().min(1, "ETA is required"),
  installationDate: z.string().optional(),
  receiverName: z.string().max(100).optional(),
  receiverNumber: z.string().max(15).optional(),
  remarks: z.string().max(500).optional(),
});

type InstallationFormData = z.infer<typeof installationSchema>;

interface AddInstallationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: InstallationFormData) => void;
}

export function AddInstallationDialog({ open, onOpenChange, onSubmit }: AddInstallationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: appData, refresh } = useAppData();

  const sites = useMemo(() => {
    return (appData?.sites || []).map((s) => ({
      id: String(s.id),
      name: s.name,
      location: s.location || s.addressJson || "",
    }));
  }, [appData?.sites]);

  const form = useForm<InstallationFormData>({
    resolver: zodResolver(installationSchema),
    defaultValues: {
      siteId: "",
      acAssetId: "",
      bookingId: "",
      shipmentStatus: "PENDING",
      status: "",
      eta: "",
      installationDate: "",
      receiverName: "",
      receiverNumber: "",
      remarks: "",
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
      }));
  }, [selectedSiteId, appData?.assets]);

  const handleSubmit = async (data: InstallationFormData) => {
    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {
        siteId: Number(data.siteId),
        acAssetId: Number(data.acAssetId),
        bookingId: data.bookingId || null,
        shipmentStatus: data.shipmentStatus,
        status: data.status || null,
        eta: data.eta || null,
        installationDate: data.installationDate || null,
        receiverName: data.receiverName || null,
        receiverNumber: data.receiverNumber || null,
        remarks: data.remarks || null,
      };

      await api.post("/installations", payload);
      onSubmit?.(data);
      toast.success("Installation created successfully");
      form.reset();
      await refresh();
      onOpenChange(false);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.response?.data || "Failed to create installation";
      toast.error(typeof msg === "string" ? msg : "Failed to create installation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const shipmentStatuses = ["PENDING", "IN_TRANSIT", "DELIVERED", "INSTALLED"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Create New Installation
          </DialogTitle>
          <DialogDescription>
            Schedule a new installation by selecting a site and AC asset, then provide shipment and receiver details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Site */}
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
                      <SelectTrigger>
                        <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Select site" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sites.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.name}{site.location ? ` — ${site.location}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* AC Asset */}
            <FormField
              control={form.control}
              name="acAssetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AC Unit *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!selectedSiteId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <Box className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder={selectedSiteId ? "Select unit" : "Select a site first"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {siteAssets.length === 0 && (
                        <SelectItem value="__none" disabled>No assets found for this site</SelectItem>
                      )}
                      {siteAssets.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.serialNumber} ({a.model})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Booking / Shipment Status */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bookingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking / Docket ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., DOC-2024-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shipmentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shipment Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {shipmentStatuses.map((s) => (
                          <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="eta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Completion (ETA) *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="installationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Installation Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Receiver info */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Receiver Details</p>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="receiverName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receiver Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Raj Kumar" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="receiverNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receiver Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 XXXXX XXXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special instructions or notes for this installation..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Installation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
