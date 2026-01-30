import { jsPDF } from "jspdf";
import { Expense, CurrencyIncome, CurrencySavings, CURRENCIES, CATEGORIES } from "@/types/expense";
import { format } from "date-fns";
import { exportFile } from "./fileExport";

// Color themes - all with high contrast
export type PDFColorTheme = "green" | "blue" | "black" | "mixed";
export type PDFOrientation = "portrait" | "landscape";

export interface PDFOptions {
  includePieChart: boolean;
  includeBarChart: boolean;
  currencyFilter: "all" | string;
  colorTheme: PDFColorTheme;
  orientation: PDFOrientation;
}

// Color palettes by theme
const getColors = (theme: PDFColorTheme) => {
  const base = {
    text: [0, 0, 0] as number[],           // Pure black for primary text
    secondary: [55, 65, 81] as number[],    // Dark charcoal for secondary
    light: [249, 250, 251] as number[],     // Off-white backgrounds
    divider: [209, 213, 219] as number[],   // Subtle dividers
    danger: [185, 28, 28] as number[],      // Dark red
  };

  switch (theme) {
    case "green":
      return {
        ...base,
        accent: [5, 150, 105] as number[],     // Emerald green
        accentLight: [209, 250, 229] as number[], // Light emerald
        success: [5, 150, 105] as number[],
      };
    case "blue":
      return {
        ...base,
        accent: [29, 78, 216] as number[],     // Blue
        accentLight: [219, 234, 254] as number[],
        success: [29, 78, 216] as number[],
      };
    case "black":
      return {
        ...base,
        accent: [0, 0, 0] as number[],         // Black
        accentLight: [243, 244, 246] as number[],
        success: [22, 163, 74] as number[],
      };
    case "mixed":
    default:
      return {
        ...base,
        accent: [5, 150, 105] as number[],     // Emerald primary
        accentLight: [209, 250, 229] as number[],
        success: [22, 163, 74] as number[],
      };
  }
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
  pdfOptions?: PDFOptions;
}

// Map currency codes to their symbols, with fallback to code if symbol might not render
const CURRENCY_DISPLAY: Record<string, { symbol: string; useCode: boolean }> = {
  INR: { symbol: "₹", useCode: true },  // Use INR code as fallback
  USD: { symbol: "$", useCode: false },
  EUR: { symbol: "€", useCode: false },
  GBP: { symbol: "£", useCode: false },
  JPY: { symbol: "¥", useCode: false },
  CNY: { symbol: "¥", useCode: true },
  KRW: { symbol: "₩", useCode: true },
  THB: { symbol: "฿", useCode: true },
  VND: { symbol: "₫", useCode: true },
  PHP: { symbol: "₱", useCode: true },
  IDR: { symbol: "Rp", useCode: false },
  MYR: { symbol: "RM", useCode: false },
  SGD: { symbol: "S$", useCode: false },
  AUD: { symbol: "A$", useCode: false },
  CAD: { symbol: "C$", useCode: false },
  CHF: { symbol: "CHF", useCode: false },
  RUB: { symbol: "₽", useCode: true },
  BRL: { symbol: "R$", useCode: false },
  MXN: { symbol: "MX$", useCode: false },
  ZAR: { symbol: "R", useCode: false },
  AED: { symbol: "AED", useCode: false },
  SAR: { symbol: "SAR", useCode: false },
  TRY: { symbol: "₺", useCode: true },
  PLN: { symbol: "zł", useCode: true },
  SEK: { symbol: "kr", useCode: false },
  NOK: { symbol: "kr", useCode: false },
  DKK: { symbol: "kr", useCode: false },
  HKD: { symbol: "HK$", useCode: false },
  TWD: { symbol: "NT$", useCode: false },
  NZD: { symbol: "NZ$", useCode: false },
};

const getSafeCurrencyDisplay = (code: string): string => {
  const display = CURRENCY_DISPLAY[code];
  if (display) {
    // For currencies that might have rendering issues, use code
    return display.useCode ? code : display.symbol;
  }
  // Fallback to code from CURRENCIES list or just the code itself
  const found = CURRENCIES.find(c => c.code === code);
  // Check if symbol contains special characters that might not render
  if (found?.symbol && /^[A-Za-z$€£¥₩]+$/.test(found.symbol)) {
    return found.symbol;
  }
  return code;
};

const getCategoryLabel = (categoryId: string, customCategories?: Array<{ id: string; label: string }>): string => {
  const builtIn = CATEGORIES.find(c => c.id === categoryId);
  if (builtIn) return builtIn.label;
  const custom = customCategories?.find(c => c.id === categoryId);
  return custom?.label || categoryId;
};

// Generate PDF and return as base64 for preview or download
export const generatePDFData = async (options: PDFExportOptions): Promise<string> => {
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
    pdfOptions = {
      includePieChart: true,
      includeBarChart: true,
      currencyFilter: "all",
      colorTheme: "green",
      orientation: "portrait",
    },
  } = options;

  const COLORS = getColors(pdfOptions.colorTheme);
  const isLandscape = pdfOptions.orientation === "landscape";

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

  // Apply currency filter
  if (pdfOptions.currencyFilter !== "all") {
    filteredExpenses = filteredExpenses.filter(e => 
      (e.currency || defaultCurrency) === pdfOptions.currencyFilter
    );
  }

  const doc = new jsPDF({
    orientation: isLandscape ? "landscape" : "portrait",
  });
  
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

  const drawDivider = (yPos: number, useAccent = false) => {
    const color = useAccent ? COLORS.accent : COLORS.divider;
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(useAccent ? 0.8 : 0.3);
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
  y = pageHeight / 2 - 50;

  // App name with accent color
  setColor(COLORS.accent);
  doc.setFontSize(36);
  doc.setFont("helvetica", "bold");
  doc.text("MEET", pageWidth / 2, y, { align: "center" });
  
  // Tagline
  y += 10;
  setColor(COLORS.secondary);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Monthly Expense Entry & Tracking", pageWidth / 2, y, { align: "center" });

  // Accent divider
  y += 16;
  setFillColor(COLORS.accent);
  doc.rect(pageWidth / 2 - 30, y, 60, 2, 'F');

  // Report title
  y += 20;
  setColor(COLORS.text);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(reportTitle, pageWidth / 2, y, { align: "center" });

  // Period
  y += 10;
  setColor(COLORS.secondary);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(reportPeriod, pageWidth / 2, y, { align: "center" });

  // Total expenses highlight
  y += 28;
  setColor(COLORS.secondary);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL EXPENSES", pageWidth / 2, y, { align: "center" });
  
  y += 12;
  let totalDisplay = "";
  if (expenseCurrencies.length === 1) {
    const currency = expenseCurrencies[0];
    const symbol = getSafeCurrencyDisplay(currency);
    totalDisplay = `${symbol} ${expensesByCurrency[currency].total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else if (expenseCurrencies.length > 1) {
    totalDisplay = expenseCurrencies.map(curr => {
      const symbol = getSafeCurrencyDisplay(curr);
      return `${symbol} ${expensesByCurrency[curr].total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }).join("  •  ");
  } else {
    totalDisplay = "No expenses";
  }
  
  setColor(COLORS.text);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(totalDisplay, pageWidth / 2, y, { align: "center" });

  // Summary stats
  y += 22;
  setColor(COLORS.secondary);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  
  const statsLine = `${filteredExpenses.length} transactions  •  ${uniqueCategories} categories  •  ${expenseCurrencies.length || 1} ${expenseCurrencies.length === 1 ? 'currency' : 'currencies'}`;
  doc.text(statsLine, pageWidth / 2, y, { align: "center" });

  // Generation date at bottom
  setColor(COLORS.secondary);
  doc.setFontSize(8);
  doc.text(`Generated on ${format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}`, pageWidth / 2, pageHeight - 25, { align: "center" });

  // ============== PAGE 2: EXPENSE SUMMARY ==============
  doc.addPage();
  y = 30;

  // Section header
  setColor(COLORS.text);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Expense Summary", margin, y);
  
  y += 6;
  drawDivider(y, true);
  y += 18;

  // Currency cards
  if (expenseCurrencies.length === 0) {
    setColor(COLORS.secondary);
    doc.setFontSize(11);
    doc.setFont("helvetica", "italic");
    doc.text("No expenses recorded for this period.", margin, y);
    y += 20;
  } else {
    expenseCurrencies.forEach((currency) => {
      checkNewPage(45);
      const data = expensesByCurrency[currency];
      const symbol = getSafeCurrencyDisplay(currency);

      // Card background
      setFillColor(COLORS.accentLight);
      doc.roundedRect(margin, y - 5, pageWidth - margin * 2, 35, 3, 3, 'F');

      // Left accent bar
      setFillColor(COLORS.accent);
      doc.rect(margin, y - 5, 4, 35, 'F');

      // Currency code
      setColor(COLORS.accent);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(currency, margin + 12, y + 6);

      // Amount
      setColor(COLORS.text);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(`${symbol} ${data.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, margin + 12, y + 22);

      // Transaction count
      setColor(COLORS.secondary);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`${data.count} transaction${data.count !== 1 ? 's' : ''}`, pageWidth - margin - 10, y + 15, { align: "right" });

      y += 45;
    });
  }

  // ============== CHARTS SECTION (if enabled) ==============
  if (pdfOptions.includePieChart || pdfOptions.includeBarChart) {
    expenseCurrencies.forEach(currency => {
      const data = expensesByCurrency[currency];
      
      // Get category breakdown
      const categoryTotals: Record<string, number> = {};
      data.expenses.forEach(exp => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
      });
      
      const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8); // Top 8 categories

      if (sortedCategories.length === 0) return;

      checkNewPage(100);
      y += 10;

      // Section header
      setColor(COLORS.text);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Spending Analysis`, margin, y);
      
      setColor(COLORS.secondary);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`${currency}`, margin + 60, y);

      y += 6;
      drawDivider(y);
      y += 18;

      if (pdfOptions.includeBarChart && sortedCategories.length > 0) {
        // Simple horizontal bar chart
        const maxAmount = sortedCategories[0][1];
        const barMaxWidth = (pageWidth - margin * 2) * 0.5;
        
        sortedCategories.forEach(([catId, total], idx) => {
          checkNewPage(16);
          const label = getCategoryLabel(catId, customCategories);
          const barWidth = (total / maxAmount) * barMaxWidth;
          const percentage = (total / data.total) * 100;
          const symbol = getSafeCurrencyDisplay(currency);

          // Category label
          setColor(COLORS.text);
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.text(label.substring(0, 18), margin, y + 3);

          // Bar background
          setFillColor(COLORS.light);
          doc.roundedRect(margin + 60, y - 2, barMaxWidth, 8, 2, 2, 'F');

          // Bar fill - use theme variations for mixed
          let barColor = COLORS.accent;
          if (pdfOptions.colorTheme === "mixed") {
            const mixedColors = [
              [5, 150, 105],    // Emerald
              [59, 130, 246],   // Blue
              [245, 158, 11],   // Amber
              [168, 85, 247],   // Purple
              [239, 68, 68],    // Red
              [20, 184, 166],   // Teal
              [249, 115, 22],   // Orange
              [236, 72, 153],   // Pink
            ];
            barColor = mixedColors[idx % mixedColors.length];
          }
          setFillColor(barColor);
          doc.roundedRect(margin + 60, y - 2, Math.max(barWidth, 4), 8, 2, 2, 'F');

          // Amount and percentage
          setColor(COLORS.secondary);
          doc.setFontSize(8);
          doc.text(`${symbol} ${total.toLocaleString(undefined, { minimumFractionDigits: 0 })} (${percentage.toFixed(1)}%)`, margin + 65 + barMaxWidth, y + 3);

          y += 14;
        });

        y += 10;
      }
    });
  }

  // ============== CATEGORY BREAKDOWN ==============
  expenseCurrencies.forEach(currency => {
    checkNewPage(70);
    const data = expensesByCurrency[currency];
    const symbol = getSafeCurrencyDisplay(currency);

    y += 10;
    
    // Section header
    setColor(COLORS.text);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Category Breakdown`, margin, y);
    
    setColor(COLORS.secondary);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`${currency}`, margin + 65, y);

    y += 6;
    drawDivider(y);
    y += 14;

    // Group by category and sort by amount
    const categoryTotals: Record<string, number> = {};
    data.expenses.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    const sortedCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1]);

    sortedCategories.forEach(([catId, total], idx) => {
      checkNewPage(16);
      const label = getCategoryLabel(catId, customCategories);
      const percentage = (total / data.total) * 100;

      // Alternating background
      if (idx % 2 === 0) {
        setFillColor(COLORS.light);
        doc.rect(margin, y - 4, pageWidth - margin * 2, 12, 'F');
      }

      // Category row
      setColor(COLORS.text);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(label, margin + 5, y + 3);

      // Amount aligned right
      doc.setFont("helvetica", "bold");
      const amountText = `${symbol} ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      doc.text(amountText, pageWidth - margin - 35, y + 3, { align: "right" });

      // Percentage
      setColor(COLORS.secondary);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`${percentage.toFixed(1)}%`, pageWidth - margin - 5, y + 3, { align: "right" });

      y += 12;
    });

    y += 8;
  });

  // ============== SAVINGS SUMMARY ==============
  const currenciesWithSavings = Object.keys(savingsByCurrency).filter(c => savingsByCurrency[c] !== undefined);
  
  if (currenciesWithSavings.length > 0) {
    checkNewPage(70);
    y += 10;

    setColor(COLORS.text);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Savings Overview", margin, y);

    y += 6;
    drawDivider(y, true);
    y += 16;

    // Table header
    setFillColor(COLORS.accent);
    doc.roundedRect(margin, y - 6, pageWidth - margin * 2, 14, 2, 2, 'F');
    
    setColor([255, 255, 255]);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("CURRENCY", margin + 8, y + 2);
    doc.text("EXPENSES", isLandscape ? 130 : 85, y + 2);
    doc.text("NET SAVINGS", pageWidth - margin - 8, y + 2, { align: "right" });
    
    y += 16;

    currenciesWithSavings.forEach((currency, idx) => {
      checkNewPage(18);
      const baseSavings = savingsByCurrency[currency] || 0;
      const income = incomesByCurrency[currency] || 0;
      const expense = expensesByCurrency[currency]?.total || 0;
      const netSavings = baseSavings + income - expense;
      const symbol = getSafeCurrencyDisplay(currency);

      // Alternating row background
      if (idx % 2 === 0) {
        setFillColor(COLORS.light);
        doc.roundedRect(margin, y - 5, pageWidth - margin * 2, 14, 2, 2, 'F');
      }

      // Currency
      setColor(COLORS.text);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(currency, margin + 8, y + 3);

      // Expenses
      setColor(COLORS.danger);
      doc.setFont("helvetica", "normal");
      doc.text(`-${symbol} ${expense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, isLandscape ? 130 : 85, y + 3);

      // Net Savings
      if (netSavings >= 0) {
        setColor(COLORS.success);
      } else {
        setColor(COLORS.danger);
      }
      doc.setFont("helvetica", "bold");
      doc.text(`${netSavings >= 0 ? '+' : ''}${symbol} ${Math.abs(netSavings).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 8, y + 3, { align: "right" });

      y += 16;
    });
  }

  // ============== TRANSACTION DETAILS ==============
  expenseCurrencies.forEach(currency => {
    const data = expensesByCurrency[currency];
    const symbol = getSafeCurrencyDisplay(currency);

    doc.addPage();
    y = 30;

    // Section header
    setColor(COLORS.text);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Transaction Details`, margin, y);
    
    setColor(COLORS.secondary);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`${currency} • ${data.count} transactions`, margin + 70, y);

    y += 6;
    drawDivider(y);
    y += 14;

    // Table header
    setFillColor(COLORS.accent);
    doc.roundedRect(margin, y - 5, pageWidth - margin * 2, 12, 2, 2, 'F');
    
    setColor([255, 255, 255]);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("DATE", margin + 5, y + 2);
    doc.text("CATEGORY", isLandscape ? 70 : 50, y + 2);
    doc.text("NOTES", isLandscape ? 140 : 95, y + 2);
    doc.text("AMOUNT", pageWidth - margin - 5, y + 2, { align: "right" });
    
    y += 14;

    // Sort expenses by date (newest first)
    const sortedExpenses = [...data.expenses].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    sortedExpenses.forEach((exp, idx) => {
      checkNewPage(12);
      
      const dateStr = format(new Date(exp.date), "MMM dd");
      const categoryLabel = getCategoryLabel(exp.category, customCategories);
      const maxNotes = isLandscape ? 40 : 25;
      const notesStr = (exp.notes || "—").substring(0, maxNotes);

      // Alternating subtle background
      if (idx % 2 === 0) {
        setFillColor(COLORS.light);
        doc.rect(margin, y - 3, pageWidth - margin * 2, 10, 'F');
      }

      setColor(COLORS.secondary);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(dateStr, margin + 5, y + 2);
      
      setColor(COLORS.text);
      doc.text(categoryLabel.substring(0, 15), isLandscape ? 70 : 50, y + 2);
      
      setColor(COLORS.secondary);
      doc.text(notesStr, isLandscape ? 140 : 95, y + 2);
      
      setColor(COLORS.text);
      doc.setFont("helvetica", "bold");
      doc.text(`${symbol} ${exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 5, y + 2, { align: "right" });

      y += 10;
    });
  });

  // ============== FOOTER ON ALL PAGES ==============
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer divider with accent
    doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 16, pageWidth - margin, pageHeight - 16);
    
    // Footer text
    setColor(COLORS.secondary);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    
    // Left: Generated by
    doc.text("Generated by MEET", margin, pageHeight - 8);
    
    // Center: Report type
    let reportType = "";
    if (scope === "month") reportType = "Monthly Report";
    else if (scope === "year") reportType = "Annual Report";
    else if (scope === "purpose") reportType = "Purpose Report";
    else reportType = "Expense Report";
    doc.text(reportType, pageWidth / 2, pageHeight - 8, { align: "center" });
    
    // Right: Page number
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  // Generate PDF base64
  const pdfBlob = doc.output("blob");
  const pdfBase64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(",")[1]);
    };
    reader.readAsDataURL(pdfBlob);
  });

  return pdfBase64;
};

// Generate blob URL for preview
export const generatePDFPreview = async (options: PDFExportOptions): Promise<string> => {
  const base64 = await generatePDFData(options);
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: "application/pdf" });
  return URL.createObjectURL(blob);
};

// Export to file
export const exportToPDF = async (options: PDFExportOptions): Promise<boolean> => {
  const {
    scope,
    selectedMonth,
    selectedYear,
    purposeName,
    startDate,
    endDate,
  } = options;

  const pdfBase64 = await generatePDFData(options);

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
