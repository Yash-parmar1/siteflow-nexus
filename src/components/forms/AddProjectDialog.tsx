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
import { Upload, FileText, Image, File, X } from "lucide-react";
import { useRef } from "react";
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

const projectSchema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
  clientId: z.string().min(1, "Client is required"),
  status: z.enum(["active", "on-hold"]),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: ProjectFormData) => void;
  onFilesChange?: (files: File[]) => void; // new prop to lift attachments to parent
}

export function AddProjectDialog({ open, onOpenChange, onSubmit, onFilesChange }: AddProjectDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<Array<{ id: number | string; name: string }>>([]);

  // attachments (rich UI modeled after AddClientDialog)
  interface FileWithPreview { id: string; file: File; preview?: string }
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
    const newFiles: FileWithPreview[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      file,
    }));
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

  useEffect(() => {
    let mounted = true;
    api.get('/clients')
      .then(res => {
        if (mounted && Array.isArray(res.data)) setClients(res.data);
      })
      .catch(() => setClients([]));
    return () => { mounted = false; };
  }, []);
  
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      clientId: "",
      status: "active",
    },
  });

  const handleSubmit = async (data: ProjectFormData) => {
    console.debug('Create project form submit', data);
    setIsSubmitting(true);
    try {
      if (!data.clientId) {
        toast.error('Please select a client');
        return;
      }
      console.debug('onSubmit present?', !!onSubmit);
      // If parent provided onSubmit, delegate; otherwise fall back to calling API directly
      if (onSubmit) {
        await onSubmit(data);
        console.debug('onSubmit resolved');
      } else {
        // fallback API call
        const payload = {
          name: data.name,
          description: data.description,
          clientId: Number(data.clientId),
          status: data.status,
        };
        console.debug('Fallback POST /projects payload', payload);
        const res = await api.post('/projects', payload);
        console.debug('Fallback POST response', res);
        if (!(res.status === 201 || res.status === 200)) {
          throw new Error('Failed to create project');
        }
      }
      toast.success("Project created successfully");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create project");
      console.error('Create project error', error);
      throw error; // rethrow so caller also sees it
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            A project represents a commercial agreement with a client. Add subprojects to define specific pricing configurations.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Dava India" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={(val) => field.onChange(String(val))}>
                      <SelectTrigger>
                        <SelectValue placeholder={clients.length ? "Select client" : "No clients found"} />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(c => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the project scope..."
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File upload (drag & drop UI) */}
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
              <FormMessage />
            </FormItem>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !form.watch('clientId')}>
                {isSubmitting ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
