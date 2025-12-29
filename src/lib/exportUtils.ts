import { Expense, CATEGORIES, Category } from "@/types/expense";
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

// Map category labels back to IDs
const getCategoryId = (label: string): Category => {
  const cat = CATEGORIES.find((c) => c.label.toLowerCase() === label.toLowerCase());
  return cat?.id || "misc";
};

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

export const importFromCSV = (fileContent: string): { expenses: Omit<Expense, 'id' | 'syncStatus'>[]; result: ImportResult } => {
  const result: ImportResult = {
    success: false,
    imported: 0,
    skipped: 0,
    errors: [],
  };

  const expenses: Omit<Expense, 'id' | 'syncStatus'>[] = [];

  try {
    const lines = fileContent.trim().split('\n');
    
    if (lines.length < 2) {
      result.errors.push("CSV file is empty or has no data rows");
      return { expenses, result };
    }

    // Parse header to find column indices
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const dateIdx = header.findIndex(h => h === 'date');
    const amountIdx = header.findIndex(h => h === 'amount');
    const categoryIdx = header.findIndex(h => h === 'category');
    const notesIdx = header.findIndex(h => h === 'notes');
    const createdAtIdx = header.findIndex(h => h.includes('created'));

    if (dateIdx === -1 || amountIdx === -1) {
      result.errors.push("CSV must have 'Date' and 'Amount' columns");
      return { expenses, result };
    }

    // Skip header, process data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('TOTAL')) continue; // Skip empty lines and total row

      try {
        // Parse CSV line (handle quoted fields with commas)
        const values = parseCSVLine(line);
        
        const dateStr = values[dateIdx]?.trim();
        const amountStr = values[amountIdx]?.trim();
        const categoryStr = values[categoryIdx]?.trim() || "Misc";
        const notesStr = values[notesIdx]?.trim().replace(/^"|"$/g, '') || "";
        const createdAtStr = values[createdAtIdx]?.trim();

        if (!dateStr || !amountStr) {
          result.skipped++;
          continue;
        }

        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
          result.skipped++;
          result.errors.push(`Row ${i + 1}: Invalid amount "${amountStr}"`);
          continue;
        }

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          result.skipped++;
          result.errors.push(`Row ${i + 1}: Invalid date "${dateStr}"`);
          continue;
        }

        const createdAt = createdAtStr ? new Date(createdAtStr) : new Date();

        expenses.push({
          amount,
          category: getCategoryId(categoryStr),
          notes: notesStr,
          date,
          createdAt: isNaN(createdAt.getTime()) ? new Date() : createdAt,
        });

        result.imported++;
      } catch (err) {
        result.skipped++;
        result.errors.push(`Row ${i + 1}: Parse error`);
      }
    }

    result.success = result.imported > 0;
  } catch (err) {
    result.errors.push("Failed to parse CSV file");
  }

  return { expenses, result };
};

// Helper to parse CSV line with quoted fields
const parseCSVLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  
  return values;
};
