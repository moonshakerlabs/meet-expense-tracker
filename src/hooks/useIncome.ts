import { useState, useEffect, useCallback } from "react";
import { Income, IncomeSourceId } from "@/types/expense";

const STORAGE_KEY = "meet_income";

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useIncome = () => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const incomesWithDates = parsed.map((i: Income) => ({
          ...i,
          date: new Date(i.date),
          createdAt: new Date(i.createdAt),
          autoUpdateEndDate: i.autoUpdateEndDate ? new Date(i.autoUpdateEndDate) : undefined,
        }));
        setIncomes(incomesWithDates);
      }
    } catch (error) {
      console.error("Error loading income:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(incomes));
    }
  }, [incomes, isLoading]);

  // Check and generate recurring income entries
  useEffect(() => {
    if (isLoading) return;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    incomes.forEach((income) => {
      if (!income.isRecurring || !income.isActive) return;

      // Check if auto-update has ended
      if (income.autoUpdateEndDate && new Date(income.autoUpdateEndDate) < today) {
        return;
      }

      // Check if we already have an entry for this month
      const hasThisMonth = incomes.some(
        (i) =>
          i.source === income.source &&
          new Date(i.date).getMonth() === currentMonth &&
          new Date(i.date).getFullYear() === currentYear &&
          i.id !== income.id
      );

      if (!hasThisMonth && income.recurringDay && today.getDate() >= income.recurringDay) {
        // Auto-generate entry for this month
        const newDate = new Date(currentYear, currentMonth, income.recurringDay);
        if (newDate <= today) {
          addIncome({
            amount: income.amount,
            source: income.source,
            date: newDate,
            notes: `Auto-generated from recurring income`,
            isRecurring: false,
            isActive: true,
          });
        }
      }
    });
  }, [isLoading, incomes]);

  const addIncome = useCallback(
    (data: {
      amount: number;
      source: IncomeSourceId;
      date: Date;
      notes?: string;
      isRecurring: boolean;
      recurringDay?: number;
      autoUpdateMonths?: number;
      autoUpdateEndDate?: Date;
      isActive: boolean;
    }): Income => {
      const newIncome: Income = {
        id: generateId(),
        ...data,
        createdAt: new Date(),
      };
      setIncomes((prev) => [newIncome, ...prev]);
      return newIncome;
    },
    []
  );

  const updateIncome = useCallback((id: string, data: Partial<Income>) => {
    setIncomes((prev) =>
      prev.map((income) => (income.id === id ? { ...income, ...data } : income))
    );
  }, []);

  const deleteIncome = useCallback((id: string) => {
    setIncomes((prev) => prev.filter((income) => income.id !== id));
  }, []);

  const stopRecurringIncome = useCallback((id: string) => {
    setIncomes((prev) =>
      prev.map((income) =>
        income.id === id ? { ...income, isActive: false, autoUpdateEndDate: new Date() } : income
      )
    );
  }, []);

  const getMonthlyIncome = useCallback(
    (date: Date = new Date()) => {
      const month = date.getMonth();
      const year = date.getFullYear();
      return incomes
        .filter((i) => {
          const incomeDate = new Date(i.date);
          return incomeDate.getMonth() === month && incomeDate.getFullYear() === year;
        })
        .reduce((sum, i) => sum + i.amount, 0);
    },
    [incomes]
  );

  const getIncomeBySource = useCallback(
    (date: Date = new Date()) => {
      const month = date.getMonth();
      const year = date.getFullYear();
      const monthlyIncomes = incomes.filter((i) => {
        const incomeDate = new Date(i.date);
        return incomeDate.getMonth() === month && incomeDate.getFullYear() === year;
      });

      // Dynamic aggregation - don't rely on fixed source types
      const totals: Record<string, number> = {};

      monthlyIncomes.forEach((i) => {
        totals[i.source] = (totals[i.source] || 0) + i.amount;
      });

      return totals;
    },
    [incomes]
  );

  const getRecurringIncomes = useCallback(() => {
    return incomes.filter((i) => i.isRecurring && i.isActive);
  }, [incomes]);

  return {
    incomes,
    isLoading,
    addIncome,
    updateIncome,
    deleteIncome,
    stopRecurringIncome,
    getMonthlyIncome,
    getIncomeBySource,
    getRecurringIncomes,
  };
};
