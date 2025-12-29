import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CURRENCIES, UserSettings } from "@/types/expense";
import { Check, Sun, Moon, Smartphone, ChevronRight } from "lucide-react";

interface OnboardingProps {
  onComplete: (settings: Partial<UserSettings>) => void;
}

type Step = "welcome" | "google" | "currency" | "theme";

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [step, setStep] = useState<Step>("welcome");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark" | "system">("system");

  const handleGoogleConnect = () => {
    // Placeholder for Google OAuth - will implement with actual auth later
    setStep("currency");
  };

  const handleSkipGoogle = () => {
    setStep("currency");
  };

  const handleCurrencyNext = () => {
    setStep("theme");
  };

  const handleComplete = () => {
    const currency = CURRENCIES.find((c) => c.code === selectedCurrency);
    onComplete({
      currency: selectedCurrency,
      currencySymbol: currency?.symbol || "$",
      theme: selectedTheme,
      hasCompletedOnboarding: true,
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 safe-top safe-bottom">
      {/* Progress indicators */}
      <div className="flex gap-2 mb-8">
        {["welcome", "google", "currency", "theme"].map((s, i) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              s === step ? "w-8 bg-primary" : "w-2 bg-muted"
            }`}
          />
        ))}
      </div>

      {step === "welcome" && (
        <div className="text-center animate-fade-in max-w-sm">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">💰</span>
          </div>
          <h1 className="font-display font-bold text-3xl mb-3">
            Welcome to <span className="gradient-text">MEET</span>
          </h1>
          <p className="text-muted-foreground mb-8">
            Track your daily expenses effortlessly and take control of your finances.
          </p>
          <Button
            size="lg"
            className="w-full rounded-2xl h-14 text-lg font-semibold"
            onClick={() => setStep("google")}
          >
            Get Started
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      )}

      {step === "google" && (
        <div className="text-center animate-fade-in max-w-sm w-full">
          <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </div>
          <h1 className="font-display font-bold text-2xl mb-3">
            Connect Google
          </h1>
          <p className="text-muted-foreground mb-8">
            Sign in with Google to sync your expenses to Google Sheets automatically.
          </p>
          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full rounded-2xl h-14 text-lg font-semibold"
              onClick={handleGoogleConnect}
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
              </svg>
              Sign in with Google
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="w-full rounded-2xl h-12 text-muted-foreground"
              onClick={handleSkipGoogle}
            >
              Skip for now
            </Button>
          </div>
        </div>
      )}

      {step === "currency" && (
        <div className="animate-fade-in max-w-sm w-full">
          <h1 className="font-display font-bold text-2xl mb-2 text-center">
            Select Currency
          </h1>
          <p className="text-muted-foreground mb-6 text-center">
            Choose your preferred currency for tracking expenses.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {CURRENCIES.map((currency) => (
              <Card
                key={currency.code}
                className={`p-4 cursor-pointer transition-all duration-200 ${
                  selectedCurrency === currency.code
                    ? "ring-2 ring-primary bg-primary/5"
                    : "hover:bg-secondary"
                }`}
                onClick={() => setSelectedCurrency(currency.code)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-lg">{currency.symbol}</p>
                    <p className="text-sm text-muted-foreground">{currency.code}</p>
                  </div>
                  {selectedCurrency === currency.code && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
              </Card>
            ))}
          </div>
          <Button
            size="lg"
            className="w-full rounded-2xl h-14 text-lg font-semibold"
            onClick={handleCurrencyNext}
          >
            Continue
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      )}

      {step === "theme" && (
        <div className="animate-fade-in max-w-sm w-full">
          <h1 className="font-display font-bold text-2xl mb-2 text-center">
            Choose Theme
          </h1>
          <p className="text-muted-foreground mb-6 text-center">
            Select your preferred appearance.
          </p>
          <div className="space-y-3 mb-8">
            {[
              { id: "light" as const, icon: Sun, label: "Light", desc: "Clean & bright" },
              { id: "dark" as const, icon: Moon, label: "Dark", desc: "Elegant night mode" },
              { id: "system" as const, icon: Smartphone, label: "System", desc: "Match device settings" },
            ].map((theme) => (
              <Card
                key={theme.id}
                className={`p-4 cursor-pointer transition-all duration-200 ${
                  selectedTheme === theme.id
                    ? "ring-2 ring-primary bg-primary/5"
                    : "hover:bg-secondary"
                }`}
                onClick={() => setSelectedTheme(theme.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <theme.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{theme.label}</p>
                    <p className="text-sm text-muted-foreground">{theme.desc}</p>
                  </div>
                  {selectedTheme === theme.id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
              </Card>
            ))}
          </div>
          <Button
            size="lg"
            className="w-full rounded-2xl h-14 text-lg font-semibold"
            onClick={handleComplete}
          >
            Start Tracking
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
