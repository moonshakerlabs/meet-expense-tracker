import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Lock, Delete } from "lucide-react";
import { verifyPin } from "@/lib/pinUtils";
import { cn } from "@/lib/utils";

interface PinLockScreenProps {
  pinHash: string;
  onUnlock: () => void;
}

const PinLockScreen = ({ pinHash, onUnlock }: PinLockScreenProps) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setError(false);

      // Auto-verify when 6 digits entered
      if (newPin.length === 6) {
        verifyEnteredPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setError(false);
    }
  };

  const verifyEnteredPin = async (enteredPin: string) => {
    setIsVerifying(true);
    try {
      const isValid = await verifyPin(enteredPin, pinHash);
      if (isValid) {
        onUnlock();
      } else {
        setError(true);
        setPin("");
        // Vibrate on error if supported
        if (navigator.vibrate) {
          navigator.vibrate(200);
        }
      }
    } catch (err) {
      setError(true);
      setPin("");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 safe-top safe-bottom">
      {/* Lock Icon */}
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Lock className="w-10 h-10 text-primary" />
      </div>

      {/* Title */}
      <h1 className="font-display font-bold text-2xl mb-2">MEET is Locked</h1>
      <p className="text-muted-foreground mb-8">Enter your 6-digit PIN</p>

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
              i < pin.length
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
          Incorrect PIN. Please try again.
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
            disabled={isVerifying}
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
          disabled={isVerifying}
        >
          0
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="w-16 h-16 rounded-2xl"
          onClick={handleDelete}
          disabled={isVerifying || pin.length === 0}
        >
          <Delete className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

export default PinLockScreen;
