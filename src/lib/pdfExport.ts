import { jsPDF } from "jspdf";
import { Expense, CurrencyIncome, CurrencySavings, CURRENCIES, CATEGORIES } from "@/types/expense";
import { format } from "date-fns";
import { exportFile } from "./fileExport";

// Exchange rates to USD (approximate - in a real app, fetch from API)
const EXCHANGE_RATES_TO_USD: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  INR: 0.012,
  JPY: 0.0067,
  CAD: 0.74,
  AUD: 0.65,
  SGD: 0.74,
  MYR: 0.21,
  CHF: 1.12,
  THB: 0.028,
  AED: 0.27,
  PHP: 0.018,
  NZD: 0.61,
  RUB: 0.011,
  CNY: 0.14,
  PLN: 0.25,
};

// Beautiful color palette
const COLORS = {
  primary: [79, 70, 229], // Indigo
  secondary: [99, 102, 241],
  success: [16, 185, 129],
  warning: [245, 158, 11],
  danger: [239, 68, 68],
  muted: [107, 114, 128],
  light: [243, 244, 246],
  dark: [31, 41, 55],
};

interface PDFExportOptions {
  expenses: Expense[];
  currencyIncomes: CurrencyIncome[];
  currencySavings?: CurrencySavings[];
  defaultCurrency: string;
  defaultCurrencySymbol: string;
  monthlyIncome: number;
  startDate?: Date;
  endDate?: Date;
  customCategories?: Array<{ id: string; label: string; icon: string; color?: string }>;
  purposeName?: string;
  scope?: "month" | "year" | "purpose";
  selectedMonth?: number;
  selectedYear?: number;
}

const getCurrencySymbol = (code: string): string => {
  return CURRENCIES.find(c => c.code === code)?.symbol || code;
};

const getCategoryLabel = (categoryId: string, customCategories?: Array<{ id: string; label: string }>): string => {
  const builtIn = CATEGORIES.find(c => c.id === categoryId);
  if (builtIn) return builtIn.label;
  const custom = customCategories?.find(c => c.id === categoryId);
  return custom?.label || categoryId;
};

const getCategoryColor = (categoryId: string): number[] => {
  const colorMap: Record<string, number[]> = {
    food: [249, 115, 22],
    transport: [59, 130, 246],
    shopping: [168, 85, 247],
    bills: [234, 179, 8],
    medical: [239, 68, 68],
    subscriptions: [139, 92, 246],
    education: [20, 184, 166],
    tax: [180, 83, 9],
    liabilities: [236, 72, 153],
    investments: [34, 197, 94],
    misc: [107, 114, 128],
  };
  return colorMap[categoryId] || COLORS.muted;
};

const convertToDefaultCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  const rateFromUSD = EXCHANGE_RATES_TO_USD[fromCurrency] || 1;
  const rateToUSD = EXCHANGE_RATES_TO_USD[toCurrency] || 1;
  const amountInUSD = amount * rateFromUSD;
  return amountInUSD / rateToUSD;
};

export const exportToPDF = async (options: PDFExportOptions): Promise<boolean> => {
  const {
    expenses,
    currencyIncomes,
    currencySavings = [],
    defaultCurrency,
    defaultCurrencySymbol,
    monthlyIncome,
    startDate,
    endDate,
    customCategories,
    purposeName,
    scope,
    selectedMonth,
    selectedYear,
  } = options;

  // Filter expenses by date range if provided
  let filteredExpenses = expenses;
  if (startDate) {
    filteredExpenses = filteredExpenses.filter(e => new Date(e.date) >= startDate);
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filteredExpenses = filteredExpenses.filter(e => new Date(e.date) <= end);
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 0;

  // Helper functions
  const setColor = (color: number[]) => {
    doc.setTextColor(color[0], color[1], color[2]);
  };

  const setFillColor = (color: number[]) => {
    doc.setFillColor(color[0], color[1], color[2]);
  };

  const checkNewPage = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 30) {
      doc.addPage();
      y = 25;
    }
  };

  const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number, color: number[]) => {
    setFillColor(color);
    doc.roundedRect(x, y, w, h, r, r, 'F');
  };

  // ============== HEADER ==============
  // Header background
  setFillColor(COLORS.primary);
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Gradient overlay effect (simulated with lighter rect)
  setFillColor([99, 102, 241]);
  doc.rect(0, 0, pageWidth, 25, 'F');

  // Title
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("MEET", 20, 28);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Expense Report", 20, 38);

  // Report info box
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255, 0.9);
  
  let reportTitle = "";
  if (scope === "month" && selectedMonth !== undefined && selectedYear) {
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    reportTitle = `${monthNames[selectedMonth]} ${selectedYear}`;
  } else if (scope === "year" && selectedYear) {
    reportTitle = `Year ${selectedYear}`;
  } else if (scope === "purpose" && purposeName) {
    reportTitle = `Purpose: ${purposeName}`;
  } else if (startDate && endDate) {
    reportTitle = `${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}`;
  } else {
    reportTitle = `Generated: ${format(new Date(), "MMMM dd, yyyy")}`;
  }

  doc.text(reportTitle, pageWidth - 20, 28, { align: "right" });
  doc.text(`${filteredExpenses.length} transactions`, pageWidth - 20, 38, { align: "right" });

  y = 65;

  // Group expenses by currency (keep original currency)
  const expensesByCurrency: Record<string, { total: number; count: number; expenses: Expense[] }> = {};
  filteredExpenses.forEach(exp => {
    const currency = exp.currency || defaultCurrency;
    if (!expensesByCurrency[currency]) {
      expensesByCurrency[currency] = { total: 0, count: 0, expenses: [] };
    }
    expensesByCurrency[currency].total += exp.amount;
    expensesByCurrency[currency].count += 1;
    expensesByCurrency[currency].expenses.push(exp);
  });

  // Group incomes by currency
  const incomesByCurrency: Record<string, number> = {};
  if (monthlyIncome > 0) {
    incomesByCurrency[defaultCurrency] = monthlyIncome;
  }
  currencyIncomes.forEach(income => {
    incomesByCurrency[income.currency] = (incomesByCurrency[income.currency] || 0) + income.amount;
  });

  // Get savings by currency
  const savingsByCurrency: Record<string, number> = {};
  currencySavings.forEach(saving => {
    savingsByCurrency[saving.currency] = saving.amount;
  });

  const expenseCurrencies = Object.keys(expensesByCurrency);

  // ============== SUMMARY CARDS ==============
  const cardWidth = (pageWidth - 50) / 3;
  
  // Total Expenses Card
  let totalExpenseDisplay = "";
  if (expenseCurrencies.length === 1) {
    const currency = expenseCurrencies[0];
    const symbol = getCurrencySymbol(currency);
    totalExpenseDisplay = `${symbol}${expensesByCurrency[currency].total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    totalExpenseDisplay = expenseCurrencies.map(curr => {
      const symbol = getCurrencySymbol(curr);
      return `${symbol}${expensesByCurrency[curr].total.toFixed(0)}`;
    }).join(" | ");
  }

  drawRoundedRect(15, y, cardWidth, 35, 3, [254, 226, 226]);
  setColor(COLORS.danger);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Total Expenses", 20, y + 12);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(totalExpenseDisplay.length > 20 ? totalExpenseDisplay.substring(0, 18) + "..." : totalExpenseDisplay, 20, y + 25);

  // Transactions Card
  drawRoundedRect(20 + cardWidth, y, cardWidth, 35, 3, [219, 234, 254]);
  setColor(COLORS.secondary);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Transactions", 25 + cardWidth, y + 12);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(filteredExpenses.length.toString(), 25 + cardWidth, y + 25);

  // Categories Card
  const uniqueCategories = new Set(filteredExpenses.map(e => e.category)).size;
  drawRoundedRect(25 + cardWidth * 2, y, cardWidth, 35, 3, [220, 252, 231]);
  setColor(COLORS.success);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Categories", 30 + cardWidth * 2, y + 12);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(uniqueCategories.toString(), 30 + cardWidth * 2, y + 25);

  y += 50;

  // ============== EXPENSES BY CURRENCY (in original currency) ==============
  checkNewPage(60);
  
  setColor(COLORS.dark);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Expenses by Currency", 15, y);
  y += 10;

  expenseCurrencies.forEach((currency, idx) => {
    checkNewPage(20);
    const data = expensesByCurrency[currency];
    const symbol = getCurrencySymbol(currency);
    
    // Currency row with background
    if (idx % 2 === 0) {
      drawRoundedRect(15, y - 4, pageWidth - 30, 14, 2, COLORS.light);
    }
    
    setColor(COLORS.dark);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${currency}`, 20, y + 4);
    
    doc.setFont("helvetica", "normal");
    setColor(COLORS.muted);
    doc.text(`${data.count} transactions`, 50, y + 4);
    
    setColor(COLORS.danger);
    doc.setFont("helvetica", "bold");
    doc.text(`${symbol}${data.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 20, y + 4, { align: "right" });
    
    y += 14;
  });

  y += 15;

  // ============== CATEGORY BREAKDOWN BY CURRENCY ==============
  expenseCurrencies.forEach(currency => {
    checkNewPage(80);
    const data = expensesByCurrency[currency];
    const symbol = getCurrencySymbol(currency);

    // Section header with accent bar
    setFillColor(COLORS.primary);
    doc.rect(15, y, 4, 20, 'F');
    
    setColor(COLORS.dark);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Category Breakdown - ${currency}`, 24, y + 8);
    
    setColor(COLORS.muted);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Total: ${symbol}${data.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 24, y + 16);
    
    y += 28;

    // Group by category
    const categoryTotals: Record<string, number> = {};
    data.expenses.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    const sortedCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1]);

    // Draw category bars
    sortedCategories.forEach(([catId, total]) => {
      checkNewPage(16);
      const label = getCategoryLabel(catId, customCategories);
      const percentage = (total / data.total) * 100;
      const barWidth = Math.max(percentage * 1.2, 5);
      const catColor = getCategoryColor(catId);

      // Category name
      setColor(COLORS.dark);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(label, 20, y + 4);

      // Progress bar background
      drawRoundedRect(65, y, 80, 6, 2, COLORS.light);
      
      // Progress bar fill
      drawRoundedRect(65, y, Math.min(barWidth, 80), 6, 2, catColor);

      // Amount and percentage
      setColor(COLORS.dark);
      doc.setFont("helvetica", "bold");
      doc.text(`${symbol}${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 150, y + 4);
      
      setColor(COLORS.muted);
      doc.setFont("helvetica", "normal");
      doc.text(`${percentage.toFixed(1)}%`, pageWidth - 20, y + 4, { align: "right" });

      y += 12;
    });

    y += 10;
  });

  // ============== SAVINGS SUMMARY ==============
  checkNewPage(60);
  
  setFillColor(COLORS.success);
  doc.rect(15, y, 4, 20, 'F');
  
  setColor(COLORS.dark);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Savings Summary", 24, y + 12);
  y += 28;

  const allCurrencies = new Set([...Object.keys(incomesByCurrency), ...expenseCurrencies, ...Object.keys(savingsByCurrency)]);
  
  // Table header
  drawRoundedRect(15, y - 4, pageWidth - 30, 14, 2, COLORS.primary);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Currency", 20, y + 4);
  doc.text("Base Savings", 60, y + 4);
  doc.text("Expenses", 105, y + 4);
  doc.text("Net Savings", pageWidth - 20, y + 4, { align: "right" });
  y += 14;

  Array.from(allCurrencies).forEach((currency, idx) => {
    checkNewPage(14);
    const baseSavings = savingsByCurrency[currency] || 0;
    const expense = expensesByCurrency[currency]?.total || 0;
    const netSavings = baseSavings - expense;
    const symbol = getCurrencySymbol(currency);

    if (idx % 2 === 0) {
      drawRoundedRect(15, y - 4, pageWidth - 30, 12, 2, COLORS.light);
    }

    setColor(COLORS.dark);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(currency, 20, y + 3);
    
    doc.setFont("helvetica", "normal");
    setColor(COLORS.muted);
    doc.text(`${symbol}${baseSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 60, y + 3);
    
    setColor(COLORS.danger);
    doc.text(`${symbol}${expense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 105, y + 3);
    
    if (netSavings >= 0) {
      setColor(COLORS.success);
    } else {
      setColor(COLORS.danger);
    }
    doc.setFont("helvetica", "bold");
    doc.text(`${netSavings >= 0 ? '+' : ''}${symbol}${netSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 20, y + 3, { align: "right" });

    y += 12;
  });

  y += 15;

  // ============== EXPENSE DETAILS ==============
  expenseCurrencies.forEach(currency => {
    checkNewPage(50);
    const data = expensesByCurrency[currency];
    const symbol = getCurrencySymbol(currency);

    // Section header
    setFillColor(COLORS.secondary);
    doc.rect(15, y, 4, 16, 'F');
    
    setColor(COLORS.dark);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Transaction Details - ${currency}`, 24, y + 10);
    y += 24;

    // Table header
    drawRoundedRect(15, y - 4, pageWidth - 30, 12, 2, COLORS.dark);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Date", 18, y + 3);
    doc.text("Category", 45, y + 3);
    doc.text("Notes", 90, y + 3);
    doc.text("Amount", pageWidth - 18, y + 3, { align: "right" });
    y += 12;

    // Sort expenses by date (newest first)
    const sortedExpenses = [...data.expenses].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    sortedExpenses.slice(0, 50).forEach((exp, idx) => {
      checkNewPage(10);
      
      if (idx % 2 === 0) {
        drawRoundedRect(15, y - 3, pageWidth - 30, 9, 1, COLORS.light);
      }

      const dateStr = format(new Date(exp.date), "MMM dd");
      const categoryLabel = getCategoryLabel(exp.category, customCategories);
      const notesStr = (exp.notes || "-").substring(0, 25);

      setColor(COLORS.muted);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(dateStr, 18, y + 2);
      
      setColor(COLORS.dark);
      doc.text(categoryLabel.substring(0, 12), 45, y + 2);
      
      setColor(COLORS.muted);
      doc.text(notesStr, 90, y + 2);
      
      setColor(COLORS.danger);
      doc.setFont("helvetica", "bold");
      doc.text(`${symbol}${exp.amount.toFixed(2)}`, pageWidth - 18, y + 2, { align: "right" });

      y += 9;
    });

    if (sortedExpenses.length > 50) {
      setColor(COLORS.muted);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(`... and ${sortedExpenses.length - 50} more transactions`, 18, y + 5);
      y += 10;
    }

    y += 15;
  });

  // ============== FOOTER ==============
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
    
    // Footer text
    setColor(COLORS.muted);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Generated by MEET - Monthly Expense Entry & Tracking", 15, pageHeight - 8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 15, pageHeight - 8, { align: "right" });
  }

  // Generate PDF blob
  const pdfBlob = doc.output("blob");
  const pdfBase64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(",")[1]);
    };
    reader.readAsDataURL(pdfBlob);
  });

  let filename = "meet-expense-report";
  if (scope === "month" && selectedMonth !== undefined && selectedYear) {
    filename = `meet-report-${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  } else if (scope === "year" && selectedYear) {
    filename = `meet-report-${selectedYear}`;
  } else if (purposeName) {
    filename = `meet-report-${purposeName.toLowerCase().replace(/\s+/g, '-')}`;
  } else if (startDate && endDate) {
    filename = `meet-report-${format(startDate, "yyyy-MM-dd")}_to_${format(endDate, "yyyy-MM-dd")}`;
  } else {
    filename = `meet-report-${format(new Date(), "yyyy-MM-dd")}`;
  }

  return exportFile({
    filename: `${filename}.pdf`,
    content: pdfBase64,
    mimeType: "application/pdf",
  });
};
