import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, Receipt, ArrowUpRight, Settings, ChevronLeft, ChevronRight, Wallet, PiggyBank, ChevronDown, ChevronUp, CalendarDays, Menu } from "lucide-react";
import { Expense, CATEGORIES, Category, CATEGORY_COLORS, SUBCATEGORIES, CurrencyIncome, CurrencySavings } from "@/types/expense";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DashboardProps {
  expenses: Expense[];
  formatCurrency: (amount: number) => string;
  defaultCurrency: string;
  defaultCurrencySymbol: string;
  onAddExpense: () => void;
  onViewExpenses: (date: Date) => void;
  onOpenSettings: () => void;
  onOpenFinanceMenu?: () => void;
  onViewCategory?: (category: Category, date: Date) => void;
  onViewIncome?: () => void;
  onViewRecurring?: () => void;
  onViewPurpose?: (purposeId: string) => void;
  monthlyIncome?: number;
  userName?: string;
  customCategories?: Array<{ id: string; label: string; icon: string; color?: string }>;
  currencyIncomes?: CurrencyIncome[];
  currencySavings?: CurrencySavings[];
  country?: string;
  purposes?: Array<{ id: string; label: string; createdAt: Date }>;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const Dashboard = ({
  expenses,
  formatCurrency,
  defaultCurrency,
  defaultCurrencySymbol,
  onAddExpense,
  onViewExpenses,
  onOpenSettings,
  onOpenFinanceMenu,
  onViewCategory,
  onViewIncome,
  onViewRecurring,
  onViewPurpose,
  monthlyIncome = 0,
  userName,
  customCategories = [],
  currencyIncomes = [],
  currencySavings = [],
  country,
  purposes = [],
}: DashboardProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"monthly" | "yearly" | "purpose">("monthly");
  const [expandedCurrencies, setExpandedCurrencies] = useState<Record<string, boolean>>({});
  const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);
  const [expandedMonths, setExpandedMonths] = useState(false);
  
  const month = selectedDate.getMonth();
  const year = selectedDate.getFullYear();

  // Get the year range from expenses
  const yearRange = useMemo(() => {
    if (expenses.length === 0) return [new Date().getFullYear()];
    const years = new Set<number>();
    expenses.forEach(e => {
      years.add(new Date(e.date).getFullYear());
    });
    years.add(new Date().getFullYear()); // Always include current year
    return Array.from(years).sort((a, b) => b - a); // Descending
  }, [expenses]);

  const goToPreviousMonth = () => {
    setSelectedDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    const next = new Date(year, month + 1, 1);
    if (next <= new Date()) {
      setSelectedDate(next);
    }
  };

  const handleMonthChange = (monthIndex: string) => {
    const newMonth = parseInt(monthIndex);
    const newDate = new Date(year, newMonth, 1);
    if (newDate <= new Date()) {
      setSelectedDate(newDate);
    }
  };

  const handleYearChange = (newYear: string) => {
    const y = parseInt(newYear);
    // If changing to current year and current month is ahead, clamp to current month
    const now = new Date();
    if (y === now.getFullYear() && month > now.getMonth()) {
      setSelectedDate(new Date(y, now.getMonth(), 1));
    } else {
      setSelectedDate(new Date(y, month, 1));
    }
  };

  const toggleCurrencyExpand = (currency: string) => {
    setExpandedCurrencies(prev => ({ ...prev, [currency]: !prev[currency] }));
  };

  const monthlyExpenses = useMemo(
    () =>
      expenses.filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === month && d.getFullYear() === year;
      }),
    [expenses, month, year]
  );

  // Yearly expenses for yearly view
  const yearlyExpenses = useMemo(
    () => expenses.filter((e) => new Date(e.date).getFullYear() === year),
    [expenses, year]
  );

  // Group expenses by currency with category breakdown
  const categoryDataByCurrency = useMemo(() => {
    const sourceExpenses = viewMode === "yearly" ? yearlyExpenses : monthlyExpenses;
    const result: Record<string, { 
      currency: string; 
      symbol: string; 
      total: number;
      count: number;
      categories: Array<{ name: string; value: number; category: string }> 
    }> = {};
    
    // Helper to get category label
    const getCategoryLabel = (categoryId: string): string => {
      const builtIn = CATEGORIES.find((c) => c.id === categoryId);
      if (builtIn) return builtIn.label;
      const custom = customCategories.find((c) => c.id === categoryId);
      if (custom) return custom.label;
      return categoryId;
    };
    
    sourceExpenses.forEach((e) => {
      const curr = e.currency || defaultCurrency;
      const symbol = e.currencySymbol || defaultCurrencySymbol;
      
      if (!result[curr]) {
        result[curr] = { currency: curr, symbol, total: 0, count: 0, categories: [] };
      }
      result[curr].total += e.amount;
      result[curr].count += 1;
      
      const existingCat = result[curr].categories.find(c => c.category === e.category);
      if (existingCat) {
        existingCat.value += e.amount;
      } else {
        result[curr].categories.push({
          name: getCategoryLabel(e.category),
          value: e.amount,
          category: e.category,
        });
      }
    });
    
    Object.values(result).forEach(data => {
      data.categories.sort((a, b) => b.value - a.value);
    });
    
    return Object.values(result);
  }, [monthlyExpenses, yearlyExpenses, viewMode, defaultCurrency, defaultCurrencySymbol, customCategories]);

  // Monthly breakdown for yearly view
  const monthlyBreakdown = useMemo(() => {
    if (viewMode !== "yearly") return [];
    
    const breakdown: Array<{ month: number; monthName: string; total: number; count: number }> = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // For past years, show all 12 months; for current year, show up to current month
    const maxMonth = year < currentYear ? 11 : currentMonth;
    
    for (let m = 0; m <= maxMonth; m++) {
      const monthExpenses = yearlyExpenses.filter(e => new Date(e.date).getMonth() === m);
      const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      // Show all months up to maxMonth, even if they have 0 expenses
      breakdown.push({
        month: m,
        monthName: MONTHS[m],
        total,
        count: monthExpenses.length
      });
    }
    
    return breakdown;
  }, [yearlyExpenses, viewMode, year]);

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

  const totalCategoriesUsed = useMemo(() => {
    const uniqueCategories = new Set<string>();
    categoryDataByCurrency.forEach(data => {
      data.categories.forEach(cat => uniqueCategories.add(cat.category));
    });
    return uniqueCategories.size;
  }, [categoryDataByCurrency]);

  const recentExpenses = useMemo(() => 
    [...monthlyExpenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3), 
    [monthlyExpenses]
  );

  const monthName = selectedDate.toLocaleString("default", { month: "long", year: "numeric" });
  const isCurrentMonth = month === new Date().getMonth() && year === new Date().getFullYear();
  
  const defaultCurrencyData = categoryDataByCurrency.find(d => d.currency === defaultCurrency);
  const defaultCurrencyTotal = defaultCurrencyData?.total || 0;
  const savings = monthlyIncome - defaultCurrencyTotal;

  const handleViewMonth = (monthIndex: number) => {
    setSelectedDate(new Date(year, monthIndex, 1));
    setViewMode("monthly");
  };

  return (
    <div className="min-h-screen bg-background pb-24 safe-top">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back{userName ? `, ${userName}` : ''}</p>
            <h1 className="font-display font-bold text-2xl">Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={onOpenSettings}
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={onOpenFinanceMenu}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Month/Year Navigation with Dropdowns */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="h-9 w-9">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <Select value={month.toString()} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[120px] rounded-xl border-0 bg-secondary/50 h-9">
              <SelectValue>{MONTHS[month]}</SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-background border border-border">
              {MONTHS.map((m, idx) => {
                const isDisabled = year === new Date().getFullYear() && idx > new Date().getMonth();
                return (
                  <SelectItem key={idx} value={idx.toString()} disabled={isDisabled}>
                    {m}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          <Select value={year.toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="w-[90px] rounded-xl border-0 bg-secondary/50 h-9">
              <SelectValue>{year}</SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-background border border-border">
              {yearRange.map((y) => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            className="h-9 w-9"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-center gap-2 mb-4">
          <Button
            variant={viewMode === "monthly" ? "default" : "secondary"}
            size="sm"
            className="rounded-xl"
            onClick={() => setViewMode("monthly")}
          >
            Monthly
          </Button>
          <Button
            variant={viewMode === "yearly" ? "default" : "secondary"}
            size="sm"
            className="rounded-xl"
            onClick={() => setViewMode("yearly")}
          >
            <CalendarDays className="w-4 h-4 mr-1" />
            Yearly
          </Button>
          {purposes.length > 0 && (
            <Button
              variant={viewMode === "purpose" ? "default" : "secondary"}
              size="sm"
              className="rounded-xl"
              onClick={() => setViewMode("purpose")}
            >
              Purpose
            </Button>
          )}
        </div>

        {/* Main Stats Card */}
        <Card className="p-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-3xl mb-4">
          <p className="text-sm opacity-80 mb-1">
            {viewMode === "yearly" ? `${year} Total Spending` : "Monthly Spending"}
          </p>
          
          {categoryDataByCurrency.length > 1 ? (
            <Carousel className="w-full mb-3">
              <CarouselContent>
                {categoryDataByCurrency.map((data) => (
                  <CarouselItem key={data.currency}>
                    <div className="text-center py-2">
                      <h2 className="font-display font-bold text-4xl mb-1">
                        {data.symbol}{data.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </h2>
                      <p className="text-sm opacity-70">{data.currency} · {data.count} txn</p>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center gap-2 mt-2">
                <CarouselPrevious className="static translate-y-0 h-8 w-8 bg-primary-foreground/20 border-0 text-primary-foreground hover:bg-primary-foreground/30" />
                <CarouselNext className="static translate-y-0 h-8 w-8 bg-primary-foreground/20 border-0 text-primary-foreground hover:bg-primary-foreground/30" />
              </div>
            </Carousel>
          ) : categoryDataByCurrency.length === 1 ? (
            <h2 className="font-display font-bold text-4xl mb-4">
              {categoryDataByCurrency[0].symbol}{categoryDataByCurrency[0].total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          ) : (
            <h2 className="font-display font-bold text-4xl mb-4">
              {formatCurrency(0)}
            </h2>
          )}
          
          <div className="flex gap-6">
            <div>
              <p className="text-xs opacity-70">Transactions</p>
              <p className="font-semibold">{viewMode === "yearly" ? yearlyExpenses.length : monthlyExpenses.length}</p>
            </div>
            {isCurrentMonth && viewMode === "monthly" && (
              <div>
                <p className="text-xs opacity-70">Today</p>
                <p className="font-semibold">{formatCurrency(todayTotal)}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Yearly View: Monthly Breakdown with Expand/Collapse */}
        {viewMode === "yearly" && monthlyBreakdown.length > 0 && (
          <Card className="p-5 rounded-2xl mb-4">
            <h3 className="font-semibold mb-4">Monthly Breakdown</h3>
            <div className="space-y-2">
              {(expandedMonths ? monthlyBreakdown : monthlyBreakdown.slice(0, 4)).map((item) => (
                <div
                  key={item.month}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 cursor-pointer transition-colors"
                  onClick={() => handleViewMonth(item.month)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">{item.monthName.slice(0, 3)}</span>
                    </div>
                    <div>
                      <p className="font-medium">{item.monthName}</p>
                      <p className="text-xs text-muted-foreground">{item.count} transactions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{formatCurrency(item.total)}</p>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
            {monthlyBreakdown.length > 4 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3 text-muted-foreground hover:text-foreground"
                onClick={() => setExpandedMonths(!expandedMonths)}
              >
                {expandedMonths ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    +{monthlyBreakdown.length - 4} more months
                  </>
                )}
              </Button>
            )}
          </Card>
        )}

        {/* Purpose View */}
        {viewMode === "purpose" && (
          <Card className="p-5 rounded-2xl mb-4">
            <h3 className="font-semibold mb-4">Select Purpose</h3>
            <div className="space-y-2">
              {purposes.map((purpose) => {
                const purposeExpenses = expenses.filter(e => e.purposeId === purpose.id);
                const total = purposeExpenses.reduce((sum, e) => sum + e.amount, 0);
                return (
                  <div
                    key={purpose.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 cursor-pointer transition-colors"
                    onClick={() => onViewPurpose?.(purpose.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                        <span className="text-lg">🎯</span>
                      </div>
                      <div>
                        <p className="font-medium">{purpose.label}</p>
                        <p className="text-xs text-muted-foreground">{purposeExpenses.length} expenses</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{formatCurrency(total)}</p>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                );
              })}
              {purposes.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">No purposes defined</p>
                  <p className="text-xs mt-1">Create purposes in Finance Management</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Income & Savings Cards (only in monthly view) */}
        {viewMode === "monthly" && (monthlyIncome > 0 || currencyIncomes.length > 0 || currencySavings.length > 0) && (
          <div className="mb-4 space-y-3">
            {/* Default currency income + savings */}
            {monthlyIncome > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <Card
                  className="p-4 rounded-2xl cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={onViewIncome}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Income</p>
                      <p className="font-semibold">{formatCurrency(monthlyIncome)}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${savings >= 0 ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}>
                      <PiggyBank className={`w-5 h-5 ${savings >= 0 ? 'text-emerald-500' : 'text-destructive'}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Savings</p>
                      <p className={`font-semibold ${savings < 0 ? 'text-destructive' : ''}`}>
                        {formatCurrency(Math.abs(savings))}
                        {savings < 0 && ' (-)'}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
            
            {/* Multi-currency incomes */}
            {currencyIncomes.length > 0 && (
              <Card className="p-4 rounded-2xl">
                <p className="text-xs text-muted-foreground mb-3">Income by Currency</p>
                <div className="space-y-2">
                  {currencyIncomes.map((income) => (
                    <div key={income.currency} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm">{income.currency}</span>
                      </div>
                      <span className="font-medium text-emerald-600">
                        {income.currencySymbol}{income.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Savings by Currency (from settings - expenses) */}
            {currencySavings.length > 0 && (
              <Card className="p-4 rounded-2xl">
                <p className="text-xs text-muted-foreground mb-3">Savings by Currency</p>
                <div className="space-y-2">
                  {currencySavings.map((saving) => {
                    const currencyExpenses = monthlyExpenses
                      .filter(e => e.currency === saving.currency)
                      .reduce((sum, e) => sum + e.amount, 0);
                    const netSavings = saving.amount - currencyExpenses;
                    return (
                      <div key={saving.currency} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PiggyBank className="w-4 h-4 text-amber-500" />
                          <span className="text-sm">{saving.currency}</span>
                          <span className="text-xs text-muted-foreground">
                            (Base: {saving.currencySymbol}{saving.amount.toLocaleString()})
                          </span>
                        </div>
                        <span className={`font-medium ${netSavings >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                          {netSavings >= 0 ? '+' : ''}{saving.currencySymbol}{netSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Categories</p>
                <p className="font-semibold">{totalCategoriesUsed} used</p>
              </div>
            </div>
          </Card>
          <Card
            className="p-4 rounded-2xl cursor-pointer hover:bg-secondary/50 transition-colors"
            onClick={() => onViewExpenses(selectedDate)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {viewMode === "yearly" ? "This Year" : "This Month"}
                </p>
                <p className="font-semibold">
                  {viewMode === "yearly" ? yearlyExpenses.length : monthlyExpenses.length} expenses
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Category Breakdown - Expandable */}
        {categoryDataByCurrency.length > 0 && (
          <Card className="p-5 rounded-2xl mb-6">
            <h3 className="font-semibold mb-4">Spending by Category</h3>
            
            <Carousel className="w-full">
              <CarouselContent>
                {categoryDataByCurrency.map((currencyData) => {
                  const isExpanded = expandedCurrencies[currencyData.currency] || false;
                  const displayCategories = isExpanded ? currencyData.categories : currencyData.categories.slice(0, 4);
                  const hasMore = currencyData.categories.length > 4;
                  
                  return (
                    <CarouselItem key={currencyData.currency}>
                      <p className="text-sm text-muted-foreground text-center mb-3">
                        {currencyData.currency} ({currencyData.symbol})
                      </p>
                      
                      <div className="flex items-start gap-4">
                        <div className="w-24 h-24 shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={currencyData.categories}
                                cx="50%"
                                cy="50%"
                                innerRadius={25}
                                outerRadius={40}
                                paddingAngle={2}
                                dataKey="value"
                              >
                                {currencyData.categories.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={CATEGORY_COLORS[entry.category as Category] || CATEGORY_COLORS.misc}
                                    className="cursor-pointer"
                                    onClick={() => onViewCategory?.(entry.category as Category, selectedDate)}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value: number) => `${currencyData.symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          {displayCategories.map((item) => (
                            <div
                              key={item.category}
                              className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 rounded-lg p-1 -ml-1 transition-colors"
                              onClick={() => onViewCategory?.(item.category as Category, selectedDate)}
                            >
                              <div
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{
                                  backgroundColor: CATEGORY_COLORS[item.category as Category] || CATEGORY_COLORS.misc,
                                }}
                              />
                              <span className="text-sm flex-1 truncate">{item.name}</span>
                              <span className="text-sm font-medium shrink-0">
                                {currencyData.symbol}{item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          ))}
                          
                          {hasMore && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => toggleCurrencyExpand(currencyData.currency)}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-3 h-3 mr-1" />
                                  Show less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3 mr-1" />
                                  +{currencyData.categories.length - 4} more categories
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              
              {categoryDataByCurrency.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <CarouselPrevious className="static translate-y-0 h-8 w-8" />
                  <CarouselNext className="static translate-y-0 h-8 w-8" />
                </div>
              )}
            </Carousel>
          </Card>
        )}

        {/* Recent Transactions (only in monthly view) */}
        {viewMode === "monthly" && recentExpenses.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Recent Transactions</h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={() => onViewExpenses(selectedDate)}
              >
                See all
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {recentExpenses.map((expense) => {
                const builtInCategory = CATEGORIES.find((c) => c.id === expense.category);
                const customCategory = customCategories.find((c) => c.id === expense.category);
                const categoryLabel = builtInCategory?.label || customCategory?.label || expense.category;
                const categoryIcon = builtInCategory?.icon || customCategory?.icon || "📦";
                const subcategoryLabel = expense.subcategory
                  ? SUBCATEGORIES[expense.category as Category]?.find((s) => s.id === expense.subcategory)?.label
                  : null;
                const expenseSymbol = expense.currencySymbol || defaultCurrencySymbol;
                return (
                  <Card key={expense.id} className="p-4 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[expense.category as Category] || CATEGORY_COLORS.misc}20`,
                        }}
                      >
                        {categoryIcon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {categoryLabel}
                        </p>
                        {subcategoryLabel && (
                          <p className="text-xs text-muted-foreground truncate">
                            {subcategoryLabel}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString()}
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
          </div>
        )}

        {/* Empty State */}
        {categoryDataByCurrency.length === 0 && (
          <Card className="p-8 rounded-2xl text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No expenses yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {viewMode === "yearly" 
                ? `Start tracking your spending for ${year}`
                : `Start tracking your spending for ${monthName}`
              }
            </p>
            <Button onClick={onAddExpense} className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </Card>
        )}
      </div>

      {/* Floating Action Button */}
      <Button
        onClick={onAddExpense}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg fab"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default Dashboard;