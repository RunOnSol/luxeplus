import {
  useEffect,
  useState,
} from 'react';

import {
  ShoppingBag,
  Store,
  TrendingUp,
} from 'lucide-react';
import {
  Link,
  useNavigate,
} from 'react-router-dom';

import { ProductCard } from '../components/ProductCard';
import { useAuth } from '../contexts/AuthContext';
import {
  Category,
  Product,
  supabase,
} from '../lib/supabase';

export function HomePageWithRouter() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("categories")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Welcome to LuxePlus
            </h1>
            <p className="text-xl mb-8">Shop like a pro</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {profile ? (
                <>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center gap-2 bg-white text-amber-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    My Dashboard
                  </Link>
                  {(profile.role === "vendor" || profile.role === "admin") && (
                    <Link
                      to="/store/create"
                      className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-amber-600 transition"
                    >
                      <Store className="h-5 w-5" />
                      Create Store
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center bg-white text-amber-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
                  >
                    Shop Now
                  </Link>
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-amber-600 transition"
                  >
                    Become a Seller
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Shop by Category
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.name
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
                className="group"
              >
                <div className="bg-white rounded-lg p-4 md:p-6 shadow-md hover:shadow-xl transition-shadow">
                  <div className="aspect-square rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform overflow-hidden">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <ShoppingBag className="h-12 w-12 text-amber-600" />
                    )}
                  </div>
                  <h3 className="text-center font-semibold text-gray-800 group-hover:text-amber-600 transition text-sm md:text-base">
                    {category.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-2 mb-8">
            <TrendingUp className="h-8 w-8 text-amber-600" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Featured Products
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => navigate(`/product/${product.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {products.length === 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center py-12">
            <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">
              No products yet
            </h3>
            <p className="text-gray-600">Check back soon for amazing deals!</p>
          </div>
        </section>
      )}

      <section className="bg-amber-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Premium Quality</h3>
              <p className="text-gray-600">
                Only the best products from verified sellers
              </p>
            </div>
            <div>
              <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-600">
                Multiple payment options for your convenience
              </p>
            </div>
            <div>
              <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Store className="h-10 w-10 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">Track your orders in real-time</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
