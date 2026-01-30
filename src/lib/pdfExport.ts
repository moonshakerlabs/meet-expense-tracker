import { jsPDF } from "jspdf";
import { Expense, CurrencyIncome, CurrencySavings, CURRENCIES, CATEGORIES } from "@/types/expense";
import { format } from "date-fns";
import { exportFile } from "./fileExport";

// Premium color palette - muted, professional
const COLORS = {
  primary: [55, 65, 81],      // Charcoal gray
  accent: [79, 70, 229],      // Indigo accent
  success: [16, 185, 129],    // Green
  danger: [220, 38, 38],      // Red
  muted: [156, 163, 175],     // Light gray
  light: [249, 250, 251],     // Off-white
  dark: [17, 24, 39],         // Near black
  divider: [229, 231, 235],   // Border gray
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

export const exportToPDF = async (options: PDFExportOptions): Promise<boolean> => {
  const {
    expenses,
    currencyIncomes,
    currencySavings = [],
    defaultCurrency,
    monthlyIncome,
    startDate,
    endDate,
    customCategories,
    purposeName,
    scope,
    selectedMonth,
    selectedYear,
  } = options;

  // Filter expenses by date range
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
  const margin = 20;
  let y = 0;

  // Helper functions
  const setColor = (color: number[]) => doc.setTextColor(color[0], color[1], color[2]);
  const setFillColor = (color: number[]) => doc.setFillColor(color[0], color[1], color[2]);
  
  const checkNewPage = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 40) {
      doc.addPage();
      y = 30;
    }
  };

  const drawDivider = (yPos: number) => {
    doc.setDrawColor(COLORS.divider[0], COLORS.divider[1], COLORS.divider[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
  };

  // Calculate report metadata
  let reportTitle = "Expense Report";
  let reportPeriod = "";
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  if (scope === "month" && selectedMonth !== undefined && selectedYear) {
    reportTitle = "Monthly Expense Report";
    reportPeriod = `${monthNames[selectedMonth]} ${selectedYear}`;
  } else if (scope === "year" && selectedYear) {
    reportTitle = "Annual Expense Report";
    reportPeriod = `${selectedYear}`;
  } else if (scope === "purpose" && purposeName) {
    reportTitle = "Purpose-Based Report";
    reportPeriod = purposeName;
  } else if (startDate && endDate) {
    reportPeriod = `${format(startDate, "MMM dd, yyyy")} – ${format(endDate, "MMM dd, yyyy")}`;
  } else {
    reportPeriod = format(new Date(), "MMMM yyyy");
  }

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

  const expenseCurrencies = Object.keys(expensesByCurrency);
  const uniqueCategories = new Set(filteredExpenses.map(e => e.category)).size;

  // Group incomes and savings by currency
  const incomesByCurrency: Record<string, number> = {};
  if (monthlyIncome > 0) {
    incomesByCurrency[defaultCurrency] = monthlyIncome;
  }
  currencyIncomes.forEach(income => {
    incomesByCurrency[income.currency] = (incomesByCurrency[income.currency] || 0) + income.amount;
  });

  const savingsByCurrency: Record<string, number> = {};
  currencySavings.forEach(saving => {
    savingsByCurrency[saving.currency] = saving.amount;
  });

  // ============== COVER PAGE ==============
  y = pageHeight / 2 - 60;

  // App name
  setColor(COLORS.accent);
  doc.setFontSize(48);
  doc.setFont("helvetica", "bold");
  doc.text("MEET", pageWidth / 2, y, { align: "center" });
  
  // Tagline
  y += 12;
  setColor(COLORS.muted);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Monthly Expense Entry & Tracking", pageWidth / 2, y, { align: "center" });

  // Divider
  y += 20;
  doc.setDrawColor(COLORS.divider[0], COLORS.divider[1], COLORS.divider[2]);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 40, y, pageWidth / 2 + 40, y);

  // Report title
  y += 25;
  setColor(COLORS.dark);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(reportTitle, pageWidth / 2, y, { align: "center" });

  // Period
  y += 12;
  setColor(COLORS.primary);
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(reportPeriod, pageWidth / 2, y, { align: "center" });

  // Total expenses highlight
  y += 35;
  setColor(COLORS.muted);
  doc.setFontSize(10);
  doc.text("TOTAL EXPENSES", pageWidth / 2, y, { align: "center" });
  
  y += 15;
  let totalDisplay = "";
  if (expenseCurrencies.length === 1) {
    const currency = expenseCurrencies[0];
    const symbol = getCurrencySymbol(currency);
    totalDisplay = `${symbol}${expensesByCurrency[currency].total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (expenseCurrencies.length > 1) {
    totalDisplay = expenseCurrencies.map(curr => {
      const symbol = getCurrencySymbol(curr);
      return `${symbol}${expensesByCurrency[curr].total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }).join("  •  ");
  } else {
    totalDisplay = "No expenses";
  }
  
  setColor(COLORS.dark);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text(totalDisplay, pageWidth / 2, y, { align: "center" });

  // Summary stats
  y += 30;
  setColor(COLORS.muted);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const statsLine = `${filteredExpenses.length} transactions  •  ${uniqueCategories} categories  •  ${expenseCurrencies.length || 1} ${expenseCurrencies.length === 1 ? 'currency' : 'currencies'}`;
  doc.text(statsLine, pageWidth / 2, y, { align: "center" });

  // Generation date at bottom
  setColor(COLORS.muted);
  doc.setFontSize(9);
  doc.text(`Generated on ${format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}`, pageWidth / 2, pageHeight - 30, { align: "center" });

  // ============== PAGE 2: EXPENSE SUMMARY ==============
  doc.addPage();
  y = 30;

  // Section header
  setColor(COLORS.dark);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Expense Summary", margin, y);
  
  y += 8;
  drawDivider(y);
  y += 20;

  // Currency cards
  if (expenseCurrencies.length === 0) {
    setColor(COLORS.muted);
    doc.setFontSize(12);
    doc.setFont("helvetica", "italic");
    doc.text("No expenses recorded for this period.", margin, y);
    y += 20;
  } else {
    expenseCurrencies.forEach((currency, idx) => {
      checkNewPage(50);
      const data = expensesByCurrency[currency];
      const symbol = getCurrencySymbol(currency);

      // Card background
      setFillColor(COLORS.light);
      doc.roundedRect(margin, y - 5, pageWidth - margin * 2, 40, 3, 3, 'F');

      // Currency code
      setColor(COLORS.accent);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(currency, margin + 10, y + 8);

      // Amount
      setColor(COLORS.dark);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(`${symbol}${data.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin + 10, y + 26);

      // Transaction count
      setColor(COLORS.muted);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`${data.count} transaction${data.count !== 1 ? 's' : ''}`, pageWidth - margin - 10, y + 20, { align: "right" });

      y += 50;
    });
  }

  // ============== CATEGORY BREAKDOWN ==============
  expenseCurrencies.forEach(currency => {
    checkNewPage(80);
    const data = expensesByCurrency[currency];
    const symbol = getCurrencySymbol(currency);

    y += 10;
    
    // Section header
    setColor(COLORS.dark);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Spending by Category`, margin, y);
    
    setColor(COLORS.muted);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${currency}`, margin + 75, y);

    y += 6;
    drawDivider(y);
    y += 15;

    // Group by category and sort by amount
    const categoryTotals: Record<string, number> = {};
    data.expenses.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    const sortedCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1]);

    sortedCategories.forEach(([catId, total]) => {
      checkNewPage(18);
      const label = getCategoryLabel(catId, customCategories);
      const percentage = (total / data.total) * 100;

      // Category row
      setColor(COLORS.dark);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(label, margin + 5, y + 4);

      // Amount aligned right
      doc.setFont("helvetica", "bold");
      const amountText = `${symbol}${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      doc.text(amountText, pageWidth - margin - 40, y + 4, { align: "right" });

      // Percentage
      setColor(COLORS.muted);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`${percentage.toFixed(1)}%`, pageWidth - margin - 5, y + 4, { align: "right" });

      // Subtle separator
      y += 10;
      doc.setDrawColor(COLORS.divider[0], COLORS.divider[1], COLORS.divider[2]);
      doc.setLineWidth(0.2);
      doc.line(margin + 5, y, pageWidth - margin - 5, y);
      
      y += 8;
    });

    y += 10;
  });

  // ============== SAVINGS SUMMARY ==============
  // Only show currencies that have actual savings data
  const currenciesWithSavings = Object.keys(savingsByCurrency).filter(c => savingsByCurrency[c] !== undefined);
  
  if (currenciesWithSavings.length > 0) {
    checkNewPage(80);
    y += 10;

    setColor(COLORS.dark);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Savings Overview", margin, y);

    y += 6;
    drawDivider(y);
    y += 20;

    // Table header
    setColor(COLORS.muted);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("CURRENCY", margin + 5, y);
    doc.text("EXPENSES", 90, y);
    doc.text("NET SAVINGS", pageWidth - margin - 5, y, { align: "right" });
    
    y += 12;

    currenciesWithSavings.forEach((currency) => {
      checkNewPage(20);
      const baseSavings = savingsByCurrency[currency] || 0;
      const income = incomesByCurrency[currency] || 0;
      const expense = expensesByCurrency[currency]?.total || 0;
      const netSavings = baseSavings + income - expense;
      const symbol = getCurrencySymbol(currency);

      // Alternating row background
      setFillColor(COLORS.light);
      doc.roundedRect(margin, y - 5, pageWidth - margin * 2, 16, 2, 2, 'F');

      // Currency
      setColor(COLORS.dark);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(currency, margin + 5, y + 4);

      // Expenses
      setColor(COLORS.danger);
      doc.setFont("helvetica", "normal");
      doc.text(`-${symbol}${expense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 90, y + 4);

      // Net Savings
      if (netSavings >= 0) {
        setColor(COLORS.success);
      } else {
        setColor(COLORS.danger);
      }
      doc.setFont("helvetica", "bold");
      doc.text(`${netSavings >= 0 ? '+' : ''}${symbol}${netSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 5, y + 4, { align: "right" });

      y += 20;
    });
  }

  // ============== TRANSACTION DETAILS ==============
  expenseCurrencies.forEach(currency => {
    checkNewPage(60);
    const data = expensesByCurrency[currency];
    const symbol = getCurrencySymbol(currency);

    doc.addPage();
    y = 30;

    // Section header
    setColor(COLORS.dark);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Transaction Details`, margin, y);
    
    setColor(COLORS.muted);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${currency} • ${data.count} transactions`, margin + 80, y);

    y += 6;
    drawDivider(y);
    y += 15;

    // Table header
    setFillColor(COLORS.light);
    doc.roundedRect(margin, y - 5, pageWidth - margin * 2, 14, 2, 2, 'F');
    
    setColor(COLORS.muted);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("DATE", margin + 5, y + 4);
    doc.text("CATEGORY", 55, y + 4);
    doc.text("NOTES", 100, y + 4);
    doc.text("AMOUNT", pageWidth - margin - 5, y + 4, { align: "right" });
    
    y += 16;

    // Sort expenses by date (newest first)
    const sortedExpenses = [...data.expenses].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    sortedExpenses.forEach((exp, idx) => {
      checkNewPage(14);
      
      const dateStr = format(new Date(exp.date), "MMM dd");
      const categoryLabel = getCategoryLabel(exp.category, customCategories);
      const notesStr = (exp.notes || "—").substring(0, 30);

      // Alternating subtle background
      if (idx % 2 === 0) {
        setFillColor([254, 254, 254]);
      } else {
        setFillColor(COLORS.light);
      }
      doc.roundedRect(margin, y - 4, pageWidth - margin * 2, 12, 1, 1, 'F');

      setColor(COLORS.muted);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(dateStr, margin + 5, y + 3);
      
      setColor(COLORS.dark);
      doc.setFontSize(9);
      doc.text(categoryLabel.substring(0, 15), 55, y + 3);
      
      setColor(COLORS.muted);
      doc.text(notesStr, 100, y + 3);
      
      setColor(COLORS.dark);
      doc.setFont("helvetica", "bold");
      doc.text(`${symbol}${exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 5, y + 3, { align: "right" });

      y += 12;
    });
  });

  // ============== FOOTER ON ALL PAGES ==============
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer divider
    doc.setDrawColor(COLORS.divider[0], COLORS.divider[1], COLORS.divider[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
    
    // Footer text
    setColor(COLORS.muted);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    
    // Left: Generated by
    doc.text("Generated by MEET", margin, pageHeight - 10);
    
    // Center: Report type
    let reportType = "";
    if (scope === "month") reportType = "Monthly Report";
    else if (scope === "year") reportType = "Annual Report";
    else if (scope === "purpose") reportType = "Purpose Report";
    else reportType = "Expense Report";
    doc.text(reportType, pageWidth / 2, pageHeight - 10, { align: "center" });
    
    // Right: Page number
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: "right" });
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
