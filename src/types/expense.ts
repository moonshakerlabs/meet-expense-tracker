export type Category = 
  | "food"
  | "transport"
  | "shopping"
  | "rent"
  | "bills"
  | "misc"
  | "custom";

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  notes?: string;
  date: Date;
  createdAt: Date;
  syncStatus: "pending" | "synced" | "failed";
}

export interface UserSettings {
  currency: string;
  currencySymbol: string;
  theme: "light" | "dark" | "system";
  hasCompletedOnboarding: boolean;
  googleConnected: boolean;
}

export const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: "food", label: "Food", icon: "🍔" },
  { id: "transport", label: "Transport", icon: "🚗" },
  { id: "shopping", label: "Shopping", icon: "🛍️" },
  { id: "rent", label: "Rent", icon: "🏠" },
  { id: "bills", label: "Bills", icon: "💡" },
  { id: "misc", label: "Misc", icon: "📦" },
];

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "$", name: "Australian Dollar" },
];
