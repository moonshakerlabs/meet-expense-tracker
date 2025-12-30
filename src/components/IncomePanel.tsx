import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus, Wallet, Pencil, Trash2 } from "lucide-react";
import { Income, IncomeSource, INCOME_SOURCES } from "@/types/expense";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface IncomePanelProps {
  incomes: Income[];
  formatCurrency: (amount: number) => string;
  currencySymbol: string;
  onAddIncome: (data: {
    amount: number;
    source: IncomeSource;
    date: Date;
    notes?: string;
    isRecurring: boolean;
    recurringDay?: number;
    autoUpdateMonths?: number;
    autoUpdateEndDate?: Date;
    isActive: boolean;
  }) => void;
  onUpdateIncome: (id: string, data: Partial<Income>) => void;
  onDeleteIncome: (id: string) => void;
  onStopRecurring: (id: string) => void;
  getMonthlyIncome: (date?: Date) => number;
  onBack: () => void;
}

const IncomePanel = ({
  incomes,
  formatCurrency,
  currencySymbol,
  onAddIncome,
  onUpdateIncome,
  onDeleteIncome,
  onStopRecurring,
  getMonthlyIncome,
  onBack,
}: IncomePanelProps) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState<IncomeSource>("salary");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDay, setRecurringDay] = useState("1");
  const [autoUpdateMonths, setAutoUpdateMonths] = useState("");
  const [notes, setNotes] = useState("");

  const monthlyTotal = getMonthlyIncome();
  const recurringIncomes = incomes.filter((i) => i.isRecurring && i.isActive);

  const handleAmountChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) return;
    setAmount(cleaned);
  };

  const handleSave = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: "Error", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    const endDate = autoUpdateMonths
      ? new Date(
          new Date().getFullYear(),
          new Date().getMonth() + parseInt(autoUpdateMonths),
          1
        )
      : undefined;

    onAddIncome({
      amount: parseFloat(amount),
      source,
      date: new Date(),
      notes: notes.trim() || undefined,
      isRecurring,
      recurringDay: isRecurring ? parseInt(recurringDay) : undefined,
      autoUpdateMonths: autoUpdateMonths ? parseInt(autoUpdateMonths) : undefined,
      autoUpdateEndDate: endDate,
      isActive: true,
    });

    toast({ title: "Income added", description: `${currencySymbol}${parseFloat(amount).toFixed(2)} from ${INCOME_SOURCES.find(s => s.id === source)?.label}` });

    setAmount("");
    setSource("salary");
    setIsRecurring(false);
    setRecurringDay("1");
    setAutoUpdateMonths("");
    setNotes("");
    setShowAddModal(false);
  };

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display font-bold text-xl">Income</h1>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Monthly Summary */}
        <Card className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-3xl">
          <p className="text-sm opacity-80 mb-1">This Month's Income</p>
          <h2 className="font-display font-bold text-4xl">
            {formatCurrency(monthlyTotal)}
          </h2>
        </Card>

        {/* Recurring Income */}
        {recurringIncomes.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Recurring Income
            </h3>
            <div className="space-y-3">
              {recurringIncomes.map((income) => {
                const sourceInfo = INCOME_SOURCES.find((s) => s.id === income.source);
                return (
                  <Card key={income.id} className="p-4 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-lg">
                          {sourceInfo?.icon || "💰"}
                        </div>
                        <div>
                          <p className="font-medium">{sourceInfo?.label}</p>
                          <p className="text-xs text-muted-foreground">
                            Day {income.recurringDay} of each month
                          </p>
                          {income.autoUpdateEndDate && (
                            <p className="text-xs text-muted-foreground">
                              Until {format(new Date(income.autoUpdateEndDate), "MMM yyyy")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-emerald-600">
                          +{formatCurrency(income.amount)}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onStopRecurring(income.id)}
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Income */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Recent Income
          </h3>
          {incomes.filter((i) => !i.isRecurring).length > 0 ? (
            <div className="space-y-3">
              {incomes
                .filter((i) => !i.isRecurring)
                .slice(0, 10)
                .map((income) => {
                  const sourceInfo = INCOME_SOURCES.find((s) => s.id === income.source);
                  return (
                    <Card key={income.id} className="p-4 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-lg">
                            {sourceInfo?.icon || "💰"}
                          </div>
                          <div>
                            <p className="font-medium">{sourceInfo?.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(income.date), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-emerald-600">
                          +{formatCurrency(income.amount)}
                        </p>
                      </div>
                    </Card>
                  );
                })}
            </div>
          ) : (
            <Card className="p-8 rounded-2xl text-center">
              <Wallet className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No income entries yet</p>
            </Card>
          )}
        </div>

        {/* Add Income Button */}
        <Button
          size="lg"
          className="w-full rounded-2xl h-14 bg-emerald-500 hover:bg-emerald-600"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Income
        </Button>
      </div>

      {/* Add Income Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-[90%] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Add Income</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Amount */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted-foreground">
                  {currencySymbol}
                </span>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="pl-10 h-12 text-xl font-bold rounded-xl"
                />
              </div>
            </div>

            {/* Source */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Source
              </label>
              <Select value={source} onValueChange={(v) => setSource(v as IncomeSource)}>
                <SelectTrigger className="rounded-xl h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  {INCOME_SOURCES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        <span>{s.icon}</span>
                        <span>{s.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recurring Toggle */}
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
              <div>
                <p className="font-medium">Recurring Income</p>
                <p className="text-sm text-muted-foreground">
                  Auto-add every month
                </p>
              </div>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>

            {/* Recurring Options */}
            {isRecurring && (
              <div className="space-y-4 p-4 bg-secondary/30 rounded-xl">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Day of Month (1-31)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={recurringDay}
                    onChange={(e) => setRecurringDay(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Auto-update for (months, leave empty for indefinite)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g., 12"
                    value={autoUpdateMonths}
                    onChange={(e) => setAutoUpdateMonths(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Notes (optional)
              </label>
              <Input
                placeholder="Add a note..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Save Button */}
            <Button
              className="w-full rounded-xl h-12 font-semibold bg-emerald-500 hover:bg-emerald-600"
              onClick={handleSave}
            >
              Save Income
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IncomePanel;
