export type Category =
  | "medical"
  | "subscriptions"
  | "bills"
  | "shopping"
  | "misc"
  | "transport"
  | "education"
  | "tax"
  | "food"
  | "liabilities"
  | "investments"
  | "custom";

export type Subcategory = string;

export interface Expense {
  id: string;
  amount: number;
  currency: string;
  currencySymbol: string;
  category: Category;
  subcategory?: Subcategory;
  notes?: string;
  date: Date;
  createdAt: Date;
  syncStatus: "pending" | "synced" | "failed";
  recurringId?: string;
}

export interface Income {
  id: string;
  amount: number;
  source: IncomeSource;
  date: Date;
  notes?: string;
  isRecurring: boolean;
  recurringDay?: number; // Day of month (1-31)
  autoUpdateMonths?: number; // Number of months to auto-update (null = indefinite)
  autoUpdateEndDate?: Date;
  isActive: boolean;
  createdAt: Date;
}

export type IncomeSource = "salary" | "rent" | "other";

export type FrequencyUnit = "days" | "months" | "years";

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: Category;
  subcategory?: Subcategory;
  frequencyValue: number; // e.g., 1, 2, 3, 6, 12
  frequencyUnit: FrequencyUnit; // "days" | "months" | "years"
  startDate: Date;
  nextDueDate: Date;
  isActive: boolean;
  createdAt: Date;
  lastGenerated?: Date;
  // Legacy field for backward compatibility
  dayOfMonth?: number;
}

export interface CustomCategory {
  id: string;
  label: string;
  icon: string;
  parentCategory?: Category; // If this is a custom subcategory
}

export interface UserSettings {
  currency: string;
  currencySymbol: string;
  theme: "light" | "dark" | "system";
  hasCompletedOnboarding: boolean;
  googleConnected: boolean;
  monthlyIncome?: number;
  customCategories: CustomCategory[];
  customSubcategories: Record<string, CustomCategory[]>;
  hiddenCategories: Category[];
}

export const CATEGORIES: { id: Category; label: string; icon: string; color: string }[] = [
  { id: "food", label: "Food", icon: "🍔", color: "hsl(25, 95%, 53%)" },
  { id: "transport", label: "Transport", icon: "🚗", color: "hsl(210, 80%, 55%)" },
  { id: "shopping", label: "Shopping", icon: "🛍️", color: "hsl(280, 60%, 55%)" },
  { id: "bills", label: "Bills", icon: "💡", color: "hsl(45, 93%, 47%)" },
  { id: "medical", label: "Medical", icon: "🏥", color: "hsl(0, 70%, 55%)" },
  { id: "subscriptions", label: "Subscriptions", icon: "📺", color: "hsl(260, 70%, 60%)" },
  { id: "education", label: "Education", icon: "📚", color: "hsl(180, 60%, 45%)" },
  { id: "tax", label: "Tax", icon: "🏛️", color: "hsl(30, 50%, 45%)" },
  { id: "liabilities", label: "Liabilities", icon: "🏦", color: "hsl(340, 75%, 55%)" },
  { id: "investments", label: "Investments", icon: "📈", color: "hsl(158, 64%, 42%)" },
  { id: "misc", label: "Misc", icon: "📦", color: "hsl(200, 15%, 55%)" },
];

export const SUBCATEGORIES: Record<Category, { id: string; label: string }[]> = {
  medical: [
    { id: "treatment", label: "Treatment" },
    { id: "diagnosis", label: "Diagnosis" },
    { id: "medicines", label: "Medicines" },
    { id: "aiding_equipment", label: "Aiding Equipment" },
  ],
  subscriptions: [
    { id: "tv", label: "TV" },
    { id: "ott", label: "OTT" },
    { id: "magazines", label: "Magazines" },
    { id: "mooc", label: "MOOC" },
    { id: "job_portals", label: "Job Portals" },
    { id: "matrimony", label: "Matrimony" },
    { id: "software", label: "Software" },
    { id: "other", label: "Other Subscriptions" },
  ],
  bills: [
    { id: "electricity", label: "Electricity" },
    { id: "school_fees", label: "School Fees" },
    { id: "telephone", label: "Telephone" },
    { id: "internet", label: "Internet" },
    { id: "mobile_recharge", label: "Mobile Recharge" },
    { id: "gas", label: "Gas" },
    { id: "rent", label: "House/PG/Hostel Rent" },
    { id: "maintenance", label: "Maintenance" },
    { id: "vehicle_lease", label: "Vehicle Lease" },
    { id: "furniture_rent", label: "Furniture/Appliance Rent" },
    { id: "other_utilities", label: "Other Utilities" },
  ],
  shopping: [
    { id: "online", label: "Online Shopping" },
    { id: "instore", label: "In-Store Shopping" },
  ],
  misc: [
    { id: "gifts", label: "Gifts" },
    { id: "repairs", label: "Repairs" },
    { id: "other", label: "Others" },
  ],
  transport: [
    { id: "auto", label: "Auto" },
    { id: "taxi", label: "Taxi" },
    { id: "bus", label: "Bus" },
    { id: "fuel", label: "Fuel" },
    { id: "other", label: "Others" },
  ],
  education: [
    { id: "tuition", label: "Tuition" },
    { id: "supplies", label: "Supplies" },
    { id: "other", label: "Others" },
  ],
  tax: [
    { id: "water", label: "Water Tax" },
    { id: "property", label: "Property Tax" },
    { id: "other", label: "Others" },
  ],
  food: [
    { id: "online", label: "Online Order" },
    { id: "dining", label: "Dining Out" },
    { id: "groceries", label: "Groceries" },
    { id: "other", label: "Others" },
  ],
  liabilities: [
    { id: "house_emi", label: "House EMI" },
    { id: "loan_emi", label: "Loan EMI" },
    { id: "other", label: "Others" },
  ],
  investments: [
    { id: "rd", label: "RD" },
    { id: "sip", label: "SIP" },
    { id: "gold_silver", label: "Gold/Silver Savings" },
    { id: "other", label: "Others" },
  ],
  custom: [],
};

export const INCOME_SOURCES: { id: IncomeSource; label: string; icon: string }[] = [
  { id: "salary", label: "Salary", icon: "💼" },
  { id: "rent", label: "Rent Income", icon: "🏠" },
  { id: "other", label: "Other Source", icon: "💰" },
];

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso" },
];

export const CATEGORY_COLORS: Record<Category, string> = {
  food: "hsl(25, 95%, 53%)",
  transport: "hsl(210, 80%, 55%)",
  shopping: "hsl(280, 60%, 55%)",
  bills: "hsl(45, 93%, 47%)",
  medical: "hsl(0, 70%, 55%)",
  subscriptions: "hsl(260, 70%, 60%)",
  education: "hsl(180, 60%, 45%)",
  tax: "hsl(30, 50%, 45%)",
  liabilities: "hsl(340, 75%, 55%)",
  investments: "hsl(158, 64%, 42%)",
  misc: "hsl(200, 15%, 55%)",
  custom: "hsl(270, 50%, 50%)",
};
