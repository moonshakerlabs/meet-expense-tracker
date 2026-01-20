import { jsPDF } from "jspdf";
import { Expense, CurrencyIncome, CURRENCIES, CATEGORIES } from "@/types/expense";
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

interface PDFExportOptions {
  expenses: Expense[];
  currencyIncomes: CurrencyIncome[];
  defaultCurrency: string;
  defaultCurrencySymbol: string;
  monthlyIncome: number;
  startDate?: Date;
  endDate?: Date;
  customCategories?: Array<{ id: string; label: string; icon: string; color?: string }>;
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

const convertToDefaultCurrency = (amount: number, fromCurrency: string, toCurrency: string): number => {
  // First convert to USD
  const rateFromUSD = EXCHANGE_RATES_TO_USD[fromCurrency] || 1;
  const rateToUSD = EXCHANGE_RATES_TO_USD[toCurrency] || 1;
  
  // Convert: fromCurrency -> USD -> toCurrency
  const amountInUSD = amount * rateFromUSD;
  const amountInTarget = amountInUSD / rateToUSD;
  
  return amountInTarget;
};

export const exportToPDF = async (options: PDFExportOptions): Promise<boolean> => {
  const {
    expenses,
    currencyIncomes,
    defaultCurrency,
    defaultCurrencySymbol,
    monthlyIncome,
    startDate,
    endDate,
    customCategories,
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
  let y = 20;

  // Helper function to add a new page if needed
  const checkNewPage = (neededHeight: number) => {
    if (y + neededHeight > 270) {
      doc.addPage();
      y = 20;
    }
  };

  // Title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("MEET - Expense Report", pageWidth / 2, y, { align: "center" });
  y += 10;

  // Date range
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const dateRangeText = startDate && endDate
    ? `${format(startDate, "MMM dd, yyyy")} - ${format(endDate, "MMM dd, yyyy")}`
    : `Generated on ${format(new Date(), "MMM dd, yyyy")}`;
  doc.text(dateRangeText, pageWidth / 2, y, { align: "center" });
  y += 15;

  // Group expenses by currency
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

  // ============== SECTION 1: Income by Currency ==============
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Income by Currency", 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const incomeCurrencies = Object.keys(incomesByCurrency);
  if (incomeCurrencies.length === 0) {
    doc.text("No income configured", 14, y);
    y += 6;
  } else {
    incomeCurrencies.forEach(currency => {
      const symbol = getCurrencySymbol(currency);
      const amount = incomesByCurrency[currency];
      doc.text(`${symbol} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${currency})`, 14, y);
      y += 6;
    });
  }
  y += 10;

  // ============== SECTION 2: Expenses by Currency ==============
  checkNewPage(30);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Expenses by Currency", 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const expenseCurrencies = Object.keys(expensesByCurrency);
  if (expenseCurrencies.length === 0) {
    doc.text("No expenses in selected period", 14, y);
    y += 6;
  } else {
    expenseCurrencies.forEach(currency => {
      const data = expensesByCurrency[currency];
      const symbol = getCurrencySymbol(currency);
      doc.text(`${symbol} ${data.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${currency}) - ${data.count} transactions`, 14, y);
      y += 6;
    });
  }
  y += 10;

  // ============== SECTION 3: Category Breakdown by Currency ==============
  expenseCurrencies.forEach(currency => {
    checkNewPage(40);
    const data = expensesByCurrency[currency];
    const symbol = getCurrencySymbol(currency);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Category Breakdown - ${currency}`, 14, y);
    y += 8;

    // Group by category
    const categoryTotals: Record<string, number> = {};
    data.expenses.forEach(exp => {
      const cat = exp.category;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.amount;
    });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .forEach(([catId, total]) => {
        checkNewPage(6);
        const label = getCategoryLabel(catId, customCategories);
        const percentage = ((total / data.total) * 100).toFixed(1);
        doc.text(`  ${label}: ${symbol}${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${percentage}%)`, 14, y);
        y += 6;
      });
    y += 8;
  });

  // ============== SECTION 4: Savings by Currency ==============
  checkNewPage(40);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Savings by Currency", 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const allCurrencies = new Set([...incomeCurrencies, ...expenseCurrencies]);
  allCurrencies.forEach(currency => {
    const income = incomesByCurrency[currency] || 0;
    const expense = expensesByCurrency[currency]?.total || 0;
    const savings = income - expense;
    const symbol = getCurrencySymbol(currency);
    const savingsText = savings >= 0
      ? `+${symbol}${savings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `-${symbol}${Math.abs(savings).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    doc.text(`${currency}: Income ${symbol}${income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - Expense ${symbol}${expense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} = ${savingsText}`, 14, y);
    y += 6;
  });
  y += 15;

  // ============== SECTION 5: Converted Summary in Default Currency ==============
  checkNewPage(60);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Summary in ${defaultCurrency} (Converted)`, 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  // Calculate total income in default currency
  let totalIncomeConverted = 0;
  incomeCurrencies.forEach(currency => {
    const amount = incomesByCurrency[currency];
    totalIncomeConverted += convertToDefaultCurrency(amount, currency, defaultCurrency);
  });

  // Calculate total expense in default currency
  let totalExpenseConverted = 0;
  expenseCurrencies.forEach(currency => {
    const amount = expensesByCurrency[currency].total;
    totalExpenseConverted += convertToDefaultCurrency(amount, currency, defaultCurrency);
  });

  const totalSavingsConverted = totalIncomeConverted - totalExpenseConverted;

  doc.text(`Total Income: ${defaultCurrencySymbol}${totalIncomeConverted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, y);
  y += 6;
  doc.text(`Total Expenses: ${defaultCurrencySymbol}${totalExpenseConverted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, y);
  y += 6;
  
  doc.setFont("helvetica", "bold");
  const savingsLabel = totalSavingsConverted >= 0 ? "Net Savings" : "Net Deficit";
  doc.text(`${savingsLabel}: ${defaultCurrencySymbol}${Math.abs(totalSavingsConverted).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${totalSavingsConverted < 0 ? ' (negative)' : ''}`, 14, y);
  y += 10;

  // Currency conversion note
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("Note: Currency conversions use approximate exchange rates.", 14, y);
  y += 15;

  // ============== SECTION 6: Expense Details by Currency ==============
  expenseCurrencies.forEach(currency => {
    checkNewPage(40);
    const data = expensesByCurrency[currency];
    const symbol = getCurrencySymbol(currency);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Expense Details - ${currency}`, 14, y);
    y += 8;

    // Table header
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Date", 14, y);
    doc.text("Category", 50, y);
    doc.text("Amount", 100, y);
    doc.text("Notes", 130, y);
    y += 6;

    // Draw line
    doc.setLineWidth(0.2);
    doc.line(14, y - 2, pageWidth - 14, y - 2);

    doc.setFont("helvetica", "normal");
    
    // Sort expenses by date (newest first)
    const sortedExpenses = [...data.expenses].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    sortedExpenses.forEach(exp => {
      checkNewPage(6);
      const dateStr = format(new Date(exp.date), "MMM dd, yy");
      const categoryLabel = getCategoryLabel(exp.category, customCategories);
      const amountStr = `${symbol}${exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      const notesStr = (exp.notes || "").substring(0, 30);

      doc.text(dateStr, 14, y);
      doc.text(categoryLabel.substring(0, 15), 50, y);
      doc.text(amountStr, 100, y);
      doc.text(notesStr, 130, y);
      y += 5;
    });
    y += 10;
  });

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Generated by MEET - Monthly Expense Entry & Tracking", pageWidth / 2, 285, { align: "center" });

  // Generate PDF blob
  const pdfBlob = doc.output("blob");
  const pdfBase64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix
      resolve(base64.split(",")[1]);
    };
    reader.readAsDataURL(pdfBlob);
  });

  const dateStr = startDate && endDate
    ? `${format(startDate, "yyyy-MM-dd")}_to_${format(endDate, "yyyy-MM-dd")}`
    : format(new Date(), "yyyy-MM-dd");

  return exportFile({
    filename: `meet-expense-report-${dateStr}.pdf`,
    content: pdfBase64,
    mimeType: "application/pdf",
  });
};
