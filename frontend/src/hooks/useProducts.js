import { useEffect, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function getProductId(product) {
  return product?._id || product?.id || product?.productId;
}

export function getProductName(product) {
  return product?.name || product?.title || "ShopNest Product";
}

export function getProductPrice(product) {
  return Number(product?.price ?? product?.sellingPrice ?? 0);
}

export function getOriginalPrice(product) {
  return Number(
    product?.originalPrice ??
      product?.mrp ??
      product?.regularPrice ??
      getProductPrice(product)
  );
}

export function getProductImage(product) {
  const image =
    product?.image ||
    product?.imageUrl ||
    product?.thumbnail ||
    product?.images?.[0] ||
    "";

  return typeof image === "string" ? image : image?.url || "";
}

export function getProductCategory(product) {
  return typeof product?.category === "string"
    ? product.category
    : product?.category?.name ||
        product?.category?.title ||
        "Other";
}

export function getDiscount(product) {
  const price = getProductPrice(product);
  const original = getOriginalPrice(product);

  const explicitDiscount = Number(
    product?.discountPercentage ?? product?.discount ?? 0
  );

  if (explicitDiscount > 0) {
    return Math.min(100, Math.round(explicitDiscount));
  }

  if (original > price && original > 0) {
    return Math.round(((original - price) / original) * 100);
  }

  return 0;
}

export function hasOffer(product) {
  return (
    product?.isOffer === true ||
    product?.onSale === true ||
    product?.isOnSale === true ||
    product?.discounted === true ||
    product?.offers === true ||
    getDiscount(product) > 0
  );
}

export function getCreatedDate(product) {
  const value =
    product?.createdAt ||
    product?.created_at ||
    product?.dateAdded;

  const date = value ? new Date(value).getTime() : 0;

  return Number.isFinite(date) ? date : 0;
}

export function getPopularity(product) {
  return Number(
    product?.soldCount ??
      product?.sales ??
      product?.popularity ??
      product?.views ??
      0
  );
}

export function formatPrice(price) {
  return `₹${Number(price || 0).toLocaleString("en-IN")}`;
}

export function getImageUrl(image) {
  if (!image || typeof image !== "string") return "";

  const value = image.trim();

  if (/^(https?:|data:|blob:)/i.test(value)) {
    return value;
  }

  const origin = API_URL.replace(/\/api\/?$/, "");

  return `${origin}/${value.replace(/^\/+/, "")}`;
}

export default function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/products`);

        if (!response.ok) {
          throw new Error("Products load nahi ho paaye.");
        }

        const result = await response.json();

        const list = Array.isArray(result)
          ? result
          : result.products || result.data || [];

        if (active) {
          setProducts(
            list.filter((product) => product?.isActive !== false)
          );
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Something went wrong.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  return { products, loading, error };
}