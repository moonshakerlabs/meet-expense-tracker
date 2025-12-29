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
  currencySymbol: string
): void => {
  if (expenses.length === 0) return;

  const headers = ["Date", "Amount", "Currency", "Category", "Notes", "Created At"];
  const rows = expenses.map((exp) => [
    formatDate(exp.date),
    exp.amount.toFixed(2),
    currencySymbol,
    getCategoryLabel(exp.category),
    `"${(exp.notes || "").replace(/"/g, '""')}"`,
    formatDateTime(exp.createdAt),
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  downloadFile(csvContent, `meet-expenses-${formatDate(new Date())}.csv`, "text/csv");
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

export const exportToExcel = (
  expenses: Expense[],
  currencySymbol: string
): void => {
  if (expenses.length === 0) return;

  // Excel-compatible CSV with BOM for proper UTF-8 encoding
  const headers = ["Date", "Amount", "Currency", "Category", "Notes", "Created At"];
  const rows = expenses.map((exp) => [
    formatDate(exp.date),
    exp.amount.toFixed(2),
    currencySymbol,
    getCategoryLabel(exp.category),
    `"${(exp.notes || "").replace(/"/g, '""')}"`,
    formatDateTime(exp.createdAt),
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  downloadFile(csvContent, `meet-expenses-${formatDate(new Date())}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
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
