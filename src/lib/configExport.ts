import { UserSettings, RecurringExpense, Income, CustomCategory, CustomIncomeSource, Purpose, CurrencyIncome, CurrencySavings } from "@/types/expense";
import { exportFile, ExportData } from "./fileExport";
import { format } from "date-fns";

// App configuration structure for export/import
export interface AppConfiguration {
  exportVersion: string;
  exportDate: string;
  appName: string;
  // Settings-based config
  customCategories: CustomCategory[];
  customSubcategories: Record<string, CustomCategory[]>;
  hiddenCategories: string[];
  customIncomeSources: CustomIncomeSource[];
  purposes: Purpose[];
  currencyIncomes: CurrencyIncome[];
  currencySavings: CurrencySavings[];
  // Currency settings
  currency: string;
  currencySymbol: string;
  country: string;
  language: string;
  userName?: string;
  // Dashboard preferences
  showUpcomingPayments?: boolean;
  showSpendingByCategory?: boolean;
  showMonthlySpending?: boolean;
  // Recurring data
  recurringExpenses: RecurringExpense[];
  recurringIncomes: Income[];
}

export interface ImportConfigResult {
  success: boolean;
  imported: {
    customCategories: number;
    customSubcategories: number;
    purposes: number;
    customIncomeSources: number;
    recurringExpenses: number;
    recurringIncomes: number;
    currencyIncomes: number;
    currencySavings: number;
  };
  errors: string[];
}

const formatDate = (date: Date): string => {
  return format(new Date(date), "yyyy-MM-dd");
};

const formatDateTime = (date: Date): string => {
  return format(new Date(date), "yyyy-MM-dd HH:mm");
};

// Build configuration export data
export const buildConfigurationExport = (
  settings: UserSettings,
  recurringExpenses: RecurringExpense[],
  incomes: Income[]
): ExportData => {
  // Filter only recurring incomes
  const recurringIncomes = incomes.filter(i => i.isRecurring);

  const config: AppConfiguration = {
    exportVersion: "1.0",
    exportDate: formatDateTime(new Date()),
    appName: "MEET - Monthly Expense Entry & Tracking",
    // Settings-based config
    customCategories: settings.customCategories || [],
    customSubcategories: settings.customSubcategories || {},
    hiddenCategories: settings.hiddenCategories || [],
    customIncomeSources: settings.customIncomeSources || [],
    purposes: settings.purposes || [],
    currencyIncomes: settings.currencyIncomes || [],
    currencySavings: settings.currencySavings || [],
    // Currency settings
    currency: settings.currency,
    currencySymbol: settings.currencySymbol,
    country: settings.country,
    language: settings.language,
    userName: settings.userName,
    // Dashboard preferences
    showUpcomingPayments: settings.showUpcomingPayments,
    showSpendingByCategory: settings.showSpendingByCategory,
    showMonthlySpending: settings.showMonthlySpending,
    // Recurring data
    recurringExpenses: recurringExpenses,
    recurringIncomes: recurringIncomes,
  };

  const jsonContent = JSON.stringify(config, null, 2);

  return {
    filename: `meet-config-${formatDate(new Date())}.json`,
    content: jsonContent,
    mimeType: "application/json",
  };
};

// Export configuration to file
export const exportConfiguration = async (
  settings: UserSettings,
  recurringExpenses: RecurringExpense[],
  incomes: Income[]
): Promise<boolean> => {
  const data = buildConfigurationExport(settings, recurringExpenses, incomes);
  return exportFile(data);
};

// Parse and validate imported configuration
export const parseConfigurationImport = (
  fileContent: string
): { config: AppConfiguration | null; errors: string[] } => {
  const errors: string[] = [];

  try {
    const parsed = JSON.parse(fileContent);

    // Validate required fields
    if (!parsed.exportVersion) {
      errors.push("Invalid configuration file: missing version");
      return { config: null, errors };
    }

    // Validate structure
    if (parsed.appName !== "MEET - Monthly Expense Entry & Tracking") {
      errors.push("Warning: This configuration may not be from MEET app");
    }

    // Parse dates in recurring expenses
    const recurringExpenses = (parsed.recurringExpenses || []).map((r: any) => ({
      ...r,
      startDate: r.startDate ? new Date(r.startDate) : new Date(),
      nextDueDate: r.nextDueDate ? new Date(r.nextDueDate) : new Date(),
      createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
      lastGenerated: r.lastGenerated ? new Date(r.lastGenerated) : undefined,
    }));

    // Parse dates in recurring incomes
    const recurringIncomes = (parsed.recurringIncomes || []).map((i: any) => ({
      ...i,
      date: i.date ? new Date(i.date) : new Date(),
      createdAt: i.createdAt ? new Date(i.createdAt) : new Date(),
      autoUpdateEndDate: i.autoUpdateEndDate ? new Date(i.autoUpdateEndDate) : undefined,
    }));

    // Parse dates in purposes
    const purposes = (parsed.purposes || []).map((p: any) => ({
      ...p,
      createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
    }));

    const config: AppConfiguration = {
      exportVersion: parsed.exportVersion,
      exportDate: parsed.exportDate,
      appName: parsed.appName,
      customCategories: parsed.customCategories || [],
      customSubcategories: parsed.customSubcategories || {},
      hiddenCategories: parsed.hiddenCategories || [],
      customIncomeSources: parsed.customIncomeSources || [],
      purposes: purposes,
      currencyIncomes: parsed.currencyIncomes || [],
      currencySavings: parsed.currencySavings || [],
      currency: parsed.currency || "USD",
      currencySymbol: parsed.currencySymbol || "$",
      country: parsed.country || "US",
      language: parsed.language || "en",
      userName: parsed.userName,
      showUpcomingPayments: parsed.showUpcomingPayments,
      showSpendingByCategory: parsed.showSpendingByCategory,
      showMonthlySpending: parsed.showMonthlySpending,
      recurringExpenses: recurringExpenses,
      recurringIncomes: recurringIncomes,
    };

    return { config, errors };
  } catch (err) {
    errors.push("Failed to parse configuration file: Invalid JSON format");
    return { config: null, errors };
  }
};

// Check for duplicates before importing
export const deduplicateConfig = (
  config: AppConfiguration,
  existingSettings: UserSettings,
  existingRecurringExpenses: RecurringExpense[],
  existingIncomes: Income[]
): AppConfiguration => {
  // Deduplicate custom categories by ID
  const existingCatIds = new Set(existingSettings.customCategories.map(c => c.id));
  const newCategories = config.customCategories.filter(c => !existingCatIds.has(c.id));

  // Deduplicate purposes by ID
  const existingPurposeIds = new Set((existingSettings.purposes || []).map(p => p.id));
  const newPurposes = config.purposes.filter(p => !existingPurposeIds.has(p.id));

  // Deduplicate income sources by ID
  const existingSourceIds = new Set(existingSettings.customIncomeSources.map(s => s.id));
  const newIncomeSources = config.customIncomeSources.filter(s => !existingSourceIds.has(s.id));

  // Deduplicate recurring expenses by ID
  const existingRecExpIds = new Set(existingRecurringExpenses.map(r => r.id));
  const newRecurringExpenses = config.recurringExpenses.filter(r => !existingRecExpIds.has(r.id));

  // Deduplicate recurring incomes by ID
  const existingIncomeIds = new Set(existingIncomes.filter(i => i.isRecurring).map(i => i.id));
  const newRecurringIncomes = config.recurringIncomes.filter(i => !existingIncomeIds.has(i.id));

  // Deduplicate currency incomes
  const existingCurrencyIncomes = new Set((existingSettings.currencyIncomes || []).map(c => c.currency));
  const newCurrencyIncomes = config.currencyIncomes.filter(c => !existingCurrencyIncomes.has(c.currency));

  // Deduplicate currency savings
  const existingCurrencySavings = new Set((existingSettings.currencySavings || []).map(c => c.currency));
  const newCurrencySavings = config.currencySavings.filter(c => !existingCurrencySavings.has(c.currency));

  // Merge custom subcategories
  const mergedSubcategories = { ...existingSettings.customSubcategories };
  Object.entries(config.customSubcategories).forEach(([category, subs]) => {
    const existingSubIds = new Set((mergedSubcategories[category] || []).map(s => s.id));
    const newSubs = (subs as CustomCategory[]).filter(s => !existingSubIds.has(s.id));
    mergedSubcategories[category] = [...(mergedSubcategories[category] || []), ...newSubs];
  });

  return {
    ...config,
    customCategories: newCategories,
    customSubcategories: mergedSubcategories,
    purposes: newPurposes,
    customIncomeSources: newIncomeSources,
    recurringExpenses: newRecurringExpenses,
    recurringIncomes: newRecurringIncomes,
    currencyIncomes: newCurrencyIncomes,
    currencySavings: newCurrencySavings,
  };
};

// Count items that will be imported
export const countConfigItems = (config: AppConfiguration): ImportConfigResult["imported"] => {
  let subcategoryCount = 0;
  Object.values(config.customSubcategories).forEach(subs => {
    subcategoryCount += (subs as CustomCategory[]).length;
  });

  return {
    customCategories: config.customCategories.length,
    customSubcategories: subcategoryCount,
    purposes: config.purposes.length,
    customIncomeSources: config.customIncomeSources.length,
    recurringExpenses: config.recurringExpenses.length,
    recurringIncomes: config.recurringIncomes.length,
    currencyIncomes: config.currencyIncomes.length,
    currencySavings: config.currencySavings.length,
  };
};
