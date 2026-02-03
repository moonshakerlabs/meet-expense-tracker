import { useState, useEffect, useCallback } from "react";
import { Capacitor } from "@capacitor/core";

// Product ID for the one-time Freemium purchase
// This must match the product ID you created in Google Play Console
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

export const useGooglePlayBilling = () => {
  const [state, setState] = useState<PurchaseState>({
    isAvailable: false,
    isLoading: true,
    isPurchasing: false,
    productPrice: null,
    error: null,
  });

  const isNativeAndroid = Capacitor.getPlatform() === "android";

  // Dynamically import the plugin only on native Android
  const getPlugin = useCallback(async () => {
    if (!isNativeAndroid) return null;
    try {
      const { NativePurchases } = await import("@capgo/native-purchases");
      return NativePurchases;
    } catch (error) {
      console.error("Failed to load NativePurchases plugin:", error);
      return null;
    }
  }, [isNativeAndroid]);

  // Initialize billing and check for existing purchases
  useEffect(() => {
    const initialize = async () => {
      if (!isNativeAndroid) {
        setState((prev) => ({ ...prev, isLoading: false, isAvailable: false }));
        return;
      }

      // Add timeout to prevent hanging - 5 seconds max for billing init
      const timeoutId = setTimeout(() => {
        console.warn("[Billing] Initialization timeout - billing may not be available");
        setState((prev) => {
          if (prev.isLoading) {
            return { ...prev, isLoading: false, isAvailable: false, error: null };
          }
          return prev;
        });
      }, 5000);

      try {
        const NativePurchases = await getPlugin();
        if (!NativePurchases) {
          clearTimeout(timeoutId);
          setState((prev) => ({ ...prev, isLoading: false, isAvailable: false }));
          return;
        }

        // Check if billing is supported
        let isBillingSupported = false;
        try {
          const result = await NativePurchases.isBillingSupported();
          isBillingSupported = result?.isBillingSupported ?? false;
        } catch (billingCheckError) {
          console.warn("[Billing] isBillingSupported check failed:", billingCheckError);
          isBillingSupported = false;
        }

        if (!isBillingSupported) {
          clearTimeout(timeoutId);
          setState((prev) => ({
            ...prev,
            isLoading: false,
            isAvailable: false,
            error: null, // Don't show error for unsupported devices
          }));
          return;
        }

        // Get product information
        let productPrice: string | null = null;
        try {
          const { products } = await NativePurchases.getProducts({
            productIdentifiers: [FREEMIUM_PRODUCT_ID],
            productType: "INAPP" as any, // One-time purchase
          });

          const freemiumProduct = products.find(
            (p: any) => p.productIdentifier === FREEMIUM_PRODUCT_ID || p.identifier === FREEMIUM_PRODUCT_ID
          );

          const priceValue = freemiumProduct?.priceString || freemiumProduct?.price;
          productPrice = typeof priceValue === 'number' ? `$${priceValue}` : priceValue || null;
        } catch (productError) {
          console.warn("[Billing] Failed to get product info:", productError);
          // Continue without price - billing may still work
        }

        clearTimeout(timeoutId);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isAvailable: true,
          productPrice,
        }));
      } catch (error) {
        clearTimeout(timeoutId);
        console.error("Billing initialization error:", error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          isAvailable: false,
          error: null, // Don't show error to user for init failures
        }));
      }
    };

    initialize();
  }, [isNativeAndroid, getPlugin]);

  // Check if user has already purchased Freemium
  const checkExistingPurchase = useCallback(async (): Promise<boolean> => {
    if (!isNativeAndroid) return false;

    try {
      const NativePurchases = await getPlugin();
      if (!NativePurchases) return false;

      const { purchases } = await NativePurchases.getPurchases({
        productType: "INAPP" as any,
      });

      return purchases.some(
        (p: any) =>
          (p.productIdentifier === FREEMIUM_PRODUCT_ID || p.identifier === FREEMIUM_PRODUCT_ID) &&
          (p.purchaseState === "PURCHASED" || p.isAcknowledged)
      );
    } catch (error) {
      console.error("Error checking existing purchases:", error);
      return false;
    }
  }, [isNativeAndroid, getPlugin]);

  // Purchase Freemium upgrade
  const purchaseFreemium = useCallback(async (): Promise<PurchaseResult> => {
    console.log("[Billing] purchaseFreemium called, isNativeAndroid:", isNativeAndroid);
    
    if (!isNativeAndroid) {
      const error = "Google Play Billing is only available on Android devices";
      setState((prev) => ({ ...prev, error }));
      return { success: false, error };
    }

    setState((prev) => ({ ...prev, isPurchasing: true, error: null }));

    // Helper to create a timeout promise
    const createTimeout = (ms: number, message: string) => 
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(message)), ms)
      );

    try {
      // Load plugin with timeout
      const NativePurchases = await Promise.race([
        getPlugin(),
        createTimeout(10000, "Billing service connection timeout")
      ]);
      console.log("[Billing] Plugin loaded:", !!NativePurchases);
      
      if (!NativePurchases) {
        throw new Error("Billing plugin not available. Please ensure Google Play Services is installed.");
      }

      console.log("[Billing] Starting purchase for product:", FREEMIUM_PRODUCT_ID);
      
      // First verify the product exists
      try {
        console.log("[Billing] Checking if product exists...");
        const { products } = await Promise.race([
          NativePurchases.getProducts({
            productIdentifiers: [FREEMIUM_PRODUCT_ID],
            productType: "INAPP" as any,
          }),
          createTimeout(10000, "Failed to fetch product info")
        ]);
        
        console.log("[Billing] Products found:", JSON.stringify(products));
        
        if (!products || products.length === 0) {
          throw new Error(`Product '${FREEMIUM_PRODUCT_ID}' not found in Google Play. Please check your Google Play Console setup.`);
        }
      } catch (productError: any) {
        console.error("[Billing] Product check failed:", productError);
        if (productError.message?.includes("not found")) {
          throw productError;
        }
        // Continue anyway - product check may fail but purchase might still work
        console.warn("[Billing] Continuing despite product check failure");
      }
      
      let transaction: any;
      try {
        // Purchase with timeout (60 seconds to allow user to complete payment)
        console.log("[Billing] Initiating purchase...");
        transaction = await Promise.race([
          NativePurchases.purchaseProduct({
            productIdentifier: FREEMIUM_PRODUCT_ID,
            productType: "INAPP" as any,
          }),
          createTimeout(60000, "Purchase timeout - please try again")
        ]);
      } catch (purchaseError: any) {
        console.error("[Billing] purchaseProduct threw:", purchaseError);
        console.error("[Billing] Error code:", purchaseError?.code);
        console.error("[Billing] Error message:", purchaseError?.message);
        
        // Some plugins throw on user cancel instead of returning
        if (purchaseError?.code === "USER_CANCELED" || 
            purchaseError?.message?.toLowerCase().includes("cancel") ||
            purchaseError?.message?.toLowerCase().includes("user cancelled")) {
          setState((prev) => ({ ...prev, isPurchasing: false, error: null }));
          return { success: false, cancelled: true };
        }
        throw purchaseError;
      }

      console.log("[Billing] Transaction result:", JSON.stringify(transaction));

      // Handle various response shapes from the plugin
      const purchaseState = transaction?.purchaseState || transaction?.transactionState;
      const isAcknowledged = transaction?.isAcknowledged || transaction?.acknowledged;
      const isPurchased = purchaseState === "PURCHASED" || 
                          purchaseState === 1 || 
                          purchaseState === "purchased" ||
                          isAcknowledged === true;

      console.log("[Billing] Parsed state - purchaseState:", purchaseState, "isAcknowledged:", isAcknowledged, "isPurchased:", isPurchased);

      if (isPurchased) {
        console.log("[Billing] Purchase successful!");
        setState((prev) => ({ ...prev, isPurchasing: false }));
        return { success: true };
      } else {
        console.log("[Billing] Purchase not completed, state:", purchaseState);
        const error = "Purchase was not completed";
        setState((prev) => ({ ...prev, isPurchasing: false, error }));
        return { success: false, error };
      }
    } catch (error: any) {
      console.error("[Billing] Purchase error:", error);
      console.error("[Billing] Error details:", JSON.stringify(error));

      // Handle user cancellation gracefully
      if (error.code === "USER_CANCELED" || error.message?.includes("cancel")) {
        setState((prev) => ({ ...prev, isPurchasing: false, error: null }));
        return { success: false, cancelled: true };
      }

      const errorMsg = error.message || "Purchase failed";
      setState((prev) => ({ ...prev, isPurchasing: false, error: errorMsg }));
      return { success: false, error: errorMsg };
    }
  }, [isNativeAndroid, getPlugin]);

  // Restore purchases (for reinstalls)
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!isNativeAndroid) return false;

    try {
      const NativePurchases = await getPlugin();
      if (!NativePurchases) return false;

      await NativePurchases.restorePurchases();
      return await checkExistingPurchase();
    } catch (error) {
      console.error("Restore purchases error:", error);
      return false;
    }
  }, [isNativeAndroid, getPlugin, checkExistingPurchase]);

  return {
    ...state,
    isNativeAndroid,
    purchaseFreemium,
    checkExistingPurchase,
    restorePurchases,
  };
};
