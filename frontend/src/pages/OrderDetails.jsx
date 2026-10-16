import { Link, useParams } from "react-router-dom";

export default function OrderDetails() {
  const { id } = useParams();

  return (
    <section className="mx-auto min-h-[60vh] max-w-4xl px-4 py-10">
      <Link to="/orders" className="text-sm underline">
        ← Back to My Orders
      </Link>
      <h1 className="mt-5 text-3xl font-bold">Order Details</h1>
      <p className="mt-3 text-gray-600">Order ID: {id}</p>
      <p className="mt-4">
        Detailed order information will appear once this page is connected to
        the correct order-details API.
      </p>
    </section>
  );
}
