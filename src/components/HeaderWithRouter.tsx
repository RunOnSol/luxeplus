import { useState } from 'react';

import {
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingCart,
  Store,
  TrendingUp,
  User,
  UserCog,
  X,
} from 'lucide-react';
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export function HeaderWithRouter() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { profile, signOut } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link
              to="/"
              className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent"
            >
              LuxePlus
            </Link>
          </div>

          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                placeholder="Search products, stores, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="absolute left-3 top-2.5 text-gray-400 hover:text-amber-600 transition"
              >
                <Search className="h-5 w-5" />
              </button>
            </form>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={`${
                isActive("/")
                  ? "text-amber-600"
                  : "text-gray-700 hover:text-amber-600"
              } transition`}
            >
              Home
            </Link>

            {profile ? (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-2 ${
                    isActive("/dashboard")
                      ? "text-amber-600"
                      : "text-gray-700 hover:text-amber-600"
                  } transition`}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Dashboard
                </Link>

                {profile.role === "vendor" && (
                  <Link
                    to="/vendor-dashboard"
                    className={`flex items-center gap-2 ${
                      isActive("/vendor-dashboard")
                        ? "text-amber-600"
                        : "text-gray-700 hover:text-amber-600"
                    } transition`}
                  >
                    <TrendingUp className="h-5 w-5" />
                    Orders
                  </Link>
                )}

                {profile.role === "customer" && (
                  <Link
                    to="/upgrade-vendor"
                    className={`flex items-center gap-2 ${
                      isActive("/upgrade-vendor")
                        ? "text-amber-600"
                        : "text-gray-700 hover:text-amber-600"
                    } transition`}
                  >
                    <Store className="h-5 w-5" />
                    Become Vendor
                  </Link>
                )}

                {profile.role === "admin" && (
                  <>
                    <Link
                      to="/admin"
                      className={`flex items-center gap-2 ${
                        isActive("/admin")
                          ? "text-amber-600"
                          : "text-gray-700 hover:text-amber-600"
                      } transition`}
                    >
                      <Package className="h-5 w-5" />
                      Admin
                    </Link>
                    <Link
                      to="/admin/users"
                      className={`flex items-center gap-2 ${
                        isActive("/admin/users")
                          ? "text-amber-600"
                          : "text-gray-700 hover:text-amber-600"
                      } transition`}
                    >
                      <UserCog className="h-5 w-5" />
                      Users
                    </Link>
                  </>
                )}

                <Link
                  to="/cart"
                  className="relative text-gray-700 hover:text-amber-600 transition"
                >
                  <ShoppingCart className="h-6 w-6" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-amber-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Link>

                <div className="flex items-center gap-4">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 text-gray-700 hover:text-amber-600 transition"
                  >
                    <User className="h-6 w-6" />
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/cart"
                  className="relative text-gray-700 hover:text-amber-600 transition"
                >
                  <ShoppingCart className="h-6 w-6" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-amber-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Link>
                <Link
                  to="/signin"
                  className="text-gray-700 hover:text-amber-600 transition font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </nav>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-700"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        <div className="md:hidden mt-2 mb-4 pb-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search products, stores, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              className="absolute left-3 top-2.5 text-gray-400 hover:text-amber-600 transition"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <nav className="px-4 py-4 space-y-3">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-left text-gray-700 hover:text-amber-600 py-2"
            >
              Home
            </Link>

            {profile ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 w-full text-left text-gray-700 hover:text-amber-600 py-2"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Dashboard
                </Link>

                {profile.role === "vendor" && (
                  <Link
                    to="/vendor-dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 w-full text-left text-gray-700 hover:text-amber-600 py-2"
                  >
                    <TrendingUp className="h-5 w-5" />
                    Orders
                  </Link>
                )}

                {profile.role === "customer" && (
                  <Link
                    to="/upgrade-vendor"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 w-full text-left text-gray-700 hover:text-amber-600 py-2"
                  >
                    <Store className="h-5 w-5" />
                    Become Vendor
                  </Link>
                )}

                {profile.role === "admin" && (
                  <>
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 w-full text-left text-gray-700 hover:text-amber-600 py-2"
                    >
                      <Package className="h-5 w-5" />
                      Admin Panel
                    </Link>
                    <Link
                      to="/admin/users"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 w-full text-left text-gray-700 hover:text-amber-600 py-2"
                    >
                      <UserCog className="h-5 w-5" />
                      User Management
                    </Link>
                  </>
                )}

                <Link
                  to="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 w-full text-left text-gray-700 hover:text-amber-600 py-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Cart {totalItems > 0 && `(${totalItems})`}
                </Link>

                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 w-full text-left text-gray-700 hover:text-amber-600 py-2"
                >
                  <User className="h-5 w-5" />
                  Profile
                </Link>

                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full text-left text-red-600 hover:text-red-700 py-2"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 w-full text-left text-gray-700 hover:text-amber-600 py-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Cart {totalItems > 0 && `(${totalItems})`}
                </Link>
                <Link
                  to="/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-left text-gray-700 hover:text-amber-600 py-2"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition text-center"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
