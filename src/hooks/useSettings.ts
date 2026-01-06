import { useState, useEffect, useCallback } from "react";
import { UserSettings, CustomCategory, Category } from "@/types/expense";

const STORAGE_KEY = "meet_settings";

const defaultSettings: UserSettings = {
  currency: "USD",
  currencySymbol: "$",
  theme: "system",
  hasCompletedOnboarding: false,
  googleConnected: false,
  customCategories: [],
  customSubcategories: {
    food: [],
    transport: [],
    shopping: [],
    bills: [],
    medical: [],
    subscriptions: [],
    education: [],
    tax: [],
    liabilities: [],
    investments: [],
    misc: [],
    custom: [],
  },
  hiddenCategories: [],
  country: "US",
  language: "en",
};

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ 
          ...defaultSettings, 
          ...parsed,
          customCategories: parsed.customCategories || [],
          customSubcategories: { ...defaultSettings.customSubcategories, ...parsed.customSubcategories },
          hiddenCategories: parsed.hiddenCategories || [],
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to localStorage whenever settings change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings, isLoading]);

  // Apply theme
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      if (settings.theme === "system") {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        root.classList.toggle("dark", prefersDark);
      } else {
        root.classList.toggle("dark", settings.theme === "dark");
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (settings.theme === "system") {
        applyTheme();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [settings.theme]);

  const updateSettings = useCallback((updates: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setSettings((prev) => ({ ...prev, hasCompletedOnboarding: true }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const formatCurrency = useCallback(
    (amount: number) => {
      return `${settings.currencySymbol}${amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    },
    [settings.currencySymbol]
  );

  const addCustomCategory = useCallback((category: CustomCategory) => {
    setSettings((prev) => ({
      ...prev,
      customCategories: [...prev.customCategories, category],
    }));
  }, []);

  const removeCustomCategory = useCallback((categoryId: string) => {
    setSettings((prev) => ({
      ...prev,
      customCategories: prev.customCategories.filter((c) => c.id !== categoryId),
    }));
  }, []);

  const addCustomSubcategory = useCallback(
    (parentCategory: Category, subcategory: CustomCategory) => {
      setSettings((prev) => ({
        ...prev,
        customSubcategories: {
          ...prev.customSubcategories,
          [parentCategory]: [
            ...(prev.customSubcategories[parentCategory] || []),
            subcategory,
          ],
        },
      }));
    },
    []
  );

  const removeCustomSubcategory = useCallback(
    (parentCategory: Category, subcategoryId: string) => {
      setSettings((prev) => ({
        ...prev,
        customSubcategories: {
          ...prev.customSubcategories,
          [parentCategory]: prev.customSubcategories[parentCategory].filter(
            (s) => s.id !== subcategoryId
          ),
        },
      }));
    },
    []
  );

  const updateSubcategory = useCallback(
    (parentCategory: Category, id: string, updates: Partial<CustomCategory>) => {
      setSettings((prev) => ({
        ...prev,
        customSubcategories: {
          ...prev.customSubcategories,
          [parentCategory]: prev.customSubcategories[parentCategory].map(
            (sub) => sub.id === id ? { ...sub, ...updates } : sub
          ),
        },
      }));
    },
    []
  );

  const hideCategory = useCallback((categoryId: Category) => {
    setSettings((prev) => ({
      ...prev,
      hiddenCategories: [...prev.hiddenCategories, categoryId],
    }));
  }, []);

  const showCategory = useCallback((categoryId: Category) => {
    setSettings((prev) => ({
      ...prev,
      hiddenCategories: prev.hiddenCategories.filter((c) => c !== categoryId),
    }));
  }, []);

  return {
    settings,
    isLoading,
    updateSettings,
    completeOnboarding,
    resetSettings,
    formatCurrency,
    addCustomCategory,
    removeCustomCategory,
    addCustomSubcategory,
    removeCustomSubcategory,
    updateSubcategory,
    hideCategory,
    showCategory,
  };
};
