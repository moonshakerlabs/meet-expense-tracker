import { Category, SUBCATEGORIES } from "@/types/expense";

export interface SubcategoryMeta {
  id: string;
  label: string;
  isBuiltIn: boolean;
}

/**
 * Get the display label for a subcategory ID.
 * Resolves both built-in and custom subcategories.
 */
export const getSubcategoryLabel = (
  subcategoryId: string | undefined,
  categoryId: string,
  customSubcategories: Record<string, { id: string; label: string; icon?: string }[]> = {}
): string | null => {
  if (!subcategoryId) return null;
  
  // Check built-in subcategories first
  const builtInSubs = SUBCATEGORIES[categoryId as Category];
  if (builtInSubs) {
    const builtIn = builtInSubs.find((s) => s.id === subcategoryId);
    if (builtIn) return builtIn.label;
  }
  
  // Check custom subcategories
  const customSubs = customSubcategories[categoryId];
  if (customSubs) {
    const custom = customSubs.find((s) => s.id === subcategoryId);
    if (custom) return custom.label;
  }
  
  // If it starts with custom_sub_, it's a custom subcategory ID that we need to resolve
  // by checking all custom subcategories
  if (subcategoryId.startsWith("custom_sub_")) {
    // Search through all categories for this custom subcategory
    for (const catId in customSubcategories) {
      const subs = customSubcategories[catId];
      const found = subs?.find((s) => s.id === subcategoryId);
      if (found) return found.label;
    }
  }
  
  // Return null to indicate not found (caller can decide to show ID or "Uncategorized")
  return null;
};

/**
 * Get full subcategory metadata
 */
export const getSubcategoryMeta = (
  subcategoryId: string | undefined,
  categoryId: string,
  customSubcategories: Record<string, { id: string; label: string; icon?: string }[]> = {}
): SubcategoryMeta | null => {
  if (!subcategoryId) return null;
  
  // Check built-in subcategories first
  const builtInSubs = SUBCATEGORIES[categoryId as Category];
  if (builtInSubs) {
    const builtIn = builtInSubs.find((s) => s.id === subcategoryId);
    if (builtIn) {
      return {
        id: builtIn.id,
        label: builtIn.label,
        isBuiltIn: true,
      };
    }
  }
  
  // Check custom subcategories
  const customSubs = customSubcategories[categoryId];
  if (customSubs) {
    const custom = customSubs.find((s) => s.id === subcategoryId);
    if (custom) {
      return {
        id: custom.id,
        label: custom.label,
        isBuiltIn: false,
      };
    }
  }
  
  // Search all categories for custom subcategory
  if (subcategoryId.startsWith("custom_sub_")) {
    for (const catId in customSubcategories) {
      const subs = customSubcategories[catId];
      const found = subs?.find((s) => s.id === subcategoryId);
      if (found) {
        return {
          id: found.id,
          label: found.label,
          isBuiltIn: false,
        };
      }
    }
  }
  
  return null;
};
