import { useState, useEffect, useCallback } from "react";
import { Expense, Category } from "@/types/expense";

const STORAGE_KEY = "meet_expenses";

// Generate unique ID
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
        // Convert date strings back to Date objects
        const expensesWithDates = parsed.map((e: Expense) => ({
          ...e,
          date: new Date(e.date),
          createdAt: new Date(e.createdAt),
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

  const addExpense = useCallback((data: {
    amount: number;
    category: Category;
    notes?: string;
    date: Date;
  }): Expense => {
    const newExpense: Expense = {
      id: generateId(),
      ...data,
      createdAt: new Date(),
      syncStatus: "pending",
    };
    setExpenses((prev) => [newExpense, ...prev]);
    return newExpense;
  }, []);

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

  // Calculate totals
  const getMonthlyTotal = useCallback((date: Date = new Date()) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    return expenses
      .filter((e) => {
        const expenseDate = new Date(e.date);
        return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const getMonthlyTransactionCount = useCallback((date: Date = new Date()) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    return expenses.filter((e) => {
      const expenseDate = new Date(e.date);
      return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
    }).length;
  }, [expenses]);

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

  const getCategoryTotals = useCallback((date: Date = new Date()) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    const monthlyExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.date);
      return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
    });

    const totals: Record<Category, number> = {
      food: 0,
      transport: 0,
      shopping: 0,
      rent: 0,
      bills: 0,
      misc: 0,
      custom: 0,
    };

    monthlyExpenses.forEach((e) => {
      totals[e.category] += e.amount;
    });

    return totals;
  }, [expenses]);

  return {
    expenses,
    isLoading,
    addExpense,
    updateExpense,
    deleteExpense,
    clearAllExpenses,
    getMonthlyTotal,
    getMonthlyTransactionCount,
    getTodayTotal,
    getCategoryTotals,
  };
};
