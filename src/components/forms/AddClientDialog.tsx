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
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { X, Upload, FileText, Image, File } from "lucide-react";
import api from "@/lib/api";

const clientSchema = z.object({
  name: z.string().min(2, "Client name must be at least 2 characters").max(100),
  contactPerson: z.string().min(2, "Contact person name is required").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required").max(15),
  address: z.string().min(2, "Address is required").max(200),
  gstNumber: z.string().min(15, "GST number must be 15 characters").max(15),
  tradeName: z.string().min(2, "Trade name is required").max(100),
  notes: z.string().max(500).optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: ClientFormData) => void;
}

interface FileWithPreview {
  file: File;
  id: string;
}

export function AddClientDialog({ open, onOpenChange, onSubmit }: AddClientDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      gstNumber: "",
      tradeName: "",
      notes: "",
    },
  });

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <Image className="h-5 w-5 text-blue-500" />;
    } else if (fileType.includes("pdf")) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else {
      return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      addFiles(files);
    }
  };

  const addFiles = (files: FileList) => {
    const newFiles: FileWithPreview[] = Array.from(files).map((file) => ({
      file,
      id: Math.random().toString(36).substring(7),
    }));
    setAttachments((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setAttachments((prev) => prev.filter((file) => file.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    try {
      // 1. Create client
      const clientResponse = await api.post("/clients", data);

      const newClient = clientResponse.data;

      // 2. Upload attachments if any
      if (attachments.length > 0) {
        const formData = new FormData();
        attachments.forEach((attachment) => {
          formData.append("files", attachment.file);
        });
        formData.append("entityType", "CLIENT");
        formData.append("entityId", newClient.id.toString());

        try {
          await api.post("/documents/upload", formData);
        } catch (uploadError) {
          toast.error("Client created, but failed to upload attachments.");
        }
      }

      toast.success("Client added successfully");
      form.reset();
      setAttachments([]);
      onOpenChange(false);
      if (onSubmit) {
        onSubmit(data);
      }
    } catch (error) {
      toast.error("Failed to add client");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Add New Client</DialogTitle>
          <DialogDescription className="text-base">
            Add a new client to manage their sites, contracts, and billing.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-sm font-medium">Client Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Metro Properties Ltd." 
                          className="h-10"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tradeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Trade Name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Metro Group" 
                          className="h-10"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gstNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">GST Number *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 29ABCDE1234F1Z5" 
                          className="h-10 font-mono"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Contact Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Contact Person *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Anil Kapoor" 
                          className="h-10"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Phone *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., +91 98765 43210" 
                          className="h-10"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel className="text-sm font-medium">Email *</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="e.g., anil@company.com" 
                          className="h-10"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Address Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Address
              </h3>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Full Address *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 123 Business Bay, Bandra Kurla Complex, Mumbai, Maharashtra 400051"
                        className="resize-none min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Additional Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Additional Information
              </h3>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional notes about this client..."
                        className="resize-none min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* File Upload Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Attachments
              </h3>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                  isDragging
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="file-upload"
                />
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500"
                    >
                      <span>Upload files</span>
                    </label>
                    <p className="text-sm text-gray-500">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    PDF, DOC, DOCX, XLS, XLSX, Images up to 10MB
                  </p>
                </div>
              </div>

              {/* File List */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Selected Files ({attachments.length})
                  </p>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          {getFileIcon(attachment.file.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {attachment.file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(attachment.file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(attachment.id)}
                          className="ml-2 h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-6 gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2">Adding...</span>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </>
                ) : (
                  "Add Client"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}