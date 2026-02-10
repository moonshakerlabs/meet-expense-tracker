import { useState, useEffect, useCallback, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { SubscriptionState, SubscriptionTier, TRIAL_DURATION_DAYS, getFeatureAccess } from "@/types/subscription";
import { FREEMIUM_PRODUCT_ID } from "@/hooks/useGooglePlayBilling";

const STORAGE_KEY = "meet_subscription";

const getDefaultState = (): SubscriptionState => ({
  tier: "free",
  trialUsed: false,
  dataAcknowledged: false,
});

// Dynamic import for native purchases (auto-restore on launch)
const getNativePurchases = async () => {
  if (Capacitor.getPlatform() !== "android") return null;
  try {
    const { NativePurchases, PURCHASE_TYPE } = await import("@capgo/native-purchases");
    return { NativePurchases, PURCHASE_TYPE };
  } catch (e) {
    console.error("[Subscription] Failed to import NativePurchases:", e);
    return null;
  }
};

export const useSubscription = () => {
  const [state, setState] = useState<SubscriptionState>(getDefaultState());
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const autoRestoreDone = useRef(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SubscriptionState;
        if (parsed.tier === "freemium_trial" && parsed.trialEndDate) {
          if (new Date() > new Date(parsed.trialEndDate)) {
            parsed.tier = "free";
          }
        }
        setState(parsed);
      }
    } catch (error) {
      console.error("Error loading subscription state:", error);
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, []);

  // Auto-restore on app launch: check Google Play for existing purchase
  useEffect(() => {
    if (!hasLoaded || autoRestoreDone.current) return;
    if (state.tier === "freemium_paid") {
      autoRestoreDone.current = true;
      return;
    }
    if (Capacitor.getPlatform() !== "android") {
      autoRestoreDone.current = true;
      return;
    }

    autoRestoreDone.current = true;

    const checkAndRestore = async () => {
      console.log("[Subscription] Auto-checking for existing purchases...");
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        const imports = await getNativePurchases();
        if (!imports) return;

        const { NativePurchases, PURCHASE_TYPE } = imports;
        const { isBillingSupported } = await NativePurchases.isBillingSupported();
        if (!isBillingSupported) return;

        const { purchases } = await NativePurchases.getPurchases({
          productType: PURCHASE_TYPE.INAPP,
        });

        const hasPurchase = purchases?.some(
          (p: any) => p.productIdentifier === FREEMIUM_PRODUCT_ID
        );

        if (hasPurchase) {
          console.log("[Subscription] Found existing purchase, restoring paid status");
          setState(prev => ({
            ...prev,
            tier: "freemium_paid",
            purchaseDate: prev.purchaseDate || new Date().toISOString(),
          }));
        }
      } catch (e) {
        console.error("[Subscription] Auto-restore error:", e);
      }
    };

    checkAndRestore();
  }, [hasLoaded, state.tier]);

  // Persist to localStorage after initial load
  useEffect(() => {
    if (hasLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, hasLoaded]);

  const startTrial = useCallback(() => {
    if (state.trialUsed) return false;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + TRIAL_DURATION_DAYS);
    setState(prev => ({
      ...prev,
      tier: "freemium_trial",
      trialStartDate: startDate.toISOString(),
      trialEndDate: endDate.toISOString(),
      trialUsed: true,
    }));
    return true;
  }, [state.trialUsed]);

  const upgradeToPaid = useCallback(() => {
    setState(prev => ({
      ...prev,
      tier: "freemium_paid",
      purchaseDate: new Date().toISOString(),
    }));
    return true;
  }, []);

  const isTrialActive = useCallback(() => {
    if (state.tier !== "freemium_trial" || !state.trialEndDate) return false;
    return new Date() <= new Date(state.trialEndDate);
  }, [state.tier, state.trialEndDate]);

  const isPaid = useCallback(() => state.tier === "freemium_paid", [state.tier]);

  const getTrialDaysRemaining = useCallback(() => {
    if (!state.trialEndDate) return 0;
    const diffDays = Math.ceil((new Date(state.trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, [state.trialEndDate]);

  const acknowledgeDataProtection = useCallback(() => {
    setState(prev => ({ ...prev, dataAcknowledged: true }));
  }, []);

  const getCurrentTier = useCallback((): SubscriptionTier => {
    if (state.tier === "freemium_trial" && !isTrialActive()) return "free";
    return state.tier;
  }, [state.tier, isTrialActive]);

  const featureAccess = getFeatureAccess(getCurrentTier());

  const hasFeature = useCallback((feature: keyof typeof featureAccess) => {
    return featureAccess[feature];
  }, [featureAccess]);

  const canUseMultipleCurrencies = useCallback(() => {
    return featureAccess.useMultipleCurrencies;
  }, [featureAccess.useMultipleCurrencies]);

  const resetSubscription = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(getDefaultState());
  }, []);

  return {
    tier: getCurrentTier(),
    state,
    isLoading,
    hasLoaded,
    featureAccess,
    hasFeature,
    canUseMultipleCurrencies,
    startTrial,
    upgradeToPaid,
    isTrialActive,
    isPaid,
    getTrialDaysRemaining,
    trialUsed: state.trialUsed,
    dataAcknowledged: state.dataAcknowledged,
    acknowledgeDataProtection,
    resetSubscription,
  };
};
