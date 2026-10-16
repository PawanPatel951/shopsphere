
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";

const CartContext = createContext(null);

const STORAGE_KEY = "shopnest_cart";
const COUPON_STORAGE_KEY = "shopnest_applied_coupon";

function getSavedCart() {
  try {
    const savedCart = localStorage.getItem(STORAGE_KEY);
    const parsed = savedCart ? JSON.parse(savedCart) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load cart:", error);
    return [];
  }
}

function getSavedCoupon() {
  try {
    const savedCoupon = localStorage.getItem(
      COUPON_STORAGE_KEY
    );

    return savedCoupon ? JSON.parse(savedCoupon) : null;
  } catch (error) {
    console.error("Failed to load coupon:", error);
    return null;
  }
}

function getProductId(product) {
  return product?.id ?? product?._id ?? product?.productId;
}

function getCouponCode(coupon) {
  if (typeof coupon === "string") {
    return coupon.trim().toUpperCase();
  }

  return String(
    coupon?.code || coupon?.name || ""
  ).trim().toUpperCase();
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(getSavedCart);
  const [appliedCoupon, setAppliedCoupon] =
    useState(getSavedCoupon);

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(cartItems)
      );
    } catch (error) {
      console.error("Failed to save cart:", error);
    }
  }, [cartItems]);

  // Persist applied coupon
  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem(
          COUPON_STORAGE_KEY,
          JSON.stringify(appliedCoupon)
        );
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Failed to save coupon:", error);
    }
  }, [appliedCoupon]);

  // Add product or increase quantity
  const addToCart = useCallback((product) => {
    const productId = getProductId(product);

    if (productId == null) {
      console.error(
        "Product must have id, _id, or productId."
      );
      return;
    }

    setCartItems((previousItems) => {
      const existingItem = previousItems.find(
        (item) =>
          String(getProductId(item)) === String(productId)
      );

      if (existingItem) {
        const currentQuantity = Number(
          existingItem.quantity || 1
        );

        const stock =
          existingItem.stock == null
            ? Infinity
            : Number(existingItem.stock);

        if (currentQuantity >= stock) {
          return previousItems;
        }

        return previousItems.map((item) =>
          String(getProductId(item)) === String(productId)
            ? {
                ...item,
                quantity: Math.min(
                  currentQuantity + 1,
                  stock
                ),
              }
            : item
        );
      }

      if (Number(product.stock) <= 0) {
        return previousItems;
      }

      return [
        ...previousItems,
        {
          ...product,
          id: productId,
          quantity: 1,
        },
      ];
    });
  }, []);

  // Remove one product
  const removeFromCart = useCallback((productId) => {
    setCartItems((previousItems) =>
      previousItems.filter(
        (item) =>
          String(getProductId(item)) !== String(productId)
      )
    );
  }, []);

  // Set the exact quantity
  const updateQuantity = useCallback(
    (productId, quantity) => {
      const nextQuantity = Math.floor(Number(quantity));

      if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) {
        removeFromCart(productId);
        return;
      }

      setCartItems((previousItems) =>
        previousItems.map((item) => {
          if (
            String(getProductId(item)) !== String(productId)
          ) {
            return item;
          }

          const stock =
            item.stock == null
              ? Infinity
              : Math.max(0, Number(item.stock));

          return {
            ...item,
            quantity: Math.min(nextQuantity, stock),
          };
        })
      );
    },
    [removeFromCart]
  );

  // Clear cart and coupon
  const clearCart = useCallback(() => {
    setCartItems([]);
    setAppliedCoupon(null);
  }, []);

  // Cart quantity
  const cartCount = useMemo(
    () =>
      cartItems.reduce(
        (total, item) =>
          total + Number(item.quantity || 0),
        0
      ),
    [cartItems]
  );

  // Subtotal before discounts
  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (total, item) =>
          total +
          Number(item.price || 0) *
            Number(item.quantity || 0),
        0
      ),
    [cartItems]
  );

  // Discount from the validated coupon object
  const discountAmount = useMemo(() => {
    if (!appliedCoupon || subtotal <= 0) {
      return 0;
    }

    const discountValue = Number(
      appliedCoupon.discount ??
      appliedCoupon.discountAmount ??
      appliedCoupon.amount ??
      0
    );

    const discountType = String(
      appliedCoupon.discountType ??
      appliedCoupon.type ??
      ""
    ).toLowerCase();

    let discount = 0;

    if (
      discountType === "percentage" ||
      discountType === "percent"
    ) {
      discount = (subtotal * discountValue) / 100;

      const maxDiscount = Number(
        appliedCoupon.maxDiscount ?? Infinity
      );

      discount = Math.min(discount, maxDiscount);
    } else {
      // Fixed-amount discount
      discount = discountValue;
    }

    return Math.min(
      subtotal,
      Math.max(0, discount)
    );
  }, [appliedCoupon, subtotal]);

  const finalTotal = useMemo(
    () => Math.max(0, subtotal - discountAmount),
    [subtotal, discountAmount]
  );

  // Apply a coupon after it has been validated by the backend.
  // Expected example:
  // {
  //   code: "SAVE10",
  //   discount: 10,
  //   discountType: "percentage",
  //   maxDiscount: 500
  // }
  const applyCoupon = useCallback((coupon) => {
    const code = getCouponCode(coupon);

    if (!code) {
      return {
        success: false,
        message: "Valid coupon code required.",
      };
    }

    const discountValue = Number(
      coupon?.discount ??
      coupon?.discountAmount ??
      coupon?.amount ??
      0
    );

    if (
      !Number.isFinite(discountValue) ||
      discountValue <= 0
    ) {
      return {
        success: false,
        message: "Coupon discount is invalid.",
      };
    }

    setAppliedCoupon({
      ...coupon,
      code,
    });

    return {
      success: true,
      message: "Coupon applied successfully.",
    };
  }, []);

  // Remove applied coupon
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  // Compatibility helpers for Cart.jsx and Checkout.jsx
  const getSubtotal = useCallback(() => subtotal, [subtotal]);

  const getDiscountAmount = useCallback(
    () => discountAmount,
    [discountAmount]
  );

  const getFinalTotal = useCallback(
    () => finalTotal,
    [finalTotal]
  );

  const value = useMemo(
    () => ({
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,

      cartCount,
      subtotal,
      appliedCoupon,
      discountAmount,
      finalTotal,

      getSubtotal,
      getDiscountAmount,
      getFinalTotal,

      applyCoupon,
      removeCoupon,
    }),
    [
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      subtotal,
      appliedCoupon,
      discountAmount,
      finalTotal,
      getSubtotal,
      getDiscountAmount,
      getFinalTotal,
      applyCoupon,
      removeCoupon,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside a CartProvider"
    );
  }

  return context;
}
