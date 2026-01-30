import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category, CategoryId, Subcategory, CATEGORIES, SUBCATEGORIES, CURRENCIES, Purpose } from "@/types/expense";
import { ArrowLeft, Calendar as CalendarIcon, Check, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddExpenseProps {
  currencySymbol: string;
  currency: string;
  onSave: (data: {
    amount: number;
    category: CategoryId;
    subcategory?: Subcategory;
    notes?: string;
    date: Date;
    currency: string;
    currencySymbol: string;
    purposeId?: string;
  }) => void;
  onBack: () => void;
  customSubcategories?: Record<string, { id: string; label: string; icon: string }[]>;
  hiddenCategories?: Category[];
  customCategories?: Array<{ id: string; label: string; icon: string; color?: string }>;
  country?: string;
  purposes?: Purpose[];
  canUseMultipleCurrencies?: boolean;
  onShowFreemiumGate?: () => void;
}

const AddExpense = ({ 
  currencySymbol, 
  currency, 
  onSave, 
  onBack, 
  customSubcategories = {} as Record<string, { id: string; label: string; icon: string }[]>, 
  hiddenCategories = [], 
  customCategories = [], 
  country, 
  purposes = [],
  canUseMultipleCurrencies = true,
  onShowFreemiumGate,
}: AddExpenseProps) => {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState(format(new Date(), "HH:mm"));
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{ amount?: string; category?: string }>({});
  const [purposeId, setPurposeId] = useState<string | null>(null);
  
  // Currency state - defaults to user's primary currency
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [selectedCurrencySymbol, setSelectedCurrencySymbol] = useState(currencySymbol);

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) return;
    setAmount(cleaned);
    if (errors.amount) setErrors((e) => ({ ...e, amount: undefined }));
  };

  const handleCurrencyChange = (code: string) => {
    // If trying to change to non-primary currency without freemium, show gate
    if (!canUseMultipleCurrencies && code !== currency) {
      onShowFreemiumGate?.();
      return;
    }
    const curr = CURRENCIES.find((c) => c.code === code);
    if (curr) {
      setSelectedCurrency(curr.code);
      setSelectedCurrencySymbol(curr.symbol);
    }
  };

  const validate = (): boolean => {
    const newErrors: { amount?: string; category?: string } = {};

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }
    if (!category) {
      newErrors.category = "Please select a category";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCategorySelect = (cat: CategoryId) => {
    setCategory(cat);
    setSubcategory(null); // Reset subcategory when category changes
    if (errors.category) setErrors((e) => ({ ...e, category: undefined }));
  };

  const getAvailableSubcategories = () => {
    if (!category) return [];
    // Check if it's a built-in category
    const defaultSubs = SUBCATEGORIES[category as Category] || [];
    const customSubs = customSubcategories[category] || [];
    return [...defaultSubs, ...customSubs.map((c) => ({ id: c.id, label: c.label }))];
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const [hours, minutes] = time.split(":").map(Number);
    const expenseDate = new Date(date);
    expenseDate.setHours(hours, minutes, 0, 0);

    onSave({
      amount: parseFloat(amount),
      category: category!,
      subcategory: subcategory || undefined,
      notes: notes.trim() || undefined,
      date: expenseDate,
      currency: selectedCurrency,
      currencySymbol: selectedCurrencySymbol,
      purposeId: purposeId || undefined,
    });

    const builtInCat = CATEGORIES.find((c) => c.id === category);
    const customCat = customCategories.find((c) => c.id === category);
    const categoryLabel = builtInCat?.label || customCat?.label || category;
    toast({
      title: "Expense added",
      description: `${selectedCurrencySymbol}${parseFloat(amount).toFixed(2)} added to ${categoryLabel}`,
    });

    onBack();
  };

  const availableSubcategories = getAvailableSubcategories();
  
  // Combine built-in and custom categories, filter hidden ones
  const allCategories = [
    ...CATEGORIES.filter((cat) => !hiddenCategories.includes(cat.id)).map((cat) => ({ id: cat.id as CategoryId, label: cat.label, icon: cat.icon, color: "" })),
    ...customCategories.map((cat) => ({ id: cat.id as CategoryId, label: cat.label, icon: cat.icon, color: cat.color || "hsl(270, 50%, 50%)" })),
  ];
  const visibleCategories = allCategories;

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom flex flex-col">
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
          <h1 className="font-display font-bold text-xl">Add Expense</h1>
        </div>
      </div>

      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="p-5 space-y-6">
          {/* Amount Input with Currency Selector */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Amount
            </label>
            <div className="flex gap-2">
              {/* Currency Dropdown */}
              <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="w-[90px] rounded-xl h-16 border-2">
                  <SelectValue>
                    <span className="font-semibold">{selectedCurrency}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background border border-border max-h-[300px]">
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      <span className="flex items-center gap-2">
                        <span className="font-semibold">{curr.symbol}</span>
                        <span className="text-muted-foreground">{curr.code}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Amount Input */}
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-muted-foreground">
                  {selectedCurrencySymbol}
                </span>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className={cn(
                    "pl-10 h-16 text-3xl font-bold rounded-2xl border-2 transition-colors",
                    errors.amount ? "border-destructive" : "focus:border-primary"
                  )}
                />
              </div>
            </div>
            {errors.amount && (
              <p className="text-sm text-destructive mt-2">{errors.amount}</p>
            )}
          </div>

          {/* Category Selection */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-3 block">
              Category
            </label>
            <ScrollArea className="h-[240px] pr-2">
              <div className="grid grid-cols-3 gap-3">
                {visibleCategories.map((cat) => (
                  <Card
                    key={cat.id}
                    className={cn(
                      "p-4 cursor-pointer transition-all duration-200 text-center",
                      category === cat.id
                        ? "ring-2 ring-primary bg-primary/5"
                        : "hover:bg-secondary"
                    )}
                    onClick={() => handleCategorySelect(cat.id)}
                  >
                    <span className="text-2xl mb-1 block">{cat.icon}</span>
                    <p className="text-xs font-medium leading-tight">{cat.label}</p>
                    {category === cat.id && (
                      <Check className="w-4 h-4 text-primary mx-auto mt-1" />
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
            {errors.category && (
              <p className="text-sm text-destructive mt-2">{errors.category}</p>
            )}
          </div>

          {/* Subcategory Selection */}
          {category && availableSubcategories.length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Subcategory (optional)
              </label>
              <Select
                value={subcategory || ""}
                onValueChange={(value) => setSubcategory(value || null)}
              >
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  {availableSubcategories.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Purpose Selection (Optional) */}
          {purposes.length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Purpose (optional)
              </label>
              <Select
                value={purposeId || "none"}
                onValueChange={(value) => setPurposeId(value === "none" ? null : value)}
              >
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  <SelectItem value="none">No purpose</SelectItem>
                  {purposes.map((purpose) => (
                    <SelectItem key={purpose.id} value={purpose.id}>
                      🎯 {purpose.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal rounded-xl h-12"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, "MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Notes (optional)
            </label>
            <Textarea
              placeholder="Add a note..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl resize-none"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Sticky Save Button at Bottom */}
      <div className="sticky bottom-0 p-5 bg-background/95 backdrop-blur-lg border-t border-border">
        <Button
          size="lg"
          className="w-full rounded-2xl h-14 text-lg font-semibold"
          onClick={handleSubmit}
        >
          Save Expense
        </Button>
      </div>
    </div>
  );
};

export default AddExpense;