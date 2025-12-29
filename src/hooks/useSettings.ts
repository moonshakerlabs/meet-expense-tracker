import { useState, useEffect, useCallback } from "react";
import { UserSettings } from "@/types/expense";

const STORAGE_KEY = "meet_settings";

const defaultSettings: UserSettings = {
  currency: "USD",
  currencySymbol: "$",
  theme: "system",
  hasCompletedOnboarding: false,
  googleConnected: false,
};

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
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
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.toggle("dark", prefersDark);
      } else {
        root.classList.toggle("dark", settings.theme === "dark");
      }
    };

    applyTheme();

    // Listen for system theme changes
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

  return {
    settings,
    isLoading,
    updateSettings,
    completeOnboarding,
    resetSettings,
    formatCurrency,
  };
};
