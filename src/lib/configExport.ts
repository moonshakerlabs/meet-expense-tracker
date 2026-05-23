import { UserSettings, RecurringExpense, Income, CustomCategory, CustomIncomeSource, Purpose, CurrencyIncome, CurrencySavings } from "@/types/expense";
import { exportFile, ExportData } from "./fileExport";
import { format } from "date-fns";

// App configuration structure for export/import.
// `settingsSnapshot` carries a forward-compatible copy of all user settings
// (excluding sensitive/transient fields) so that future feature additions to
// UserSettings are automatically included in migrations without code changes.
export interface AppConfiguration {
  exportVersion: string;
  exportDate: string;
  appName: string;

  // Forward-compatible full settings snapshot
  settingsSnapshot?: Partial<UserSettings>;

  // Legacy explicit fields (kept for backward compatibility with older exports)
  customCategories: CustomCategory[];
  customSubcategories: Record<string, CustomCategory[]>;
  hiddenCategories: string[];
  customIncomeSources: CustomIncomeSource[];
  purposes: Purpose[];
  currencyIncomes: CurrencyIncome[];
  currencySavings: CurrencySavings[];
  currency: string;
  currencySymbol: string;
  country: string;
  language: string;
  userName?: string;
  theme?: "light" | "dark" | "system";
  monthlyIncome?: number;
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

const formatDate = (date: Date): string => format(new Date(date), "yyyy-MM-dd");
const formatDateTime = (date: Date): string => format(new Date(date), "yyyy-MM-dd HH:mm");

// Build a forward-compatible snapshot of user settings.
// Excludes sensitive (pinHash) and transient (hasCompletedOnboarding, hasSeenAppTour)
// fields so the import flow can decide when to mark migration complete.
const buildSettingsSnapshot = (settings: UserSettings): Partial<UserSettings> => {
  const {
    pinHash: _pinHash,
    pinEnabled: _pinEnabled,
    hasCompletedOnboarding: _onb,
    hasSeenAppTour: _tour,
    ...rest
  } = settings;
  return rest;
};

// Build configuration export data
export const buildConfigurationExport = (
  settings: UserSettings,
  recurringExpenses: RecurringExpense[],
  incomes: Income[]
): ExportData => {
  const recurringIncomes = incomes.filter((i) => i.isRecurring);

  const config: AppConfiguration = {
    exportVersion: "1.1",
    exportDate: formatDateTime(new Date()),
    appName: "MEET - Monthly Expense Entry & Tracking",

    settingsSnapshot: buildSettingsSnapshot(settings),

    customCategories: settings.customCategories || [],
    customSubcategories: settings.customSubcategories || {},
    hiddenCategories: settings.hiddenCategories || [],
    customIncomeSources: settings.customIncomeSources || [],
    purposes: settings.purposes || [],
    currencyIncomes: settings.currencyIncomes || [],
    currencySavings: settings.currencySavings || [],
    currency: settings.currency,
    currencySymbol: settings.currencySymbol,
    country: settings.country,
    language: settings.language,
    userName: settings.userName,
    theme: settings.theme,
    monthlyIncome: settings.monthlyIncome,
    showUpcomingPayments: settings.showUpcomingPayments,
    showSpendingByCategory: settings.showSpendingByCategory,
    showMonthlySpending: settings.showMonthlySpending,

    recurringExpenses,
    recurringIncomes,
  };

  return {
    filename: `meet-config-${formatDate(new Date())}.json`,
    content: JSON.stringify(config, null, 2),
    mimeType: "application/json",
  };
};

export const exportConfiguration = async (
  settings: UserSettings,
  recurringExpenses: RecurringExpense[],
  incomes: Income[]
): Promise<boolean> => {
  const data = buildConfigurationExport(settings, recurringExpenses, incomes);
  return exportFile(data);
};

// Parse + validate import
export const parseConfigurationImport = (
  fileContent: string
): { config: AppConfiguration | null; errors: string[] } => {
  const errors: string[] = [];
  try {
    const parsed = JSON.parse(fileContent);

    if (!parsed.exportVersion) {
      errors.push("Invalid configuration file: missing version");
      return { config: null, errors };
    }

    if (parsed.appName && parsed.appName !== "MEET - Monthly Expense Entry & Tracking") {
      errors.push("Warning: This configuration may not be from MEET app");
    }

    const recurringExpenses = (parsed.recurringExpenses || []).map((r: any) => ({
      ...r,
      startDate: r.startDate ? new Date(r.startDate) : new Date(),
      nextDueDate: r.nextDueDate ? new Date(r.nextDueDate) : new Date(),
      createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
      lastGenerated: r.lastGenerated ? new Date(r.lastGenerated) : undefined,
    }));

    const recurringIncomes = (parsed.recurringIncomes || []).map((i: any) => ({
      ...i,
      date: i.date ? new Date(i.date) : new Date(),
      createdAt: i.createdAt ? new Date(i.createdAt) : new Date(),
      autoUpdateEndDate: i.autoUpdateEndDate ? new Date(i.autoUpdateEndDate) : undefined,
    }));

    const purposes = (parsed.purposes || []).map((p: any) => ({
      ...p,
      createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
    }));

    // If a snapshot exists, also normalize purpose dates inside it
    const snapshot: Partial<UserSettings> | undefined = parsed.settingsSnapshot
      ? {
          ...parsed.settingsSnapshot,
          purposes: (parsed.settingsSnapshot.purposes || []).map((p: any) => ({
            ...p,
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
          })),
        }
      : undefined;

    const config: AppConfiguration = {
      exportVersion: parsed.exportVersion,
      exportDate: parsed.exportDate,
      appName: parsed.appName,
      settingsSnapshot: snapshot,
      customCategories: parsed.customCategories || [],
      customSubcategories: parsed.customSubcategories || {},
      hiddenCategories: parsed.hiddenCategories || [],
      customIncomeSources: parsed.customIncomeSources || [],
      purposes,
      currencyIncomes: parsed.currencyIncomes || [],
      currencySavings: parsed.currencySavings || [],
      currency: parsed.currency || "USD",
      currencySymbol: parsed.currencySymbol || "$",
      country: parsed.country || "US",
      language: parsed.language || "en",
      userName: parsed.userName,
      theme: parsed.theme,
      monthlyIncome: parsed.monthlyIncome,
      showUpcomingPayments: parsed.showUpcomingPayments,
      showSpendingByCategory: parsed.showSpendingByCategory,
      showMonthlySpending: parsed.showMonthlySpending,
      recurringExpenses,
      recurringIncomes,
    };

    return { config, errors };
  } catch (err) {
    errors.push("Failed to parse configuration file: Invalid JSON format");
    return { config: null, errors };
  }
};

// Dedupe against existing user data
export const deduplicateConfig = (
  config: AppConfiguration,
  existingSettings: UserSettings,
  existingRecurringExpenses: RecurringExpense[],
  existingIncomes: Income[]
): AppConfiguration => {
  const existingCatIds = new Set(existingSettings.customCategories.map((c) => c.id));
  const newCategories = config.customCategories.filter((c) => !existingCatIds.has(c.id));

  const existingPurposeIds = new Set((existingSettings.purposes || []).map((p) => p.id));
  const newPurposes = config.purposes.filter((p) => !existingPurposeIds.has(p.id));

  const existingSourceIds = new Set(existingSettings.customIncomeSources.map((s) => s.id));
  const newIncomeSources = config.customIncomeSources.filter((s) => !existingSourceIds.has(s.id));

  const existingRecExpIds = new Set(existingRecurringExpenses.map((r) => r.id));
  const newRecurringExpenses = config.recurringExpenses.filter((r) => !existingRecExpIds.has(r.id));

  const existingIncomeIds = new Set(existingIncomes.filter((i) => i.isRecurring).map((i) => i.id));
  const newRecurringIncomes = config.recurringIncomes.filter((i) => !existingIncomeIds.has(i.id));

  const existingCurrencyIncomes = new Set((existingSettings.currencyIncomes || []).map((c) => c.currency));
  const newCurrencyIncomes = config.currencyIncomes.filter((c) => !existingCurrencyIncomes.has(c.currency));

  const existingCurrencySavings = new Set((existingSettings.currencySavings || []).map((c) => c.currency));
  const newCurrencySavings = config.currencySavings.filter((c) => !existingCurrencySavings.has(c.currency));

  const mergedSubcategories = { ...existingSettings.customSubcategories };
  Object.entries(config.customSubcategories).forEach(([category, subs]) => {
    const existingSubIds = new Set((mergedSubcategories[category] || []).map((s) => s.id));
    const newSubs = (subs as CustomCategory[]).filter((s) => !existingSubIds.has(s.id));
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

export const countConfigItems = (config: AppConfiguration): ImportConfigResult["imported"] => {
  let subcategoryCount = 0;
  Object.values(config.customSubcategories).forEach((subs) => {
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

// Build a Partial<UserSettings> update object that merges an imported (already-
// deduplicated) config with existing settings. Excludes sensitive fields (pinHash)
// and transient onboarding flags — callers decide whether to mark onboarding done.
export const buildSettingsUpdatesFromConfig = (
  config: AppConfiguration,
  existing: UserSettings
): Partial<UserSettings> => {
  // Start from snapshot (forward-compatible) but strip sensitive/transient fields
  const snapshot = config.settingsSnapshot
    ? (() => {
        const {
          pinHash: _ph,
          pinEnabled: _pe,
          hasCompletedOnboarding: _o,
          hasSeenAppTour: _t,
          ...rest
        } = config.settingsSnapshot as UserSettings;
        return rest as Partial<UserSettings>;
      })()
    : {};

  // Explicit legacy fields fall back to snapshot
  const updates: Partial<UserSettings> = {
    ...snapshot,
    customCategories: [
      ...existing.customCategories,
      ...config.customCategories,
    ],
    customSubcategories: config.customSubcategories,
    purposes: [...(existing.purposes || []), ...config.purposes],
    customIncomeSources: [
      ...existing.customIncomeSources,
      ...config.customIncomeSources,
    ],
    currencyIncomes: [
      ...(existing.currencyIncomes || []),
      ...config.currencyIncomes,
    ],
    currencySavings: [
      ...(existing.currencySavings || []),
      ...config.currencySavings,
    ],
    hiddenCategories: Array.from(
      new Set([...(existing.hiddenCategories || []), ...(config.hiddenCategories as any[])])
    ) as any,
  };

  // Apply primitive settings from legacy fields when present
  if (config.currency) updates.currency = config.currency;
  if (config.currencySymbol) updates.currencySymbol = config.currencySymbol;
  if (config.country) updates.country = config.country;
  if (config.language) updates.language = config.language;
  if (config.userName !== undefined) updates.userName = config.userName;
  if (config.theme) updates.theme = config.theme;
  if (config.monthlyIncome !== undefined) updates.monthlyIncome = config.monthlyIncome;
  if (config.showUpcomingPayments !== undefined) updates.showUpcomingPayments = config.showUpcomingPayments;
  if (config.showSpendingByCategory !== undefined) updates.showSpendingByCategory = config.showSpendingByCategory;
  if (config.showMonthlySpending !== undefined) updates.showMonthlySpending = config.showMonthlySpending;

  return updates;
};
