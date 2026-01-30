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
import { AlertTriangle } from "lucide-react";

interface CSVExportWarningProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExportCSV: () => void;
  onUseJSON: () => void;
}

const CSVExportWarning = ({
  open,
  onOpenChange,
  onExportCSV,
  onUseJSON,
}: CSVExportWarningProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[90%] rounded-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <AlertDialogTitle>CSV Import Notice</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-3">
            <p>
              <strong>CSV import is available only for Freemium users.</strong>
            </p>
            <p>
              If your trial ends or you return to Free, CSV files cannot be imported.
            </p>
            <p>
              For guaranteed re-import on any plan, use <strong>JSON export</strong> instead.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel 
            className="rounded-xl"
            onClick={onUseJSON}
          >
            Use JSON instead
          </AlertDialogCancel>
          <AlertDialogAction
            className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white"
            onClick={onExportCSV}
          >
            Export CSV anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CSVExportWarning;
