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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAppData } from "@/context/AppDataContext";
import { Box, MapPin, Info } from "lucide-react";

const unitSchema = z.object({
  serialNumber: z.string().min(3, "Serial number is required").max(50),
  manufacturer: z.string().min(1, "Manufacturer is required").max(100),
  model: z.string().min(1, "Model is required").max(100),
  siteId: z.string().min(1, "Site is required"),
  locationInSite: z.string().max(100).optional(),
  sizeInTon: z.number().min(0.5, "Min 0.5 ton").max(10, "Max 10 ton").optional(),
  isIndoorAc: z.boolean().optional(),
  monthlyRent: z.number().min(0).optional(),
  firstMonthRent: z.number().min(0).optional(),
  purchaseCost: z.number().min(0).optional(),
  warrantyExpiryDate: z.string().optional(),
});

type UnitFormData = z.infer<typeof unitSchema>;

const manufacturers = ["Daikin", "Voltas", "Blue Star", "LG", "Samsung", "Hitachi", "Carrier", "Mitsubishi", "Panasonic", "Godrej"];

interface AddUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSiteId?: string;
  onSubmit?: (data: UnitFormData) => void;
}

export function AddUnitDialog({
  open,
  onOpenChange,
  defaultSiteId,
  onSubmit,
}: AddUnitDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: appData, refresh } = useAppData();

  const sites = useMemo(() => {
    return (appData?.sites || []).map((s) => ({
      id: String(s.id),
      name: s.name,
      projectName: s.projectName || "",
      subprojectName: s.subprojectName || "",
      subprojectId: s.subprojectId,
      projectId: s.projectId,
    }));
  }, [appData?.sites]);

  const form = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      serialNumber: "",
      manufacturer: "",
      model: "",
      siteId: defaultSiteId || "",
      locationInSite: "",
      sizeInTon: 1.5,
      isIndoorAc: false,
      monthlyRent: 0,
      firstMonthRent: 0,
      purchaseCost: 0,
      warrantyExpiryDate: "",
    },
  });

  const selectedSiteId = form.watch("siteId");
  const selectedSite = sites.find((s) => s.id === selectedSiteId);

  const handleSubmit = async (data: UnitFormData) => {
    setIsSubmitting(true);
    try {
      const site = sites.find((s) => s.id === data.siteId);
      const payload: Record<string, any> = {
        serialNumber: data.serialNumber,
        manufacturer: data.manufacturer,
        model: data.model,
        siteId: Number(data.siteId),
        subprojectId: site?.subprojectId ? Number(site.subprojectId) : null,
        projectId: site?.projectId ? Number(site.projectId) : null,
        locationInSite: data.locationInSite || null,
        sizeInTon: data.sizeInTon ?? null,
        isIndoorAc: data.isIndoorAc ?? false,
        monthlyRent: data.monthlyRent ?? null,
        firstMonthRent: data.firstMonthRent ?? null,
        purchaseCost: data.purchaseCost ?? null,
        warrantyExpiryDate: data.warrantyExpiryDate || null,
        status: "ACTIVE",
        maintenanceSupported: true,
      };

      await api.post("/assets", payload);
      onSubmit?.(data);
      toast.success("AC unit added successfully");
      form.reset();
      await refresh();
      onOpenChange(false);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.response?.data || "Failed to add unit";
      toast.error(typeof msg === "string" ? msg : "Failed to add unit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Box className="w-4 h-4 text-primary" />
            Add AC Unit
          </DialogTitle>
          <DialogDescription>
            Add a new AC unit to a site. The unit will inherit the site's configuration.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Site selection */}
            <FormField
              control={form.control}
              name="siteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Select site" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sites.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          <div className="flex items-center gap-2">
                            {site.name}
                            {site.projectName && (
                              <span className="text-xs text-muted-foreground">
                                ({site.projectName}{site.subprojectName ? ` / ${site.subprojectName}` : ""})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Serial / Manufacturer / Model */}
            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., SN-2024-0001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturer *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select manufacturer" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {manufacturers.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., FTKF50UV16V" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Size / Indoor / Location */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="sizeInTon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size (Ton)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        min="0.5"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isIndoorAc"
                render={({ field }) => (
                  <FormItem className="flex flex-col justify-end">
                    <FormLabel>Type</FormLabel>
                    <div className="flex items-center gap-2 h-10">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <span className="text-sm">{field.value ? "Indoor" : "Outdoor"}</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="locationInSite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location in Site</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Floor 12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Rent / Purchase Cost / Warranty */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="monthlyRent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Rent (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purchaseCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Cost (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="warrantyExpiryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warranty Expiry</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-start gap-2 p-3 bg-[hsl(var(--status-info)/0.1)] rounded-lg text-xs text-muted-foreground">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-[hsl(var(--status-info))]" />
              <span>
                The unit will be linked to <strong>{selectedSite?.name || "the selected site"}</strong>. Maintenance tracking and rent calculations begin once the unit becomes operational.
              </span>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Unit"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
