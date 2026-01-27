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
import { Expense, CATEGORIES, SUBCATEGORIES, CATEGORY_COLORS, CURRENCIES, CategoryId, Category, Purpose } from "@/types/expense";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCategoryMeta } from "@/lib/categoryUtils";

interface ExpenseListProps {
  expenses: Expense[];
  formatCurrency: (amount: number) => string;
  currencySymbol: string;
  defaultCurrency: string;
  onBack: () => void;
  onUpdateExpense: (id: string, data: Partial<Expense>) => void;
  onDeleteExpense: (id: string) => void;
  selectedDate?: Date;
  customCategories?: Array<{ id: string; label: string; icon: string; color?: string }>;
  customSubcategories?: Record<string, { id: string; label: string; icon: string }[]>;
  purposes?: Array<{ id: string; label: string; createdAt: Date }>;
}

type FilterType = "today" | "week" | "month" | "all";
type SortType = "newest" | "oldest" | "highest";

const FILTERS: { id: FilterType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

const ExpenseList = ({ 
  expenses, 
  formatCurrency, 
  currencySymbol, 
  defaultCurrency, 
  onBack, 
  onUpdateExpense, 
  onDeleteExpense,
  selectedDate,
  customCategories = [],
  customSubcategories = {},
  purposes = []
}: ExpenseListProps) => {
const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [categoryFilter, setCategoryFilter] = useState<CategoryId | "all">("all");
  
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState<CategoryId | null>(null);
  const [editSubcategory, setEditSubcategory] = useState<string>("");
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [editTime, setEditTime] = useState("12:00");
  const [editNotes, setEditNotes] = useState("");
  const [editCurrency, setEditCurrency] = useState("");
  const [editCurrencySymbol, setEditCurrencySymbol] = useState("");
  const [editPurposeId, setEditPurposeId] = useState<string>("");
  
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  // The context date for filtering - defaults to current date if not provided
  const contextDate = selectedDate || new Date();
  const contextMonth = contextDate.getMonth();
  const contextYear = contextDate.getFullYear();

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setEditAmount(expense.amount.toString());
    setEditCategory(expense.category);
    setEditSubcategory(expense.subcategory || "");
    const expDate = new Date(expense.date);
    setEditDate(expDate);
    setEditTime(format(expDate, "HH:mm"));
    setEditNotes(expense.notes || "");
    setEditCurrency(expense.currency || defaultCurrency);
    setEditCurrencySymbol(expense.currencySymbol || currencySymbol);
    setEditPurposeId(expense.purposeId || "");
  };

  const handleEditCurrencyChange = (code: string) => {
    const curr = CURRENCIES.find((c) => c.code === code);
    if (curr) {
      setEditCurrency(curr.code);
      setEditCurrencySymbol(curr.symbol);
    }
  };

  const handleEditSave = () => {
    if (!editingExpense || !editCategory || !editAmount) return;
    
    const [hours, minutes] = editTime.split(":").map(Number);
    const expenseDate = new Date(editDate);
    expenseDate.setHours(hours, minutes, 0, 0);
    
    onUpdateExpense(editingExpense.id, {
      amount: parseFloat(editAmount),
      category: editCategory,
      subcategory: editSubcategory || undefined,
      notes: editNotes.trim() || undefined,
      date: expenseDate,
      currency: editCurrency,
      currencySymbol: editCurrencySymbol,
      purposeId: editPurposeId || undefined,
    });
    
    const categoryMeta = getCategoryMeta(editCategory, customCategories);
    toast({
      title: "Expense updated",
      description: `${editCurrencySymbol}${parseFloat(editAmount).toFixed(2)} in ${categoryMeta.label}`,
    });
    
    setEditingExpense(null);
  };

  const handleDelete = () => {
    if (!deletingExpense) return;
    onDeleteExpense(deletingExpense.id);
    toast({ title: "Expense deleted", description: "The expense has been removed" });
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
    
    let filtered = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      
      if (categoryFilter !== "all" && expense.category !== categoryFilter) {
        return false;
      }
      
      switch (filter) {
        case "today":
          return expenseDate.getDate() === now.getDate() && expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
        case "week":
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return expenseDate >= weekAgo;
        case "month":
          return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
        case "all":
        default:
          // Show expenses for the selected month only (not all time)
          return expenseDate.getMonth() === contextMonth && expenseDate.getFullYear() === contextYear;
      }
    });

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((expense) => {
        const categoryMeta = getCategoryMeta(expense.category, customCategories);
        const categoryLabel = categoryMeta.label.toLowerCase();
        const notes = expense.notes?.toLowerCase() || "";
        return categoryLabel.includes(query) || notes.includes(query);
      });
    }

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case "newest": return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "oldest": return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "highest": return b.amount - a.amount;
        default: return 0;
      }
    });
  }, [expenses, filter, sort, searchQuery, categoryFilter, contextMonth, contextYear, customCategories]);

  // Calculate totals by currency for filtered expenses
  const totalsByCurrency = useMemo(() => {
    const totals: Record<string, { amount: number; symbol: string; count: number }> = {};
    filteredAndSortedExpenses.forEach((expense) => {
      const curr = expense.currency || defaultCurrency;
      const symbol = expense.currencySymbol || currencySymbol;
      if (!totals[curr]) {
        totals[curr] = { amount: 0, symbol, count: 0 };
      }
      totals[curr].amount += expense.amount;
      totals[curr].count += 1;
    });
    return Object.entries(totals);
  }, [filteredAndSortedExpenses, defaultCurrency, currencySymbol]);

  // All categories for the dropdown (built-in + custom)
  const allCategories = useMemo(() => {
    const builtIn = CATEGORIES.map(c => ({ id: c.id, label: c.label, icon: c.icon }));
    const custom = customCategories.map(c => ({ id: c.id, label: c.label, icon: c.icon }));
    return [...builtIn, ...custom];
  }, [customCategories]);


  // Get subcategories for editing (built-in + custom)
  const editSubcategories = useMemo(() => {
    if (!editCategory) return [];
    const builtInSubs = SUBCATEGORIES[editCategory as Category] || [];
    const customSubs = customSubcategories[editCategory] || [];
    return [...builtInSubs, ...customSubs.map((c) => ({ id: c.id, label: c.label }))];
  }, [editCategory, customSubcategories]);

  const monthLabel = new Date(contextYear, contextMonth).toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background pb-8 safe-top">
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display font-bold text-2xl">Expenses</h1>
            <p className="text-sm text-muted-foreground">{monthLabel}</p>
          </div>
        </div>

        {/* Summary Totals */}
        {totalsByCurrency.length > 0 && (
          <Card className="p-4 rounded-2xl mb-4 bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {filter === "all" ? "Month Total" : filter === "today" ? "Today" : filter === "week" ? "This Week" : "This Month"}
                </p>
                <div className="space-y-1">
                  {totalsByCurrency.map(([currency, data]) => (
                    <p key={currency} className="font-bold text-xl">
                      {data.symbol}{data.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      {totalsByCurrency.length > 1 && <span className="text-sm font-normal text-muted-foreground ml-1">({currency})</span>}
                    </p>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Transactions</p>
                <p className="font-semibold text-lg">{filteredAndSortedExpenses.length}</p>
              </div>
            </div>
          </Card>
        )}

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search expenses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-xl bg-secondary/50 border-0" />
        </div>

        <div className="flex gap-2 mb-4">
          {FILTERS.map((f) => (
            <Button key={f.id} variant={filter === f.id ? "default" : "secondary"} size="sm" className="rounded-xl flex-1" onClick={() => setFilter(f.id)}>{f.label}</Button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as CategoryId | "all")}>
            <SelectTrigger className="w-[140px] rounded-xl border-0 bg-secondary/50"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent className="bg-background border border-border">
              <SelectItem value="all">All Categories</SelectItem>
              {allCategories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.label}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortType)}>
            <SelectTrigger className="w-[120px] rounded-xl border-0 bg-secondary/50"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-background border border-border">
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="highest">Highest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredAndSortedExpenses.length > 0 ? (
          <div className="space-y-3">
            {filteredAndSortedExpenses.map((expense, index) => {
              const categoryMeta = getCategoryMeta(expense.category, customCategories);
              // Check both built-in and custom subcategories
              const builtInSubLabel = expense.subcategory && SUBCATEGORIES[expense.category as Category]
                ? SUBCATEGORIES[expense.category as Category]?.find((s) => s.id === expense.subcategory)?.label 
                : null;
              const customSubLabel = expense.subcategory && customSubcategories[expense.category]
                ? customSubcategories[expense.category]?.find((s) => s.id === expense.subcategory)?.label
                : null;
              const subcategoryLabel = builtInSubLabel || customSubLabel;
              const expenseDate = new Date(expense.date);
              const expenseSymbol = expense.currencySymbol || currencySymbol;
              
              return (
                <Card key={expense.id} className="p-4 rounded-2xl animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: `${categoryMeta.color}20` }}>
                      {categoryMeta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{categoryMeta.label}</p>
                      {subcategoryLabel && <p className="text-xs text-muted-foreground truncate">{subcategoryLabel}</p>}
                      {expense.notes && <p className="text-sm text-muted-foreground truncate">{expense.notes}</p>}
                      <p className="text-xs text-muted-foreground">{expenseDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="font-semibold text-lg">-{expenseSymbol}{expense.amount.toFixed(2)}</p>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" onClick={() => openEditModal(expense)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeletingExpense(expense)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 rounded-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4"><Receipt className="w-8 h-8 text-muted-foreground" /></div>
            <h3 className="font-semibold mb-2">No expenses found</h3>
            <p className="text-sm text-muted-foreground">{searchQuery ? "Try adjusting your search or filters" : "No expenses match the selected filter"}</p>
          </Card>
        )}
      </div>

      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent className="max-w-[90%] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">Edit Expense</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Amount</label>
              <div className="flex gap-2">
                <Select value={editCurrency} onValueChange={handleEditCurrencyChange}>
                  <SelectTrigger className="w-[90px] rounded-xl h-12">
                    <SelectValue>
                      <span className="font-semibold">{editCurrency}</span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border max-h-[200px]">
                    {CURRENCIES.map((curr) => (
                      <SelectItem key={curr.code} value={curr.code}>
                        <span className="flex items-center gap-2">
                          <span className="font-semibold">{curr.symbol}</span>
                          <span className="text-muted-foreground">{curr.code}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted-foreground">{editCurrencySymbol}</span>
                  <Input type="text" inputMode="decimal" placeholder="0.00" value={editAmount} onChange={(e) => handleAmountChange(e.target.value)} className="pl-10 h-12 text-xl font-bold rounded-xl" />
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Category</label>
              <ScrollArea className="h-[200px]">
                <div className="grid grid-cols-3 gap-2">
                  {allCategories.map((cat) => (
                    <Card key={cat.id} className={cn("p-3 cursor-pointer transition-all duration-200 text-center", editCategory === cat.id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-secondary")} onClick={() => { setEditCategory(cat.id); setEditSubcategory(""); }}>
                      <span className="text-xl mb-1 block">{cat.icon}</span>
                      <p className="text-xs font-medium">{cat.label}</p>
                      {editCategory === cat.id && <Check className="w-3 h-3 text-primary mx-auto mt-1" />}
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
            {editSubcategories.length > 0 && (
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Subcategory</label>
                <Select value={editSubcategory} onValueChange={setEditSubcategory}>
                  <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                  <SelectContent className="bg-background border border-border">{editSubcategories.map((sub) => (<SelectItem key={sub.id} value={sub.id}>{sub.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Date</label>
                <Popover>
                  <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal rounded-xl h-10"><CalendarIcon className="mr-2 h-4 w-4" />{format(editDate, "MMM d")}</Button></PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background border border-border" align="start"><Calendar mode="single" selected={editDate} onSelect={(d) => d && setEditDate(d)} initialFocus /></PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Time</label>
                <div className="relative"><Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="pl-10 h-10 rounded-xl" /></div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Purpose (Optional)</label>
              <Select value={editPurposeId || "none"} onValueChange={(v) => setEditPurposeId(v === "none" ? "" : v)}>
                <SelectTrigger className="rounded-xl h-10">
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  <SelectItem value="none">No Purpose</SelectItem>
                  {purposes.map((purpose) => (
                    <SelectItem key={purpose.id} value={purpose.id}>
                      {purpose.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Notes</label>
              <Textarea placeholder="Add a note..." value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="rounded-xl resize-none" rows={2} />
            </div>
            <Button className="w-full rounded-xl h-12 font-semibold" onClick={handleEditSave} disabled={!editAmount || !editCategory}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingExpense} onOpenChange={(open) => !open && setDeletingExpense(null)}>
        <AlertDialogContent className="max-w-[90%] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the {deletingExpense && `${deletingExpense.currencySymbol || currencySymbol}${deletingExpense.amount.toFixed(2)}`} expense.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-destructive hover:bg-destructive/90" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExpenseList;