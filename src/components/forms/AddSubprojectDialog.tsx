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
  baseMonthlyRent: z.number().min(1000, "Minimum rent is ₹1,000").max(100000),
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
}

export function AddSubprojectDialog({ 
  open, 
  onOpenChange, 
  projectId,
  projectName,
  onSubmit 
}: AddSubprojectDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      await new Promise(resolve => setTimeout(resolve, 500));
      onSubmit?.(data);
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
      <DialogContent className="sm:max-w-[600px]">
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
