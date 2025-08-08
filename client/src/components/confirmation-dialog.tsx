import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: "default" | "warning" | "destructive";
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  variant = "warning"
}: ConfirmationDialogProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "destructive":
        return {
          iconBg: "bg-destructive/10",
          iconColor: "text-destructive",
          buttonClass: "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
        };
      case "warning":
        return {
          iconBg: "bg-warning/10",
          iconColor: "text-warning",
          buttonClass: "bg-warning hover:bg-warning/90 text-warning-foreground"
        };
      default:
        return {
          iconBg: "bg-primary/10",
          iconColor: "text-primary",
          buttonClass: "bg-primary hover:bg-primary-dark text-primary-foreground"
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center mb-4">
            <div className={`${styles.iconBg} p-3 rounded-full mr-4`}>
              <AlertTriangle className={`${styles.iconColor} h-6 w-6`} />
            </div>
            <div>
              <DialogTitle className="text-lg font-medium text-foreground">{title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{message}</p>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isLoading}
            className={styles.buttonClass}
          >
            {isLoading ? 'Loading...' : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
