import { Link } from "react-router-dom";
import {
  Store,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

function Footer() {
  return (
    <footer className="mt-16 bg-gray-950 text-gray-300">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div>
          <Link to="/" className="mb-4 inline-flex items-center gap-2">
            <span className="rounded-lg bg-indigo-600 p-2 text-white">
              <Store size={23} />
            </span>

            <span className="text-2xl font-bold text-white">
              Shop<span className="text-indigo-400">Nest</span>
            </span>
          </Link>

          <p className="mt-3 text-sm leading-6 text-gray-400">
            Discover quality products at great prices. Enjoy a simple,
            secure, and convenient online shopping experience.
          </p>

          {/* Social Links */}
          <div className="mt-5 flex gap-3">
            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 text-lg font-bold text-white transition hover:bg-indigo-600"
            >
              f
            </a>

            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-800 text-xs font-bold text-white transition hover:bg-indigo-600"
            >
              IG
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-white">
            Quick Links
          </h3>

          <ul className="space-y-3 text-sm">
            <li>
              <Link to="/" className="transition hover:text-indigo-400">
                Home
              </Link>
            </li>

            <li>
              <Link
                to="/products"
                className="transition hover:text-indigo-400"
              >
                All Products
              </Link>
            </li>

            <li>
              <Link to="/cart" className="transition hover:text-indigo-400">
                Shopping Cart
              </Link>
            </li>

            <li>
              <Link to="/login" className="transition hover:text-indigo-400">
                Login
              </Link>
            </li>

            <li>
              <Link
                to="/register"
                className="transition hover:text-indigo-400"
              >
                Create Account
              </Link>
            </li>
          </ul>
        </div>

        {/* Customer Support */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-white">
            Customer Support
          </h3>

          <ul className="space-y-3 text-sm">
            <li>
              <a
                href="mailto:support@example.com"
                className="flex items-center gap-2 transition hover:text-indigo-400"
              >
                <Mail size={17} />
                <span>support@example.com</span>
              </a>
            </li>

            <li>
              <a
                href="tel:+910000000000"
                className="flex items-center gap-2 transition hover:text-indigo-400"
              >
                <Phone size={17} />
                <span>+91 00000 00000</span>
              </a>
            </li>

            <li className="flex items-start gap-2">
              <MapPin size={17} className="mt-1 shrink-0" />
              <span>India</span>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-white">
            Stay Updated
          </h3>

          <p className="mb-4 text-sm leading-6 text-gray-400">
            Stay connected for new products, offers, and updates.
          </p>

          <p className="text-sm text-gray-400">
            Your next favorite product is waiting for you!
          </p>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-5 text-center text-sm text-gray-500 sm:flex-row">
          <p>
            © {new Date().getFullYear()} ShopNest. All rights reserved.
          </p>

          <p>Built with React, Node.js &amp; MongoDB</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;