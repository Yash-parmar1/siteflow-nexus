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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const vendorSchema = z.object({
  name: z.string().min(2, "Vendor name must be at least 2 characters").max(100),
  type: z.enum(["Installer", "Supplier", "Maintenance", "Logistics"]),
  contactPerson: z.string().min(2, "Contact person name is required").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required").max(15),
  location: z.string().min(2, "Location is required").max(200),
  contractExpiry: z.string().min(1, "Contract expiry date is required"),
  specializations: z.array(z.string()).min(1, "Select at least one specialization"),
  notes: z.string().max(500).optional(),
});

type VendorFormData = z.infer<typeof vendorSchema>;

const availableSpecializations = [
  "Installation",
  "Repairs",
  "Maintenance",
  "Emergency Repairs",
  "Preventive Maintenance",
  "Compressors",
  "Filters",
  "Refrigerants",
  "Shipping",
  "Last-mile Delivery",
];

interface AddVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (data: VendorFormData) => void;
}

export function AddVendorDialog({ open, onOpenChange, onSubmit }: AddVendorDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: "",
      type: "Installer",
      contactPerson: "",
      email: "",
      phone: "",
      location: "",
      contractExpiry: "",
      specializations: [],
      notes: "",
    },
  });

  const handleSubmit = async (data: VendorFormData) => {
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      onSubmit?.(data);
      toast.success("Vendor added successfully");
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to add vendor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
          <DialogDescription>
            Add a new vendor or service provider for installations, supplies, or maintenance.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Vendor Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., TechServe Solutions" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Installer">Installer</SelectItem>
                        <SelectItem value="Supplier">Supplier</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Logistics">Logistics</SelectItem>
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
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Rahul Sharma" {...field} />
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
                      <Input type="email" placeholder="e.g., rahul@techserve.com" {...field} />
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
                      <Input placeholder="e.g., +91 98765 43210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contractExpiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Expiry</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="specializations"
              render={() => (
                <FormItem>
                  <FormLabel>Specializations</FormLabel>
                  <FormDescription>Select all applicable services</FormDescription>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {availableSpecializations.map((spec) => (
                      <FormField
                        key={spec}
                        control={form.control}
                        name="specializations"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(spec)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, spec])
                                    : field.onChange(field.value?.filter((v) => v !== spec));
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              {spec}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional notes about this vendor..."
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
                {isSubmitting ? "Adding..." : "Add Vendor"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
