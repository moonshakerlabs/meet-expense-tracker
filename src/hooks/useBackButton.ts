import { useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

interface UseBackButtonOptions {
  onBack?: () => void;
  isHome?: boolean;
  onExitRequest?: () => void;
}

export const useBackButton = ({ onBack, isHome = false, onExitRequest }: UseBackButtonOptions) => {
  const handleBackButton = useCallback(() => {
    if (isHome) {
      // On home screen, request exit confirmation
      onExitRequest?.();
    } else if (onBack) {
      // On other screens, navigate back
      onBack();
    }
  }, [isHome, onBack, onExitRequest]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = App.addListener("backButton", ({ canGoBack }) => {
      handleBackButton();
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [handleBackButton]);
};

export const exitApp = () => {
  if (Capacitor.isNativePlatform()) {
    App.exitApp();
  }
};
