import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Receipt, ArrowUpRight, Settings } from "lucide-react";
import { Expense, CATEGORIES, Category } from "@/types/expense";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface DashboardProps {
  expenses: Expense[];
  formatCurrency: (amount: number) => string;
  onAddExpense: () => void;
  onViewExpenses: () => void;
  onOpenSettings: () => void;
}

const CATEGORY_COLORS: Record<Category, string> = {
  food: "hsl(25, 95%, 53%)",
  transport: "hsl(210, 80%, 55%)",
  shopping: "hsl(280, 60%, 55%)",
  rent: "hsl(340, 75%, 55%)",
  bills: "hsl(45, 93%, 47%)",
  misc: "hsl(200, 15%, 55%)",
  custom: "hsl(158, 64%, 42%)",
};

const Dashboard = ({
  expenses,
  formatCurrency,
  onAddExpense,
  onViewExpenses,
  onOpenSettings,
}: DashboardProps) => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const monthlyExpenses = useMemo(
    () =>
      expenses.filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === month && d.getFullYear() === year;
      }),
    [expenses, month, year]
  );

  const monthlyTotal = useMemo(
    () => monthlyExpenses.reduce((sum, e) => sum + e.amount, 0),
    [monthlyExpenses]
  );

  const todayTotal = useMemo(() => {
    const today = new Date();
    return expenses
      .filter((e) => {
        const d = new Date(e.date);
        return (
          d.getDate() === today.getDate() &&
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear()
        );
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const categoryData = useMemo(() => {
    const totals: Record<string, number> = {};
    monthlyExpenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return Object.entries(totals)
      .map(([category, value]) => ({
        name: CATEGORIES.find((c) => c.id === category)?.label || category,
        value,
        category,
      }))
      .sort((a, b) => b.value - a.value);
  }, [monthlyExpenses]);

  const recentExpenses = useMemo(
    () => expenses.slice(0, 3),
    [expenses]
  );

  const monthName = now.toLocaleString("default", { month: "long" });

  return (
    <div className="min-h-screen bg-background pb-24 safe-top">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back</p>
            <h1 className="font-display font-bold text-2xl">Dashboard</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={onOpenSettings}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Main Stats Card */}
        <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-3xl mb-4">
          <p className="text-sm opacity-80 mb-1">{monthName} Spending</p>
          <h2 className="font-display font-bold text-4xl mb-4">
            {formatCurrency(monthlyTotal)}
          </h2>
          <div className="flex gap-6">
            <div>
              <p className="text-xs opacity-70">Transactions</p>
              <p className="font-semibold">{monthlyExpenses.length}</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Today</p>
              <p className="font-semibold">{formatCurrency(todayTotal)}</p>
            </div>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">This Week</p>
                <p className="font-semibold">
                  {formatCurrency(
                    expenses
                      .filter((e) => {
                        const d = new Date(e.date);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return d >= weekAgo;
                      })
                      .reduce((s, e) => s + e.amount, 0)
                  )}
                </p>
              </div>
            </div>
          </Card>
          <Card
            className="p-4 rounded-2xl cursor-pointer hover:bg-secondary/50 transition-colors"
            onClick={onViewExpenses}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">All Expenses</p>
                <p className="font-semibold">{expenses.length} total</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Category Breakdown */}
        {categoryData.length > 0 && (
          <Card className="p-5 rounded-2xl mb-6">
            <h3 className="font-semibold mb-4">Spending by Category</h3>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={25}
                      outerRadius={40}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[entry.category as Category]}
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
                {categoryData.slice(0, 4).map((item) => (
                  <div key={item.category} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: CATEGORY_COLORS[item.category as Category],
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

        {/* Recent Transactions */}
        {recentExpenses.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Recent Transactions</h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={onViewExpenses}
              >
                See all
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {recentExpenses.map((expense) => {
                const category = CATEGORIES.find((c) => c.id === expense.category);
                return (
                  <Card key={expense.id} className="p-4 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
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
                        <p className="text-xs text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="font-semibold">
                        -{formatCurrency(expense.amount)}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {expenses.length === 0 && (
          <Card className="p-8 rounded-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">No expenses yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start tracking your spending by adding your first expense.
            </p>
            <Button className="rounded-xl" onClick={onAddExpense}>
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </Card>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        className="fab"
        onClick={onAddExpense}
        aria-label="Add expense"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default Dashboard;
