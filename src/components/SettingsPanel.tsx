import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserSettings, Expense } from "@/types/expense";
import { ArrowLeft, Check, Sun, Moon, Smartphone, ChevronRight, Lock, Key, Shield, BookOpen, User, RotateCcw } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  onResetApp?: () => void;
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
  onViewAppTour,
  onResetApp,
}: SettingsPanelProps) => {
  const [showThemeSheet, setShowThemeSheet] = useState(false);
  const [showNameSheet, setShowNameSheet] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [newName, setNewName] = useState(settings.userName || "");

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

  const handleSaveName = () => {
    if (newName.trim()) {
      onUpdateSettings({ userName: newName.trim() });
      toast.success("App name updated");
      setShowNameSheet(false);
    }
  };

  const handleResetApp = () => {
    onResetApp?.();
    setShowResetDialog(false);
    toast.success("App has been reset");
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
        {/* Profile */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            Profile
          </h3>
          <Card className="rounded-2xl divide-y divide-border">
            <button
              className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
              onClick={() => {
                setNewName(settings.userName || "");
                setShowNameSheet(true);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Edit App Name</p>
                  <p className="text-sm text-muted-foreground">
                    {settings.userName || "Set your name"}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </Card>
        </div>

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

        {/* Data Management */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
            Data Management
          </h3>
          <Card className="rounded-2xl divide-y divide-border">
            <button
              className="w-full p-4 flex items-center justify-between hover:bg-destructive/5 transition-colors"
              onClick={() => setShowResetDialog(true)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-destructive" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-destructive">App Reset</p>
                  <p className="text-sm text-muted-foreground">
                    Clear all data and start fresh
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
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

      {/* Name Edit Sheet */}
      <Sheet open={showNameSheet} onOpenChange={setShowNameSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="mb-4">
            <SheetTitle>Edit App Name</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pb-8">
            <Input
              placeholder="Enter your name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="rounded-xl h-12"
              autoFocus
            />
            <Button
              className="w-full h-12 rounded-xl"
              onClick={handleSaveName}
              disabled={!newName.trim()}
            >
              Save Name
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="max-w-[90%] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset App?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your expenses, settings, and data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleResetApp}
            >
              Reset Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsPanel;