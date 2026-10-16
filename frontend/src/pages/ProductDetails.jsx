import { Link } from "react-router-dom";

export default function ProductDetails() {
  return (
    <section className="mx-auto min-h-[50vh] max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">Product Details</h1>
      <p className="mt-3 text-gray-600">
        Product details page needs to be connected to your product API.
      </p>
      <Link to="/products" className="mt-5 inline-block underline">
        Back to Products
      </Link>
    </section>
  );
}
