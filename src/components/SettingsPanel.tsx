import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserSettings, Expense } from "@/types/expense";
import { ArrowLeft, Check, Sun, Moon, Smartphone, ChevronRight, Lock, Key, Shield, BookOpen, FileText } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface SettingsPanelProps {
  settings: UserSettings;
  onUpdateSettings: (updates: Partial<UserSettings>) => void;
  onBack: () => void;
  expenses: Expense[];
  onEnablePin?: (hashedPin: string) => void;
  onDisablePin?: () => void;
  onChangePin?: () => void;
  onViewPrivacy?: () => void;
  onViewAppTour?: () => void;
}

const SettingsPanel = ({ 
  settings, 
  onUpdateSettings, 
  onBack, 
  expenses, 
  onEnablePin, 
  onDisablePin, 
  onChangePin, 
  onViewPrivacy, 
  onViewAppTour 
}: SettingsPanelProps) => {
  const [showThemeSheet, setShowThemeSheet] = useState(false);

  const themes = [
    { id: "light" as const, icon: Sun, label: "Light", desc: "Clean & bright" },
    { id: "dark" as const, icon: Moon, label: "Dark", desc: "Elegant night mode" },
    { id: "system" as const, icon: Smartphone, label: "System", desc: "Match device" },
  ];

  const handlePinToggle = (enabled: boolean) => {
    if (enabled) {
      onChangePin?.();
    } else {
      onDisablePin?.();
      toast.success("PIN protection disabled");
    }
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
          <h1 className="font-display font-bold text-xl">Settings</h1>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Appearance */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            Appearance
          </h3>
          <Card className="rounded-2xl divide-y divide-border">
            {/* Theme */}
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

        {/* Security */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            Security
          </h3>
          <Card className="rounded-2xl divide-y divide-border">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">PIN Protection</p>
                  <p className="text-sm text-muted-foreground">
                    Protect app with 6-digit PIN
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.pinEnabled}
                onCheckedChange={handlePinToggle}
              />
            </div>

            {settings.pinEnabled && (
              <button
                className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                onClick={onChangePin}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Key className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Change PIN</p>
                    <p className="text-sm text-muted-foreground">
                      Update your security PIN
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </Card>
        </div>

        {/* Legal & Info */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            Legal & Info
          </h3>
          <Card className="rounded-2xl divide-y divide-border">
            <button
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
              onClick={onViewPrivacy}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Privacy Policy</p>
                  <p className="text-sm text-muted-foreground">
                    How your data is protected
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
              onClick={onViewPrivacy}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Terms & Conditions</p>
                  <p className="text-sm text-muted-foreground">
                    App usage terms
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <button
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
              onClick={onViewAppTour}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">View Onboarding</p>
                  <p className="text-sm text-muted-foreground">
                    See app features tour
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="p-4">
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
            </div>
          </Card>
        </div>
      </div>

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
