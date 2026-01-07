import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Delete, Lock, Check } from "lucide-react";
import { hashPin } from "@/lib/pinUtils";
import { cn } from "@/lib/utils";

interface PinSetupProps {
  onComplete: (hashedPin: string) => void;
  onCancel: () => void;
  isChangingPin?: boolean;
}

const PinSetup = ({ onComplete, onCancel, isChangingPin = false }: PinSetupProps) => {
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentPin = step === "enter" ? pin : confirmPin;
  const setCurrentPin = step === "enter" ? setPin : setConfirmPin;

  const handleDigit = (digit: string) => {
    if (currentPin.length < 6) {
      const newPin = currentPin + digit;
      setCurrentPin(newPin);
      setError(false);

      // Auto-advance when 6 digits entered
      if (newPin.length === 6) {
        if (step === "enter") {
          setTimeout(() => setStep("confirm"), 200);
        } else {
          handleConfirm(newPin);
        }
      }
    }
  };

  const handleDelete = () => {
    if (currentPin.length > 0) {
      setCurrentPin(currentPin.slice(0, -1));
      setError(false);
    }
  };

  const handleConfirm = async (confirmedPin: string) => {
    if (confirmedPin !== pin) {
      setError(true);
      setConfirmPin("");
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
      return;
    }

    setIsSaving(true);
    try {
      const hashedPin = await hashPin(pin);
      onComplete(hashedPin);
    } catch (err) {
      setError(true);
      setConfirmPin("");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (step === "confirm") {
      setStep("enter");
      setConfirmPin("");
      setError(false);
    } else {
      onCancel();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col safe-top safe-bottom">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={handleBack}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display font-bold text-xl">
            {isChangingPin ? "Change PIN" : "Set Up PIN"}
          </h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Lock Icon */}
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-primary" />
        </div>

        {/* Title */}
        <h2 className="font-semibold text-xl mb-2">
          {step === "enter" ? "Enter a 6-digit PIN" : "Confirm your PIN"}
        </h2>
        <p className="text-muted-foreground text-center mb-8">
          {step === "enter"
            ? "Choose a PIN you'll remember"
            : "Enter the same PIN again to confirm"}
        </p>

        {/* PIN Dots */}
        <div className={cn(
          "flex gap-3 mb-8 transition-transform",
          error && "animate-shake"
        )}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-4 h-4 rounded-full border-2 transition-all duration-150",
                i < currentPin.length
                  ? error
                    ? "bg-destructive border-destructive"
                    : "bg-primary border-primary"
                  : "border-muted-foreground/30"
              )}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-destructive text-sm mb-4 animate-fade-in">
            PINs don't match. Please try again.
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <Button
              key={digit}
              variant="outline"
              size="lg"
              className="w-16 h-16 text-2xl font-semibold rounded-2xl"
              onClick={() => handleDigit(String(digit))}
              disabled={isSaving}
            >
              {digit}
            </Button>
          ))}
          <div /> {/* Empty space */}
          <Button
            variant="outline"
            size="lg"
            className="w-16 h-16 text-2xl font-semibold rounded-2xl"
            onClick={() => handleDigit("0")}
            disabled={isSaving}
          >
            0
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-16 h-16 rounded-2xl"
            onClick={handleDelete}
            disabled={isSaving || currentPin.length === 0}
          >
            <Delete className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PinSetup;
