import { useState, useEffect } from "react";
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
import { MapPin, AlertTriangle, FolderKanban } from "lucide-react";

interface ProjectOption {
  id: string;
  name: string;
  clientId?: number;
  subprojects: { id: string; name: string; configurationId?: number }[];
}

const siteSchema = z.object({
  name: z.string().min(2, "Site name must be at least 2 characters").max(100),
  siteCode: z.string().max(50).optional(),
  location: z.string().min(3, "Location is required").max(200),
  projectId: z.string().min(1, "Project is required"),
  subprojectId: z.string().min(1, "Subproject is required"),
  siteType: z.string().optional(),
  regionType: z.string().optional(),
  preferredAcMake: z.string().max(100).optional(),
  plannedAcsCount: z.number().min(1, "At least 1 AC unit is required").max(200),
  notes: z.string().max(500).optional(),
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
  onSubmit,
}: AddSiteDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const { refresh } = useAppData();

  // Fetch real projects from API
  useEffect(() => {
    if (open) {
      api.get("/projects").then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setProjects(
          data.map((p: any) => ({
            id: String(p.id),
            name: p.name,
            clientId: p.clientId ?? p.client?.id,
            subprojects: (p.subprojects || []).map((s: any) => ({
              id: String(s.id),
              name: s.name,
              configurationId: s.configurationId ?? s.configuration?.id,
            })),
          }))
        );
      }).catch(() => {});
    }
  }, [open]);

  const form = useForm<SiteFormData>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      name: "",
      siteCode: "",
      location: "",
      projectId: defaultProjectId || "",
      subprojectId: defaultSubprojectId || "",
      siteType: "",
      regionType: "",
      preferredAcMake: "",
      plannedAcsCount: 4,
      notes: "",
    },
  });

  const selectedProjectId = form.watch("projectId");
  const selectedSubprojectId = form.watch("subprojectId");
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const selectedSubproject = selectedProject?.subprojects.find((s) => s.id === selectedSubprojectId);

  const handleSubmit = async (data: SiteFormData) => {
    setIsSubmitting(true);
    try {
      const project = projects.find((p) => p.id === data.projectId);
      const subproject = project?.subprojects.find((s) => s.id === data.subprojectId);

      const payload: Record<string, any> = {
        name: data.name,
        siteCode: data.siteCode || null,
        addressJson: data.location,
        location: data.location,
        projectId: Number(data.projectId),
        subprojectId: Number(data.subprojectId),
        clientId: project?.clientId ? Number(project.clientId) : null,
        configurationId: subproject?.configurationId ? Number(subproject.configurationId) : null,
        siteType: data.siteType || null,
        regionType: data.regionType || null,
        preferredAcMake: data.preferredAcMake || null,
        plannedAcsCount: data.plannedAcsCount,
        currentStage: "Started",
        progress: 0,
        hasDelay: false,
        status: "ACTIVE",
        notes: data.notes || null,
      };

      await api.post("/sites", payload);
      onSubmit?.(data);
      toast.success("Site created successfully");
      form.reset();
      await refresh();
      onOpenChange(false);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.response?.data || "Failed to create site";
      toast.error(typeof msg === "string" ? msg : "Failed to create site");
    } finally {
      setIsSubmitting(false);
    }
  };

  const siteTypes = ["Commercial", "Residential", "Industrial", "Government", "Retail", "Office"];
  const regionTypes = ["Urban", "Semi-Urban", "Rural", "Metro"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Add New Site
          </DialogTitle>
          <DialogDescription>
            Select a project and subproject, then fill in site details to create a new site.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Project / Subproject */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("subprojectId", "");
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <FolderKanban className="w-4 h-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((project) => (
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
                    <FormLabel>Subproject *</FormLabel>
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
                        {selectedProject?.subprojects.map((subproject) => (
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

            {/* SiteCode / SiteName */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="siteCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., SITE-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Metro Tower - Block A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location / Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Mumbai, Maharashtra" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type / Region / AC Make */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="siteType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {siteTypes.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="regionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Region" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regionTypes.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="preferredAcMake"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred AC Make</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Daikin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Planned ACs */}
            <FormField
              control={form.control}
              name="plannedAcsCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Planned AC Units *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional notes..." className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedSubproject && (
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Once created, this site will be bound to the selected subproject's configuration.
                  The pricing rules will be inherited automatically.
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
