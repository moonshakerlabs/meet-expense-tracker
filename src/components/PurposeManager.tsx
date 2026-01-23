import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Purpose } from "@/types/expense";
import { toast } from "sonner";
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

interface PurposeManagerProps {
  purposes: Purpose[];
  onAddPurpose: (purpose: Purpose) => void;
  onUpdatePurpose: (id: string, updates: Partial<Purpose>) => void;
  onRemovePurpose: (id: string) => void;
  onBack: () => void;
}

const PurposeManager = ({
  purposes,
  onAddPurpose,
  onUpdatePurpose,
  onRemovePurpose,
  onBack,
}: PurposeManagerProps) => {
  const [newPurpose, setNewPurpose] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddPurpose = () => {
    if (!newPurpose.trim()) return;
    
    const purpose: Purpose = {
      id: `purpose_${Date.now()}`,
      label: newPurpose.trim(),
      createdAt: new Date(),
    };
    
    onAddPurpose(purpose);
    setNewPurpose("");
    toast.success("Purpose added");
  };

  const handleUpdatePurpose = () => {
    if (!editingId || !editingLabel.trim()) return;
    onUpdatePurpose(editingId, { label: editingLabel.trim() });
    setEditingId(null);
    setEditingLabel("");
    toast.success("Purpose updated");
  };

  const handleDeletePurpose = () => {
    if (!deletingId) return;
    onRemovePurpose(deletingId);
    setDeletingId(null);
    toast.success("Purpose deleted");
  };

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display font-bold text-xl">Manage Purposes</h1>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Add New Purpose */}
        <Card className="p-4 rounded-2xl">
          <h3 className="font-semibold mb-3">Add Purpose</h3>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., Birthday Party 2026"
              value={newPurpose}
              onChange={(e) => setNewPurpose(e.target.value)}
              className="rounded-xl"
              onKeyDown={(e) => e.key === "Enter" && handleAddPurpose()}
            />
            <Button onClick={handleAddPurpose} disabled={!newPurpose.trim()} className="rounded-xl">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Existing Purposes */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            Your Purposes ({purposes.length})
          </h3>
          {purposes.length > 0 ? (
            <Card className="rounded-2xl divide-y divide-border">
              {purposes.map((purpose) => (
                <div key={purpose.id} className="p-4 flex items-center justify-between">
                  {editingId === purpose.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editingLabel}
                        onChange={(e) => setEditingLabel(e.target.value)}
                        className="rounded-xl h-10"
                        autoFocus
                      />
                      <Button size="icon" className="h-10 w-10" onClick={handleUpdatePurpose}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-10 w-10" onClick={() => setEditingId(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                          <span className="text-lg">🎯</span>
                        </div>
                        <p className="font-medium">{purpose.label}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingId(purpose.id);
                            setEditingLabel(purpose.label);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeletingId(purpose.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </Card>
          ) : (
            <Card className="p-8 rounded-2xl text-center">
              <p className="text-muted-foreground">No purposes created yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add purposes to organize your expenses
              </p>
            </Card>
          )}
        </div>
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="max-w-[90%] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purpose?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the purpose. Expenses tagged with it will keep their data but won't show this purpose.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-destructive text-destructive-foreground" onClick={handleDeletePurpose}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PurposeManager;
