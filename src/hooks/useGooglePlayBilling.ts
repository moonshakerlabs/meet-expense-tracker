import { useState, useEffect, useCallback, useRef } from "react";
import { Capacitor } from "@capacitor/core";

export const FREEMIUM_PRODUCT_ID = "meet_freemium";

interface BillingState {
  isAvailable: boolean;
  isLoading: boolean;
  isPurchasing: boolean;
  productPrice: string | null;
  error: string | null;
}

export interface PurchaseResult {
  success: boolean;
  cancelled?: boolean;
  error?: string;
}

// Dynamically import the plugin only on native Android
const getNativePurchasesModule = async () => {
  if (Capacitor.getPlatform() !== "android") return null;
  try {
    const mod = await import("@capgo/native-purchases");
    return { NativePurchases: mod.NativePurchases, PURCHASE_TYPE: mod.PURCHASE_TYPE };
  } catch (e) {
    console.error("[Billing] Failed to import @capgo/native-purchases:", e);
    return null;
  }
};

export const useGooglePlayBilling = () => {
  const [state, setState] = useState<BillingState>({
    isAvailable: false,
    isLoading: true,
    isPurchasing: false,
    productPrice: null,
    error: null,
  });

  const isNativeAndroid = Capacitor.getPlatform() === "android";
  const mounted = useRef(true);
  const initDone = useRef(false);
  const pluginCache = useRef<any>(null);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Initialize billing
  useEffect(() => {
    if (!isNativeAndroid) {
      setState(s => ({ ...s, isLoading: false, isAvailable: false }));
      return;
    }
    if (initDone.current) return;
    initDone.current = true;

    const init = async () => {
      console.log("[Billing] Initializing...");
      try {
        const mod = await getNativePurchasesModule();
        if (!mod || !mounted.current) {
          if (mounted.current) setState(s => ({ ...s, isLoading: false, isAvailable: false }));
          return;
        }
        pluginCache.current = mod;

        const { isBillingSupported } = await mod.NativePurchases.isBillingSupported();
        console.log("[Billing] Supported:", isBillingSupported);

        if (!isBillingSupported) {
          if (mounted.current) setState(s => ({ ...s, isLoading: false, isAvailable: false, error: "Billing not supported" }));
          return;
        }

        // Fetch product price
        let price: string | null = null;
        try {
          const { products } = await mod.NativePurchases.getProducts({
            productIdentifiers: [FREEMIUM_PRODUCT_ID],
            productType: mod.PURCHASE_TYPE.INAPP,
          });
          const product = products?.find((p: any) => p.identifier === FREEMIUM_PRODUCT_ID);
          price = product?.priceString || null;
          console.log("[Billing] Product price:", price);
        } catch (e) {
          console.warn("[Billing] Could not fetch product price:", e);
        }

        if (mounted.current) {
          setState(s => ({ ...s, isLoading: false, isAvailable: true, productPrice: price }));
        }
      } catch (e: any) {
        console.error("[Billing] Init error:", e);
        if (mounted.current) setState(s => ({ ...s, isLoading: false, isAvailable: false, error: e?.message }));
      }
    };

    const timer = setTimeout(init, 500);
    return () => clearTimeout(timer);
  }, [isNativeAndroid]);

  // Purchase the freemium product — triggers Google Play billing popup
  const purchaseFreemium = useCallback(async (): Promise<PurchaseResult> => {
    if (!isNativeAndroid) return { success: false, error: "Not on Android" };

    const mod = pluginCache.current || (await getNativePurchasesModule());
    if (!mod) return { success: false, error: "Billing not available" };

    setState(s => ({ ...s, isPurchasing: true, error: null }));

    try {
      console.log("[Billing] Launching purchase for:", FREEMIUM_PRODUCT_ID);
      const transaction = await mod.NativePurchases.purchaseProduct({
        productIdentifier: FREEMIUM_PRODUCT_ID,
        productType: mod.PURCHASE_TYPE.INAPP,
      });

      console.log("[Billing] Transaction:", transaction);
      setState(s => ({ ...s, isPurchasing: false }));

      if (transaction?.transactionId) {
        return { success: true };
      }
      return { success: false, error: "Purchase not completed" };
    } catch (e: any) {
      console.error("[Billing] Purchase error:", e);
      setState(s => ({ ...s, isPurchasing: false }));

      const msg = (e?.message || e?.code || "").toLowerCase();
      if (msg.includes("cancel") || msg.includes("user_canceled") || e?.code === "USER_CANCELED" || e?.code === 1) {
        return { success: false, cancelled: true };
      }
      return { success: false, error: e?.message || "Purchase failed" };
    }
  }, [isNativeAndroid]);

  // Check if user already owns the product (for auto-restore on app launch)
  const checkExistingPurchase = useCallback(async (): Promise<boolean> => {
    if (!isNativeAndroid) return false;
    try {
      const mod = pluginCache.current || (await getNativePurchasesModule());
      if (!mod) return false;

      const { isBillingSupported } = await mod.NativePurchases.isBillingSupported();
      if (!isBillingSupported) return false;

      const { purchases } = await mod.NativePurchases.getPurchases({
        productType: mod.PURCHASE_TYPE.INAPP,
      });
      console.log("[Billing] Existing purchases:", purchases);
      return purchases?.some((p: any) => p.productIdentifier === FREEMIUM_PRODUCT_ID) || false;
    } catch (e) {
      console.error("[Billing] checkExistingPurchase error:", e);
      return false;
    }
  }, [isNativeAndroid]);

  // Restore purchases (manual trigger)
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!isNativeAndroid) return false;
    try {
      const mod = pluginCache.current || (await getNativePurchasesModule());
      if (!mod) return false;

      await mod.NativePurchases.restorePurchases();
      const { purchases } = await mod.NativePurchases.getPurchases({
        productType: mod.PURCHASE_TYPE.INAPP,
      });
      console.log("[Billing] Restored purchases:", purchases);
      return purchases?.some((p: any) => p.productIdentifier === FREEMIUM_PRODUCT_ID) || false;
    } catch (e) {
      console.error("[Billing] Restore error:", e);
      return false;
    }
  }, [isNativeAndroid]);

  return {
    ...state,
    isNativeAndroid,
    purchaseFreemium,
    checkExistingPurchase,
    restorePurchases,
  };
};
