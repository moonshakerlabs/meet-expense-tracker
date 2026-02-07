import { useState, useEffect, useCallback, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { PURCHASE_TYPE } from "@capgo/native-purchases";

// Product ID for the one-time Freemium purchase
export const FREEMIUM_PRODUCT_ID = "meet_freemium";

interface PurchaseState {
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

// Dynamically import the plugin only on native
const getNativePurchases = async () => {
  if (Capacitor.getPlatform() !== "android") {
    return null;
  }
  try {
    const { NativePurchases } = await import("@capgo/native-purchases");
    return NativePurchases;
  } catch (e) {
    console.error("[Billing] Failed to import NativePurchases:", e);
    return null;
  }
};

export const useGooglePlayBilling = () => {
  const [state, setState] = useState<PurchaseState>({
    isAvailable: false,
    isLoading: true,
    isPurchasing: false,
    productPrice: null,
    error: null,
  });

  const isNativeAndroid = Capacitor.getPlatform() === "android";
  const mounted = useRef(true);
  const initDone = useRef(false);
  const pluginRef = useRef<any>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (!isNativeAndroid) {
      setState((s) => ({ ...s, isLoading: false, isAvailable: false }));
      return;
    }

    if (initDone.current) return;
    initDone.current = true;

    const doInit = async () => {
      console.log("[Billing] Initializing @capgo/native-purchases...");

      try {
        const NativePurchases = await getNativePurchases();
        if (!NativePurchases || !mounted.current) {
          console.log("[Billing] NativePurchases not available");
          if (mounted.current) {
            setState((s) => ({ ...s, isLoading: false, isAvailable: false }));
          }
          return;
        }

        pluginRef.current = NativePurchases;

        // Check if billing is supported
        const { isBillingSupported } = await NativePurchases.isBillingSupported();
        console.log("[Billing] Billing supported:", isBillingSupported);

        if (!isBillingSupported) {
          if (mounted.current) {
            setState((s) => ({
              ...s,
              isLoading: false,
              isAvailable: false,
              error: "Billing not supported",
            }));
          }
          return;
        }

        // Get products to fetch price
        try {
          const { products } = await NativePurchases.getProducts({
            productIdentifiers: [FREEMIUM_PRODUCT_ID],
            productType: PURCHASE_TYPE.INAPP,
          });

          console.log("[Billing] Products:", products);

          const product = products?.find((p: any) => p.identifier === FREEMIUM_PRODUCT_ID);
          const price = product?.priceString || null;

          if (mounted.current) {
            setState((s) => ({
              ...s,
              isLoading: false,
              isAvailable: true,
              productPrice: price,
            }));
          }
        } catch (productError) {
          console.error("[Billing] Error fetching products:", productError);
          // Still mark as available - we can try purchasing without price info
          if (mounted.current) {
            setState((s) => ({
              ...s,
              isLoading: false,
              isAvailable: true,
              productPrice: null,
            }));
          }
        }

        console.log("[Billing] Init complete");
      } catch (e: any) {
        console.error("[Billing] Initialize error:", e);
        if (mounted.current) {
          setState((s) => ({
            ...s,
            isLoading: false,
            isAvailable: false,
            error: e?.message,
          }));
        }
      }
    };

    // Small delay to let native side initialize
    const timer = setTimeout(doInit, 500);
    return () => clearTimeout(timer);
  }, [isNativeAndroid]);

  // Purchase
  const purchaseFreemium = useCallback(async (): Promise<PurchaseResult> => {
    console.log("[Billing] purchaseFreemium called");

    if (!isNativeAndroid) {
      return { success: false, error: "Not on Android" };
    }

    const NativePurchases = pluginRef.current || (await getNativePurchases());
    if (!NativePurchases) {
      return { success: false, error: "Billing not available" };
    }

    setState((s) => ({ ...s, isPurchasing: true, error: null }));

    try {
      console.log("[Billing] Starting purchase for:", FREEMIUM_PRODUCT_ID);

      // This triggers the Google Play purchase dialog
      const transaction = await NativePurchases.purchaseProduct({
        productIdentifier: FREEMIUM_PRODUCT_ID,
        productType: PURCHASE_TYPE.INAPP,
      });

      console.log("[Billing] Purchase transaction:", transaction);

      if (transaction && transaction.transactionId) {
        console.log("[Billing] Purchase successful:", transaction.transactionId);
        setState((s) => ({ ...s, isPurchasing: false }));
        return { success: true };
      } else {
        setState((s) => ({ ...s, isPurchasing: false }));
        return { success: false, error: "Purchase not completed" };
      }
    } catch (e: any) {
      console.error("[Billing] Purchase error:", e);
      setState((s) => ({ ...s, isPurchasing: false }));

      const msg = (e?.message || e?.code || "").toLowerCase();
      
      // Check for user cancellation
      if (
        msg.includes("cancel") ||
        msg.includes("user_canceled") ||
        e?.code === "USER_CANCELED" ||
        e?.code === 1 // BillingResponseCode.USER_CANCELED
      ) {
        return { success: false, cancelled: true };
      }

      return { success: false, error: e?.message || "Purchase failed" };
    }
  }, [isNativeAndroid]);

  // Check existing purchase
  const checkExistingPurchase = useCallback(async (): Promise<boolean> => {
    if (!isNativeAndroid) return false;

    try {
      const NativePurchases = pluginRef.current || (await getNativePurchases());
      if (!NativePurchases) return false;

      console.log("[Billing] Checking existing purchases...");

      const { purchases } = await NativePurchases.getPurchases({
        productType: PURCHASE_TYPE.INAPP,
      });

      console.log("[Billing] Existing purchases:", purchases);

      const hasPurchase = purchases?.some(
        (p: any) => p.productIdentifier === FREEMIUM_PRODUCT_ID
      );

      return hasPurchase || false;
    } catch (e) {
      console.error("[Billing] checkExistingPurchase error:", e);
      return false;
    }
  }, [isNativeAndroid]);

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!isNativeAndroid) return false;

    try {
      const NativePurchases = pluginRef.current || (await getNativePurchases());
      if (!NativePurchases) return false;

      console.log("[Billing] Restoring purchases...");

      // Call restorePurchases first
      await NativePurchases.restorePurchases();

      // Then get purchases to check if product is owned
      const { purchases } = await NativePurchases.getPurchases({
        productType: PURCHASE_TYPE.INAPP,
      });

      console.log("[Billing] Restored purchases:", purchases);

      const hasPurchase = purchases?.some(
        (p: any) => p.productIdentifier === FREEMIUM_PRODUCT_ID
      );

      return hasPurchase || false;
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
