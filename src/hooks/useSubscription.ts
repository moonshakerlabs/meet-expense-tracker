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

// Dynamic import for native purchases
const getNativePurchases = async () => {
  if (Capacitor.getPlatform() !== "android") {
    return null;
  }
  try {
    const { NativePurchases } = await import("@capgo/native-purchases");
    const { PURCHASE_TYPE } = await import("@capgo/native-purchases");
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

  // Load subscription state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SubscriptionState;
        
        // Check if trial has expired
        if (parsed.tier === "freemium_trial" && parsed.trialEndDate) {
          const endDate = new Date(parsed.trialEndDate);
          if (new Date() > endDate) {
            // Trial has expired, revert to free
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

  // Auto-restore purchases on app startup (Android only)
  useEffect(() => {
    if (!hasLoaded || autoRestoreDone.current) return;
    
    // Skip if already paid
    if (state.tier === "freemium_paid") {
      autoRestoreDone.current = true;
      return;
    }

    // Only run on native Android
    if (Capacitor.getPlatform() !== "android") {
      autoRestoreDone.current = true;
      return;
    }

    autoRestoreDone.current = true;

    const checkAndRestore = async () => {
      console.log("[Subscription] Auto-checking for existing purchases...");
      
      // Wait a bit for native side to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        const imports = await getNativePurchases();
        if (!imports) {
          console.log("[Subscription] NativePurchases not available for auto-restore");
          return;
        }

        const { NativePurchases, PURCHASE_TYPE } = imports;

        // Check if billing is supported
        const { isBillingSupported } = await NativePurchases.isBillingSupported();
        if (!isBillingSupported) {
          console.log("[Subscription] Billing not supported for auto-restore");
          return;
        }

        // Get existing purchases
        const { purchases } = await NativePurchases.getPurchases({
          productType: PURCHASE_TYPE.INAPP,
        });

        console.log("[Subscription] Found purchases:", purchases);

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
        } else {
          console.log("[Subscription] No existing purchase found");
        }
      } catch (e) {
        console.error("[Subscription] Auto-restore error:", e);
      }
    };

    checkAndRestore();
  }, [hasLoaded, state.tier]);

  // Save to localStorage only after initial load is complete
  useEffect(() => {
    if (hasLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, hasLoaded]);

  // Start 7-day free trial
  const startTrial = useCallback(() => {
    if (state.trialUsed) {
      return false; // Trial already used
    }

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

  // Upgrade to paid Freemium (after successful Google Play purchase)
  const upgradeToPaid = useCallback(() => {
    setState(prev => ({
      ...prev,
      tier: "freemium_paid",
      purchaseDate: new Date().toISOString(),
    }));
    return true;
  }, []);

  // Check if trial is active
  const isTrialActive = useCallback(() => {
    if (state.tier !== "freemium_trial") return false;
    if (!state.trialEndDate) return false;
    
    const endDate = new Date(state.trialEndDate);
    return new Date() <= endDate;
  }, [state.tier, state.trialEndDate]);

  // Check if user has paid for Freemium
  const isPaid = useCallback(() => {
    return state.tier === "freemium_paid";
  }, [state.tier]);

  // Get days remaining in trial
  const getTrialDaysRemaining = useCallback(() => {
    if (!state.trialEndDate) return 0;
    
    const endDate = new Date(state.trialEndDate);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }, [state.trialEndDate]);

  // Acknowledge data protection
  const acknowledgeDataProtection = useCallback(() => {
    setState(prev => ({
      ...prev,
      dataAcknowledged: true,
    }));
  }, []);

  // Get current tier (checking for expired trial)
  const getCurrentTier = useCallback((): SubscriptionTier => {
    if (state.tier === "freemium_trial" && !isTrialActive()) {
      return "free";
    }
    return state.tier;
  }, [state.tier, isTrialActive]);

  // Get feature access
  const featureAccess = getFeatureAccess(getCurrentTier());

  // Check if a specific feature is available
  const hasFeature = useCallback((feature: keyof typeof featureAccess) => {
    return featureAccess[feature];
  }, [featureAccess]);

  // Check if user can use non-primary currency
  const canUseMultipleCurrencies = useCallback(() => {
    return featureAccess.useMultipleCurrencies;
  }, [featureAccess.useMultipleCurrencies]);

  // Reset subscription (for app reset)
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
