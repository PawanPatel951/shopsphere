
import { Heart } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";

function WishlistButton({ product, className = "" }) {
  const {
    isWishlisted,
    toggleWishlist,
  } = useWishlist();

  const productId =
    product?._id ?? product?.id ?? product?.productId;

  const active =
    productId != null && isWishlisted(productId);

  const handleToggle = (event) => {
    // Prevent clicks from triggering a parent product card.
    event.preventDefault();
    event.stopPropagation();

    if (!product || productId == null) {
      console.error("Wishlist: Product ID is missing.");
      return;
    }

    toggleWishlist(product);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={!product || productId == null}
      aria-label={
        active
          ? `Remove ${product?.name || "product"} from wishlist`
          : `Add ${product?.name || "product"} to wishlist`
      }
      aria-pressed={active}
      title={
        active
          ? "Remove from Wishlist"
          : "Add to Wishlist"
      }
      className={`group flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-500 shadow-md backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:border-red-200 hover:text-red-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? "border-red-200 text-red-500"
          : ""
      } ${className}`}
    >
      <Heart
        size={20}
        strokeWidth={2}
        className={`transition-all duration-300 ${
          active
            ? "fill-red-500 text-red-500"
            : "group-hover:fill-red-100"
        }`}
      />
    </button>
  );
}

export default WishlistButton;
