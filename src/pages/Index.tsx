import { useState } from "react";
import SplashScreen from "@/components/SplashScreen";
import Onboarding from "@/components/Onboarding";
import Dashboard from "@/components/Dashboard";
import AddExpense from "@/components/AddExpense";
import SettingsPanel from "@/components/SettingsPanel";
import ExpenseList from "@/components/ExpenseList";
import { useExpenses } from "@/hooks/useExpenses";
import { useSettings } from "@/hooks/useSettings";
import { UserSettings } from "@/types/expense";

type View = "dashboard" | "add-expense" | "settings" | "expense-list";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState<View>("dashboard");
  
  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses();
  const { settings, isLoading, updateSettings, formatCurrency } = useSettings();

  // Show splash screen
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show onboarding if not completed
  if (!settings.hasCompletedOnboarding) {
    return (
      <Onboarding
        onComplete={(newSettings: Partial<UserSettings>) => {
          updateSettings(newSettings);
        }}
      />
    );
  }

  // Main app views
  return (
    <>
      {currentView === "dashboard" && (
        <Dashboard
          expenses={expenses}
          formatCurrency={formatCurrency}
          onAddExpense={() => setCurrentView("add-expense")}
          onViewExpenses={() => setCurrentView("expense-list")}
          onOpenSettings={() => setCurrentView("settings")}
        />
      )}

      {currentView === "add-expense" && (
        <AddExpense
          currencySymbol={settings.currencySymbol}
          onSave={addExpense}
          onBack={() => setCurrentView("dashboard")}
        />
      )}

      {currentView === "settings" && (
        <SettingsPanel
          settings={settings}
          onUpdateSettings={updateSettings}
          onBack={() => setCurrentView("dashboard")}
        />
      )}

      {currentView === "expense-list" && (
        <ExpenseList
          expenses={expenses}
          formatCurrency={formatCurrency}
          currencySymbol={settings.currencySymbol}
          onBack={() => setCurrentView("dashboard")}
          onUpdateExpense={updateExpense}
          onDeleteExpense={deleteExpense}
        />
      )}
    </>
  );
};

export default Index;
