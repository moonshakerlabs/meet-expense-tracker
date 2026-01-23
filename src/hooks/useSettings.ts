import { useState, useEffect, useCallback } from "react";
import { UserSettings, CustomCategory, Category, CustomIncomeSource, CurrencyIncome, CurrencySavings, Purpose } from "@/types/expense";

const STORAGE_KEY = "meet_settings";

const defaultSettings: UserSettings = {
  currency: "USD",
  currencySymbol: "$",
  theme: "system",
  hasCompletedOnboarding: false,
  hasSeenAppTour: false,
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
  pinEnabled: false,
  pinHash: undefined,
  customIncomeSources: [],
  userName: undefined,
  currencyIncomes: [],
  currencySavings: [],
  purposes: [],
};

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Migration: if pinHash exists, ensure pinEnabled is true
        const pinEnabled = parsed.pinHash ? true : (parsed.pinEnabled || false);
        
        setSettings({ 
          ...defaultSettings, 
          ...parsed,
          customCategories: parsed.customCategories || [],
          customSubcategories: { ...defaultSettings.customSubcategories, ...parsed.customSubcategories },
          hiddenCategories: parsed.hiddenCategories || [],
          hasSeenAppTour: parsed.hasSeenAppTour || false,
          pinEnabled,
          pinHash: parsed.pinHash,
          customIncomeSources: parsed.customIncomeSources || [],
          userName: parsed.userName || undefined,
          currencyIncomes: parsed.currencyIncomes || [],
          currencySavings: parsed.currencySavings || [],
          purposes: parsed.purposes || [],
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, []);

  // Save to localStorage only after initial load is complete
  useEffect(() => {
    if (hasLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings, hasLoaded]);

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

  const completeAppTour = useCallback(() => {
    setSettings((prev) => ({ ...prev, hasSeenAppTour: true }));
  }, []);

  const resetAppTour = useCallback(() => {
    setSettings((prev) => ({ ...prev, hasSeenAppTour: false }));
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
    (parentCategory: string, subcategory: CustomCategory) => {
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
    (parentCategory: string, subcategoryId: string) => {
      setSettings((prev) => ({
        ...prev,
        customSubcategories: {
          ...prev.customSubcategories,
          [parentCategory]: (prev.customSubcategories[parentCategory] || []).filter(
            (s) => s.id !== subcategoryId
          ),
        },
      }));
    },
    []
  );

  const updateSubcategory = useCallback(
    (parentCategory: string, id: string, updates: Partial<CustomCategory>) => {
      setSettings((prev) => ({
        ...prev,
        customSubcategories: {
          ...prev.customSubcategories,
          [parentCategory]: (prev.customSubcategories[parentCategory] || []).map(
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

  const enablePin = useCallback((hashedPin: string) => {
    setSettings((prev) => ({
      ...prev,
      pinEnabled: true,
      pinHash: hashedPin,
    }));
  }, []);

  const disablePin = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      pinEnabled: false,
      pinHash: undefined,
    }));
  }, []);

  const updatePin = useCallback((newHashedPin: string) => {
    setSettings((prev) => ({
      ...prev,
      pinHash: newHashedPin,
    }));
  }, []);

  // Income source management
  const addIncomeSource = useCallback((source: CustomIncomeSource) => {
    setSettings((prev) => ({
      ...prev,
      customIncomeSources: [...prev.customIncomeSources, source],
    }));
  }, []);

  const removeIncomeSource = useCallback((sourceId: string) => {
    setSettings((prev) => ({
      ...prev,
      customIncomeSources: prev.customIncomeSources.filter((s) => s.id !== sourceId),
    }));
  }, []);

  const updateIncomeSource = useCallback((sourceId: string, updates: Partial<CustomIncomeSource>) => {
    setSettings((prev) => ({
      ...prev,
      customIncomeSources: prev.customIncomeSources.map((s) =>
        s.id === sourceId ? { ...s, ...updates } : s
      ),
    }));
  }, []);

  // Currency income management
  const addCurrencyIncome = useCallback((income: CurrencyIncome) => {
    setSettings((prev) => ({
      ...prev,
      currencyIncomes: [...(prev.currencyIncomes || []), income],
    }));
  }, []);

  const updateCurrencyIncome = useCallback((currency: string, amount: number) => {
    setSettings((prev) => ({
      ...prev,
      currencyIncomes: (prev.currencyIncomes || []).map((i) =>
        i.currency === currency ? { ...i, amount } : i
      ),
    }));
  }, []);

  const removeCurrencyIncome = useCallback((currency: string) => {
    setSettings((prev) => ({
      ...prev,
      currencyIncomes: (prev.currencyIncomes || []).filter((i) => i.currency !== currency),
    }));
  }, []);

  // Currency savings management
  const addCurrencySavings = useCallback((savings: CurrencySavings) => {
    setSettings((prev) => ({
      ...prev,
      currencySavings: [...(prev.currencySavings || []), savings],
    }));
  }, []);

  const updateCurrencySavings = useCallback((currency: string, amount: number) => {
    setSettings((prev) => ({
      ...prev,
      currencySavings: (prev.currencySavings || []).map((s) =>
        s.currency === currency ? { ...s, amount } : s
      ),
    }));
  }, []);

  const removeCurrencySavings = useCallback((currency: string) => {
    setSettings((prev) => ({
      ...prev,
      currencySavings: (prev.currencySavings || []).filter((s) => s.currency !== currency),
    }));
  }, []);

  // Purpose management
  const addPurpose = useCallback((purpose: Purpose) => {
    setSettings((prev) => ({
      ...prev,
      purposes: [...(prev.purposes || []), purpose],
    }));
  }, []);

  const updatePurpose = useCallback((id: string, updates: Partial<Purpose>) => {
    setSettings((prev) => ({
      ...prev,
      purposes: (prev.purposes || []).map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  }, []);

  const removePurpose = useCallback((id: string) => {
    setSettings((prev) => ({
      ...prev,
      purposes: (prev.purposes || []).filter((p) => p.id !== id),
    }));
  }, []);

  return {
    settings,
    isLoading,
    updateSettings,
    completeOnboarding,
    completeAppTour,
    resetAppTour,
    resetSettings,
    formatCurrency,
    addCustomCategory,
    removeCustomCategory,
    addCustomSubcategory,
    removeCustomSubcategory,
    updateSubcategory,
    hideCategory,
    showCategory,
    enablePin,
    disablePin,
    updatePin,
    addIncomeSource,
    removeIncomeSource,
    updateIncomeSource,
    addCurrencyIncome,
    updateCurrencyIncome,
    removeCurrencyIncome,
    addCurrencySavings,
    updateCurrencySavings,
    removeCurrencySavings,
    addPurpose,
    updatePurpose,
    removePurpose,
  };
};
