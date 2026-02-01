import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Expense, Category, CATEGORIES, SUBCATEGORIES, CATEGORY_COLORS } from "@/types/expense";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { format } from "date-fns";
import { getSubcategoryLabel } from "@/lib/subcategoryUtils";

interface CategoryDetailViewProps {
  category: Category;
  selectedDate: Date;
  expenses: Expense[];
  formatCurrency: (amount: number) => string;
  defaultCurrencySymbol: string;
  onBack: () => void;
  onChangeMonth: (date: Date) => void;
  customSubcategories?: Record<string, { id: string; label: string; icon?: string }[]>;
}

const CategoryDetailView = ({
  category,
  selectedDate,
  expenses,
  formatCurrency,
  defaultCurrencySymbol,
  onBack,
  onChangeMonth,
  customSubcategories = {},
}: CategoryDetailViewProps) => {
  const categoryInfo = CATEGORIES.find((c) => c.id === category);
  const subcategories = SUBCATEGORIES[category] || [];
  const allSubcategories = [
    ...subcategories,
    ...(customSubcategories[category] || []).map((s) => ({ id: s.id, label: s.label })),
  ];

  const month = selectedDate.getMonth();
  const year = selectedDate.getFullYear();

  const goToPreviousMonth = () => {
    onChangeMonth(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    const next = new Date(year, month + 1, 1);
    if (next <= new Date()) {
      onChangeMonth(next);
    }
  };

  const categoryExpenses = useMemo(
    () =>
      expenses.filter((e) => {
        const d = new Date(e.date);
        return (
          e.category === category &&
          d.getMonth() === month &&
          d.getFullYear() === year
        );
      }),
    [expenses, category, month, year]
  );

  // Group totals by currency
  const totalsByCurrency = useMemo(() => {
    const totals: Record<string, { amount: number; symbol: string; count: number }> = {};
    categoryExpenses.forEach((e) => {
      const curr = e.currency || "USD";
      const symbol = e.currencySymbol || defaultCurrencySymbol;
      if (!totals[curr]) {
        totals[curr] = { amount: 0, symbol, count: 0 };
      }
      totals[curr].amount += e.amount;
      totals[curr].count += 1;
    });
    return Object.entries(totals);
  }, [categoryExpenses, defaultCurrencySymbol]);

  // Subcategory data grouped by currency
  const subcategoryDataByCurrency = useMemo(() => {
    const result: Record<string, Record<string, number>> = {};
    
    categoryExpenses.forEach((e) => {
      const curr = e.currency || "USD";
      const subcat = e.subcategory || "uncategorized";
      
      if (!result[curr]) {
        result[curr] = {};
      }
      result[curr][subcat] = (result[curr][subcat] || 0) + e.amount;
    });
    
    // Convert to sorted arrays
    return Object.entries(result).map(([currency, totals]) => ({
      currency,
      data: Object.entries(totals)
        .map(([subcategory, value]) => {
          // Resolve subcategory label properly
          const label = getSubcategoryLabel(subcategory, category, customSubcategories);
          return {
            name: label || (subcategory === "uncategorized" ? "Uncategorized" : subcategory),
            value,
            subcategory,
          };
        })
        .sort((a, b) => b.value - a.value),
    }));
  }, [categoryExpenses, customSubcategories, category]);

  const SUBCATEGORY_COLORS = [
    "hsl(210, 80%, 55%)",
    "hsl(25, 95%, 53%)",
    "hsl(280, 60%, 55%)",
    "hsl(158, 64%, 42%)",
    "hsl(45, 93%, 47%)",
    "hsl(340, 75%, 55%)",
    "hsl(200, 15%, 55%)",
  ];

  const monthName = selectedDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const isCurrentMonth =
    month === new Date().getMonth() && year === new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background pb-8 safe-top">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{categoryInfo?.icon}</span>
            <h1 className="font-display font-bold text-xl">
              {categoryInfo?.label}
            </h1>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="font-semibold text-lg min-w-[150px] text-center">
            {monthName}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Total Card - Multi-currency support */}
        <Card
          className="p-6 rounded-3xl mb-6"
          style={{
            backgroundColor: `${CATEGORY_COLORS[category]}15`,
            borderColor: CATEGORY_COLORS[category],
          }}
        >
          <p className="text-sm text-muted-foreground mb-1">
            Total {categoryInfo?.label} Expenses
          </p>
          {totalsByCurrency.length > 0 ? (
            <div className="space-y-1">
              {totalsByCurrency.map(([currency, data]) => (
                <div key={currency} className="flex items-center justify-between">
                  <h2
                    className="font-display font-bold text-3xl"
                    style={{ color: CATEGORY_COLORS[category] }}
                  >
                    {data.symbol}{data.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>
                  {totalsByCurrency.length > 1 && (
                    <span className="text-sm text-muted-foreground">{currency}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <h2
              className="font-display font-bold text-4xl"
              style={{ color: CATEGORY_COLORS[category] }}
            >
              {formatCurrency(0)}
            </h2>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            {categoryExpenses.length} transactions
          </p>
        </Card>

        {/* Subcategory Breakdown - Multi-currency */}
        {subcategoryDataByCurrency.length > 0 && allSubcategories.length > 0 && (
          <Card className="p-5 rounded-2xl mb-6">
            <h3 className="font-semibold mb-4">Breakdown by Subcategory</h3>
            {subcategoryDataByCurrency.map(({ currency, data }) => {
              const currencySymbol = totalsByCurrency.find(([c]) => c === currency)?.[1]?.symbol || "$";
              return (
                <div key={currency} className="mb-4 last:mb-0">
                  {subcategoryDataByCurrency.length > 1 && (
                    <p className="text-xs text-muted-foreground mb-2 font-medium">{currency}</p>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={25}
                            outerRadius={40}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {data.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={SUBCATEGORY_COLORS[index % SUBCATEGORY_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number) => `${currencySymbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2">
                      {data.map((item, index) => (
                        <div key={item.subcategory} className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                SUBCATEGORY_COLORS[index % SUBCATEGORY_COLORS.length],
                            }}
                          />
                          <span className="text-sm flex-1">{item.name}</span>
                          <span className="text-sm font-medium">
                            {currencySymbol}{item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        )}

        {/* Transaction List */}
        <div>
          <h3 className="font-semibold mb-3">Transactions</h3>
          {categoryExpenses.length > 0 ? (
            <div className="space-y-3">
              {categoryExpenses
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .map((expense) => {
                  // Resolve subcategory label properly using utility
                  const subcategoryLabel = getSubcategoryLabel(
                    expense.subcategory,
                    expense.category,
                    customSubcategories
                  );
                  const expenseSymbol = expense.currencySymbol || defaultCurrencySymbol;
                  return (
                    <Card key={expense.id} className="p-4 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[category]}20`,
                          }}
                        >
                          {categoryInfo?.icon || "📦"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {subcategoryLabel || categoryInfo?.label}
                          </p>
                          {expense.notes && (
                            <p className="text-sm text-muted-foreground truncate">
                              {expense.notes}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(expense.date), "MMM d, h:mm a")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            -{expenseSymbol}{expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          {totalsByCurrency.length > 1 && (
                            <p className="text-xs text-muted-foreground">{expense.currency || "USD"}</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
            </div>
          ) : (
            <Card className="p-8 rounded-2xl text-center">
              <p className="text-muted-foreground">
                No expenses in this category for {monthName}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryDetailView;
