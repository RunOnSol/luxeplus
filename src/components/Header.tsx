import { useState } from 'react';
import { ShoppingCart, User, Menu, X, Search, Store, Package, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}

export function Header({ onNavigate, currentPage }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { profile, signOut } = useAuth();
  const { totalItems } = useCart();

  const handleSignOut = async () => {
    try {
      await signOut();
      onNavigate('home');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={() => onNavigate('home')}
              className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent"
            >
              LuxePlus
            </button>
          </div>

          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => onNavigate('home')}
              className={`${currentPage === 'home' ? 'text-amber-600' : 'text-gray-700 hover:text-amber-600'} transition`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('categories')}
              className={`${currentPage === 'categories' ? 'text-amber-600' : 'text-gray-700 hover:text-amber-600'} transition`}
            >
              Categories
            </button>

            {profile?.role === 'vendor' && (
              <button
                onClick={() => onNavigate('vendor')}
                className={`flex items-center gap-2 ${currentPage === 'vendor' ? 'text-amber-600' : 'text-gray-700 hover:text-amber-600'} transition`}
              >
                <Store className="h-5 w-5" />
                My Store
              </button>
            )}

            {profile?.role === 'admin' && (
              <button
                onClick={() => onNavigate('admin')}
                className={`flex items-center gap-2 ${currentPage === 'admin' ? 'text-amber-600' : 'text-gray-700 hover:text-amber-600'} transition`}
              >
                <Package className="h-5 w-5" />
                Admin
              </button>
            )}

            <button
              onClick={() => onNavigate('cart')}
              className="relative text-gray-700 hover:text-amber-600 transition"
            >
              <ShoppingCart className="h-6 w-6" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-amber-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            {profile ? (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onNavigate('profile')}
                  className="flex items-center gap-2 text-gray-700 hover:text-amber-600 transition"
                >
                  <User className="h-6 w-6" />
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('auth')}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition"
              >
                Sign In
              </button>
            )}
          </nav>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-700"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        <div className="md:hidden mt-2 mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <nav className="px-4 py-4 space-y-3">
            <button
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left text-gray-700 hover:text-amber-600 py-2"
            >
              Home
            </button>
            <button
              onClick={() => {
                onNavigate('categories');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left text-gray-700 hover:text-amber-600 py-2"
            >
              Categories
            </button>

            {profile?.role === 'vendor' && (
              <button
                onClick={() => {
                  onNavigate('vendor');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full text-left text-gray-700 hover:text-amber-600 py-2"
              >
                <Store className="h-5 w-5" />
                My Store
              </button>
            )}

            {profile?.role === 'admin' && (
              <button
                onClick={() => {
                  onNavigate('admin');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full text-left text-gray-700 hover:text-amber-600 py-2"
              >
                <Package className="h-5 w-5" />
                Admin Panel
              </button>
            )}

            <button
              onClick={() => {
                onNavigate('cart');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 w-full text-left text-gray-700 hover:text-amber-600 py-2"
            >
              <ShoppingCart className="h-5 w-5" />
              Cart {totalItems > 0 && `(${totalItems})`}
            </button>

            {profile ? (
              <>
                <button
                  onClick={() => {
                    onNavigate('profile');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full text-left text-gray-700 hover:text-amber-600 py-2"
                >
                  <User className="h-5 w-5" />
                  Profile
                </button>
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
              <button
                onClick={() => {
                  onNavigate('auth');
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition"
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
