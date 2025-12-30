import { useState, useEffect, useCallback } from "react";
import { RecurringExpense, Category, Subcategory } from "@/types/expense";

const STORAGE_KEY = "meet_recurring_expenses";

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useRecurringExpenses = () => {
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const withDates = parsed.map((r: RecurringExpense) => ({
          ...r,
          createdAt: new Date(r.createdAt),
          lastGenerated: r.lastGenerated ? new Date(r.lastGenerated) : undefined,
        }));
        setRecurringExpenses(withDates);
      }
    } catch (error) {
      console.error("Error loading recurring expenses:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recurringExpenses));
    }
  }, [recurringExpenses, isLoading]);

  const addRecurringExpense = useCallback(
    (data: {
      name: string;
      amount: number;
      category: Category;
      subcategory?: Subcategory;
      dayOfMonth: number;
    }): RecurringExpense => {
      const newRecurring: RecurringExpense = {
        id: generateId(),
        ...data,
        isActive: true,
        createdAt: new Date(),
      };
      setRecurringExpenses((prev) => [newRecurring, ...prev]);
      return newRecurring;
    },
    []
  );

  const updateRecurringExpense = useCallback(
    (id: string, data: Partial<RecurringExpense>) => {
      setRecurringExpenses((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...data } : r))
      );
    },
    []
  );

  const deleteRecurringExpense = useCallback((id: string) => {
    setRecurringExpenses((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const toggleActive = useCallback((id: string) => {
    setRecurringExpenses((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
  }, []);

  const markAsGenerated = useCallback((id: string) => {
    setRecurringExpenses((prev) =>
      prev.map((r) => (r.id === id ? { ...r, lastGenerated: new Date() } : r))
    );
  }, []);

  const getActiveRecurringExpenses = useCallback(() => {
    return recurringExpenses.filter((r) => r.isActive);
  }, [recurringExpenses]);

  const getDueRecurringExpenses = useCallback(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    return recurringExpenses.filter((r) => {
      if (!r.isActive) return false;
      
      // Check if already generated this month
      if (r.lastGenerated) {
        const lastGenDate = new Date(r.lastGenerated);
        if (
          lastGenDate.getMonth() === currentMonth &&
          lastGenDate.getFullYear() === currentYear
        ) {
          return false;
        }
      }

      // Check if day has passed this month
      return today.getDate() >= r.dayOfMonth;
    });
  }, [recurringExpenses]);

  const getExpectedMonthlyTotal = useCallback(() => {
    return recurringExpenses
      .filter((r) => r.isActive)
      .reduce((sum, r) => sum + r.amount, 0);
  }, [recurringExpenses]);

  return {
    recurringExpenses,
    isLoading,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    toggleActive,
    markAsGenerated,
    getActiveRecurringExpenses,
    getDueRecurringExpenses,
    getExpectedMonthlyTotal,
  };
};
