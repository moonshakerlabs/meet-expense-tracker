import { useState, useEffect, useCallback } from "react";
import { Expense, Category, Subcategory, CategoryId } from "@/types/expense";

const STORAGE_KEY = "meet_expenses";

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load expenses from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Deduplicate expenses by id to prevent duplicates during app updates
        const uniqueExpenses = new Map<string, Expense>();
        parsed.forEach((e: Expense) => {
          // Use the expense id as the key to prevent duplicates
          if (!uniqueExpenses.has(e.id)) {
            uniqueExpenses.set(e.id, {
              ...e,
              date: new Date(e.date),
              createdAt: new Date(e.createdAt),
            });
          }
        });
        setExpenses(Array.from(uniqueExpenses.values()));
      }
    } catch (error) {
      console.error("Error loading expenses:", error);
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, []);

  // Save to localStorage only after initial load is complete
  useEffect(() => {
    if (hasLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    }
  }, [expenses, hasLoaded]);

  // Migrate expenses with missing currency to use provided default
  const migrateExpensesCurrency = useCallback((defaultCurrency: string, defaultCurrencySymbol: string) => {
    setExpenses((prev) => {
      const needsMigration = prev.some((e) => !e.currency || !e.currencySymbol);
      if (!needsMigration) return prev;
      
      return prev.map((e) => ({
        ...e,
        currency: e.currency || defaultCurrency,
        currencySymbol: e.currencySymbol || defaultCurrencySymbol,
      }));
    });
  }, []);

  const addExpense = useCallback(
    (data: {
      amount: number;
      category: CategoryId;
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

  // Helper to check if expense is a duplicate
  const isDuplicateExpense = useCallback(
    (newExp: Omit<Expense, "id" | "syncStatus">, existingExpenses: Expense[]): boolean => {
      const newDate = new Date(newExp.date);
      return existingExpenses.some((existing) => {
        const existingDate = new Date(existing.date);
        return (
          existing.amount === newExp.amount &&
          existing.currency === newExp.currency &&
          existing.category === newExp.category &&
          existingDate.toDateString() === newDate.toDateString() &&
          (existing.notes || "") === (newExp.notes || "")
        );
      });
    },
    []
  );

  type ImportExpenseInput = Partial<Pick<Expense, "id">> &
    Omit<Expense, "id" | "syncStatus">;

  const importExpenses = useCallback(
    (newExpenses: ImportExpenseInput[]) => {
      let importedCount = 0;
      
      setExpenses((prev) => {
        const nonDuplicates: Expense[] = [];
        
        for (const exp of newExpenses) {
          // Check against both existing expenses and newly added ones
          const allExpenses = [...prev, ...nonDuplicates];

          // If the imported expense includes a stable id and we already have it, skip.
          // This prevents duplicates when re-importing backups that include ids.
          if (exp.id && allExpenses.some((e) => e.id === exp.id)) {
            continue;
          }

          if (!isDuplicateExpense(exp, allExpenses)) {
            nonDuplicates.push({
              ...exp,
              id: exp.id || generateId(),
              syncStatus: "pending" as const,
            });
          }
        }
        
        importedCount = nonDuplicates.length;
        return [...nonDuplicates, ...prev];
      });
      
      return importedCount;
    },
    [isDuplicateExpense]
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
        if (e.category in totals) {
          totals[e.category as Category] += e.amount;
        }
      });

      return totals;
    },
    [expenses]
  );

  const getExpensesByCategory = useCallback(
    (category: CategoryId, date: Date = new Date()) => {
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
    (category: CategoryId, date: Date = new Date()) => {
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
    hasLoaded,
    addExpense,
    updateExpense,
    deleteExpense,
    clearAllExpenses,
    importExpenses,
    migrateExpensesCurrency,
    getMonthlyTotal,
    getMonthlyTransactionCount,
    getTodayTotal,
    getCategoryTotals,
    getExpensesByCategory,
    getSubcategoryTotals,
    getMonthlyExpenses,
  };
};
