import { useState, useEffect, useCallback } from "react";
import { RecurringExpense, Category, Subcategory, FrequencyUnit } from "@/types/expense";
import { addDays, addMonths, addYears, startOfDay } from "date-fns";

const STORAGE_KEY = "meet_recurring_expenses";

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Calculate next due date based on frequency
const calculateNextDueDate = (
  fromDate: Date,
  frequencyValue: number,
  frequencyUnit: FrequencyUnit
): Date => {
  const date = new Date(fromDate);
  switch (frequencyUnit) {
    case "days":
      return addDays(date, frequencyValue);
    case "months":
      return addMonths(date, frequencyValue);
    case "years":
      return addYears(date, frequencyValue);
    default:
      return addMonths(date, frequencyValue);
  }
};

// Format frequency for display
export const formatFrequency = (value: number, unit: FrequencyUnit): string => {
  if (unit === "months") {
    if (value === 1) return "Monthly";
    if (value === 3) return "Quarterly";
    if (value === 6) return "Half-yearly";
    if (value === 12) return "Yearly";
    return `Every ${value} months`;
  }
  if (unit === "years") {
    if (value === 1) return "Yearly";
    return `Every ${value} years`;
  }
  if (unit === "days") {
    if (value === 1) return "Daily";
    if (value === 7) return "Weekly";
    if (value === 14) return "Bi-weekly";
    return `Every ${value} days`;
  }
  return `Every ${value} ${unit}`;
};

export const useRecurringExpenses = () => {
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage with migration
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const migrated = parsed.map((r: any) => {
          // Migrate old format to new
          const startDate = r.startDate ? new Date(r.startDate) : new Date(r.createdAt);
          let nextDueDate: Date;
          
          if (r.nextDueDate) {
            nextDueDate = new Date(r.nextDueDate);
          } else if (r.dayOfMonth) {
            // Legacy migration: calculate next due from dayOfMonth
            const today = new Date();
            const thisMonth = new Date(today.getFullYear(), today.getMonth(), r.dayOfMonth);
            nextDueDate = thisMonth >= today ? thisMonth : addMonths(thisMonth, 1);
          } else {
            nextDueDate = startDate;
          }

          return {
            ...r,
            frequencyValue: r.frequencyValue ?? 1,
            frequencyUnit: r.frequencyUnit ?? "months",
            startDate,
            nextDueDate,
            createdAt: new Date(r.createdAt),
            lastGenerated: r.lastGenerated ? new Date(r.lastGenerated) : undefined,
          };
        });
        setRecurringExpenses(migrated);
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
      frequencyValue: number;
      frequencyUnit: FrequencyUnit;
      startDate: Date;
    }): RecurringExpense => {
      const newRecurring: RecurringExpense = {
        id: generateId(),
        name: data.name,
        amount: data.amount,
        category: data.category,
        subcategory: data.subcategory,
        frequencyValue: data.frequencyValue,
        frequencyUnit: data.frequencyUnit,
        startDate: data.startDate,
        nextDueDate: data.startDate,
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
      prev.map((r) => {
        if (r.id === id) {
          const newNextDueDate = calculateNextDueDate(
            r.nextDueDate,
            r.frequencyValue,
            r.frequencyUnit
          );
          return {
            ...r,
            lastGenerated: new Date(),
            nextDueDate: newNextDueDate,
          };
        }
        return r;
      })
    );
  }, []);

  const getActiveRecurringExpenses = useCallback(() => {
    return recurringExpenses.filter((r) => r.isActive);
  }, [recurringExpenses]);

  const getDueRecurringExpenses = useCallback(() => {
    const today = startOfDay(new Date());

    return recurringExpenses.filter((r) => {
      if (!r.isActive) return false;
      
      const nextDue = startOfDay(new Date(r.nextDueDate));
      return today >= nextDue;
    });
  }, [recurringExpenses]);

  const getExpectedMonthlyTotal = useCallback(() => {
    return recurringExpenses
      .filter((r) => r.isActive)
      .reduce((sum, r) => {
        // Calculate proportional monthly cost
        let monthlyCost = r.amount;
        
        switch (r.frequencyUnit) {
          case "days":
            // Approximate monthly cost (30 days)
            monthlyCost = (r.amount * 30) / r.frequencyValue;
            break;
          case "months":
            monthlyCost = r.amount / r.frequencyValue;
            break;
          case "years":
            monthlyCost = r.amount / (12 * r.frequencyValue);
            break;
        }
        
        return sum + monthlyCost;
      }, 0);
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
