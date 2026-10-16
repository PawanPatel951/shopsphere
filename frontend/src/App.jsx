
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { WishlistProvider } from "./context/WishlistContext";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import AdminRoute from "./components/AdminRoute";

// Public pages
import Home from "./pages/Home";
import Products from "./pages/Products";
import NewArrivals from "./pages/NewArrivals";
import BestSellers from "./pages/BestSellers";
import Offers from "./pages/Offers";
import WishlistPage from "./pages/WishlistPage";
import ProductDetails from "./pages/ProductDetails";
import Contact from "./pages/Contact";

// Authentication pages
import Login from "./pages/Login";
import Register from "./pages/Register";

// Customer pages
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import OrderDetails from "./pages/OrderDetails";
import Profile from "./pages/Profile";

// Admin pages
import AdminProducts from "./pages/AdminProducts";
import AdminCategories from "./pages/AdminCategories";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrders from "./pages/AdminOrders";
import Reports from "./pages/Reports";
import AdminCoupons from "./pages/AdminCoupons";

import "./index.css";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <BrowserRouter>
            <div className="app flex min-h-screen flex-col">
              <Navbar />

              <main className="main-content flex-1">
                <Routes>
                  {/* Home */}
                  <Route path="/" element={<Home />} />

                  {/* Shopping pages */}
                  <Route
                    path="/products"
                    element={<Products />}
                  />

                  <Route
                    path="/products/new-arrivals"
                    element={<NewArrivals />}
                  />

                  <Route
                    path="/products/best-sellers"
                    element={<BestSellers />}
                  />

                  <Route
                    path="/products/offers"
                    element={<Offers />}
                  />

                  <Route
                    path="/products/:id"
                    element={<ProductDetails />}
                  />

                  {/* Wishlist */}
                  <Route
                    path="/wishlist"
                    element={<WishlistPage />}
                  />

                  {/* Guest-only pages */}
                  <Route element={<GuestRoute />}>
                    <Route
                      path="/login"
                      element={<Login />}
                    />

                    <Route
                      path="/register"
                      element={<Register />}
                    />
                  </Route>

                  {/* Public contact */}
                  <Route
                    path="/contact"
                    element={<Contact />}
                  />

                  {/* Login-required customer pages */}
                  <Route element={<ProtectedRoute />}>
                    <Route
                      path="/cart"
                      element={<Cart />}
                    />

                    <Route
                      path="/checkout"
                      element={<Checkout />}
                    />

                    <Route
                      path="/orders"
                      element={<MyOrders />}
                    />

                    <Route
                      path="/orders/:id"
                      element={<OrderDetails />}
                    />

                    <Route
                      path="/profile"
                      element={<Profile />}
                    />
                  </Route>

                  {/* Admin-only pages */}
                  <Route element={<AdminRoute />}>
                    <Route
                      path="/admin"
                      element={<AdminDashboard />}
                    />

                    <Route
                      path="/admin/products"
                      element={<AdminProducts />}
                    />

                    <Route
                      path="/admin/categories"
                      element={<AdminCategories />}
                    />

                    <Route
                      path="/admin/orders"
                      element={<AdminOrders />}
                    />

                    <Route
                      path="/admin/reports"
                      element={<Reports />}
                    />

                    <Route
                      path="/admin/coupons"
                      element={<AdminCoupons />}
                    />
                  </Route>

                  {/* 404 page */}
                  <Route
                    path="*"
                    element={
                      <div className="px-4 py-20 text-center">
                        <h1 className="text-3xl font-bold">
                          404
                        </h1>

                        <p className="mt-2 text-gray-600">
                          Page not found.
                        </p>
                      </div>
                    }
                  />
                </Routes>
              </main>

              <Footer />
            </div>
          </BrowserRouter>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
