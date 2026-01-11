import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Wrench, MapPin, Box, User, AlertCircle } from "lucide-react";

const ticketSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  siteId: z.string().min(1, "Please select a site"),
  unitId: z.string().optional(),
  priority: z.string().min(1, "Please select a priority"),
  assigneeId: z.string().optional(),
});

type TicketFormData = z.infer<typeof ticketSchema>;

// Mock data
const mockSites = [
  { id: "site-001", name: "Metro Tower - Block A" },
  { id: "site-002", name: "Phoenix Mall Expansion" },
  { id: "site-003", name: "Cyber Hub Tower 5" },
  { id: "site-004", name: "Prestige Tech Park" },
  { id: "site-005", name: "DLF Cyber City Phase 3" },
];

const mockUnits = [
  { id: "SN-2024-0001", name: "SN-2024-0001 (Floor 12)" },
  { id: "SN-2024-0002", name: "SN-2024-0002 (Floor 15)" },
  { id: "SN-2024-0003", name: "SN-2024-0003 (Floor 8)" },
];

const mockAssignees = [
  { id: "USR-001", name: "Raj Kumar" },
  { id: "USR-002", name: "Priya Singh" },
  { id: "USR-003", name: "Amit Patel" },
];

const priorities = [
  { value: "Critical", color: "bg-[hsl(var(--status-error)/0.15)] text-[hsl(var(--status-error))]" },
  { value: "High", color: "bg-[hsl(var(--status-warning)/0.15)] text-[hsl(var(--status-warning))]" },
  { value: "Medium", color: "bg-[hsl(var(--status-info)/0.15)] text-[hsl(var(--status-info))]" },
  { value: "Low", color: "bg-muted text-muted-foreground" },
];

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStatus?: string;
  onSubmit?: (data: TicketFormData) => void;
}

export function CreateTicketDialog({ open, onOpenChange, initialStatus, onSubmit }: CreateTicketDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: "",
      description: "",
      siteId: "",
      unitId: "",
      priority: "",
      assigneeId: "",
    },
  });

  const handleSubmit = async (data: TicketFormData) => {
    setIsSubmitting(true);
    try {
      // TODO: Integrate with backend
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const ticketId = `TKT-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;
      
      onSubmit?.(data);
      toast({
        title: "Ticket created",
        description: `Ticket ${ticketId} has been created successfully.`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            Create Ticket
          </DialogTitle>
          <DialogDescription>
            Create a new maintenance or service ticket.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of the issue" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed description of the issue, symptoms, and any relevant observations..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="siteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-secondary/50">
                          <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="Select site" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border">
                        {mockSites.map((site) => (
                          <SelectItem key={site.id} value={site.id}>
                            {site.name}
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
                name="unitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ACS Unit (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-secondary/50">
                          <Box className="w-4 h-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border">
                        {mockUnits.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-secondary/50">
                          <AlertCircle className="w-4 h-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border">
                        {priorities.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${priority.color.split(" ")[0]}`} />
                              {priority.value}
                            </div>
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
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-secondary/50">
                          <User className="w-4 h-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border">
                        {mockAssignees.map((assignee) => (
                          <SelectItem key={assignee.id} value={assignee.id}>
                            {assignee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Ticket"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
