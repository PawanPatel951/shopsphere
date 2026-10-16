
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const WishlistContext = createContext(null);

const STORAGE_KEY = "shopnest_wishlist";

// Get a consistent product ID
const getProductId = (product) => {
  if (!product) return null;

  const id = product._id ?? product.id ?? product.productId;

  return id == null ? null : String(id);
};

// Safely load wishlist from localStorage
const getInitialWishlist = () => {
  try {
    const savedWishlist = localStorage.getItem(STORAGE_KEY);

    if (!savedWishlist) return [];

    const parsedWishlist = JSON.parse(savedWishlist);

    if (!Array.isArray(parsedWishlist)) return [];

    const uniqueProducts = new Map();

    parsedWishlist.forEach((product) => {
      const id = getProductId(product);

      if (id !== null && !uniqueProducts.has(id)) {
        uniqueProducts.set(id, product);
      }
    });

    return Array.from(uniqueProducts.values());
  } catch (error) {
    console.error("Wishlist load error:", error);
    return [];
  }
};

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(getInitialWishlist);

  // Persist wishlist whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(wishlist)
      );
    } catch (error) {
      console.error("Wishlist save error:", error);
    }
  }, [wishlist]);

  // Check whether a product is already wishlisted
  const isWishlisted = useCallback(
    (productId) => {
      if (productId == null) return false;

      const targetId = String(productId);

      return wishlist.some(
        (product) => getProductId(product) === targetId
      );
    },
    [wishlist]
  );

  // Add product to wishlist
  const addToWishlist = useCallback((product) => {
    const id = getProductId(product);

    if (id === null) return;

    setWishlist((currentWishlist) => {
      const alreadyExists = currentWishlist.some(
        (item) => getProductId(item) === id
      );

      if (alreadyExists) return currentWishlist;

      return [...currentWishlist, { ...product, id }];
    });
  }, []);

  // Remove product from wishlist
  const removeFromWishlist = useCallback((productId) => {
    if (productId == null) return;

    const targetId = String(productId);

    setWishlist((currentWishlist) =>
      currentWishlist.filter(
        (product) => getProductId(product) !== targetId
      )
    );
  }, []);

  // Toggle wishlist status
  const toggleWishlist = useCallback(
    (product) => {
      const id = getProductId(product);

      if (id === null) return;

      if (isWishlisted(id)) {
        removeFromWishlist(id);
      } else {
        addToWishlist(product);
      }
    },
    [isWishlisted, addToWishlist, removeFromWishlist]
  );

  // Clear entire wishlist
  const clearWishlist = useCallback(() => {
    setWishlist([]);
  }, []);

  const value = {
    wishlist,
    wishlistCount: wishlist.length,
    isWishlisted,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    clearWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

// Custom hook
export function useWishlist() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error(
      "useWishlist must be used inside WishlistProvider"
    );
  }

  return context;
}

