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
import { Download } from "lucide-react";

interface UpdateAvailableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  isUpdating: boolean;
}

const UpdateAvailableDialog = ({
  open,
  onOpenChange,
  onUpdate,
  isUpdating,
}: UpdateAvailableDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[90%] rounded-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <AlertDialogTitle className="text-xl">Update Available</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            Update the app for a great experience with the latest features and improvements.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel 
            className="rounded-xl"
            disabled={isUpdating}
          >
            Later
          </AlertDialogCancel>
          <AlertDialogAction
            className="rounded-xl bg-primary"
            onClick={(e) => {
              e.preventDefault();
              onUpdate();
            }}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Updating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Update Now
              </span>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default UpdateAvailableDialog;
