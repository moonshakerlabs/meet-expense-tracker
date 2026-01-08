import { CATEGORIES, CATEGORY_COLORS, Category, CustomCategory, UserSettings } from "@/types/expense";

export interface CategoryMeta {
  id: string;
  label: string;
  icon: string;
  color: string;
  isBuiltIn: boolean;
}

// Default color palette for custom categories
const CUSTOM_CATEGORY_COLORS = [
  "hsl(270, 50%, 50%)",
  "hsl(320, 60%, 50%)",
  "hsl(190, 70%, 45%)",
  "hsl(50, 80%, 45%)",
  "hsl(140, 50%, 45%)",
  "hsl(10, 70%, 50%)",
];

export const getCategoryMeta = (
  categoryId: string,
  customCategories: CustomCategory[] = []
): CategoryMeta => {
  // Check built-in categories first
  const builtIn = CATEGORIES.find((c) => c.id === categoryId);
  if (builtIn) {
    return {
      id: builtIn.id,
      label: builtIn.label,
      icon: builtIn.icon,
      color: CATEGORY_COLORS[builtIn.id as Category] || CATEGORY_COLORS.misc,
      isBuiltIn: true,
    };
  }

  // Check custom categories
  const custom = customCategories.find((c) => c.id === categoryId);
  if (custom) {
    // Generate a deterministic color based on the category id
    const colorIndex = Math.abs(hashCode(custom.id)) % CUSTOM_CATEGORY_COLORS.length;
    return {
      id: custom.id,
      label: custom.label,
      icon: custom.icon,
      color: CUSTOM_CATEGORY_COLORS[colorIndex],
      isBuiltIn: false,
    };
  }

  // Fallback for unknown categories
  return {
    id: categoryId,
    label: categoryId,
    icon: "📦",
    color: CATEGORY_COLORS.misc,
    isBuiltIn: false,
  };
};

// Simple hash function for consistent color assignment
const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash;
};

// Get all available categories (built-in + custom, excluding hidden)
export const getVisibleCategories = (
  customCategories: CustomCategory[] = [],
  hiddenCategories: Category[] = []
): CategoryMeta[] => {
  const builtInVisible = CATEGORIES
    .filter((c) => c.id !== "custom" && !hiddenCategories.includes(c.id))
    .map((c) => ({
      id: c.id,
      label: c.label,
      icon: c.icon,
      color: CATEGORY_COLORS[c.id as Category],
      isBuiltIn: true,
    }));

  const customVisible = customCategories.map((c) => {
    const colorIndex = Math.abs(hashCode(c.id)) % CUSTOM_CATEGORY_COLORS.length;
    return {
      id: c.id,
      label: c.label,
      icon: c.icon,
      color: CUSTOM_CATEGORY_COLORS[colorIndex],
      isBuiltIn: false,
    };
  });

  return [...builtInVisible, ...customVisible];
};
