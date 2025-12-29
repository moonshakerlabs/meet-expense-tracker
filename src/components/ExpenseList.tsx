import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Search, Receipt, Pencil, Trash2, Calendar as CalendarIcon, Clock, Check } from "lucide-react";
import { Expense, CATEGORIES, Category } from "@/types/expense";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface ExpenseListProps {
  expenses: Expense[];
  formatCurrency: (amount: number) => string;
  currencySymbol: string;
  onBack: () => void;
  onUpdateExpense: (id: string, data: Partial<Expense>) => void;
  onDeleteExpense: (id: string) => void;
}

type FilterType = "today" | "week" | "month" | "all";
type SortType = "newest" | "oldest" | "highest";

const CATEGORY_COLORS: Record<Category, string> = {
  food: "hsl(25, 95%, 53%)",
  transport: "hsl(210, 80%, 55%)",
  shopping: "hsl(280, 60%, 55%)",
  rent: "hsl(340, 75%, 55%)",
  bills: "hsl(45, 93%, 47%)",
  misc: "hsl(200, 15%, 55%)",
  custom: "hsl(158, 64%, 42%)",
};

const FILTERS: { id: FilterType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

const ExpenseList = ({ expenses, formatCurrency, currencySymbol, onBack, onUpdateExpense, onDeleteExpense }: ExpenseListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  
  // Edit modal state
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [editTime, setEditTime] = useState("12:00");
  const [editNotes, setEditNotes] = useState("");
  
  // Delete confirmation state
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setEditAmount(expense.amount.toString());
    setEditCategory(expense.category);
    const expDate = new Date(expense.date);
    setEditDate(expDate);
    setEditTime(format(expDate, "HH:mm"));
    setEditNotes(expense.notes || "");
  };

  const handleEditSave = () => {
    if (!editingExpense || !editCategory || !editAmount) return;
    
    const [hours, minutes] = editTime.split(":").map(Number);
    const expenseDate = new Date(editDate);
    expenseDate.setHours(hours, minutes, 0, 0);
    
    onUpdateExpense(editingExpense.id, {
      amount: parseFloat(editAmount),
      category: editCategory,
      notes: editNotes.trim() || undefined,
      date: expenseDate,
    });
    
    toast({
      title: "Expense updated",
      description: `${currencySymbol}${parseFloat(editAmount).toFixed(2)} in ${CATEGORIES.find(c => c.id === editCategory)?.label}`,
    });
    
    setEditingExpense(null);
  };

  const handleDelete = () => {
    if (!deletingExpense) return;
    
    onDeleteExpense(deletingExpense.id);
    
    toast({
      title: "Expense deleted",
      description: "The expense has been removed",
    });
    
    setDeletingExpense(null);
  };

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) return;
    setEditAmount(cleaned);
  };

  const filteredAndSortedExpenses = useMemo(() => {
    const now = new Date();
    
    // Apply filter
    let filtered = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      
      switch (filter) {
        case "today":
          return (
            expenseDate.getDate() === now.getDate() &&
            expenseDate.getMonth() === now.getMonth() &&
            expenseDate.getFullYear() === now.getFullYear()
          );
        case "week":
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return expenseDate >= weekAgo;
        case "month":
          return (
            expenseDate.getMonth() === now.getMonth() &&
            expenseDate.getFullYear() === now.getFullYear()
          );
        default:
          return true;
      }
    });

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((expense) => {
        const category = CATEGORIES.find((c) => c.id === expense.category);
        const categoryLabel = category?.label.toLowerCase() || "";
        const notes = expense.notes?.toLowerCase() || "";
        return categoryLabel.includes(query) || notes.includes(query);
      });
    }

    // Apply sort
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "newest":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "oldest":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "highest":
          return b.amount - a.amount;
        default:
          return 0;
      }
    });
  }, [expenses, filter, sort, searchQuery]);

  const totalAmount = useMemo(
    () => filteredAndSortedExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredAndSortedExpenses]
  );

  return (
    <div className="min-h-screen bg-background pb-8 safe-top">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display font-bold text-2xl">Expenses</h1>
            <p className="text-sm text-muted-foreground">
              {filteredAndSortedExpenses.length} transactions · {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl bg-secondary/50 border-0"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {FILTERS.map((f) => (
            <Button
              key={f.id}
              variant={filter === f.id ? "default" : "secondary"}
              size="sm"
              className="rounded-xl flex-1"
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select value={sort} onValueChange={(v) => setSort(v as SortType)}>
            <SelectTrigger className="w-[140px] rounded-xl border-0 bg-secondary/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="highest">Highest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Expense List */}
        {filteredAndSortedExpenses.length > 0 ? (
          <div className="space-y-3">
            {filteredAndSortedExpenses.map((expense, index) => {
              const category = CATEGORIES.find((c) => c.id === expense.category);
              const expenseDate = new Date(expense.date);
              
              return (
                <Card
                  key={expense.id}
                  className="p-4 rounded-2xl animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{
                        backgroundColor: `${CATEGORY_COLORS[expense.category]}20`,
                      }}
                    >
                      {category?.icon || "📦"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {category?.label || expense.category}
                      </p>
                      {expense.notes && (
                        <p className="text-sm text-muted-foreground truncate">
                          {expense.notes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {expenseDate.toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        · {expenseDate.toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="font-semibold text-lg">
                        -{formatCurrency(expense.amount)}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                          onClick={() => openEditModal(expense)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeletingExpense(expense)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 rounded-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No expenses found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search or filters"
                : "No expenses match the selected filter"}
            </p>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent className="max-w-[90%] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Expense</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
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
                  value={editAmount}
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
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <Card
                    key={cat.id}
                    className={cn(
                      "p-3 cursor-pointer transition-all duration-200 text-center",
                      editCategory === cat.id
                        ? "ring-2 ring-primary bg-primary/5"
                        : "hover:bg-secondary"
                    )}
                    onClick={() => setEditCategory(cat.id)}
                  >
                    <span className="text-xl mb-1 block">{cat.icon}</span>
                    <p className="text-xs font-medium">{cat.label}</p>
                    {editCategory === cat.id && (
                      <Check className="w-3 h-3 text-primary mx-auto mt-1" />
                    )}
                  </Card>
                ))}
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal rounded-xl h-10"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(editDate, "MMM d")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editDate}
                      onSelect={(d) => d && setEditDate(d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="pl-10 h-10 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Notes
              </label>
              <Textarea
                placeholder="Add a note..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="rounded-xl resize-none"
                rows={2}
              />
            </div>

            {/* Save Button */}
            <Button
              className="w-full rounded-xl h-12 font-semibold"
              onClick={handleEditSave}
              disabled={!editAmount || !editCategory}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingExpense} onOpenChange={(open) => !open && setDeletingExpense(null)}>
        <AlertDialogContent className="max-w-[90%] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {deletingExpense && formatCurrency(deletingExpense.amount)} expense. This action cannot be undone.
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

export default ExpenseList;
