import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { toast } from "sonner";
import api from "@/lib/api";
import { Separator } from "@/components/ui/separator";
import { Upload, X, File as FileIcon, Image as ImageIcon, FileText, RotateCcw } from "lucide-react";

const clientSchema = z.object({
  name: z.string().min(2, "Client name must be at least 2 characters").max(100),
  contactPerson: z.string().min(2, "Contact person name is required").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required").max(15),
  address: z.string().min(2, "Address is required").max(200),
  gstNumber: z.string().max(15).optional().or(z.literal("")),
  tradeName: z.string().max(100).optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
  contractStartDate: z.string().optional().nullable(),
  contractEndDate: z.string().optional().nullable(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientData {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  gstNumber?: string;
  tradeName?: string;
  notes?: string;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
}

interface EditClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientData | null;
  onClientUpdate: () => void;
}

interface FileWithPreview {
  file: File;
  id: string;
}

export function EditClientDialog({ open, onOpenChange, client, onClientUpdate }: EditClientDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [newAttachments, setNewAttachments] = useState<FileWithPreview[]>([]);
  const [attachmentsToDelete, setAttachmentsToDelete] = useState<string[]>([]);

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

  useEffect(() => {
    if (client && open) {
      form.reset({
        name: client.name,
        contactPerson: client.contactPerson,
        email: client.email,
        phone: client.phone,
        address: client.address,
        gstNumber: client.gstNumber,
        tradeName: client.tradeName,
        notes: client.notes || "",
        contractStartDate: client.contractStartDate,
        contractEndDate: client.contractEndDate,
      });
      // Fetch existing attachments
      api.get(`/clients/${client.id.replace('CLT-', '')}/documents`)
        .then(response => setAttachments(response.data))
        .catch(() => toast.error("Failed to load attachments."));
    } else {
      // Reset states when dialog is closed
      setAttachments([]);
      setNewAttachments([]);
      setAttachmentsToDelete([]);
    }
  }, [client, open, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles: FileWithPreview[] = Array.from(files).map((file) => ({
        file,
        id: Math.random().toString(36).substring(7),
      }));
      setNewAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  const removeNewAttachment = (id: string) => {
    setNewAttachments((prev) => prev.filter((file) => file.id !== id));
  };
  
  const removeExistingAttachment = (fileName: string) => {
    setAttachmentsToDelete((prev) => [...prev, fileName]);
  };

  const undoRemoveExistingAttachment = (fileName: string) => {
    setAttachmentsToDelete((prev) => prev.filter((name) => name !== fileName));
  };

  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false);
  const [formData, setFormData] = useState<ClientFormData | null>(null);

  const handleSubmit = (data: ClientFormData) => {
    setFormData(data);
    setShowSaveConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    if (!client || !formData) return;
    setIsSubmitting(true);
    setShowSaveConfirmDialog(false);
    try {
      // 1. Update client details
      await api.put(`/clients/${client.id.replace('CLT-','')}`, formData);

      // 2. Delete marked attachments
      if (attachmentsToDelete.length > 0) {
        await Promise.all(
          attachmentsToDelete.map(fileName =>
            api.delete(`/clients/${client.id.replace('CLT-', '')}/documents/${fileName}`)
          )
        );
      }
      
      // 3. Upload new attachments if any
      if (newAttachments.length > 0) {
        const uploadFormData = new FormData();
        newAttachments.forEach((attachment) => {
          uploadFormData.append("files", attachment.file);
        });
        uploadFormData.append("entityType", "CLIENT");
        uploadFormData.append("entityId", client.id.replace('CLT-',''));
        await api.post("/documents/upload", uploadFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
             Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
      }

      toast.success("Client updated successfully.");
      onClientUpdate();
      onOpenChange(false);
    } catch (error) {
      toast.error("An error occurred while updating the client.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    } else if (extension === 'pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else {
      return <FileIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Edit Client</DialogTitle>
          <DialogDescription className="text-base">
            Update the details for {client?.name}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Innovations Inc." {...field} />
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
                    <FormLabel>Trade Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Innovate" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. contact@innovate.com" {...field} />
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. +1234567890" {...field} />
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
                    <FormLabel>GST Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 29ABCDE1234F1Z5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contractStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contractEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="123 Innovation Drive, Tech City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add any relevant notes here..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator />

            {/* Attachments Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Attachments
              </h3>
              
              {/* Existing Files */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Existing Files</p>
                  {attachments.map((fileName) => {
                    const isMarkedForDeletion = attachmentsToDelete.includes(fileName);
                    return (
                      <div
                        key={fileName}
                        className={`flex items-center justify-between p-2 rounded-lg ${
                          isMarkedForDeletion ? 'bg-red-500/10' : 'bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {getFileIcon(fileName)}
                          <span className={`text-sm ${isMarkedForDeletion ? 'text-red-500 line-through' : ''}`}>
                            {fileName}
                          </span>
                        </div>
                        {isMarkedForDeletion ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => undoRemoveExistingAttachment(fileName)}
                          >
                            <RotateCcw className="h-4 w-4 text-blue-500" />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExistingAttachment(fileName)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* New Files */}
              {newAttachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">New Files</p>
                  {newAttachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-2 bg-green-500/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        {getFileIcon(attachment.file.name)}
                        <span className="text-sm text-green-600">{attachment.file.name}</span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeNewAttachment(attachment.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Area */}
              <div className="relative border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="mx-auto h-10 w-10 text-gray-400" />
                <label htmlFor="file-upload-edit" className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500 cursor-pointer">
                  Upload new files
                </label>
                <p className="text-xs text-gray-500">or drag and drop</p>
                <input id="file-upload-edit" type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
              </div>
            </div>


            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
      <AlertDialog open={showSaveConfirmDialog} onOpenChange={setShowSaveConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to save changes to this client.
              {newAttachments.length > 0 && ` You are adding ${newAttachments.length} new file(s).`}
              {attachmentsToDelete.length > 0 && ` You are deleting ${attachmentsToDelete.length} file(s).`}
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}