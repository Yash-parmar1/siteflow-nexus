import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Key, Mail, Copy, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface UserData {
  id: string;
  name: string;
  email: string;
}

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData | null;
  onConfirm?: () => void;
}

export function ResetPasswordDialog({ open, onOpenChange, user, onConfirm }: ResetPasswordDialogProps) {
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [resetMethod, setResetMethod] = useState<"email" | "manual">("email");
  const [tempPassword, setTempPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const generateTempPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleReset = async () => {
    if (!user) return;
    
    setIsResetting(true);
    try {
      // TODO: Integrate with backend
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (resetMethod === "manual") {
        const newPassword = generateTempPassword();
        setTempPassword(newPassword);
        toast({
          title: "Password reset successful",
          description: "A temporary password has been generated.",
        });
      } else {
        onConfirm?.();
        toast({
          title: "Password reset email sent",
          description: `A password reset link has been sent to ${user.email}`,
        });
        onOpenChange(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setTempPassword("");
    setCopied(false);
    setResetMethod("email");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Reset Password
          </DialogTitle>
          <DialogDescription>
            Reset password for <span className="font-medium text-foreground">{user?.name}</span>
          </DialogDescription>
        </DialogHeader>

        {!tempPassword ? (
          <div className="space-y-4 py-4">
            <RadioGroup value={resetMethod} onValueChange={(v) => setResetMethod(v as "email" | "manual")}>
              <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="email" id="email" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="email" className="cursor-pointer font-medium">Send reset link via email</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    User will receive an email with a secure link to reset their password.
                  </p>
                </div>
                <Mail className="w-5 h-5 text-muted-foreground" />
              </div>
              
              <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="manual" id="manual" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="manual" className="cursor-pointer font-medium">Generate temporary password</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create a temporary password that the user must change on next login.
                  </p>
                </div>
                <Key className="w-5 h-5 text-muted-foreground" />
              </div>
            </RadioGroup>

            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={handleClose} disabled={isResetting}>
                Cancel
              </Button>
              <Button onClick={handleReset} disabled={isResetting}>
                {isResetting ? "Processing..." : "Reset Password"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-[hsl(var(--status-success)/0.1)] border border-[hsl(var(--status-success)/0.2)] rounded-lg">
              <p className="text-sm text-[hsl(var(--status-success))] mb-3">
                Temporary password generated successfully!
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={tempPassword}
                  readOnly
                  className="font-mono text-center bg-background"
                />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Share this password securely with the user. They will be required to change it on their next login.
            </p>

            <DialogFooter className="pt-2">
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
