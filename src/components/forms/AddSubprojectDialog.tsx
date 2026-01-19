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
import { Upload, FileText, Image, File, X } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Lock, IndianRupee, Calendar, Wrench } from "lucide-react";

const subprojectSchema = z.object({
  name: z.string().min(2, "Subproject name must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
  baseMonthlyRent: z.number().min(100, "Minimum rent is ₹100").max(100000),
  tenureMonths: z.number().min(12, "Minimum tenure is 12 months").max(120),
  installationChargeable: z.boolean(),
  installationCharge: z.number().optional(),
  maintenanceIncluded: z.boolean(),
  maintenanceCharge: z.number().optional(),
});

type SubprojectFormData = z.infer<typeof subprojectSchema>;

interface AddSubprojectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  onSubmit?: (data: SubprojectFormData) => void;
  onFilesChange?: (files: File[]) => void;
}

export function AddSubprojectDialog({ 
  open, 
  onOpenChange, 
  projectId,
  projectName,
  onSubmit,
  onFilesChange
}: AddSubprojectDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // attachments UI
  interface FileWithPreview { id: string; file: File }
  const [attachments, setAttachments] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <Image className="h-5 w-5" />;
    if (fileType.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const addFiles = (files: FileList) => {
    const newFiles: FileWithPreview[] = Array.from(files).map((file) => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, file }));
    setAttachments((prev) => {
      const merged = [...prev, ...newFiles];
      if (onFilesChange) onFilesChange(merged.map(f => f.file));
      return merged;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    addFiles(files);
  };

  const removeFile = (id: string) => {
    setAttachments((prev) => {
      const remaining = prev.filter((f) => f.id !== id);
      if (onFilesChange) onFilesChange(remaining.map(f => f.file));
      return remaining;
    });
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const triggerFileInput = () => fileInputRef.current?.click();

  const form = useForm<SubprojectFormData>({
    resolver: zodResolver(subprojectSchema),
    defaultValues: {
      name: "",
      baseMonthlyRent: 12000,
      tenureMonths: 36,
      installationChargeable: false,
      installationCharge: 25000,
      maintenanceIncluded: true,
      maintenanceCharge: 2000,
    },
  });

  const watchInstallationChargeable = form.watch("installationChargeable");
  const watchMaintenanceIncluded = form.watch("maintenanceIncluded");

  const handleSubmit = async (data: SubprojectFormData) => {
    setIsSubmitting(true);
    try {
      if (onSubmit) await onSubmit(data);
      toast.success("Subproject created with locked configuration");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create subproject");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Create Subproject Configuration
          </DialogTitle>
          <DialogDescription>
            for <span className="font-medium text-foreground">{projectName}</span> — 
            Configuration will be locked after creation and cannot be modified.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subproject Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Delhi, Mumbai, Phase 1" {...field} />
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
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add a short description for the subproject" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="p-4 bg-secondary/30 rounded-lg border border-border space-y-4">
              <h4 className="font-medium text-sm text-foreground flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" />
                Pricing Configuration (Immutable)
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="baseMonthlyRent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <IndianRupee className="w-3.5 h-3.5" />
                        Base Monthly Rent
                      </FormLabel>
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

                <FormField
                  control={form.control}
                  name="tenureMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        Tenure (Months)
                      </FormLabel>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="installationChargeable"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Checkbox 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0 cursor-pointer">
                          Installation Chargeable
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  {watchInstallationChargeable && (
                    <FormField
                      control={form.control}
                      name="installationCharge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Installation Charge</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="25000"
                              {...field} 
                              onChange={e => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="maintenanceIncluded"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Checkbox 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0 cursor-pointer flex items-center gap-1">
                          <Wrench className="w-3 h-3" />
                          Maintenance Included
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  {!watchMaintenanceIncluded && (
                    <FormField
                      control={form.control}
                      name="maintenanceCharge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Monthly Maintenance</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="2000"
                              {...field} 
                              onChange={e => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <strong>Note:</strong> Once created, this configuration cannot be edited. 
              Any future pricing changes require creating a new subproject. 
              Sites bound to this subproject will inherit these rules permanently.
            </div>

            <div className="space-y-2">
              <FormItem>
                <FormLabel>Attachments (optional)</FormLabel>
                <FormControl>
                  <div
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    className={`border-dashed border-2 rounded-md p-4 text-center ${isDragging ? 'border-primary/70 bg-primary/5' : 'border-border bg-transparent'}`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Drag & drop files here, or <button type="button" onClick={triggerFileInput} className="text-primary underline">browse</button></div>
                        <div className="text-xs text-muted-foreground">Supported file types: pdf, xlsx, png, jpg</div>
                      </div>
                    </div>
                    <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" />

                    {attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {attachments.map((a) => (
                          <div key={a.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex items-center gap-2">
                              {getFileIcon(a.file.type)}
                              <div>
                                <div className="text-sm font-medium">{a.file.name}</div>
                                <div className="text-xs text-muted-foreground">{formatFileSize(a.file.size)}</div>
                              </div>
                            </div>
                            <button type="button" onClick={() => removeFile(a.id)} className="text-destructive">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </FormControl>
              </FormItem>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create & Lock Configuration"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
