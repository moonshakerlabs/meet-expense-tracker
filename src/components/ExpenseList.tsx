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
import { ArrowLeft, Search, Receipt, Pencil, Trash2, Calendar as CalendarIcon, Check, ChevronDown, Calculator } from "lucide-react";
import MiniCalculator from "@/components/MiniCalculator";
import { Expense, CATEGORIES, SUBCATEGORIES, CATEGORY_COLORS, CURRENCIES, CategoryId, Category, Purpose } from "@/types/expense";
import { format, isToday, isYesterday, isSameMonth, isSameYear, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCategoryMeta } from "@/lib/categoryUtils";
import { Checkbox } from "@/components/ui/checkbox";

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
  canUseMultipleCurrencies?: boolean;
  isFreemium?: boolean;
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
  purposes = [],
  canUseMultipleCurrencies = true,
  isFreemium = false,
}: ExpenseListProps) => {
const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  
  
  // Multi-select category state - default to all categories selected
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(() => {
    const allCatIds = new Set<string>(CATEGORIES.map(c => c.id as string));
    customCategories.forEach(c => allCatIds.add(c.id));
    return allCatIds;
  });
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [currencyFilter, setCurrencyFilter] = useState<string>("all");
  const [categorySearchQuery, setCategorySearchQuery] = useState("");

  // Toggle category selection
  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
    // Reset currency filter when categories change
    setCurrencyFilter("all");
  };

  // Select all categories
  const selectAllCategories = () => {
    const allCatIds = new Set<string>(CATEGORIES.map(c => c.id as string));
    customCategories.forEach(c => allCatIds.add(c.id));
    setSelectedCategories(allCatIds);
    setCurrencyFilter("all");
  };

  // Clear all categories
  const clearAllCategories = () => {
    setSelectedCategories(new Set());
    setCurrencyFilter("all");
  };
  
  
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState<CategoryId | null>(null);
  const [editSubcategory, setEditSubcategory] = useState<string>("");
  const [editDate, setEditDate] = useState<Date>(new Date());
  
  const [editNotes, setEditNotes] = useState("");
  const [editCurrency, setEditCurrency] = useState("");
  const [editCurrencySymbol, setEditCurrencySymbol] = useState("");
  const [editPurposeId, setEditPurposeId] = useState<string>("");
  
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);

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
    
    const expenseDate = new Date(editDate);
    expenseDate.setHours(12, 0, 0, 0);
    
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
      
      // Multi-select category filter
      if (selectedCategories.size === 0) {
        return false; // Show nothing if no categories selected
      }
      if (!selectedCategories.has(expense.category)) {
        return false;
      }
      
      // Currency filter
      if (currencyFilter !== "all") {
        const expCurrency = expense.currency || defaultCurrency;
        if (expCurrency !== currencyFilter) {
          return false;
        }
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
  }, [expenses, filter, sort, searchQuery, selectedCategories, currencyFilter, contextMonth, contextYear, customCategories, defaultCurrency]);

  // Get currencies available for selected categories
  const availableCurrencies = useMemo(() => {
    const currencies = new Map<string, string>(); // code -> symbol
    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date);
      // Only consider expenses in the current context month
      if (expenseDate.getMonth() !== contextMonth || expenseDate.getFullYear() !== contextYear) {
        return;
      }
      // Only consider expenses in selected categories
      if (selectedCategories.size > 0 && selectedCategories.has(expense.category)) {
        const curr = expense.currency || defaultCurrency;
        const symbol = expense.currencySymbol || currencySymbol;
        currencies.set(curr, symbol);
      }
    });
    return Array.from(currencies.entries()).map(([code, symbol]) => ({ code, symbol }));
  }, [expenses, selectedCategories, contextMonth, contextYear, defaultCurrency, currencySymbol]);

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

  // Group expenses by date for All, Week, Month filters
  const groupedExpenses = useMemo(() => {
    // Only group when sort is "newest"
    if (sort !== "newest") {
      return null;
    }
    
    // Only group for all, week, month filters
    if (filter === "today") {
      return null; // Today doesn't need grouping
    }

    const now = new Date();
    const groups: { label: string; key: string; expenses: typeof filteredAndSortedExpenses }[] = [];
    const todayExpenses: Expense[] = [];
    const yesterdayExpenses: Expense[] = [];
    const byDate: Record<string, Expense[]> = {};
    const byMonth: Record<string, Expense[]> = {};

    filteredAndSortedExpenses.forEach((expense) => {
      const expenseDate = new Date(expense.date);
      
      if (isToday(expenseDate)) {
        todayExpenses.push(expense);
      } else if (isYesterday(expenseDate)) {
        yesterdayExpenses.push(expense);
      } else if (isSameMonth(expenseDate, now) && isSameYear(expenseDate, now)) {
        // Same month as today - group by date
        const dateKey = format(expenseDate, "yyyy-MM-dd");
        if (!byDate[dateKey]) {
          byDate[dateKey] = [];
        }
        byDate[dateKey].push(expense);
      } else {
        // Previous months - group by month name
        const monthKey = format(expenseDate, "MMMM yyyy");
        if (!byMonth[monthKey]) {
          byMonth[monthKey] = [];
        }
        byMonth[monthKey].push(expense);
      }
    });

    // Add Today group
    if (todayExpenses.length > 0) {
      groups.push({ label: "Today", key: "today", expenses: todayExpenses });
    }

    // Add Yesterday group
    if (yesterdayExpenses.length > 0) {
      groups.push({ label: "Yesterday", key: "yesterday", expenses: yesterdayExpenses });
    }

    // Add this month's dates (sorted by date descending)
    const sortedDateKeys = Object.keys(byDate).sort((a, b) => b.localeCompare(a));
    sortedDateKeys.forEach((dateKey) => {
      const date = new Date(dateKey);
      const label = format(date, "EEEE, MMMM d");
      groups.push({ label, key: dateKey, expenses: byDate[dateKey] });
    });

    // Add previous months (sorted by date descending)
    const sortedMonthKeys = Object.keys(byMonth).sort((a, b) => {
      const dateA = new Date(byMonth[a][0].date);
      const dateB = new Date(byMonth[b][0].date);
      return dateB.getTime() - dateA.getTime();
    });
    sortedMonthKeys.forEach((monthKey) => {
      groups.push({ label: monthKey, key: monthKey, expenses: byMonth[monthKey] });
    });

    return groups.length > 0 ? groups : null;
  }, [filteredAndSortedExpenses, filter, sort]);

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

        {/* Summary Totals - shows totals for selected categories */}
        <Card className="p-4 rounded-2xl mb-4 bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {selectedCategories.size === 0 ? "No Categories Selected" : 
                  filter === "all" ? "Month Total" : filter === "today" ? "Today" : filter === "week" ? "This Week" : "This Month"}
              </p>
              <div className="space-y-1">
                {selectedCategories.size === 0 ? (
                  <p className="font-bold text-xl text-muted-foreground">0</p>
                ) : totalsByCurrency.length > 0 ? (
                  totalsByCurrency.map(([currency, data]) => (
                    <p key={currency} className="font-bold text-xl">
                      {data.symbol}{data.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      {totalsByCurrency.length > 1 && <span className="text-sm font-normal text-muted-foreground ml-1">({currency})</span>}
                    </p>
                  ))
                ) : (
                  <p className="font-bold text-xl text-muted-foreground">0</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Transactions</p>
              <p className="font-semibold text-lg">{filteredAndSortedExpenses.length}</p>
            </div>
          </div>
        </Card>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search expenses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-xl bg-secondary/50 border-0" />
        </div>

        <div className="flex gap-2 mb-4">
          {FILTERS.map((f) => (
            <Button key={f.id} variant={filter === f.id ? "default" : "secondary"} size="sm" className="rounded-xl flex-1" onClick={() => setFilter(f.id)}>{f.label}</Button>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {/* Multi-select Category Dropdown */}
          <Popover open={categoryDropdownOpen} onOpenChange={setCategoryDropdownOpen}>
            <PopoverTrigger asChild>
              <Button variant="secondary" className="rounded-xl border-0 bg-secondary/50 h-10 px-3 justify-between min-w-[140px]">
                <span className="truncate">
                  {selectedCategories.size === 0 
                    ? "No Categories" 
                    : selectedCategories.size === allCategories.length 
                      ? "All Categories" 
                      : `${selectedCategories.size} Selected`}
                </span>
                <ChevronDown className="w-4 h-4 ml-2 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0 bg-popover border border-border shadow-lg z-50" align="start">
              {/* Select/Deselect All Toggle Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
                <span className="text-sm font-medium">Categories</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-xs hover:bg-secondary"
                  onClick={() => {
                    if (selectedCategories.size === allCategories.length) {
                      clearAllCategories();
                    } else {
                      selectAllCategories();
                    }
                  }}
                >
                  {selectedCategories.size === allCategories.length ? "Deselect All" : "Select All"}
                </Button>
              </div>
              {/* Search field */}
              <div className="px-3 py-2 border-b border-border">
                <Input 
                  placeholder="Search categories..." 
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  className="h-8 text-sm rounded-lg"
                />
              </div>
              <ScrollArea className="h-[250px]">
                <div className="p-2 space-y-0.5">
                  {allCategories
                    .filter((cat) => {
                      if (!categorySearchQuery.trim()) return true;
                      const query = categorySearchQuery.toLowerCase();
                      return cat.label.toLowerCase().includes(query) || cat.icon.includes(query);
                    })
                    .map((cat) => {
                    const isSelected = selectedCategories.has(cat.id);
                    return (
                      <div 
                        key={cat.id} 
                        className={cn(
                          "flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition-colors",
                          isSelected ? "bg-primary/10" : "hover:bg-secondary/50"
                        )}
                        onClick={() => toggleCategorySelection(cat.id)}
                      >
                        <Checkbox 
                          checked={isSelected}
                          className="h-5 w-5 rounded border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary pointer-events-none"
                        />
                        <span className="text-base">{cat.icon}</span>
                        <span className="text-sm font-medium flex-1">{cat.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-primary" />}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Currency Filter Dropdown - only show if there are currencies available */}
          {availableCurrencies.length > 0 && (
            <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
              <SelectTrigger className="w-[100px] rounded-xl border-0 bg-secondary/50">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="all">All</SelectItem>
                {availableCurrencies.map((curr) => (
                  <SelectItem key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={sort} onValueChange={(v) => setSort(v as SortType)}>
            <SelectTrigger className="w-[110px] rounded-xl border-0 bg-secondary/50"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="highest">Highest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredAndSortedExpenses.length > 0 ? (
          groupedExpenses ? (
            // Grouped view for "All" filter with newest sort
            <div className="space-y-4">
              {groupedExpenses.map((group) => (
                <div key={group.key}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-1">{group.label}</h3>
                  <div className="space-y-3">
                    {group.expenses.map((expense, index) => {
                      const categoryMeta = getCategoryMeta(expense.category, customCategories);
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
                              <p className="text-xs text-muted-foreground">{format(expenseDate, "h:mm a")}</p>
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
                </div>
              ))}
            </div>
          ) : (
            // Regular flat list for other filters
            <div className="space-y-3">
              {filteredAndSortedExpenses.map((expense, index) => {
                const categoryMeta = getCategoryMeta(expense.category, customCategories);
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
          )
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
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="font-display">Edit Expense</DialogTitle>
              <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setShowCalculator(true)}>
                <Calculator className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Amount</label>
              <div className="flex gap-2">
                {canUseMultipleCurrencies ? (
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
                ) : (
                  <div className="w-[90px] h-12 rounded-xl border flex items-center justify-center bg-muted/30">
                    <span className="font-semibold text-muted-foreground">{editCurrency}</span>
                  </div>
                )}
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
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Subcategory</label>
              <Select value={editSubcategory} onValueChange={setEditSubcategory} disabled={editSubcategories.length === 0}>
                <SelectTrigger className={cn("rounded-xl h-10", editSubcategories.length === 0 && "opacity-50 cursor-not-allowed")}><SelectValue placeholder={editSubcategories.length === 0 ? "Select a category first" : "Select subcategory"} /></SelectTrigger>
                <SelectContent className="bg-background border border-border">{editSubcategories.map((sub) => (<SelectItem key={sub.id} value={sub.id}>{sub.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Date</label>
              <Popover>
                <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left font-normal rounded-xl h-10"><CalendarIcon className="mr-2 h-4 w-4" />{format(editDate, "MMM d, yyyy")}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border border-border" align="start"><Calendar mode="single" selected={editDate} onSelect={(d) => d && setEditDate(d)} initialFocus /></PopoverContent>
              </Popover>
            </div>
            {/* Only show purpose if user is freemium OR expense already has a purposeId */}
            {(isFreemium || editingExpense?.purposeId) && (
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
            )}
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

      <MiniCalculator open={showCalculator} onOpenChange={setShowCalculator} />
    </div>
  );
};

export default ExpenseList;