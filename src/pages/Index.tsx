import { useState } from "react";
import SplashScreen from "@/components/SplashScreen";
import Onboarding from "@/components/Onboarding";
import Dashboard from "@/components/Dashboard";
import AddExpense from "@/components/AddExpense";
import SettingsPanel from "@/components/SettingsPanel";
import ExpenseList from "@/components/ExpenseList";
import CategoryDetailView from "@/components/CategoryDetailView";
import IncomePanel from "@/components/IncomePanel";
import RecurringExpensesPanel from "@/components/RecurringExpensesPanel";
import CategoryManager from "@/components/CategoryManager";
import InstallPrompt from "@/components/InstallPrompt";
import PinLockScreen from "@/components/PinLockScreen";
import PinSetup from "@/components/PinSetup";
import { useExpenses } from "@/hooks/useExpenses";
import { useSettings } from "@/hooks/useSettings";
import { useIncome } from "@/hooks/useIncome";
import { useRecurringExpenses } from "@/hooks/useRecurringExpenses";
import { UserSettings, Category } from "@/types/expense";

type View = "dashboard" | "add-expense" | "settings" | "expense-list" | "category-detail" | "income" | "recurring" | "manage-categories" | "pin-setup";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);

  const { expenses, addExpense, updateExpense, deleteExpense, clearAllExpenses, importExpenses } = useExpenses();
  const { settings, isLoading, updateSettings, formatCurrency, resetSettings, addCustomCategory, removeCustomCategory, addCustomSubcategory, removeCustomSubcategory, updateSubcategory, hideCategory, showCategory, enablePin, disablePin, updatePin } = useSettings();
  const { incomes, addIncome, updateIncome, deleteIncome, stopRecurringIncome, getMonthlyIncome } = useIncome();
  const { recurringExpenses, addRecurringExpense, updateRecurringExpense, deleteRecurringExpense, toggleActive, getExpectedMonthlyTotal } = useRecurringExpenses();

  const handleClearAllData = () => {
    clearAllExpenses();
    resetSettings();
  };

  const handleViewCategory = (category: Category, date: Date) => {
    setSelectedCategory(category);
    setSelectedDate(date);
    setCurrentView("category-detail");
  };

  const handlePinSetupComplete = (hashedPin: string) => {
    if (isChangingPin) {
      updatePin(hashedPin);
    } else {
      enablePin(hashedPin);
    }
    setCurrentView("settings");
    setIsChangingPin(false);
  };

  const handleChangePin = () => {
    setIsChangingPin(settings.pinEnabled);
    setCurrentView("pin-setup");
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show PIN lock screen if PIN is enabled and not unlocked
  if (settings.pinEnabled && !isUnlocked && settings.pinHash && settings.hasCompletedOnboarding) {
    return (
      <PinLockScreen
        pinHash={settings.pinHash}
        onUnlock={() => setIsUnlocked(true)}
      />
    );
  }

  if (!settings.hasCompletedOnboarding) {
    return <Onboarding onComplete={(newSettings: Partial<UserSettings>) => updateSettings(newSettings)} />;
  }

  return (
    <>
      {currentView === "dashboard" && (
        <Dashboard
          expenses={expenses}
          formatCurrency={formatCurrency}
          defaultCurrency={settings.currency}
          defaultCurrencySymbol={settings.currencySymbol}
          onAddExpense={() => setCurrentView("add-expense")}
          onViewExpenses={() => setCurrentView("expense-list")}
          onOpenSettings={() => setCurrentView("settings")}
          onViewCategory={handleViewCategory}
          onViewIncome={() => setCurrentView("income")}
          onViewRecurring={() => setCurrentView("recurring")}
          monthlyIncome={getMonthlyIncome()}
        />
      )}

      {currentView === "add-expense" && (
        <AddExpense
          currencySymbol={settings.currencySymbol}
          currency={settings.currency}
          onSave={addExpense}
          onBack={() => setCurrentView("dashboard")}
          customSubcategories={settings.customSubcategories}
          hiddenCategories={settings.hiddenCategories}
        />
      )}

      {currentView === "settings" && (
        <SettingsPanel
          settings={settings}
          onUpdateSettings={updateSettings}
          onBack={() => setCurrentView("dashboard")}
          expenses={expenses}
          onClearAllData={handleClearAllData}
          onImportExpenses={importExpenses}
          onManageCategories={() => setCurrentView("manage-categories")}
          onViewIncome={() => setCurrentView("income")}
          onViewRecurring={() => setCurrentView("recurring")}
          onEnablePin={enablePin}
          onDisablePin={disablePin}
          onChangePin={handleChangePin}
        />
      )}

      {currentView === "expense-list" && (
        <ExpenseList
          expenses={expenses}
          formatCurrency={formatCurrency}
          currencySymbol={settings.currencySymbol}
          defaultCurrency={settings.currency}
          onBack={() => setCurrentView("dashboard")}
          onUpdateExpense={updateExpense}
          onDeleteExpense={deleteExpense}
        />
      )}

      {currentView === "category-detail" && selectedCategory && (
        <CategoryDetailView
          category={selectedCategory}
          selectedDate={selectedDate}
          expenses={expenses}
          formatCurrency={formatCurrency}
          defaultCurrencySymbol={settings.currencySymbol}
          onBack={() => setCurrentView("dashboard")}
          onChangeMonth={setSelectedDate}
        />
      )}

      {currentView === "income" && (
        <IncomePanel
          incomes={incomes}
          formatCurrency={formatCurrency}
          currencySymbol={settings.currencySymbol}
          onAddIncome={addIncome}
          onUpdateIncome={updateIncome}
          onDeleteIncome={deleteIncome}
          onStopRecurring={stopRecurringIncome}
          getMonthlyIncome={getMonthlyIncome}
          onBack={() => setCurrentView("dashboard")}
        />
      )}

      {currentView === "recurring" && (
        <RecurringExpensesPanel
          recurringExpenses={recurringExpenses}
          formatCurrency={formatCurrency}
          currencySymbol={settings.currencySymbol}
          onAdd={addRecurringExpense}
          onUpdate={updateRecurringExpense}
          onDelete={deleteRecurringExpense}
          onToggleActive={toggleActive}
          getExpectedMonthlyTotal={getExpectedMonthlyTotal}
          onBack={() => setCurrentView("dashboard")}
        />
      )}

      {currentView === "manage-categories" && (
        <CategoryManager
          customCategories={settings.customCategories}
          customSubcategories={settings.customSubcategories}
          hiddenCategories={settings.hiddenCategories}
          onAddCategory={addCustomCategory}
          onRemoveCategory={removeCustomCategory}
          onAddSubcategory={addCustomSubcategory}
          onRemoveSubcategory={removeCustomSubcategory}
          onUpdateSubcategory={updateSubcategory}
          onHideCategory={hideCategory}
          onShowCategory={showCategory}
          onBack={() => setCurrentView("settings")}
        />
      )}

      {currentView === "pin-setup" && (
        <PinSetup
          onComplete={handlePinSetupComplete}
          onCancel={() => {
            setCurrentView("settings");
            setIsChangingPin(false);
          }}
          isChangingPin={isChangingPin}
        />
      )}

      <InstallPrompt />
    </>
  );
};

export default Index;
