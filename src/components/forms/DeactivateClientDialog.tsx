import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeactivateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  clientName: string;
  isActive: boolean;
}

export function DeactivateClientDialog({
  open,
  onOpenChange,
  onConfirm,
  clientName,
  isActive,
}: DeactivateClientDialogProps) {
  const title = isActive ? "Deactivate Client" : "Activate Client";
  const description = isActive
    ? `Are you sure you want to deactivate the client ${clientName}? This action will mark the client as inactive, archive all projects and subprojects under this client, and prevent activating those projects while the client remains inactive.`
    : `Are you sure you want to activate the client ${clientName}? This action will mark the client as active and restore projects/subprojects that were archived due to client deactivation.`;
  const buttonText = isActive ? "Deactivate" : "Activate";
  const buttonVariant = isActive ? "destructive" : "default";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="text-destructive" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant={buttonVariant} onClick={onConfirm}>
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}