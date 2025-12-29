import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserSettings, CURRENCIES, Expense } from "@/types/expense";
import { ArrowLeft, Check, Sun, Moon, Smartphone, ChevronRight, Download, FileJson, Trash2, Calendar, AlertTriangle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { exportToCSV, exportToJSON, exportToCSVFiltered } from "@/lib/exportUtils";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SettingsPanelProps {
  settings: UserSettings;
  onUpdateSettings: (updates: Partial<UserSettings>) => void;
  onBack: () => void;
  expenses: Expense[];
  onClearAllData: () => void;
}

const SettingsPanel = ({ settings, onUpdateSettings, onBack, expenses, onClearAllData }: SettingsPanelProps) => {
  const [showCurrencySheet, setShowCurrencySheet] = useState(false);
  const [showThemeSheet, setShowThemeSheet] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showTimelineSheet, setShowTimelineSheet] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [clearStep, setClearStep] = useState<"warning" | "confirm">("warning");

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

  const handleExportAllThenClear = () => {
    if (expenses.length > 0) {
      exportToCSV(expenses, settings.currency);
      toast.success(`Exported ${expenses.length} expenses`);
    }
    setClearStep("confirm");
  };

  const handleExportTimelineThenClear = () => {
    setShowClearDialog(false);
    setShowTimelineSheet(true);
  };

  const handleConfirmClear = () => {
    onClearAllData();
    setShowClearDialog(false);
    setClearStep("warning");
    toast.success("All data cleared successfully");
  };

  const handleCancelClear = () => {
    setShowClearDialog(false);
    setClearStep("warning");
  };

  const currentCurrency = CURRENCIES.find((c) => c.code === settings.currency);

  const themes = [
    { id: "light" as const, icon: Sun, label: "Light", desc: "Clean & bright" },
    { id: "dark" as const, icon: Moon, label: "Dark", desc: "Elegant night mode" },
    { id: "system" as const, icon: Smartphone, label: "System", desc: "Match device" },
  ];

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
          <h1 className="font-display font-bold text-xl">Settings</h1>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Preferences */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            Preferences
          </h3>
          <Card className="rounded-2xl divide-y divide-border">
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

            <button
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
              onClick={() => setShowThemeSheet(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  {settings.theme === "light" && <Sun className="w-5 h-5" />}
                  {settings.theme === "dark" && <Moon className="w-5 h-5" />}
                  {settings.theme === "system" && <Smartphone className="w-5 h-5" />}
                </div>
                <div className="text-left">
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {settings.theme}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </Card>
        </div>

        {/* Data Export */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            Data
          </h3>
          <Card className="rounded-2xl divide-y divide-border">
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

        {/* About */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            About
          </h3>
          <Card className="p-4 rounded-2xl">
            <div className="text-center">
              <h2 className="font-display font-bold text-2xl gradient-text mb-1">
                MEET
              </h2>
              <p className="text-sm text-muted-foreground mb-2">
                Monthly Expense Entry & Tracking
              </p>
              <p className="text-xs text-muted-foreground">
                Version 1.0.0
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Built with Love by MoonShaker Labs
              </p>
            </div>
          </Card>
        </div>

        {/* Danger Zone */}
        <div>
          <h3 className="text-sm font-medium text-destructive mb-3 px-1">
            Danger Zone
          </h3>
          <Card className="rounded-2xl border-destructive/30">
            <button
              className="w-full p-4 flex items-center justify-between hover:bg-destructive/5 transition-colors"
              onClick={() => setShowClearDialog(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-destructive" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-destructive">Clear All Data</p>
                  <p className="text-sm text-muted-foreground">
                    Delete all expenses permanently
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-destructive/50" />
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
          <div className="grid grid-cols-2 gap-3 pb-8">
            {CURRENCIES.map((currency) => (
              <Card
                key={currency.code}
                className={`p-4 cursor-pointer transition-all duration-200 ${
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{currency.symbol}</p>
                    <p className="text-sm text-muted-foreground">{currency.code}</p>
                  </div>
                  {settings.currency === currency.code && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Theme Sheet */}
      <Sheet open={showThemeSheet} onOpenChange={setShowThemeSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="mb-4">
            <SheetTitle>Choose Theme</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 pb-8">
            {themes.map((theme) => (
              <Card
                key={theme.id}
                className={`p-4 cursor-pointer transition-all duration-200 ${
                  settings.theme === theme.id
                    ? "ring-2 ring-primary bg-primary/5"
                    : "hover:bg-secondary"
                }`}
                onClick={() => {
                  onUpdateSettings({ theme: theme.id });
                  setShowThemeSheet(false);
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <theme.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{theme.label}</p>
                    <p className="text-sm text-muted-foreground">{theme.desc}</p>
                  </div>
                  {settings.theme === theme.id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Date Range Export Sheet */}
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

      {/* Clear Data Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={handleCancelClear}>
        <AlertDialogContent className="max-w-sm mx-4 rounded-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <AlertDialogTitle className="text-left">
                {clearStep === "warning" ? "Clear All Data?" : "Are you sure?"}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-left">
              {clearStep === "warning" ? (
                <>
                  All <strong>{expenses.length} expenses</strong> stored on this device will be 
                  <strong className="text-destructive"> permanently deleted</strong>. This action cannot be undone.
                </>
              ) : (
                "This will permanently delete all your expense data. This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            {clearStep === "warning" ? (
              <>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleExportAllThenClear}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export All First
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleExportTimelineThenClear}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Export Specific Timeline
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setClearStep("confirm")}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Without Export
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleCancelClear}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleConfirmClear}
                >
                  Yes, Delete Everything
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleCancelClear}
                >
                  Cancel
                </Button>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsPanel;