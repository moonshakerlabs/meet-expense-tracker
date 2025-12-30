import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { ArrowLeft, Plus, CalendarClock, Pencil, Trash2, Power } from "lucide-react";
import { RecurringExpense, Category, CATEGORIES, SUBCATEGORIES, CATEGORY_COLORS } from "@/types/expense";
import { toast } from "@/hooks/use-toast";

interface RecurringExpensesPanelProps {
  recurringExpenses: RecurringExpense[];
  formatCurrency: (amount: number) => string;
  currencySymbol: string;
  onAdd: (data: {
    name: string;
    amount: number;
    category: Category;
    subcategory?: string;
    dayOfMonth: number;
  }) => void;
  onUpdate: (id: string, data: Partial<RecurringExpense>) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  getExpectedMonthlyTotal: () => number;
  onBack: () => void;
}

const RecurringExpensesPanel = ({
  recurringExpenses,
  formatCurrency,
  currencySymbol,
  onAdd,
  onUpdate,
  onDelete,
  onToggleActive,
  getExpectedMonthlyTotal,
  onBack,
}: RecurringExpensesPanelProps) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("bills");
  const [subcategory, setSubcategory] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("1");

  const expectedTotal = getExpectedMonthlyTotal();
  const activeCount = recurringExpenses.filter((r) => r.isActive).length;

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) return;
    setAmount(cleaned);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: "Error", description: "Please enter a name", variant: "destructive" });
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Error", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    onAdd({
      name: name.trim(),
      amount: parseFloat(amount),
      category,
      subcategory: subcategory || undefined,
      dayOfMonth: parseInt(dayOfMonth),
    });

    toast({
      title: "Recurring expense added",
      description: `${name} - ${currencySymbol}${parseFloat(amount).toFixed(2)} on day ${dayOfMonth}`,
    });

    setName("");
    setAmount("");
    setCategory("bills");
    setSubcategory("");
    setDayOfMonth("1");
    setShowAddModal(false);
  };

  const handleDelete = () => {
    if (deletingId) {
      onDelete(deletingId);
      toast({ title: "Deleted", description: "Recurring expense removed" });
      setDeletingId(null);
    }
  };

  const availableSubcategories = SUBCATEGORIES[category] || [];

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display font-bold text-xl">Recurring Expenses</h1>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Summary */}
        <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-3xl">
          <p className="text-sm opacity-80 mb-1">Expected Monthly</p>
          <h2 className="font-display font-bold text-4xl">
            {formatCurrency(expectedTotal)}
          </h2>
          <p className="text-sm opacity-80 mt-2">
            {activeCount} active recurring expense{activeCount !== 1 ? "s" : ""}
          </p>
        </Card>

        {/* Recurring List */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            All Recurring Expenses
          </h3>
          {recurringExpenses.length > 0 ? (
            <div className="space-y-3">
              {recurringExpenses.map((recurring) => {
                const categoryInfo = CATEGORIES.find((c) => c.id === recurring.category);
                const subcategoryLabel = recurring.subcategory
                  ? SUBCATEGORIES[recurring.category]?.find((s) => s.id === recurring.subcategory)?.label
                  : null;
                return (
                  <Card
                    key={recurring.id}
                    className={`p-4 rounded-2xl transition-opacity ${!recurring.isActive ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[recurring.category]}20`,
                        }}
                      >
                        {categoryInfo?.icon || "📦"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{recurring.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {categoryInfo?.label}
                          {subcategoryLabel && ` • ${subcategoryLabel}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Day {recurring.dayOfMonth} of each month
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {formatCurrency(recurring.amount)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onToggleActive(recurring.id)}
                        >
                          <Power
                            className={`w-4 h-4 ${recurring.isActive ? "text-emerald-500" : "text-muted-foreground"}`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setDeletingId(recurring.id)}
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 rounded-2xl text-center">
              <CalendarClock className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No recurring expenses yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add recurring expenses to track expected monthly costs
              </p>
            </Card>
          )}
        </div>

        {/* Add Button */}
        <Button
          size="lg"
          className="w-full rounded-2xl h-14"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Recurring Expense
        </Button>
      </div>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-[90%] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Add Recurring Expense</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Name */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Name
              </label>
              <Input
                placeholder="e.g., Netflix Subscription"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted-foreground">
                  {currencySymbol}
                </span>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="pl-10 h-12 text-xl font-bold rounded-xl"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Category
              </label>
              <Select value={category} onValueChange={(v) => {
                setCategory(v as Category);
                setSubcategory("");
              }}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subcategory */}
            {availableSubcategories.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Subcategory (optional)
                </label>
                <Select value={subcategory} onValueChange={setSubcategory}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border">
                    {availableSubcategories.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Day of Month */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Day of Month (1-31)
              </label>
              <Input
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Save Button */}
            <Button
              className="w-full rounded-xl h-12 font-semibold"
              onClick={handleSave}
            >
              Save Recurring Expense
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="max-w-[90%] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the recurring expense. Past expenses won't be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RecurringExpensesPanel;
