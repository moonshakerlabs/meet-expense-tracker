import { useState, useEffect, useCallback, useRef } from "react";
import { Capacitor } from "@capacitor/core";

interface UpdateState {
  updateAvailable: boolean;
  currentVersion: string;
  availableVersion: string;
  isChecking: boolean;
  isUpdating: boolean;
  flexibleUpdateAllowed: boolean;
  immediateUpdateAllowed: boolean;
  lastChecked: number | null;
}

const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour minimum between checks
const UPDATE_CHECK_TIMEOUT = 15000; // 15 seconds timeout

export const useAppUpdate = () => {
  const [state, setState] = useState<UpdateState>({
    updateAvailable: false,
    currentVersion: "",
    availableVersion: "",
    isChecking: false,
    isUpdating: false,
    flexibleUpdateAllowed: false,
    immediateUpdateAllowed: false,
    lastChecked: null,
  });
  
  const hasCheckedRef = useRef(false);

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

  // Check for updates with timeout and throttling
  const checkForUpdate = useCallback(async (force: boolean = false) => {
    if (!isNativeAndroid) {
      console.log("[AppUpdate] Not on Android, skipping update check");
      return false;
    }
    
    // Prevent concurrent checks
    if (state.isChecking) {
      console.log("[AppUpdate] Already checking, skipping");
      return false;
    }
    
    // Throttle checks unless forced
    if (!force && state.lastChecked) {
      const timeSinceLastCheck = Date.now() - state.lastChecked;
      if (timeSinceLastCheck < UPDATE_CHECK_INTERVAL) {
        console.log("[AppUpdate] Recently checked, skipping. Time since last:", timeSinceLastCheck);
        return state.updateAvailable;
      }
    }

    console.log("[AppUpdate] Starting update check...");
    setState((prev) => ({ ...prev, isChecking: true }));

    try {
      const AppUpdate = await getPlugin();
      if (!AppUpdate) {
        console.log("[AppUpdate] Plugin not available");
        setState((prev) => ({ ...prev, isChecking: false, lastChecked: Date.now() }));
        return false;
      }

      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Update check timed out")), UPDATE_CHECK_TIMEOUT);
      });

      // Race between the actual check and the timeout
      const result = await Promise.race([
        AppUpdate.getAppUpdateInfo(),
        timeoutPromise,
      ]);

      console.log("[AppUpdate] Update info received:", JSON.stringify(result));
      
      // updateAvailability: 1 = NOT_AVAILABLE, 2 = UPDATE_AVAILABLE, 3 = UPDATE_IN_PROGRESS
      const updateAvailable = result.updateAvailability === 2;
      const flexibleUpdateAllowed = result.flexibleUpdateAllowed || false;
      const immediateUpdateAllowed = result.immediateUpdateAllowed || false;

      console.log("[AppUpdate] Update available:", updateAvailable, 
        "| Availability code:", result.updateAvailability,
        "| Current:", result.currentVersionCode,
        "| Available:", result.availableVersionCode);

      setState({
        updateAvailable,
        currentVersion: result.currentVersionCode?.toString() || "",
        availableVersion: result.availableVersionCode?.toString() || "",
        isChecking: false,
        isUpdating: false,
        flexibleUpdateAllowed,
        immediateUpdateAllowed,
        lastChecked: Date.now(),
      });

      return updateAvailable;
    } catch (error) {
      console.error("[AppUpdate] Error checking for updates:", error);
      setState((prev) => ({ ...prev, isChecking: false, lastChecked: Date.now() }));
      return false;
    }
  }, [isNativeAndroid, getPlugin, state.isChecking, state.lastChecked, state.updateAvailable]);

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

  // Check for updates on mount (only once)
  useEffect(() => {
    if (isNativeAndroid && !hasCheckedRef.current) {
      hasCheckedRef.current = true;
      // Small delay to let the app initialize
      const timer = setTimeout(() => {
        console.log("[AppUpdate] Initial update check on mount");
        checkForUpdate(true); // Force check on first mount
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isNativeAndroid]);

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
