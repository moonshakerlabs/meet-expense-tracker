import { Expense, CATEGORIES } from "@/types/expense";
import { format } from "date-fns";

const getCategoryLabel = (category: string): string => {
  const cat = CATEGORIES.find((c) => c.id === category);
  return cat?.label || category;
};

const formatDate = (date: Date): string => {
  return format(new Date(date), "yyyy-MM-dd");
};

const formatDateTime = (date: Date): string => {
  return format(new Date(date), "yyyy-MM-dd HH:mm");
};

export const exportToCSV = (
  expenses: Expense[],
  currency: string
): void => {
  if (expenses.length === 0) return;

  const headers = ["Date", "Amount", "Currency", "Category", "Notes", "Created At"];
  const rows = expenses.map((exp) => [
    formatDate(exp.date),
    exp.amount.toFixed(2),
    currency,
    getCategoryLabel(exp.category),
    `"${(exp.notes || "").replace(/"/g, '""')}"`,
    formatDateTime(exp.createdAt),
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  downloadFile(csvContent, `meet-expenses-${formatDate(new Date())}.csv`, "text/csv;charset=utf-8");
};

export const exportToCSVFiltered = (
  expenses: Expense[],
  currency: string,
  startDate?: Date,
  endDate?: Date
): void => {
  let filtered = expenses;
  
  if (startDate) {
    filtered = filtered.filter((exp) => new Date(exp.date) >= startDate);
  }
  if (endDate) {
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    filtered = filtered.filter((exp) => new Date(exp.date) <= endOfDay);
  }

  if (filtered.length === 0) return;

  const headers = ["Date", "Amount", "Currency", "Category", "Notes", "Created At"];
  const rows = filtered.map((exp) => [
    formatDate(exp.date),
    exp.amount.toFixed(2),
    currency,
    getCategoryLabel(exp.category),
    `"${(exp.notes || "").replace(/"/g, '""')}"`,
    formatDateTime(exp.createdAt),
  ]);

  // Add total row
  const total = filtered.reduce((sum, exp) => sum + exp.amount, 0);
  rows.push(["", "", "", "", "", ""]);
  rows.push(["TOTAL", total.toFixed(2), currency, "", "", ""]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  
  const dateRange = startDate && endDate 
    ? `${formatDate(startDate)}_to_${formatDate(endDate)}`
    : formatDate(new Date());
  
  downloadFile(csvContent, `meet-expenses-${dateRange}.csv`, "text/csv;charset=utf-8");
};

export const exportToJSON = (
  expenses: Expense[],
  currencySymbol: string,
  currency: string
): void => {
  if (expenses.length === 0) return;

  const exportData = {
    exportDate: formatDateTime(new Date()),
    currency,
    currencySymbol,
    totalExpenses: expenses.length,
    totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
    expenses: expenses.map((exp) => ({
      date: formatDate(exp.date),
      amount: exp.amount,
      category: getCategoryLabel(exp.category),
      notes: exp.notes || "",
      createdAt: formatDateTime(exp.createdAt),
    })),
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  downloadFile(jsonContent, `meet-expenses-${formatDate(new Date())}.json`, "application/json");
};

const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
