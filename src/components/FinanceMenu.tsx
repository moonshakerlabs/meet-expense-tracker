import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserSettings, CURRENCIES, COUNTRIES, Expense, CurrencyIncome, CurrencySavings } from "@/types/expense";
import { ArrowLeft, Check, ChevronRight, Download, FileJson, Calendar, Upload, Wallet, RefreshCw, FolderOpen, Globe, Plus, X, FileText, PiggyBank, Pencil, Trash2, Target, DollarSign } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRef, useState, useCallback } from "react";
import { exportToCSV, exportToJSON, exportToCSVFiltered, importFromCSV } from "@/lib/exportUtils";
import { exportToPDF } from "@/lib/pdfExport";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FinanceMenuProps {
  settings: UserSettings;
  onUpdateSettings: (updates: Partial<UserSettings>) => void;
  onBack: () => void;
  expenses: Expense[];
  onImportExpenses: (expenses: Omit<Expense, 'id' | 'syncStatus'>[]) => number;
  onManageCategories?: () => void;
  onManagePurposes?: () => void;
  onViewIncome?: () => void;
  onViewRecurring?: () => void;
  onAddCurrencyIncome?: (income: CurrencyIncome) => void;
  onUpdateCurrencyIncome?: (currency: string, amount: number) => void;
  onRemoveCurrencyIncome?: (currency: string) => void;
  onAddCurrencySavings?: (savings: CurrencySavings) => void;
  onUpdateCurrencySavings?: (currency: string, amount: number) => void;
  onRemoveCurrencySavings?: (currency: string) => void;
}

const FinanceMenu = ({ 
  settings, 
  onUpdateSettings, 
  onBack, 
  expenses, 
  onImportExpenses, 
  onManageCategories, 
  onManagePurposes,
  onViewIncome, 
  onViewRecurring,
  onAddCurrencyIncome,
  onUpdateCurrencyIncome,
  onRemoveCurrencyIncome,
  onAddCurrencySavings,
  onUpdateCurrencySavings,
  onRemoveCurrencySavings,
}: FinanceMenuProps) => {
  const [showCurrencySheet, setShowCurrencySheet] = useState(false);
  const [showCountrySheet, setShowCountrySheet] = useState(false);
  const [showTimelineSheet, setShowTimelineSheet] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // PDF export state
  const [showPdfSheet, setShowPdfSheet] = useState(false);
  const [pdfStartDate, setPdfStartDate] = useState<Date | undefined>(undefined);
  const [pdfEndDate, setPdfEndDate] = useState<Date | undefined>(undefined);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  
  // Savings state
  const [showSavingsSheet, setShowSavingsSheet] = useState(false);
  const [selectedSavingsCurrency, setSelectedSavingsCurrency] = useState("");
  const [savingsAmount, setSavingsAmount] = useState("");
  const [editingSavings, setEditingSavings] = useState<string | null>(null);

  const processCSVContent = useCallback((content: string) => {
    const { expenses: parsedExpenses, result } = importFromCSV(content);

    if (!result.success) {
      toast.error(result.errors[0] || "Failed to import CSV");
      return;
    }

    const imported = onImportExpenses(parsedExpenses);
    
    if (result.skipped > 0) {
      toast.success(`Imported ${imported} expenses (${result.skipped} skipped)`);
    } else {
      toast.success(`Imported ${imported} expenses`);
    }
  }, [onImportExpenses]);

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        toast.error("Failed to read file");
        return;
      }
      processCSVContent(content);
    };

    reader.onerror = () => {
      toast.error("Failed to read file");
    };

    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportClick = async () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) {
      toast.error("No expenses to export");
      return;
    }
    exportToCSV(expenses, settings.currency);
    toast.success(`Exported ${expenses.length} expenses as CSV`);
  };

  const handleExportJSON = () => {
    if (expenses.length === 0) {
      toast.error("No expenses to export");
      return;
    }
    exportToJSON(expenses, settings.currencySymbol, settings.currency);
    toast.success(`Exported ${expenses.length} expenses as JSON`);
  };

  const handleExportPDF = async () => {
    setIsExportingPdf(true);
    try {
      const success = await exportToPDF({
        expenses,
        currencyIncomes: settings.currencyIncomes || [],
        defaultCurrency: settings.currency,
        defaultCurrencySymbol: settings.currencySymbol,
        monthlyIncome: settings.monthlyIncome || 0,
        startDate: pdfStartDate,
        endDate: pdfEndDate,
      });
      if (success) {
        toast.success("PDF report exported successfully");
        setShowPdfSheet(false);
        setPdfStartDate(undefined);
        setPdfEndDate(undefined);
      }
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportFiltered = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }
    
    const filtered = expenses.filter((exp) => {
      const expDate = new Date(exp.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return expDate >= start && expDate <= end;
    });

    if (filtered.length === 0) {
      toast.error("No expenses found in selected date range");
      return;
    }

    exportToCSVFiltered(expenses, settings.currency, startDate, endDate);
    toast.success(`Exported ${filtered.length} expenses`);
    setShowTimelineSheet(false);
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const handleCountryChange = (countryCode: string) => {
    const country = COUNTRIES.find(c => c.code === countryCode);
    if (country) {
      const updates: Partial<UserSettings> = { country: countryCode };
      const currencyExists = CURRENCIES.find(c => c.code === country.currency);
      if (currencyExists) {
        updates.currency = country.currency;
        updates.currencySymbol = currencyExists.symbol;
      }
      if (!country.languages.includes(settings.language)) {
        updates.language = country.languages[0];
      }
      onUpdateSettings(updates);
    }
    setShowCountrySheet(false);
  };

  // Savings handlers
  const handleAddSavings = () => {
    if (!selectedSavingsCurrency || !savingsAmount) {
      toast.error("Please select a currency and enter an amount");
      return;
    }
    const amount = parseFloat(savingsAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    const currencyData = CURRENCIES.find(c => c.code === selectedSavingsCurrency);
    if (!currencyData) return;
    
    if (settings.currencySavings?.some(s => s.currency === selectedSavingsCurrency)) {
      toast.error("Savings for this currency already exists. Edit the existing entry.");
      return;
    }
    
    onAddCurrencySavings?.({
      currency: selectedSavingsCurrency,
      currencySymbol: currencyData.symbol,
      amount,
    });
    toast.success(`Savings added for ${currencyData.name}`);
    setSelectedSavingsCurrency("");
    setSavingsAmount("");
    setShowSavingsSheet(false);
  };

  const handleUpdateSavings = () => {
    if (!editingSavings || !savingsAmount) return;
    const amount = parseFloat(savingsAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    onUpdateCurrencySavings?.(editingSavings, amount);
    toast.success("Savings updated");
    setEditingSavings(null);
    setSavingsAmount("");
  };

  const handleRemoveSavings = (currency: string) => {
    onRemoveCurrencySavings?.(currency);
    toast.success("Savings removed");
  };

  const currentCurrency = CURRENCIES.find((c) => c.code === settings.currency);
  const currentCountry = COUNTRIES.find((c) => c.code === settings.country);
  
  const availableCurrenciesForSavings = CURRENCIES.filter(
    c => !settings.currencySavings?.some(s => s.currency === c.code)
  );

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={onBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display font-bold text-xl">Finance Management</h1>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Country & Currency */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            Region
          </h3>
          <Card className="rounded-2xl divide-y divide-border">
            {/* Country */}
            <button
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
              onClick={() => setShowCountrySheet(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Country</p>
                  <p className="text-sm text-muted-foreground">
                    {currentCountry ? `${currentCountry.flag} ${currentCountry.name}` : "Select country"}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Currency */}
            <button
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
              onClick={() => setShowCurrencySheet(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {currentCurrency?.symbol}
                  </span>
                </div>
                <div className="text-left">
                  <p className="font-medium">Currency</p>
                  <p className="text-sm text-muted-foreground">
                    {currentCurrency?.name}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </Card>
        </div>

        {/* Income */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            Income
          </h3>
          <Card className="rounded-2xl divide-y divide-border">
            <button
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
              onClick={onViewIncome}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Monthly Income</p>
                  <p className="text-sm text-muted-foreground">
                    Manage income sources
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
              onClick={onViewIncome}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-teal-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Income by Category</p>
                  <p className="text-sm text-muted-foreground">
                    Track income categories
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </Card>
        </div>

        {/* Management */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            Management
          </h3>
          <Card className="rounded-2xl divide-y divide-border">
            <button
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
              onClick={onManagePurposes}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-orange-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Manage Purposes</p>
                  <p className="text-sm text-muted-foreground">
                    Add expense purposes
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
              onClick={onManageCategories}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Manage Categories</p>
                  <p className="text-sm text-muted-foreground">
                    Add custom categories
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
              onClick={onViewRecurring}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Recurring Expenses</p>
                  <p className="text-sm text-muted-foreground">
                    Manage recurring payments
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </Card>
        </div>

        {/* Savings by Currency */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            Savings by Currency
          </h3>
          <Card className="rounded-2xl">
            {settings.currencySavings && settings.currencySavings.length > 0 && (
              <div className="divide-y divide-border">
                {settings.currencySavings.map((saving) => (
                  <div key={saving.currency} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <PiggyBank className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {CURRENCIES.find(c => c.code === saving.currency)?.name || saving.currency}
                        </p>
                        {editingSavings === saving.currency ? (
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              type="number"
                              value={savingsAmount}
                              onChange={(e) => setSavingsAmount(e.target.value)}
                              className="w-28 h-8 text-sm"
                              placeholder="Amount"
                              min="0"
                              step="0.01"
                            />
                            <Button size="sm" className="h-8" onClick={handleUpdateSavings}>
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8"
                              onClick={() => {
                                setEditingSavings(null);
                                setSavingsAmount("");
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {saving.currencySymbol}{saving.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        )}
                      </div>
                    </div>
                    {editingSavings !== saving.currency && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingSavings(saving.currency);
                            setSavingsAmount(saving.amount.toString());
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveSavings(saving.currency)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <button
              className={cn(
                "w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors",
                settings.currencySavings && settings.currencySavings.length > 0 && "border-t border-border"
              )}
              onClick={() => setShowSavingsSheet(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Add Savings</p>
                  <p className="text-sm text-muted-foreground">
                    Track savings for a currency
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </Card>
        </div>

        {/* Export Reports */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            Export Reports
          </h3>
          <Card className="rounded-2xl divide-y divide-border">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,text/csv,text/comma-separated-values,application/csv,text/plain,*/*"
              onChange={handleImportCSV}
              className="hidden"
            />
            
            <button
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
              onClick={handleImportClick}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-orange-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Import from CSV</p>
                  <p className="text-sm text-muted-foreground">
                    Restore exported data
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            
            <button
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors disabled:opacity-50"
              onClick={handleExportCSV}
              disabled={expenses.length === 0}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Download className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Export as CSV</p>
                  <p className="text-sm text-muted-foreground">
                    {expenses.length} expenses
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors disabled:opacity-50"
              onClick={handleExportJSON}
              disabled={expenses.length === 0}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <FileJson className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Export as JSON</p>
                  <p className="text-sm text-muted-foreground">
                    {expenses.length} expenses
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors disabled:opacity-50"
              onClick={() => setShowPdfSheet(true)}
              disabled={expenses.length === 0}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-red-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Export PDF Report</p>
                  <p className="text-sm text-muted-foreground">
                    Full report with currency conversion
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors disabled:opacity-50"
              onClick={() => setShowTimelineSheet(true)}
              disabled={expenses.length === 0}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Export by Date Range</p>
                  <p className="text-sm text-muted-foreground">
                    Select specific timeline
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </Card>
        </div>
      </div>

      {/* Currency Sheet */}
      <Sheet open={showCurrencySheet} onOpenChange={setShowCurrencySheet}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="mb-4">
            <SheetTitle>Select Currency</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-2 pb-8 max-h-[60vh] overflow-y-auto">
            {CURRENCIES.map((currency) => (
              <Card
                key={currency.code}
                className={`p-3 cursor-pointer transition-all duration-200 ${
                  settings.currency === currency.code
                    ? "ring-2 ring-primary bg-primary/5"
                    : "hover:bg-secondary"
                }`}
                onClick={() => {
                  onUpdateSettings({
                    currency: currency.code,
                    currencySymbol: currency.symbol,
                  });
                  setShowCurrencySheet(false);
                }}
              >
                <div className="text-center">
                  <p className="font-bold text-lg">{currency.symbol}</p>
                  <p className="text-xs text-muted-foreground">{currency.code}</p>
                  {settings.currency === currency.code && (
                    <Check className="w-4 h-4 text-primary mx-auto mt-1" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Country Sheet */}
      <Sheet open={showCountrySheet} onOpenChange={setShowCountrySheet}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="mb-4">
            <SheetTitle>Select Country</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[50vh] pb-8">
            <div className="space-y-2 pr-4">
              {COUNTRIES.map((country) => (
                <Card
                  key={country.code}
                  className={`p-3 cursor-pointer transition-all duration-200 ${
                    settings.country === country.code
                      ? "ring-2 ring-primary bg-primary/5"
                      : "hover:bg-secondary"
                  }`}
                  onClick={() => handleCountryChange(country.code)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{country.flag}</span>
                      <div>
                        <p className="font-medium">{country.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {CURRENCIES.find(c => c.code === country.currency)?.name}
                        </p>
                      </div>
                    </div>
                    {settings.country === country.code && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Timeline Sheet */}
      <Sheet open={showTimelineSheet} onOpenChange={(open) => {
        setShowTimelineSheet(open);
        if (!open) {
          setStartDate(undefined);
          setEndDate(undefined);
        }
      }}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="mb-4">
            <SheetTitle>Export by Date Range</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pb-8">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  From Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "MMM d, yyyy") : "Select"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  To Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "MMM d, yyyy") : "Select"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleExportFiltered}
              disabled={!startDate || !endDate}
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Savings Sheet */}
      <Sheet open={showSavingsSheet} onOpenChange={(open) => {
        setShowSavingsSheet(open);
        if (!open) {
          setSelectedSavingsCurrency("");
          setSavingsAmount("");
        }
      }}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="mb-4">
            <SheetTitle>Add Savings</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pb-8">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Currency
              </label>
              <ScrollArea className="h-48 rounded-xl border border-border">
                <div className="p-2 space-y-1">
                  {availableCurrenciesForSavings.map((currency) => (
                    <Card
                      key={currency.code}
                      className={cn(
                        "p-3 cursor-pointer transition-all duration-200",
                        selectedSavingsCurrency === currency.code
                          ? "ring-2 ring-primary bg-primary/5"
                          : "hover:bg-secondary"
                      )}
                      onClick={() => setSelectedSavingsCurrency(currency.code)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold">{currency.symbol}</span>
                          <span className="text-sm">{currency.name}</span>
                        </div>
                        {selectedSavingsCurrency === currency.code && (
                          <Check className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Savings Amount
              </label>
              <Input
                type="number"
                value={savingsAmount}
                onChange={(e) => setSavingsAmount(e.target.value)}
                placeholder="Enter amount"
                min="0"
                step="0.01"
                className="h-12"
              />
            </div>
            <Button
              className="w-full h-12"
              onClick={handleAddSavings}
              disabled={!selectedSavingsCurrency || !savingsAmount}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Savings
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* PDF Export Sheet */}
      <Sheet open={showPdfSheet} onOpenChange={(open) => {
        setShowPdfSheet(open);
        if (!open) {
          setPdfStartDate(undefined);
          setPdfEndDate(undefined);
        }
      }}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="mb-4">
            <SheetTitle>Export PDF Report</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pb-8">
            <p className="text-sm text-muted-foreground">
              Generate a comprehensive PDF report with:
            </p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Income by currency</li>
              <li>Expenses by currency</li>
              <li>Category breakdown per currency</li>
              <li>Savings calculation</li>
              <li>Converted totals in your default currency ({settings.currency})</li>
            </ul>
            
            <div className="space-y-3 pt-2">
              <p className="text-sm font-medium">Date Range (optional)</p>
              <div className="grid grid-cols-2 gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal h-12",
                        !pdfStartDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {pdfStartDate ? format(pdfStartDate, "MMM d, yyyy") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={pdfStartDate}
                      onSelect={setPdfStartDate}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal h-12",
                        !pdfEndDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {pdfEndDate ? format(pdfEndDate, "MMM d, yyyy") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      mode="single"
                      selected={pdfEndDate}
                      onSelect={setPdfEndDate}
                      disabled={(date) => date > new Date() || (pdfStartDate ? date < pdfStartDate : false)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Button
              className="w-full h-12"
              onClick={handleExportPDF}
              disabled={isExportingPdf}
            >
              {isExportingPdf ? (
                <>Generating PDF...</>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate PDF Report
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default FinanceMenu;
