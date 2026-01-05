import { useState } from "react";
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
import { toast } from "sonner";
import { mockSites } from "@/data/mockData";
import { Box, MapPin, Lock, Info } from "lucide-react";

const unitSchema = z.object({
  serialNumber: z.string().min(5, "Serial number must be at least 5 characters").max(50),
  model: z.string().min(1, "Model is required"),
  siteId: z.string().min(1, "Site is required"),
  location: z.string().max(100).optional(),
});

type UnitFormData = z.infer<typeof unitSchema>;

const models = ["ACS Pro X1", "ACS Pro X2", "ACS Lite", "ACS Ultra"];

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
  onSubmit 
}: AddUnitDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      serialNumber: "",
      model: "",
      siteId: defaultSiteId || "",
      location: "",
    },
  });

  const selectedSiteId = form.watch("siteId");
  const selectedSite = mockSites.find(s => s.id === selectedSiteId);

  const handleSubmit = async (data: UnitFormData) => {
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      onSubmit?.(data);
      toast.success("ACS unit added successfully");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to add unit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Box className="w-4 h-4 text-primary" />
            Add ACS Unit
          </DialogTitle>
          <DialogDescription>
            Add a new ACS unit to a site. The unit will inherit the site's configuration.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="siteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select site" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {mockSites.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            {site.name}
                            <span className="text-xs text-muted-foreground">
                              ({site.projectName} / {site.subprojectName})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedSite && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Lock className="w-3 h-3" />
                  Inherited Configuration
                </div>
                <div className="flex items-center gap-4 text-foreground">
                  <span>₹{selectedSite.configuredRent.toLocaleString("en-IN")}/mo</span>
                  <span>•</span>
                  <span>{selectedSite.configuredTenure} months tenure</span>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., SN-2024-0001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
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
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location within Site (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Floor 12, Zone A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-start gap-2 p-3 bg-status-info/10 rounded-lg text-xs text-muted-foreground">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-status-info" />
              <span>
                The unit's tenure will start when it becomes operational. 
                Rent end date is calculated as: activation date + {selectedSite?.configuredTenure || 36} months.
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
