import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Lock, Unlock, AlertCircle } from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  status: string;
}

interface DeactivateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData | null;
  onConfirm?: () => void;
}

export function DeactivateUserDialog({ open, onOpenChange, user, onConfirm }: DeactivateUserDialogProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const isDeactivating = user?.status === "Active";
  const actionText = isDeactivating ? "Deactivate" : "Activate";
  const actionIcon = isDeactivating ? Lock : Unlock;
  const ActionIcon = actionIcon;

  const handleConfirm = async () => {
    if (!user) return;
    
    setIsProcessing(true);
    try {
      // TODO: Integrate with backend
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onConfirm?.();
      toast({
        title: `User ${isDeactivating ? "deactivated" : "activated"}`,
        description: `${user.name} has been ${isDeactivating ? "deactivated" : "activated"} successfully.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${actionText.toLowerCase()} user. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-background border-border">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isDeactivating 
                ? "bg-[hsl(var(--status-warning)/0.15)]" 
                : "bg-[hsl(var(--status-success)/0.15)]"
            }`}>
              <ActionIcon className={`w-5 h-5 ${
                isDeactivating 
                  ? "text-[hsl(var(--status-warning))]" 
                  : "text-[hsl(var(--status-success))]"
              }`} />
            </div>
            <AlertDialogTitle>{actionText} User</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            {isDeactivating ? (
              <>
                <p>
                  Are you sure you want to deactivate{" "}
                  <span className="font-semibold text-foreground">{user?.name}</span>?
                </p>
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>User will immediately lose access to the system</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>All active sessions will be terminated</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <span>User data and history will be preserved</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p>
                  Are you sure you want to activate{" "}
                  <span className="font-semibold text-foreground">{user?.name}</span>?
                </p>
                <p className="text-sm">
                  The user will regain access to the system with their previous role and permissions.
                </p>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            variant={isDeactivating ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : actionText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
