import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calculator } from "lucide-react";

interface MiniCalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MiniCalculator = ({ open, onOpenChange }: MiniCalculatorProps) => {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [resetNext, setResetNext] = useState(false);

  const handleNumber = (num: string) => {
    if (resetNext) {
      setDisplay(num);
      setResetNext(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const handleDecimal = () => {
    if (resetNext) {
      setDisplay("0.");
      setResetNext(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const handleOperation = (op: string) => {
    const current = parseFloat(display);
    if (previousValue !== null && operation && !resetNext) {
      const result = calculate(previousValue, current, operation);
      setDisplay(String(result));
      setPreviousValue(result);
    } else {
      setPreviousValue(current);
    }
    setOperation(op);
    setResetNext(true);
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleEquals = () => {
    if (previousValue === null || !operation) return;
    const current = parseFloat(display);
    const result = calculate(previousValue, current, operation);
    const rounded = Math.round(result * 100000000) / 100000000;
    setDisplay(String(rounded));
    setPreviousValue(null);
    setOperation(null);
    setResetNext(true);
  };

  const handleClear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setResetNext(false);
  };

  const handlePercent = () => {
    const current = parseFloat(display);
    setDisplay(String(current / 100));
    setResetNext(true);
  };

  const handleToggleSign = () => {
    const current = parseFloat(display);
    setDisplay(String(-current));
  };

  const buttons = [
    { label: "AC", action: handleClear, variant: "secondary" as const },
    { label: "±", action: handleToggleSign, variant: "secondary" as const },
    { label: "%", action: handlePercent, variant: "secondary" as const },
    { label: "÷", action: () => handleOperation("÷"), variant: "default" as const, isOp: true },
    { label: "7", action: () => handleNumber("7") },
    { label: "8", action: () => handleNumber("8") },
    { label: "9", action: () => handleNumber("9") },
    { label: "×", action: () => handleOperation("×"), variant: "default" as const, isOp: true },
    { label: "4", action: () => handleNumber("4") },
    { label: "5", action: () => handleNumber("5") },
    { label: "6", action: () => handleNumber("6") },
    { label: "-", action: () => handleOperation("-"), variant: "default" as const, isOp: true },
    { label: "1", action: () => handleNumber("1") },
    { label: "2", action: () => handleNumber("2") },
    { label: "3", action: () => handleNumber("3") },
    { label: "+", action: () => handleOperation("+"), variant: "default" as const, isOp: true },
    { label: "0", action: () => handleNumber("0"), wide: true },
    { label: ".", action: handleDecimal },
    { label: "=", action: handleEquals, variant: "default" as const, isOp: true },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[320px] rounded-2xl p-4">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Calculator
          </DialogTitle>
        </DialogHeader>
        
        {/* Display */}
        <div className="bg-muted rounded-xl p-4 text-right mb-2">
          <p className="text-xs text-muted-foreground h-4">
            {previousValue !== null && operation ? `${previousValue} ${operation}` : ""}
          </p>
          <p className="text-3xl font-bold truncate">{display}</p>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-4 gap-2">
          {buttons.map((btn) => (
            <Button
              key={btn.label}
              variant={btn.isOp ? "default" : (btn.variant || "outline")}
              className={`h-12 text-lg font-semibold rounded-xl ${btn.wide ? "col-span-2" : ""} ${
                btn.isOp ? "bg-primary text-primary-foreground" : ""
              } ${btn.variant === "secondary" ? "bg-muted text-muted-foreground" : ""}`}
              onClick={btn.action}
            >
              {btn.label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MiniCalculator;
