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

  // Recurring income entries are templates - they define the recurring pattern
  // The monthly income is calculated by including the recurring entry itself for the current month
  // No auto-generation needed - the recurring entry IS the monthly entry

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
      const today = new Date();
      
      let total = 0;
      
      incomes.forEach((income) => {
        const incomeDate = new Date(income.date);
        
        if (income.isRecurring && income.isActive) {
          // For recurring income: check if it applies to this month
          // It applies if the recurring entry was created before or during this month
          // and hasn't ended yet
          const createdDate = new Date(income.createdAt);
          const createdMonth = createdDate.getMonth();
          const createdYear = createdDate.getFullYear();
          
          // Check if this recurring income applies to the target month
          const isCurrentOrFutureMonth = 
            year > createdYear || (year === createdYear && month >= createdMonth);
          
          // Check if auto-update has ended
          const hasEnded = income.autoUpdateEndDate && 
            new Date(income.autoUpdateEndDate) < new Date(year, month + 1, 0);
          
          if (isCurrentOrFutureMonth && !hasEnded) {
            total += income.amount;
          }
        } else if (!income.isRecurring) {
          // For non-recurring income: only count if date is in this month
          if (incomeDate.getMonth() === month && incomeDate.getFullYear() === year) {
            total += income.amount;
          }
        }
      });
      
      return total;
    },
    [incomes]
  );

  const getIncomeBySource = useCallback(
    (date: Date = new Date()) => {
      const month = date.getMonth();
      const year = date.getFullYear();
      const totals: Record<string, number> = {};

      incomes.forEach((income) => {
        const incomeDate = new Date(income.date);
        
        if (income.isRecurring && income.isActive) {
          // Same logic as getMonthlyIncome for recurring
          const createdDate = new Date(income.createdAt);
          const createdMonth = createdDate.getMonth();
          const createdYear = createdDate.getFullYear();
          
          const isCurrentOrFutureMonth = 
            year > createdYear || (year === createdYear && month >= createdMonth);
          
          const hasEnded = income.autoUpdateEndDate && 
            new Date(income.autoUpdateEndDate) < new Date(year, month + 1, 0);
          
          if (isCurrentOrFutureMonth && !hasEnded) {
            totals[income.source] = (totals[income.source] || 0) + income.amount;
          }
        } else if (!income.isRecurring) {
          if (incomeDate.getMonth() === month && incomeDate.getFullYear() === year) {
            totals[income.source] = (totals[income.source] || 0) + income.amount;
          }
        }
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
