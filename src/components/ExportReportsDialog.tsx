import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  ArrowLeft, 
  FileText, 
  FileJson, 
  Download, 
  Calendar, 
  CalendarDays, 
  Target, 
  Check, 
  ChevronRight,
  PieChart,
  BarChart3,
  Palette,
  RotateCw,
  Eye,
  RefreshCw
} from "lucide-react";
import { Expense, Purpose, CurrencyIncome, CurrencySavings, CURRENCIES } from "@/types/expense";
import { exportToCSV, exportToJSON } from "@/lib/exportUtils";
import { exportToPDF, generatePDFPreview, PDFColorTheme, PDFOrientation, PDFOptions } from "@/lib/pdfExport";
import { toast } from "sonner";
import { FeatureAccess } from "@/types/subscription";
import CSVExportWarning from "@/components/CSVExportWarning";

type ExportScope = "month" | "year" | "purpose";
type ExportFormat = "pdf" | "csv" | "json";

interface ExportReportsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenses: Expense[];
  purposes: Purpose[];
  currencyIncomes: CurrencyIncome[];
  currencySavings: CurrencySavings[];
  defaultCurrency: string;
  defaultCurrencySymbol: string;
  monthlyIncome: number;
  customCategories?: Array<{ id: string; label: string; icon: string; color?: string }>;
  featureAccess?: FeatureAccess;
  onShowFreemiumGate?: (featureName: string) => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const COLOR_THEMES: { value: PDFColorTheme; label: string; color: string }[] = [
  { value: "green", label: "Emerald", color: "bg-emerald-500" },
  { value: "blue", label: "Blue", color: "bg-blue-500" },
  { value: "black", label: "Black", color: "bg-gray-900" },
  { value: "mixed", label: "Mixed", color: "bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500" },
];

const ExportReportsDialog = ({
  open,
  onOpenChange,
  expenses,
  purposes,
  currencyIncomes,
  currencySavings,
  defaultCurrency,
  defaultCurrencySymbol,
  monthlyIncome,
  customCategories,
  featureAccess,
  onShowFreemiumGate,
}: ExportReportsDialogProps) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [scope, setScope] = useState<ExportScope | null>(null);
  // Multi-select state
  const [selectedMonths, setSelectedMonths] = useState<number[]>([new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedYears, setSelectedYears] = useState<number[]>([new Date().getFullYear()]);
  const [selectedPurposeIds, setSelectedPurposeIds] = useState<string[]>([]);
  const [format, setFormat] = useState<ExportFormat | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showCSVWarning, setShowCSVWarning] = useState(false);

  // PDF Options
  const [pdfOptions, setPdfOptions] = useState<PDFOptions>({
    includePieChart: true,
    includeBarChart: true,
    currencyFilter: "all",
    colorTheme: "green",
    orientation: "portrait",
  });

  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  // Get available years from expenses
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    expenses.forEach(exp => {
      years.add(new Date(exp.date).getFullYear());
    });
    const currentYear = new Date().getFullYear();
    years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [expenses]);

  // Get available currencies from expenses
  const availableCurrencies = useMemo(() => {
    const currencies = new Set<string>();
    currencies.add(defaultCurrency);
    expenses.forEach(exp => {
      if (exp.currency) currencies.add(exp.currency);
    });
    return Array.from(currencies);
  }, [expenses, defaultCurrency]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const resetDialog = () => {
    setStep(1);
    setScope(null);
    setSelectedMonths([new Date().getMonth()]);
    setSelectedYear(new Date().getFullYear());
    setSelectedYears([new Date().getFullYear()]);
    setSelectedPurposeIds([]);
    setFormat(null);
    setPdfOptions({
      includePieChart: true,
      includeBarChart: true,
      currencyFilter: "all",
      colorTheme: "green",
      orientation: "portrait",
    });
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const toggleInArray = <T,>(arr: T[], value: T): T[] =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetDialog();
    }
    onOpenChange(open);
  };

  const getFilteredExpenses = (): Expense[] => {
    let filtered = expenses;

    if (scope === "month") {
      filtered = expenses.filter(exp => {
        const date = new Date(exp.date);
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
      });
    } else if (scope === "year") {
      filtered = expenses.filter(exp => {
        const date = new Date(exp.date);
        return date.getFullYear() === selectedYear;
      });
    } else if (scope === "purpose" && selectedPurposeId) {
      filtered = expenses.filter(exp => exp.purposeId === selectedPurposeId);
    }

    return filtered;
  };

  const getDateRange = (): { startDate?: Date; endDate?: Date } => {
    if (scope === "month") {
      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0);
      return { startDate, endDate };
    } else if (scope === "year") {
      const startDate = new Date(selectedYear, 0, 1);
      const endDate = new Date(selectedYear, 11, 31);
      return { startDate, endDate };
    }
    return {};
  };

  const getPDFExportOptions = () => {
    const filteredExpenses = getFilteredExpenses();
    const { startDate, endDate } = getDateRange();
    const purposeName = scope === "purpose" 
      ? purposes.find(p => p.id === selectedPurposeId)?.label 
      : undefined;

    return {
      expenses: filteredExpenses,
      currencyIncomes,
      currencySavings,
      defaultCurrency,
      defaultCurrencySymbol,
      monthlyIncome,
      startDate,
      endDate,
      customCategories,
      purposeName,
      scope,
      selectedMonth,
      selectedYear,
      pdfOptions,
    };
  };

  const handleGeneratePreview = async () => {
    setIsGeneratingPreview(true);
    
    // Cleanup previous preview
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    try {
      const url = await generatePDFPreview(getPDFExportOptions());
      setPreviewUrl(url);
      setStep(5);
    } catch (error) {
      console.error("Preview generation error:", error);
      toast.error("Failed to generate preview");
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleExport = async () => {
    if (!format) return;

    const filteredExpenses = getFilteredExpenses();
    
    if (filteredExpenses.length === 0) {
      toast.error("No expenses found for the selected criteria");
      return;
    }

    setIsExporting(true);

    try {
      if (format === "csv") {
        exportToCSV(filteredExpenses, defaultCurrency);
        toast.success(`Exported ${filteredExpenses.length} expenses as CSV`);
      } else if (format === "json") {
        exportToJSON(filteredExpenses, defaultCurrencySymbol, defaultCurrency);
        toast.success(`Exported ${filteredExpenses.length} expenses as JSON`);
      } else if (format === "pdf") {
        const success = await exportToPDF(getPDFExportOptions());

        if (success) {
          toast.success("PDF report exported successfully");
        }
      }

      handleOpenChange(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  const canProceedToStep2 = scope !== null;
  const canProceedToStep3 = (() => {
    if (!scope) return false;
    if (scope === "purpose" && !selectedPurposeId) return false;
    return true;
  })();
  const canExport = format !== null;

  const getScopeSummary = () => {
    if (scope === "month") {
      return `${MONTHS[selectedMonth]} ${selectedYear}`;
    } else if (scope === "year") {
      return `Year ${selectedYear}`;
    } else if (scope === "purpose" && selectedPurposeId) {
      return purposes.find(p => p.id === selectedPurposeId)?.label || "Purpose";
    }
    return "";
  };

  const handleBackFromStep = (currentStep: number) => {
    if (currentStep === 5) {
      setStep(4);
    } else if (currentStep === 4) {
      setStep(3);
    } else {
      setStep((currentStep - 1) as 1 | 2 | 3);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl h-[85vh]">
        <SheetHeader className="mb-4">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl h-8 w-8"
                onClick={() => handleBackFromStep(step)}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <SheetTitle>
              {step === 1 && "Export Reports"}
              {step === 2 && "Select Details"}
              {step === 3 && "Choose Format"}
              {step === 4 && "PDF Options"}
              {step === 5 && "Preview Report"}
            </SheetTitle>
          </div>
          
          {/* Progress indicator */}
          <div className="flex gap-2 mt-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-muted"
                } ${format !== "pdf" && s > 3 ? "hidden" : ""}`}
              />
            ))}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(85vh-140px)]">
          {/* Step 1: Select Scope */}
          {step === 1 && (
            <div className="space-y-3 pb-8">
              <p className="text-sm text-muted-foreground mb-4">
                Select how you want to filter your report
              </p>

              <Card
                className={`p-4 cursor-pointer transition-all duration-200 ${
                  scope === "month" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-secondary"
                }`}
                onClick={() => setScope("month")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">By Month</p>
                      <p className="text-sm text-muted-foreground">
                        Export expenses for a specific month
                      </p>
                    </div>
                  </div>
                  {scope === "month" && <Check className="w-5 h-5 text-primary" />}
                </div>
              </Card>

              <Card
                className={`p-4 cursor-pointer transition-all duration-200 ${
                  scope === "year" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-secondary"
                }`}
                onClick={() => setScope("year")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <CalendarDays className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-medium">By Year</p>
                      <p className="text-sm text-muted-foreground">
                        Export all expenses for a year
                      </p>
                    </div>
                  </div>
                  {scope === "year" && <Check className="w-5 h-5 text-primary" />}
                </div>
              </Card>

              <Card
                className={`p-4 cursor-pointer transition-all duration-200 ${
                  scope === "purpose" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-secondary"
                } ${purposes.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => purposes.length > 0 && setScope("purpose")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                      <Target className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-medium">By Purpose</p>
                      <p className="text-sm text-muted-foreground">
                        {purposes.length === 0 
                          ? "No purposes defined yet"
                          : "Export expenses for a specific purpose"
                        }
                      </p>
                    </div>
                  </div>
                  {scope === "purpose" && <Check className="w-5 h-5 text-primary" />}
                </div>
              </Card>

              <Button
                className="w-full h-12 mt-4"
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2}
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Select Details */}
          {step === 2 && (
            <div className="space-y-4 pb-8">
              {scope === "month" && (
                <>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Month
                    </label>
                    <Select
                      value={selectedMonth.toString()}
                      onValueChange={(v) => setSelectedMonth(parseInt(v))}
                    >
                      <SelectTrigger className="rounded-xl h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border">
                        {MONTHS.map((month, idx) => (
                          <SelectItem key={idx} value={idx.toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Year
                    </label>
                    <Select
                      value={selectedYear.toString()}
                      onValueChange={(v) => setSelectedYear(parseInt(v))}
                    >
                      <SelectTrigger className="rounded-xl h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border">
                        {availableYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {scope === "year" && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Year
                  </label>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(v) => setSelectedYear(parseInt(v))}
                  >
                    <SelectTrigger className="rounded-xl h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border">
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {scope === "purpose" && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Purpose
                  </label>
                  <div className="space-y-2">
                    {purposes.map((purpose) => (
                      <Card
                        key={purpose.id}
                        className={`p-3 cursor-pointer transition-all duration-200 ${
                          selectedPurposeId === purpose.id 
                            ? "ring-2 ring-primary bg-primary/5" 
                            : "hover:bg-secondary"
                        }`}
                        onClick={() => setSelectedPurposeId(purpose.id)}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{purpose.label}</p>
                          {selectedPurposeId === purpose.id && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <Button
                className="w-full h-12 mt-4"
                onClick={() => setStep(3)}
                disabled={!canProceedToStep3}
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 3: Select Format */}
          {step === 3 && (
            <div className="space-y-4 pb-8">
              <Card className="p-4 bg-primary/5 border-primary/20">
                <p className="text-sm text-muted-foreground">Exporting:</p>
                <p className="font-semibold">{getScopeSummary()}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {getFilteredExpenses().length} expenses found
                </p>
              </Card>

              <p className="text-sm font-medium text-muted-foreground">
                Choose export format
              </p>

              <Card
                className={`p-4 cursor-pointer transition-all duration-200 ${
                  format === "pdf" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-secondary"
                } ${!featureAccess?.exportPDF ? "opacity-60" : ""}`}
                onClick={() => {
                  if (featureAccess?.exportPDF) {
                    setFormat("pdf");
                  } else {
                    onShowFreemiumGate?.("Export PDF reports");
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium">PDF Report</p>
                      <p className="text-sm text-muted-foreground">
                        Professional formatted report with charts
                        {!featureAccess?.exportPDF && " (Freemium)"}
                      </p>
                    </div>
                  </div>
                  {format === "pdf" && <Check className="w-5 h-5 text-primary" />}
                </div>
              </Card>

              <Card
                className={`p-4 cursor-pointer transition-all duration-200 ${
                  format === "csv" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-secondary"
                }`}
                onClick={() => setFormat("csv")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Download className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-medium">CSV Spreadsheet</p>
                      <p className="text-sm text-muted-foreground">
                        For Excel, Google Sheets, etc.
                      </p>
                    </div>
                  </div>
                  {format === "csv" && <Check className="w-5 h-5 text-primary" />}
                </div>
              </Card>

              <Card
                className={`p-4 cursor-pointer transition-all duration-200 ${
                  format === "json" ? "ring-2 ring-primary bg-primary/5" : "hover:bg-secondary"
                }`}
                onClick={() => setFormat("json")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <FileJson className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">JSON Data</p>
                      <p className="text-sm text-muted-foreground">
                        Backup format for re-import
                      </p>
                    </div>
                  </div>
                  {format === "json" && <Check className="w-5 h-5 text-primary" />}
                </div>
              </Card>

              <Button
                className="w-full h-12 mt-4"
                onClick={() => {
                  if (format === "pdf") {
                    setStep(4);
                  } else if (format === "csv") {
                    // Show CSV warning before export
                    setShowCSVWarning(true);
                  } else {
                    handleExport();
                  }
                }}
                disabled={!canExport || isExporting}
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Exporting...
                  </>
                ) : format === "pdf" ? (
                  <>
                    Customize PDF
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export {format?.toUpperCase()}
                  </>
                )}
              </Button>

              {/* CSV Export Warning */}
              <CSVExportWarning
                open={showCSVWarning}
                onOpenChange={setShowCSVWarning}
                onExportCSV={() => {
                  setShowCSVWarning(false);
                  handleExport();
                }}
                onUseJSON={() => {
                  setShowCSVWarning(false);
                  setFormat("json");
                }}
              />
            </div>
          )}

          {/* Step 4: PDF Options */}
          {step === 4 && (
            <div className="space-y-5 pb-8">
              <p className="text-sm text-muted-foreground">
                Customize your PDF report appearance
              </p>

              {/* Chart Options */}
              <Card className="p-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Chart Options
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-bar" className="text-sm">
                    Include Bar Chart
                  </Label>
                  <Switch
                    id="include-bar"
                    checked={pdfOptions.includeBarChart}
                    onCheckedChange={(checked) => 
                      setPdfOptions(prev => ({ ...prev, includeBarChart: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="include-pie" className="text-sm">
                    Include Category Visualization
                  </Label>
                  <Switch
                    id="include-pie"
                    checked={pdfOptions.includePieChart}
                    onCheckedChange={(checked) => 
                      setPdfOptions(prev => ({ ...prev, includePieChart: checked }))
                    }
                  />
                </div>
              </Card>

              {/* Currency Filter */}
              {availableCurrencies.length > 1 && (
                <Card className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="w-4 h-4 flex items-center justify-center text-primary font-bold">$</span>
                    Currency Filter
                  </div>
                  
                  <Select
                    value={pdfOptions.currencyFilter}
                    onValueChange={(v) => 
                      setPdfOptions(prev => ({ ...prev, currencyFilter: v }))
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border">
                      <SelectItem value="all">All Currencies</SelectItem>
                      {availableCurrencies.map((code) => {
                        const currency = CURRENCIES.find(c => c.code === code);
                        return (
                          <SelectItem key={code} value={code}>
                            {currency?.symbol || code} {code}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </Card>
              )}

              {/* Color Theme */}
              <Card className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Palette className="w-4 h-4 text-primary" />
                  Color Theme
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {COLOR_THEMES.map((theme) => (
                    <button
                      key={theme.value}
                      className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                        pdfOptions.colorTheme === theme.value 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:bg-secondary"
                      }`}
                      onClick={() => 
                        setPdfOptions(prev => ({ ...prev, colorTheme: theme.value }))
                      }
                    >
                      <div className={`w-5 h-5 rounded-full ${theme.color}`} />
                      <span className="text-sm font-medium">{theme.label}</span>
                      {pdfOptions.colorTheme === theme.value && (
                        <Check className="w-4 h-4 text-primary ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Orientation */}
              <Card className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <RotateCw className="w-4 h-4 text-primary" />
                  Page Orientation
                </div>
                
                <RadioGroup
                  value={pdfOptions.orientation}
                  onValueChange={(v: PDFOrientation) => 
                    setPdfOptions(prev => ({ ...prev, orientation: v }))
                  }
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="portrait" id="portrait" />
                    <Label htmlFor="portrait" className="text-sm cursor-pointer">
                      Portrait
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="landscape" id="landscape" />
                    <Label htmlFor="landscape" className="text-sm cursor-pointer">
                      Landscape
                    </Label>
                  </div>
                </RadioGroup>
              </Card>

              <Button
                className="w-full h-12 mt-4"
                onClick={handleGeneratePreview}
                disabled={isGeneratingPreview}
              >
                {isGeneratingPreview ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Generating Preview...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Report
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 5: Preview */}
          {step === 5 && (
            <div className="space-y-4 pb-8">
              {previewUrl ? (
                <div className="rounded-xl overflow-hidden border border-border bg-white">
                  <iframe
                    src={previewUrl}
                    className="w-full h-[50vh] bg-white"
                    title="PDF Preview"
                  />
                </div>
              ) : (
                <div className="h-[50vh] flex items-center justify-center bg-muted rounded-xl">
                  <p className="text-muted-foreground">Preview not available</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() => {
                    setStep(4);
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Change Options
                </Button>
                
                <Button
                  className="flex-1 h-12"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default ExportReportsDialog;
