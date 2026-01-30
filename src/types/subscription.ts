// Subscription tier types
export type SubscriptionTier = "free" | "freemium_trial" | "freemium_paid";

export interface SubscriptionState {
  tier: SubscriptionTier;
  trialStartDate?: string; // ISO date string
  trialEndDate?: string; // ISO date string
  trialUsed: boolean;
  dataAcknowledged: boolean; // User acknowledged data is stored locally only
}

// Trial duration in days
export const TRIAL_DURATION_DAYS = 7;

// Feature definitions
export interface FeatureAccess {
  // FREE features (always available)
  addEditDeleteExpenses: boolean; // In primary currency only for FREE
  viewExpensesMonthlyYearly: boolean;
  savingsTracking: boolean;
  manualSavingsUpdate: boolean;
  customIncomeSources: boolean;
  recurringIncome: boolean;
  categoryDoughnutChart: boolean; // Primary currency only for FREE
  savingsVisibilityToggle: boolean; // Primary currency only for FREE
  manageCategories: boolean;
  addCustomCategories: boolean;
  importJSON: boolean;
  exportJSON: boolean;
  exportCSV: boolean;
  pinProtection: boolean;
  themeSwitching: boolean;
  viewOnboarding: boolean;
  viewPrivacy: boolean;
  appReset: boolean;
  
  // FREEMIUM features
  changeCountryAfterSetup: boolean;
  changeDefaultCurrency: boolean;
  useMultipleCurrencies: boolean;
  addExpensesNonPrimaryCurrency: boolean;
  viewByCurrency: boolean;
  managePurposes: boolean;
  assignPurposeToExpenses: boolean;
  viewPurposeInsights: boolean;
  importCSV: boolean;
  exportPDF: boolean;
  pdfChartOptions: boolean;
  pdfColorTheme: boolean;
  pdfOrientation: boolean;
  pdfCurrencyFilter: boolean;
  pdfPreview: boolean;
}

// Get feature access based on subscription tier
export const getFeatureAccess = (tier: SubscriptionTier): FeatureAccess => {
  const isFreemium = tier === "freemium_trial" || tier === "freemium_paid";
  
  return {
    // FREE features - always available
    addEditDeleteExpenses: true,
    viewExpensesMonthlyYearly: true,
    savingsTracking: true,
    manualSavingsUpdate: true,
    customIncomeSources: true,
    recurringIncome: true,
    categoryDoughnutChart: true,
    savingsVisibilityToggle: true,
    manageCategories: true,
    addCustomCategories: true,
    importJSON: true,
    exportJSON: true,
    exportCSV: true,
    pinProtection: true,
    themeSwitching: true,
    viewOnboarding: true,
    viewPrivacy: true,
    appReset: true,
    
    // FREEMIUM features - only available with trial or paid
    changeCountryAfterSetup: isFreemium,
    changeDefaultCurrency: isFreemium,
    useMultipleCurrencies: isFreemium,
    addExpensesNonPrimaryCurrency: isFreemium,
    viewByCurrency: isFreemium,
    managePurposes: isFreemium,
    assignPurposeToExpenses: isFreemium,
    viewPurposeInsights: isFreemium,
    importCSV: isFreemium,
    exportPDF: isFreemium,
    pdfChartOptions: isFreemium,
    pdfColorTheme: isFreemium,
    pdfOrientation: isFreemium,
    pdfCurrencyFilter: isFreemium,
    pdfPreview: isFreemium,
  };
};

// List of FREE features for display
export const FREE_FEATURES = [
  "Add, edit, delete expenses in primary currency",
  "View expenses monthly and yearly",
  "Savings tracking with automatic updates",
  "Manually update savings",
  "Add custom income sources",
  "Add recurring income",
  "Category doughnut chart (primary currency)",
  "Manage categories and subcategories",
  "Add custom categories and subcategories",
  "Import data using JSON",
  "Export data as JSON",
  "Export data as CSV",
  "PIN protection",
  "Theme switching",
  "View onboarding & privacy policy",
  "App reset",
  "All data stored locally on device",
];

// List of FREEMIUM features for display
export const FREEMIUM_FEATURES = [
  "Change country after setup",
  "Change default currency",
  "Use multiple currencies",
  "Add expenses in non-primary currencies",
  "View expenses, income, and savings by currency",
  "Manage purposes (add/edit/delete)",
  "Assign purpose while adding or editing expenses",
  "View purpose-wise expense insights across all time",
  "Import data using CSV",
  "Export PDF reports",
  "PDF: Pie chart / Bar chart selection",
  "PDF: Color theme selection",
  "PDF: Page orientation (portrait/landscape)",
  "PDF: Currency selection & preview",
];
