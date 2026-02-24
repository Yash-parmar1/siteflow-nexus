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
import { mockProjects } from "@/data/mockData";
import { Lock, IndianRupee, Calendar, MapPin, AlertTriangle } from "lucide-react";

const siteSchema = z.object({
  name: z.string().min(2, "Site name must be at least 2 characters").max(100),
  location: z.string().min(5, "Location is required").max(200),
  projectId: z.string().min(1, "Project is required"),
  subprojectId: z.string().min(1, "Subproject is required"),
  acsPlanned: z.number().min(1, "At least 1 ACS unit is required").max(100),
});

type SiteFormData = z.infer<typeof siteSchema>;

interface AddSiteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
  defaultSubprojectId?: string;
  onSubmit?: (data: SiteFormData) => void;
}

export function AddSiteDialog({ 
  open, 
  onOpenChange, 
  defaultProjectId,
  defaultSubprojectId,
  onSubmit 
}: AddSiteDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<SiteFormData>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      name: "",
      location: "",
      projectId: defaultProjectId || "",
      subprojectId: defaultSubprojectId || "",
      acsPlanned: 4,
    },
  });

  const selectedProjectId = form.watch("projectId");
  const selectedSubprojectId = form.watch("subprojectId");

  const selectedProject = mockProjects.find(p => p.id === selectedProjectId);
  const selectedSubproject = selectedProject?.subprojects.find(s => s.id === selectedSubprojectId);

  const handleSubmit = async (data: SiteFormData) => {
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      onSubmit?.(data);
      toast.success("Site created and bound to configuration");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create site");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Add New Site
          </DialogTitle>
          <DialogDescription>
            Select a project and subproject to bind this site to a pricing configuration.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("subprojectId", "");
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockProjects.filter(p => p.status === "active").map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
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
                name="subprojectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subproject</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={!selectedProjectId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subproject" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {selectedProject?.subprojects
                          .filter(s => s.status === "active")
                          .map((subproject) => (
                            <SelectItem key={subproject.id} value={subproject.id}>
                              {subproject.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedSubproject && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    Configuration to be bound (v{selectedSubproject.configuration.version})
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Base Rent</div>
                    <div className="font-medium flex items-center gap-1">
                      <IndianRupee className="w-3 h-3" />
                      {selectedSubproject.configuration.baseMonthlyRent.toLocaleString("en-IN")}/mo
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Tenure</div>
                    <div className="font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {selectedSubproject.configuration.tenureMonths} months
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Installation</div>
                    <div className="font-medium">
                      {selectedSubproject.configuration.installationChargeable 
                        ? `₹${selectedSubproject.configuration.installationCharge?.toLocaleString("en-IN")}`
                        : <span className="text-status-success">Included</span>
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Metro Tower - Block A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Mumbai, Maharashtra" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="acsPlanned"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Planned ACS Units</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      {...field} 
                      onChange={e => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedSubproject && (
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Once created, this site will be permanently bound to the selected configuration. 
                  The pricing rules cannot be changed for this site.
                </span>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedSubproject}>
                {isSubmitting ? "Creating..." : "Create Site"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
