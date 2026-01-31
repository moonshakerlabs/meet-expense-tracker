import { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";

interface UpdateState {
  updateAvailable: boolean;
  currentVersion: string;
  availableVersion: string;
  isChecking: boolean;
  isUpdating: boolean;
  flexibleUpdateAllowed: boolean;
  immediateUpdateAllowed: boolean;
}

export const useAppUpdate = () => {
  const [state, setState] = useState<UpdateState>({
    updateAvailable: false,
    currentVersion: "",
    availableVersion: "",
    isChecking: false,
    isUpdating: false,
    flexibleUpdateAllowed: false,
    immediateUpdateAllowed: false,
  });

  const isNativeAndroid = Capacitor.getPlatform() === "android";

  // Dynamically import the plugin only on native Android
  const getPlugin = useCallback(async () => {
    if (!isNativeAndroid) return null;
    try {
      const { AppUpdate } = await import("@capawesome/capacitor-app-update");
      return AppUpdate;
    } catch (error) {
      console.error("[AppUpdate] Failed to load plugin:", error);
      return null;
    }
  }, [isNativeAndroid]);

  // Check for updates with timeout
  const checkForUpdate = useCallback(async (timeoutMs: number = 10000) => {
    if (!isNativeAndroid) {
      console.log("[AppUpdate] Not on Android, skipping update check");
      return false;
    }

    setState((prev) => ({ ...prev, isChecking: true }));

    try {
      const AppUpdate = await getPlugin();
      if (!AppUpdate) {
        setState((prev) => ({ ...prev, isChecking: false }));
        return false;
      }

      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Update check timed out")), timeoutMs);
      });

      // Race between the actual check and the timeout
      const result = await Promise.race([
        AppUpdate.getAppUpdateInfo(),
        timeoutPromise,
      ]);

      console.log("[AppUpdate] Update info:", JSON.stringify(result));

      const updateAvailable = result.updateAvailability === 2; // UPDATE_AVAILABLE
      const flexibleUpdateAllowed = result.flexibleUpdateAllowed || false;
      const immediateUpdateAllowed = result.immediateUpdateAllowed || false;

      setState({
        updateAvailable,
        currentVersion: result.currentVersionCode?.toString() || "",
        availableVersion: result.availableVersionCode?.toString() || "",
        isChecking: false,
        isUpdating: false,
        flexibleUpdateAllowed,
        immediateUpdateAllowed,
      });

      return updateAvailable;
    } catch (error) {
      console.error("[AppUpdate] Error checking for updates:", error);
      setState((prev) => ({ ...prev, isChecking: false }));
      return false;
    }
  }, [isNativeAndroid, getPlugin]);

  // Start flexible update (downloads in background)
  const startFlexibleUpdate = useCallback(async () => {
    if (!isNativeAndroid) return false;

    setState((prev) => ({ ...prev, isUpdating: true }));

    try {
      const AppUpdate = await getPlugin();
      if (!AppUpdate) {
        setState((prev) => ({ ...prev, isUpdating: false }));
        return false;
      }

      await AppUpdate.startFlexibleUpdate();
      console.log("[AppUpdate] Flexible update started");
      return true;
    } catch (error) {
      console.error("[AppUpdate] Flexible update error:", error);
      setState((prev) => ({ ...prev, isUpdating: false }));
      return false;
    }
  }, [isNativeAndroid, getPlugin]);

  // Complete flexible update (installs the downloaded update)
  const completeFlexibleUpdate = useCallback(async () => {
    if (!isNativeAndroid) return;

    try {
      const AppUpdate = await getPlugin();
      if (!AppUpdate) return;

      await AppUpdate.completeFlexibleUpdate();
      console.log("[AppUpdate] Flexible update completed");
    } catch (error) {
      console.error("[AppUpdate] Complete update error:", error);
    }
  }, [isNativeAndroid, getPlugin]);

  // Start immediate update (blocks UI until update is installed)
  const startImmediateUpdate = useCallback(async () => {
    if (!isNativeAndroid) return false;

    setState((prev) => ({ ...prev, isUpdating: true }));

    try {
      const AppUpdate = await getPlugin();
      if (!AppUpdate) {
        setState((prev) => ({ ...prev, isUpdating: false }));
        return false;
      }

      await AppUpdate.performImmediateUpdate();
      console.log("[AppUpdate] Immediate update started");
      return true;
    } catch (error) {
      console.error("[AppUpdate] Immediate update error:", error);
      setState((prev) => ({ ...prev, isUpdating: false }));
      return false;
    }
  }, [isNativeAndroid, getPlugin]);

  // Open app store page
  const openAppStore = useCallback(async () => {
    if (!isNativeAndroid) return;

    try {
      const AppUpdate = await getPlugin();
      if (!AppUpdate) return;

      await AppUpdate.openAppStore();
    } catch (error) {
      console.error("[AppUpdate] Open store error:", error);
    }
  }, [isNativeAndroid, getPlugin]);

  // Check for updates on mount
  useEffect(() => {
    if (isNativeAndroid) {
      // Small delay to let the app initialize
      const timer = setTimeout(() => {
        checkForUpdate();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isNativeAndroid, checkForUpdate]);

  return {
    ...state,
    isNativeAndroid,
    checkForUpdate,
    startFlexibleUpdate,
    completeFlexibleUpdate,
    startImmediateUpdate,
    openAppStore,
  };
};
