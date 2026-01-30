import { useState, useEffect } from "react";
import SplashScreen from "@/components/SplashScreen";
import Onboarding from "@/components/Onboarding";
import AppOnboarding from "@/components/AppOnboarding";
import Dashboard from "@/components/Dashboard";
import AddExpense from "@/components/AddExpense";
import SettingsPanel from "@/components/SettingsPanel";
import FinanceMenu from "@/components/FinanceMenu";
import ExpenseList from "@/components/ExpenseList";
import CategoryDetailView from "@/components/CategoryDetailView";
import IncomePanel from "@/components/IncomePanel";
import RecurringExpensesPanel from "@/components/RecurringExpensesPanel";
import CategoryManager from "@/components/CategoryManager";
import PurposeManager from "@/components/PurposeManager";
import PurposeDetailView from "@/components/PurposeDetailView";
import InstallPrompt from "@/components/InstallPrompt";
import PinLockScreen from "@/components/PinLockScreen";
import PinSetup from "@/components/PinSetup";
import Privacy from "@/pages/Privacy";
import UpgradeScreen from "@/components/UpgradeScreen";
import FreemiumGate from "@/components/FreemiumGate";
import { useExpenses } from "@/hooks/useExpenses";
import { useSettings } from "@/hooks/useSettings";
import { useIncome } from "@/hooks/useIncome";
import { useRecurringExpenses } from "@/hooks/useRecurringExpenses";
import { useSubscription } from "@/hooks/useSubscription";
import { useBackButton, exitApp } from "@/hooks/useBackButton";
import { UserSettings, Category } from "@/types/expense";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type View = "dashboard" | "add-expense" | "settings" | "finance-menu" | "expense-list" | "category-detail" | "income" | "recurring" | "manage-categories" | "manage-purposes" | "purpose-detail" | "pin-setup" | "privacy" | "app-tour" | "upgrade";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedPurposeId, setSelectedPurposeId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dashboardDate, setDashboardDate] = useState(new Date());
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showFreemiumGate, setShowFreemiumGate] = useState(false);
  const [gatedFeatureName, setGatedFeatureName] = useState("");

  const { expenses, addExpense, updateExpense, deleteExpense, clearAllExpenses, importExpenses, migrateExpensesCurrency, hasLoaded: expensesLoaded } = useExpenses();
  const { settings, isLoading, updateSettings, formatCurrency, resetSettings, addCustomCategory, removeCustomCategory, addCustomSubcategory, removeCustomSubcategory, updateSubcategory, hideCategory, showCategory, enablePin, disablePin, updatePin, completeAppTour, resetAppTour, addIncomeSource, removeIncomeSource, updateIncomeSource, addCurrencyIncome, updateCurrencyIncome, removeCurrencyIncome, addCurrencySavings, updateCurrencySavings, removeCurrencySavings, addPurpose, updatePurpose, removePurpose } = useSettings();
  const { incomes, addIncome, updateIncome, deleteIncome, stopRecurringIncome, getMonthlyIncome } = useIncome();
  const { recurringExpenses, addRecurringExpense, updateRecurringExpense, deleteRecurringExpense, toggleActive, getExpectedMonthlyTotal, markAsGenerated } = useRecurringExpenses();
  const { tier: subscriptionTier, featureAccess, hasFeature, startTrial, upgradeToPaid, isTrialActive, isPaid, getTrialDaysRemaining, trialUsed, acknowledgeDataProtection, resetSubscription } = useSubscription();

  // Handle back button navigation
  const getBackHandler = () => {
    switch (currentView) {
      case "add-expense":
      case "settings":
      case "finance-menu":
      case "expense-list":
      case "income":
      case "recurring":
        return () => setCurrentView("dashboard");
      case "category-detail":
      case "purpose-detail":
        return () => setCurrentView("dashboard");
      case "manage-categories":
      case "manage-purposes":
        return () => setCurrentView("finance-menu");
      case "privacy":
        return () => setCurrentView("settings");
      case "upgrade":
        return () => setCurrentView("settings");
      case "pin-setup":
        return () => {
          setCurrentView("settings");
          setIsChangingPin(false);
        };
      default:
        return undefined;
    }
  };

  useBackButton({
    onBack: getBackHandler(),
    isHome: currentView === "dashboard",
    onExitRequest: () => setShowExitDialog(true),
  });

  // Migrate expenses with missing currency once both are loaded
  useEffect(() => {
    if (expensesLoaded && !isLoading && settings.currency && settings.currencySymbol) {
      migrateExpensesCurrency(settings.currency, settings.currencySymbol);
    }
  }, [expensesLoaded, isLoading, settings.currency, settings.currencySymbol, migrateExpensesCurrency]);

  const handleClearAllData = () => {
    clearAllExpenses();
    resetSettings();
    resetSubscription();
  };

  // Handle freemium gate
  const showGate = (featureName: string) => {
    setGatedFeatureName(featureName);
    setShowFreemiumGate(true);
  };

  // Handle start trial
  const handleStartTrial = () => {
    const success = startTrial();
    if (success) {
      toast.success("7-day trial started! Enjoy all Freemium features.");
      setCurrentView("settings");
    } else {
      toast.error("Trial has already been used.");
    }
  };

  const handleViewCategory = (category: Category, date: Date) => {
    setSelectedCategory(category);
    setSelectedDate(date);
    setCurrentView("category-detail");
  };

  const handleViewPurpose = (purposeId: string) => {
    setSelectedPurposeId(purposeId);
    setCurrentView("purpose-detail");
  };

  const handleViewExpenses = (date: Date) => {
    setDashboardDate(date);
    setCurrentView("expense-list");
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

  const handleAppTourComplete = () => {
    completeAppTour();
    setCurrentView("dashboard");
  };

  const handleViewAppTour = () => {
    resetAppTour();
    setCurrentView("app-tour");
  };

  const handleExitApp = () => {
    setShowExitDialog(false);
    exitApp();
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
    return (
      <Onboarding 
        onComplete={(newSettings: Partial<UserSettings>) => updateSettings(newSettings)} 
        onAcknowledgeData={acknowledgeDataProtection}
      />
    );
  }

  // Show app tour on first launch after onboarding
  if (!settings.hasSeenAppTour || currentView === "app-tour") {
    return (
      <AppOnboarding
        onComplete={handleAppTourComplete}
        onSkip={handleAppTourComplete}
      />
    );
  }

  const selectedPurpose = settings.purposes?.find(p => p.id === selectedPurposeId);

  return (
    <>
      {currentView === "dashboard" && (
        <Dashboard
          expenses={expenses}
          formatCurrency={formatCurrency}
          defaultCurrency={settings.currency}
          defaultCurrencySymbol={settings.currencySymbol}
          onAddExpense={() => setCurrentView("add-expense")}
          onViewExpenses={handleViewExpenses}
          onOpenSettings={() => setCurrentView("settings")}
          onOpenFinanceMenu={() => setCurrentView("finance-menu")}
          onViewCategory={handleViewCategory}
          onViewRecurring={() => setCurrentView("recurring")}
          onViewPurpose={handleViewPurpose}
          userName={settings.userName}
          customCategories={settings.customCategories}
          currencySavings={settings.currencySavings}
          country={settings.country}
          purposes={settings.purposes}
          incomes={incomes}
          recurringExpenses={recurringExpenses}
          onMarkRecurringAsGenerated={markAsGenerated}
          onAddExpenseFromRecurring={(data) => {
            // Check if expense already exists for this recurring on this date
            const existingExpense = expenses.find(e => 
              e.recurringId === data.recurringId && 
              new Date(e.date).toDateString() === new Date(data.date).toDateString()
            );
            if (!existingExpense) {
              addExpense(data);
            }
          }}
          showUpcomingPayments={settings.showUpcomingPayments}
          showSpendingByCategory={settings.showSpendingByCategory}
          showMonthlySpending={settings.showMonthlySpending}
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
          customCategories={settings.customCategories}
          country={settings.country}
          purposes={featureAccess.assignPurposeToExpenses ? settings.purposes : []}
          canUseMultipleCurrencies={featureAccess.useMultipleCurrencies}
          onShowFreemiumGate={() => showGate("Multiple currencies")}
        />
      )}

      {currentView === "settings" && (
        <SettingsPanel
          settings={settings}
          onUpdateSettings={updateSettings}
          onBack={() => setCurrentView("dashboard")}
          expenses={expenses}
          onEnablePin={enablePin}
          onDisablePin={disablePin}
          onChangePin={handleChangePin}
          onViewPrivacy={() => setCurrentView("privacy")}
          onViewAppTour={handleViewAppTour}
          onResetApp={handleClearAllData}
          onViewUpgrade={() => setCurrentView("upgrade")}
          subscriptionTier={subscriptionTier}
          trialDaysRemaining={getTrialDaysRemaining()}
        />
      )}

      {currentView === "finance-menu" && (
        <FinanceMenu
          settings={settings}
          onUpdateSettings={updateSettings}
          onBack={() => setCurrentView("dashboard")}
          expenses={expenses}
          onImportExpenses={importExpenses}
          onManageCategories={() => setCurrentView("manage-categories")}
          onManagePurposes={() => {
            if (featureAccess.managePurposes) {
              setCurrentView("manage-purposes");
            } else {
              showGate("Manage purposes");
            }
          }}
          onViewIncome={() => setCurrentView("income")}
          onViewRecurring={() => setCurrentView("recurring")}
          onAddCurrencyIncome={addCurrencyIncome}
          onUpdateCurrencyIncome={updateCurrencyIncome}
          onRemoveCurrencyIncome={removeCurrencyIncome}
          onAddCurrencySavings={addCurrencySavings}
          onUpdateCurrencySavings={updateCurrencySavings}
          onRemoveCurrencySavings={removeCurrencySavings}
          featureAccess={featureAccess}
          onShowFreemiumGate={showGate}
        />
      )}

      {currentView === "expense-list" && (
        <ExpenseList
          expenses={expenses}
          formatCurrency={formatCurrency}
          currencySymbol={settings.currencySymbol}
          defaultCurrency={settings.currency}
          onBack={() => setCurrentView("dashboard")}
          selectedDate={dashboardDate}
          onUpdateExpense={updateExpense}
          onDeleteExpense={deleteExpense}
          customCategories={settings.customCategories}
          customSubcategories={settings.customSubcategories}
          purposes={settings.purposes}
          canUseMultipleCurrencies={featureAccess.useMultipleCurrencies}
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

      {currentView === "purpose-detail" && selectedPurpose && (
        <PurposeDetailView
          purpose={selectedPurpose}
          expenses={expenses}
          formatCurrency={formatCurrency}
          defaultCurrencySymbol={settings.currencySymbol}
          onBack={() => setCurrentView("dashboard")}
          customCategories={settings.customCategories}
          customSubcategories={settings.customSubcategories}
        />
      )}

      {currentView === "income" && (
        <IncomePanel
          incomes={incomes}
          formatCurrency={formatCurrency}
          currencySymbol={settings.currencySymbol}
          customIncomeSources={settings.customIncomeSources}
          onAddIncome={addIncome}
          onUpdateIncome={updateIncome}
          onDeleteIncome={deleteIncome}
          onStopRecurring={stopRecurringIncome}
          getMonthlyIncome={getMonthlyIncome}
          onBack={() => setCurrentView("finance-menu")}
          onAddIncomeSource={addIncomeSource}
          onRemoveIncomeSource={removeIncomeSource}
          onUpdateIncomeSource={updateIncomeSource}
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
          onBack={() => setCurrentView("finance-menu")}
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
          onBack={() => setCurrentView("finance-menu")}
        />
      )}

      {currentView === "manage-purposes" && (
        <PurposeManager
          purposes={settings.purposes || []}
          onAddPurpose={addPurpose}
          onUpdatePurpose={updatePurpose}
          onRemovePurpose={removePurpose}
          onBack={() => setCurrentView("finance-menu")}
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

      {currentView === "privacy" && (
        <Privacy onBack={() => setCurrentView("settings")} />
      )}

      {currentView === "upgrade" && (
        <UpgradeScreen
          onBack={() => setCurrentView("settings")}
          onStartTrial={handleStartTrial}
          onUpgradeToPaid={upgradeToPaid}
          trialUsed={trialUsed}
          isTrialActive={isTrialActive()}
          trialDaysRemaining={getTrialDaysRemaining()}
          isPaid={isPaid()}
        />
      )}

      <InstallPrompt />

      {/* Freemium Gate Dialog */}
      <FreemiumGate
        open={showFreemiumGate}
        onOpenChange={setShowFreemiumGate}
        featureName={gatedFeatureName}
        onUpgrade={() => {
          setShowFreemiumGate(false);
          setCurrentView("upgrade");
        }}
      />

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="max-w-[90%] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Exit App?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to exit MEET?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl"
              onClick={handleExitApp}
            >
              Exit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default Index;