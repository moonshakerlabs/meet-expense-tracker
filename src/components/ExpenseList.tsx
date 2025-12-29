import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Search, Receipt } from "lucide-react";
import { Expense, CATEGORIES, Category } from "@/types/expense";

interface ExpenseListProps {
  expenses: Expense[];
  formatCurrency: (amount: number) => string;
  onBack: () => void;
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

const ExpenseList = ({ expenses, formatCurrency, onBack }: ExpenseListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");

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
                    <p className="font-semibold text-lg shrink-0">
                      -{formatCurrency(expense.amount)}
                    </p>
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
    </div>
  );
};

export default ExpenseList;
