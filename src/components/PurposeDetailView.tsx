import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, Receipt } from "lucide-react";
import { Expense, CATEGORIES, CATEGORY_COLORS, Category, Purpose } from "@/types/expense";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCategoryMeta } from "@/lib/categoryUtils";
import { getSubcategoryLabel } from "@/lib/subcategoryUtils";

interface PurposeDetailViewProps {
  purpose: Purpose;
  expenses: Expense[];
  formatCurrency: (amount: number) => string;
  defaultCurrencySymbol: string;
  onBack: () => void;
  customCategories?: Array<{ id: string; label: string; icon: string; color?: string }>;
  customSubcategories?: Record<string, { id: string; label: string; icon?: string }[]>;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const PurposeDetailView = ({
  purpose,
  expenses,
  formatCurrency,
  defaultCurrencySymbol,
  onBack,
  customCategories = [],
  customSubcategories = {},
}: PurposeDetailViewProps) => {
  // State for viewing expenses by category
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // Filter expenses by purpose
  const purposeExpenses = useMemo(
    () => expenses.filter((e) => e.purposeId === purpose.id),
    [expenses, purpose.id]
  );

  // Group by currency - showing ALL currencies
  const totalsByCurrency = useMemo(() => {
    const totals: Record<string, { amount: number; symbol: string; count: number }> = {};
    purposeExpenses.forEach((expense) => {
      const curr = expense.currency || "USD";
      const symbol = expense.currencySymbol || defaultCurrencySymbol;
      if (!totals[curr]) {
        totals[curr] = { amount: 0, symbol, count: 0 };
      }
      totals[curr].amount += expense.amount;
      totals[curr].count += 1;
    });
    return Object.entries(totals);
  }, [purposeExpenses, defaultCurrencySymbol]);

  // Monthly breakdown with currency-wise totals - ALL currencies
  const monthlyBreakdown = useMemo(() => {
    const breakdown: Record<string, { 
      month: number; 
      year: number; 
      count: number;
      currencies: Record<string, { amount: number; symbol: string }>;
    }> = {};
    
    purposeExpenses.forEach((expense) => {
      const date = new Date(expense.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const curr = expense.currency || "USD";
      const symbol = expense.currencySymbol || defaultCurrencySymbol;
      
      if (!breakdown[key]) {
        breakdown[key] = { 
          month: date.getMonth(), 
          year: date.getFullYear(), 
          count: 0,
          currencies: {}
        };
      }
      
      if (!breakdown[key].currencies[curr]) {
        breakdown[key].currencies[curr] = { amount: 0, symbol };
      }
      
      breakdown[key].currencies[curr].amount += expense.amount;
      breakdown[key].count += 1;
    });

    return Object.values(breakdown)
      .map((item) => ({
        ...item,
        currencyTotals: Object.entries(item.currencies),
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
  }, [purposeExpenses, defaultCurrencySymbol]);

  // Category breakdown with currency-wise totals - ALL currencies
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, { 
      category: string; 
      label: string; 
      icon: string; 
      count: number;
      currencies: Record<string, { amount: number; symbol: string }>;
    }> = {};
    
    purposeExpenses.forEach((expense) => {
      const categoryId = expense.category;
      const curr = expense.currency || "USD";
      const symbol = expense.currencySymbol || defaultCurrencySymbol;
      
      if (!breakdown[categoryId]) {
        const builtIn = CATEGORIES.find((c) => c.id === categoryId);
        const custom = customCategories.find((c) => c.id === categoryId);
        breakdown[categoryId] = {
          category: categoryId,
          label: builtIn?.label || custom?.label || categoryId,
          icon: builtIn?.icon || custom?.icon || "📦",
          count: 0,
          currencies: {},
        };
      }
      
      if (!breakdown[categoryId].currencies[curr]) {
        breakdown[categoryId].currencies[curr] = { amount: 0, symbol };
      }
      
      breakdown[categoryId].currencies[curr].amount += expense.amount;
      breakdown[categoryId].count += 1;
    });

    return Object.values(breakdown)
      .map((item) => ({
        ...item,
        currencyTotals: Object.entries(item.currencies),
        // For sorting, sum all currencies (approximate)
        totalForSort: Object.values(item.currencies).reduce((sum, c) => sum + c.amount, 0),
      }))
      .sort((a, b) => b.totalForSort - a.totalForSort);
  }, [purposeExpenses, customCategories, defaultCurrencySymbol]);

  // Get expenses for the selected category
  const categoryExpenses = useMemo(() => {
    if (!selectedCategoryId) return [];
    return purposeExpenses
      .filter((e) => e.category === selectedCategoryId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [purposeExpenses, selectedCategoryId]);

  // Get category meta for selected category
  const selectedCategoryMeta = useMemo(() => {
    if (!selectedCategoryId) return null;
    return getCategoryMeta(selectedCategoryId, customCategories);
  }, [selectedCategoryId, customCategories]);

  // If viewing a category's expenses
  if (selectedCategoryId && selectedCategoryMeta) {
    return (
      <div className="min-h-screen bg-background pb-8 safe-top">
        <div className="px-5 pt-6 pb-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setSelectedCategoryId(null)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedCategoryMeta.icon}</span>
                <h1 className="font-display font-bold text-2xl">{selectedCategoryMeta.label}</h1>
              </div>
              <p className="text-sm text-muted-foreground">🎯 {purpose.label} • {categoryExpenses.length} expenses</p>
            </div>
          </div>

          {/* Expenses List - showing proper currency for each */}
          {categoryExpenses.length > 0 ? (
            <ScrollArea className="max-h-[calc(100vh-150px)]">
              <div className="space-y-3">
                {categoryExpenses.map((expense) => {
                  const expenseDate = new Date(expense.date);
                  const expenseSymbol = expense.currencySymbol || defaultCurrencySymbol;
                  const expenseCurrency = expense.currency || "USD";
                  
                  // Get subcategory label using utility
                  const subcategoryLabel = getSubcategoryLabel(
                    expense.subcategory,
                    expense.category,
                    customSubcategories
                  );

                  return (
                    <Card key={expense.id} className="p-4 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                          style={{ backgroundColor: `${selectedCategoryMeta.color}20` }}
                        >
                          {selectedCategoryMeta.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          {subcategoryLabel && <p className="font-medium truncate">{subcategoryLabel}</p>}
                          {expense.notes && <p className="text-sm text-muted-foreground truncate">{expense.notes}</p>}
                          <p className="text-xs text-muted-foreground">
                            {expenseDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-lg">-{expenseSymbol}{expense.amount.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{expenseCurrency}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <Card className="p-8 rounded-2xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">No expenses</h3>
              <p className="text-sm text-muted-foreground">No expenses in this category for this purpose</p>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8 safe-top">
      <div className="px-5 pt-6 pb-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display font-bold text-2xl">🎯 {purpose.label}</h1>
            <p className="text-sm text-muted-foreground">Purpose Details</p>
          </div>
        </div>

        {/* Totals - ALL currencies */}
        {totalsByCurrency.length > 0 ? (
          <Card className="p-5 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-2xl mb-4">
            <p className="text-sm text-muted-foreground mb-2">Total Spent</p>
            <div className="space-y-1">
              {totalsByCurrency.map(([currency, data]) => (
                <div key={currency} className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-3xl">
                    {data.symbol}{data.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground">{data.count} txn</span>
                    {totalsByCurrency.length > 1 && (
                      <span className="text-xs text-muted-foreground ml-2">({currency})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="p-8 rounded-2xl text-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No expenses yet</h3>
            <p className="text-sm text-muted-foreground">
              Add expenses with this purpose to see them here
            </p>
          </Card>
        )}

        {/* Monthly Breakdown - Currency-wise - ALL currencies */}
        {monthlyBreakdown.length > 0 && (
          <Card className="p-5 rounded-2xl mb-4">
            <h3 className="font-semibold mb-4">Monthly Breakdown</h3>
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {monthlyBreakdown.map((item) => (
                  <div
                    key={`${item.year}-${item.month}`}
                    className="p-3 rounded-xl bg-secondary/30"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">{MONTHS[item.month].slice(0, 3)}</span>
                      </div>
                      <div>
                        <p className="font-medium">{MONTHS[item.month]} {item.year}</p>
                        <p className="text-xs text-muted-foreground">{item.count} expenses</p>
                      </div>
                    </div>
                    {/* Currency breakdown for this month - ALL currencies */}
                    <div className="ml-13 pl-13 space-y-1">
                      {item.currencyTotals.map(([currency, data]) => (
                        <div key={currency} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{currency}</span>
                          <span className="font-semibold">
                            {data.symbol}{data.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        )}

        {/* Category Breakdown - Currency-wise - ALL currencies - Clickable */}
        {categoryBreakdown.length > 0 && (
          <Card className="p-5 rounded-2xl">
            <h3 className="font-semibold mb-4">Category Breakdown</h3>
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {categoryBreakdown.map((item) => (
                  <div
                    key={item.category}
                    className="p-3 rounded-xl bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors group"
                    onClick={() => setSelectedCategoryId(item.category)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[item.category as Category] || CATEGORY_COLORS.misc}20`,
                        }}
                      >
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.count} expenses</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    {/* Currency breakdown for this category - ALL currencies */}
                    <div className="ml-13 pl-13 space-y-1">
                      {item.currencyTotals.map(([currency, data]) => (
                        <div key={currency} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{currency}</span>
                          <span className="font-semibold">
                            {data.symbol}{data.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PurposeDetailView;
