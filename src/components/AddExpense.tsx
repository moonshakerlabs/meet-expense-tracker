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
import { Category, CATEGORIES } from "@/types/expense";
import { ArrowLeft, Calendar as CalendarIcon, Check, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface AddExpenseProps {
  currencySymbol: string;
  onSave: (data: { amount: number; category: Category; notes?: string; date: Date }) => void;
  onBack: () => void;
}

const AddExpense = ({ currencySymbol, onSave, onBack }: AddExpenseProps) => {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState(format(new Date(), "HH:mm"));
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{ amount?: string; category?: string }>({});

  const handleAmountChange = (value: string) => {
    // Allow only numbers and decimal point
    const cleaned = value.replace(/[^0-9.]/g, "");
    // Prevent multiple decimal points
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    // Limit decimal places to 2
    if (parts[1]?.length > 2) return;
    setAmount(cleaned);
    if (errors.amount) setErrors((e) => ({ ...e, amount: undefined }));
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

  const handleSubmit = () => {
    if (!validate()) return;

    const [hours, minutes] = time.split(":").map(Number);
    const expenseDate = new Date(date);
    expenseDate.setHours(hours, minutes, 0, 0);

    onSave({
      amount: parseFloat(amount),
      category: category!,
      notes: notes.trim() || undefined,
      date: expenseDate,
    });

    toast({
      title: "Expense added",
      description: `${currencySymbol}${parseFloat(amount).toFixed(2)} added to ${CATEGORIES.find(c => c.id === category)?.label}`,
    });

    onBack();
  };

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
          <h1 className="font-display font-bold text-xl">Add Expense</h1>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Amount Input */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-muted-foreground">
              {currencySymbol}
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
          {errors.amount && (
            <p className="text-sm text-destructive mt-2">{errors.amount}</p>
          )}
        </div>

        {/* Category Selection */}
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-3 block">
            Category
          </label>
          <div className="grid grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => (
              <Card
                key={cat.id}
                className={cn(
                  "p-4 cursor-pointer transition-all duration-200 text-center",
                  category === cat.id
                    ? "ring-2 ring-primary bg-primary/5"
                    : "hover:bg-secondary"
                )}
                onClick={() => {
                  setCategory(cat.id);
                  if (errors.category) setErrors((e) => ({ ...e, category: undefined }));
                }}
              >
                <span className="text-2xl mb-1 block">{cat.icon}</span>
                <p className="text-sm font-medium">{cat.label}</p>
                {category === cat.id && (
                  <Check className="w-4 h-4 text-primary mx-auto mt-1" />
                )}
              </Card>
            ))}
          </div>
          {errors.category && (
            <p className="text-sm text-destructive mt-2">{errors.category}</p>
          )}
        </div>

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
              <PopoverContent className="w-auto p-0" align="start">
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

        {/* Save Button */}
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
