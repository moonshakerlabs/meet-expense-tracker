import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useState, useEffect } from "react";

const InstallPrompt = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    
    // Check if dismissed before
    const wasDismissed = localStorage.getItem("pwa-install-dismissed");
    if (wasDismissed) {
      const dismissedTime = parseInt(wasDismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setDismissed(true);
    }
  };

  // Don't show if already installed or dismissed
  if (isInstalled || dismissed) return null;

  // iOS instructions (can't auto-prompt on iOS)
  if (isIOS) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
        <div className="glass rounded-2xl p-4 shadow-xl border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm">Install MEET App</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Tap the <span className="font-medium">Share</span> button, then <span className="font-medium">"Add to Home Screen"</span>
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0"
              onClick={handleDismiss}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Android/Desktop with install prompt
  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <div className="glass rounded-2xl p-4 shadow-xl border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm">Install MEET App</h3>
            <p className="text-xs text-muted-foreground">Quick access from your home screen</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={handleDismiss}
            >
              Later
            </Button>
            <Button
              size="sm"
              className="h-8"
              onClick={handleInstall}
            >
              Install
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
