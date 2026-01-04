import { useState, useEffect, useCallback } from "react";
import { Expense, Category, Subcategory, CATEGORIES } from "@/types/expense";

const STORAGE_KEY = "meet_expenses";

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load expenses from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const expensesWithDates = parsed.map((e: Expense) => ({
          ...e,
          date: new Date(e.date),
          createdAt: new Date(e.createdAt),
          // Backward compatibility: default to USD if no currency
          currency: e.currency || "USD",
          currencySymbol: e.currencySymbol || "$",
        }));
        setExpenses(expensesWithDates);
      }
    } catch (error) {
      console.error("Error loading expenses:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to localStorage whenever expenses change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    }
  }, [expenses, isLoading]);

  const addExpense = useCallback(
    (data: {
      amount: number;
      category: Category;
      subcategory?: Subcategory;
      notes?: string;
      date: Date;
      currency: string;
      currencySymbol: string;
      recurringId?: string;
    }): Expense => {
      const newExpense: Expense = {
        id: generateId(),
        ...data,
        createdAt: new Date(),
        syncStatus: "pending",
      };
      setExpenses((prev) => [newExpense, ...prev]);
      return newExpense;
    },
    []
  );

  const updateExpense = useCallback((id: string, data: Partial<Expense>) => {
    setExpenses((prev) =>
      prev.map((expense) =>
        expense.id === id
          ? { ...expense, ...data, syncStatus: "pending" as const }
          : expense
      )
    );
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  }, []);

  const clearAllExpenses = useCallback(() => {
    setExpenses([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const importExpenses = useCallback(
    (newExpenses: Omit<Expense, "id" | "syncStatus">[]) => {
      const expensesWithIds: Expense[] = newExpenses.map((exp) => ({
        ...exp,
        id: generateId(),
        syncStatus: "pending" as const,
      }));
      setExpenses((prev) => [...expensesWithIds, ...prev]);
      return expensesWithIds.length;
    },
    []
  );

  // Calculate totals
  const getMonthlyTotal = useCallback(
    (date: Date = new Date()) => {
      const month = date.getMonth();
      const year = date.getFullYear();
      return expenses
        .filter((e) => {
          const expenseDate = new Date(e.date);
          return (
            expenseDate.getMonth() === month && expenseDate.getFullYear() === year
          );
        })
        .reduce((sum, e) => sum + e.amount, 0);
    },
    [expenses]
  );

  const getMonthlyTransactionCount = useCallback(
    (date: Date = new Date()) => {
      const month = date.getMonth();
      const year = date.getFullYear();
      return expenses.filter((e) => {
        const expenseDate = new Date(e.date);
        return (
          expenseDate.getMonth() === month && expenseDate.getFullYear() === year
        );
      }).length;
    },
    [expenses]
  );

  const getTodayTotal = useCallback(() => {
    const today = new Date();
    return expenses
      .filter((e) => {
        const expenseDate = new Date(e.date);
        return (
          expenseDate.getDate() === today.getDate() &&
          expenseDate.getMonth() === today.getMonth() &&
          expenseDate.getFullYear() === today.getFullYear()
        );
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const getCategoryTotals = useCallback(
    (date: Date = new Date()) => {
      const month = date.getMonth();
      const year = date.getFullYear();
      const monthlyExpenses = expenses.filter((e) => {
        const expenseDate = new Date(e.date);
        return (
          expenseDate.getMonth() === month && expenseDate.getFullYear() === year
        );
      });

      const totals: Record<Category, number> = {
        food: 0,
        transport: 0,
        shopping: 0,
        bills: 0,
        medical: 0,
        subscriptions: 0,
        education: 0,
        tax: 0,
        liabilities: 0,
        investments: 0,
        misc: 0,
        custom: 0,
      };

      monthlyExpenses.forEach((e) => {
        totals[e.category] += e.amount;
      });

      return totals;
    },
    [expenses]
  );

  const getExpensesByCategory = useCallback(
    (category: Category, date: Date = new Date()) => {
      const month = date.getMonth();
      const year = date.getFullYear();
      return expenses.filter((e) => {
        const expenseDate = new Date(e.date);
        return (
          e.category === category &&
          expenseDate.getMonth() === month &&
          expenseDate.getFullYear() === year
        );
      });
    },
    [expenses]
  );

  const getSubcategoryTotals = useCallback(
    (category: Category, date: Date = new Date()) => {
      const categoryExpenses = getExpensesByCategory(category, date);
      const totals: Record<string, number> = {};

      categoryExpenses.forEach((e) => {
        const subcat = e.subcategory || "uncategorized";
        totals[subcat] = (totals[subcat] || 0) + e.amount;
      });

      return totals;
    },
    [getExpensesByCategory]
  );

  const getMonthlyExpenses = useCallback(
    (date: Date = new Date()) => {
      const month = date.getMonth();
      const year = date.getFullYear();
      return expenses.filter((e) => {
        const expenseDate = new Date(e.date);
        return (
          expenseDate.getMonth() === month && expenseDate.getFullYear() === year
        );
      });
    },
    [expenses]
  );

  return {
    expenses,
    isLoading,
    addExpense,
    updateExpense,
    deleteExpense,
    clearAllExpenses,
    importExpenses,
    getMonthlyTotal,
    getMonthlyTransactionCount,
    getTodayTotal,
    getCategoryTotals,
    getExpensesByCategory,
    getSubcategoryTotals,
    getMonthlyExpenses,
  };
};
