import { Link } from "react-router-dom";

export default function Profile() {
  return (
    <section className="mx-auto min-h-[50vh] max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">My Profile</h1>
      <p className="mt-3 text-gray-600">Your account profile.</p>
      <Link to="/orders" className="mt-5 inline-block underline">
        View My Orders
      </Link>
    </section>
  );
}
