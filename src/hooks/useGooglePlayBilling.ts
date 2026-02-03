import { useState, useEffect, useCallback, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import "cordova-plugin-purchase";

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

// Get the CdvPurchase store instance
const getStore = (): typeof CdvPurchase.store | null => {
  if (typeof CdvPurchase !== "undefined" && CdvPurchase.store) {
    return CdvPurchase.store;
  }
  return null;
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
  const purchaseResolverRef = useRef<((result: PurchaseResult) => void) | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (!isNativeAndroid) {
      setState(s => ({ ...s, isLoading: false, isAvailable: false }));
      return;
    }

    if (initDone.current) return;
    initDone.current = true;

    const doInit = async () => {
      console.log("[Billing] Initializing CdvPurchase...");

      const store = getStore();
      if (!store || !mounted.current) {
        console.log("[Billing] CdvPurchase store not available");
        if (mounted.current) {
          setState(s => ({ ...s, isLoading: false, isAvailable: false }));
        }
        return;
      }

      // Set verbosity for debugging
      store.verbosity = CdvPurchase.LogLevel.DEBUG;

      // Register the product
      store.register([{
        id: FREEMIUM_PRODUCT_ID,
        type: CdvPurchase.ProductType.NON_CONSUMABLE,
        platform: CdvPurchase.Platform.GOOGLE_PLAY,
      }]);

      // Listen for transaction updates
      store.when()
        .approved((transaction) => {
          console.log("[Billing] Transaction approved:", transaction.transactionId);
          // Verify and finish the transaction
          transaction.verify();
        })
        .verified((receipt) => {
          console.log("[Billing] Receipt verified:", receipt.id);
          // Finish the transaction
          receipt.finish();
        })
        .finished((transaction) => {
          console.log("[Billing] Transaction finished:", transaction.transactionId);
          // Resolve purchase promise if we have one pending
          if (purchaseResolverRef.current) {
            purchaseResolverRef.current({ success: true });
            purchaseResolverRef.current = null;
          }
          if (mounted.current) {
            setState(s => ({ ...s, isPurchasing: false }));
          }
        });

      // Handle errors
      store.error((error) => {
        console.error("[Billing] Store error:", error.code, error.message);
        if (purchaseResolverRef.current) {
          const cancelled = error.code === CdvPurchase.ErrorCode.PAYMENT_CANCELLED;
          purchaseResolverRef.current({
            success: false,
            cancelled,
            error: cancelled ? undefined : error.message,
          });
          purchaseResolverRef.current = null;
        }
        if (mounted.current) {
          setState(s => ({ ...s, isPurchasing: false, error: error.message }));
        }
      });

      // Initialize the store
      try {
        console.log("[Billing] Calling store.initialize()...");
        await store.initialize([CdvPurchase.Platform.GOOGLE_PLAY]);
        console.log("[Billing] Store initialized successfully");

        // Get product info
        const product = store.get(FREEMIUM_PRODUCT_ID, CdvPurchase.Platform.GOOGLE_PLAY);
        const price = product?.pricing?.price || null;
        console.log("[Billing] Product:", product?.id, "Price:", price);

        if (mounted.current) {
          setState(s => ({
            ...s,
            isLoading: false,
            isAvailable: true,
            productPrice: price,
          }));
        }
      } catch (e: any) {
        console.error("[Billing] Initialize error:", e);
        if (mounted.current) {
          setState(s => ({ ...s, isLoading: false, isAvailable: false, error: e?.message }));
        }
      }

      console.log("[Billing] Init complete");
    };

    // Delay to let Cordova/native side initialize
    const timer = setTimeout(doInit, 1500);
    return () => clearTimeout(timer);
  }, [isNativeAndroid]);

  // Purchase
  const purchaseFreemium = useCallback(async (): Promise<PurchaseResult> => {
    console.log("[Billing] purchaseFreemium called");

    if (!isNativeAndroid) {
      return { success: false, error: "Not on Android" };
    }

    const store = getStore();
    if (!store) {
      return { success: false, error: "Billing not available" };
    }

    setState(s => ({ ...s, isPurchasing: true, error: null }));

    try {
      const product = store.get(FREEMIUM_PRODUCT_ID, CdvPurchase.Platform.GOOGLE_PLAY);
      if (!product) {
        setState(s => ({ ...s, isPurchasing: false }));
        return { success: false, error: "Product not found" };
      }

      // Check if already owned
      if (product.owned) {
        console.log("[Billing] Product already owned");
        setState(s => ({ ...s, isPurchasing: false }));
        return { success: true };
      }

      console.log("[Billing] Starting purchase order...");

      // Create a promise that will be resolved by the event handlers
      const purchasePromise = new Promise<PurchaseResult>((resolve) => {
        purchaseResolverRef.current = resolve;

        // Set a timeout in case something goes wrong
        setTimeout(() => {
          if (purchaseResolverRef.current === resolve) {
            purchaseResolverRef.current = null;
            resolve({ success: false, error: "Purchase timed out" });
          }
        }, 120000); // 2 minute timeout
      });

      // Start the purchase
      const offer = product.getOffer();
      if (offer) {
        await store.order(offer);
      } else {
        setState(s => ({ ...s, isPurchasing: false }));
        return { success: false, error: "No offer available" };
      }

      // Wait for the purchase to complete
      return await purchasePromise;

    } catch (e: any) {
      console.error("[Billing] Purchase error:", e);
      setState(s => ({ ...s, isPurchasing: false }));

      const msg = (e?.message || "").toLowerCase();
      if (msg.includes("cancel")) {
        return { success: false, cancelled: true };
      }

      return { success: false, error: e?.message || "Purchase failed" };
    }
  }, [isNativeAndroid]);

  // Check existing purchase
  const checkExistingPurchase = useCallback(async (): Promise<boolean> => {
    if (!isNativeAndroid) return false;

    try {
      const store = getStore();
      if (!store) return false;

      const product = store.get(FREEMIUM_PRODUCT_ID, CdvPurchase.Platform.GOOGLE_PLAY);
      return product?.owned || false;
    } catch (e) {
      console.error("[Billing] checkExistingPurchase error:", e);
      return false;
    }
  }, [isNativeAndroid]);

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!isNativeAndroid) return false;

    try {
      const store = getStore();
      if (!store) return false;

      console.log("[Billing] Restoring purchases...");
      await store.restorePurchases();

      // Check if product is now owned
      const product = store.get(FREEMIUM_PRODUCT_ID, CdvPurchase.Platform.GOOGLE_PLAY);
      return product?.owned || false;
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
