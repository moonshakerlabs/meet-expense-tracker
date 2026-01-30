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
import { Crown, Lock } from "lucide-react";

interface FreemiumGateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
  onUpgrade: () => void;
}

const FreemiumGate = ({
  open,
  onOpenChange,
  featureName,
  onUpgrade,
}: FreemiumGateProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[90%] rounded-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-emerald-500" />
            </div>
            <AlertDialogTitle>Freemium Feature</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-3">
            <p>
              <strong>{featureName}</strong> is available with Freemium.
            </p>
            <p>
              Upgrade to unlock this feature and many more!
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel className="rounded-xl">
            Maybe later
          </AlertDialogCancel>
          <AlertDialogAction
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
            onClick={onUpgrade}
          >
            <Crown className="w-4 h-4 mr-2" />
            View Upgrade Options
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default FreemiumGate;
