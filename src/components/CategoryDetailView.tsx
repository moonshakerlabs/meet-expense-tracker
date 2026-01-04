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

interface CategoryDetailViewProps {
  category: Category;
  selectedDate: Date;
  expenses: Expense[];
  formatCurrency: (amount: number) => string;
  defaultCurrencySymbol: string;
  onBack: () => void;
  onChangeMonth: (date: Date) => void;
}

const CategoryDetailView = ({
  category,
  selectedDate,
  expenses,
  formatCurrency,
  defaultCurrencySymbol,
  onBack,
  onChangeMonth,
}: CategoryDetailViewProps) => {
  const categoryInfo = CATEGORIES.find((c) => c.id === category);
  const subcategories = SUBCATEGORIES[category] || [];

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

  const totalAmount = useMemo(
    () => categoryExpenses.reduce((sum, e) => sum + e.amount, 0),
    [categoryExpenses]
  );

  const subcategoryData = useMemo(() => {
    const totals: Record<string, number> = {};
    categoryExpenses.forEach((e) => {
      const subcat = e.subcategory || "uncategorized";
      totals[subcat] = (totals[subcat] || 0) + e.amount;
    });
    return Object.entries(totals)
      .map(([subcategory, value]) => ({
        name:
          subcategories.find((s) => s.id === subcategory)?.label ||
          (subcategory === "uncategorized" ? "Uncategorized" : subcategory),
        value,
        subcategory,
      }))
      .sort((a, b) => b.value - a.value);
  }, [categoryExpenses, subcategories]);

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

        {/* Total Card */}
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
          <h2
            className="font-display font-bold text-4xl"
            style={{ color: CATEGORY_COLORS[category] }}
          >
            {formatCurrency(totalAmount)}
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {categoryExpenses.length} transactions
          </p>
        </Card>

        {/* Subcategory Breakdown */}
        {subcategoryData.length > 0 && subcategories.length > 0 && (
          <Card className="p-5 rounded-2xl mb-6">
            <h3 className="font-semibold mb-4">Breakdown by Subcategory</h3>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subcategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={40}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {subcategoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={SUBCATEGORY_COLORS[index % SUBCATEGORY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {subcategoryData.map((item, index) => (
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
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
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
                  const subcategoryLabel = expense.subcategory
                    ? subcategories.find((s) => s.id === expense.subcategory)
                        ?.label
                    : null;
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
                        <p className="font-semibold">
                          -{expenseSymbol}{expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
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