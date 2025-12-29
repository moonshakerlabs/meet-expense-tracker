import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserSettings, CURRENCIES } from "@/types/expense";
import { ArrowLeft, Check, Sun, Moon, Smartphone, ChevronRight } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";

interface SettingsPanelProps {
  settings: UserSettings;
  onUpdateSettings: (updates: Partial<UserSettings>) => void;
  onBack: () => void;
}

const SettingsPanel = ({ settings, onUpdateSettings, onBack }: SettingsPanelProps) => {
  const [showCurrencySheet, setShowCurrencySheet] = useState(false);
  const [showThemeSheet, setShowThemeSheet] = useState(false);

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
    </div>
  );
};

export default SettingsPanel;
