import {
  useEffect,
  useState,
} from 'react';

import {
  Package,
  Search,
  Store,
} from 'lucide-react';
import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import { ProductCard } from '../components/ProductCard';
import {
  Category,
  Product,
  supabase,
} from '../lib/supabase';

interface StoreResult {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  banner_url: string;
}

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<StoreResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "products" | "categories" | "stores"
  >("products");

  useEffect(() => {
    if (query) {
      searchAll();
    } else {
      setLoading(false);
    }
  }, [query]);

  const searchAll = async () => {
    setLoading(true);
    try {
      const searchTerm = `%${query}%`;

      const [productsRes, categoriesRes, storesRes] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .ilike("name", searchTerm)
          .limit(20),
        supabase
          .from("categories")
          .select("*")
          .ilike("name", searchTerm)
          .limit(10),
        supabase
          .from("stores")
          .select("*")
          .eq("is_active", true)
          .ilike("name", searchTerm)
          .limit(10),
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (storesRes.data) setStores(storesRes.data);
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!query) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Search className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Search LuxePlus
          </h2>
          <p className="text-gray-500">
            Enter a search term to find products, stores, and categories
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  const totalResults = products.length + categories.length + stores.length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Search Results for "{query}"
          </h1>
          <p className="text-gray-600">
            Found {totalResults} result{totalResults !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex gap-4 mb-6 border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 font-medium transition whitespace-nowrap ${
              activeTab === "products"
                ? "border-b-2 border-amber-600 text-amber-600"
                : "text-gray-600 hover:text-amber-600"
            }`}
          >
            <Package className="w-4 h-4 inline mr-2" />
            Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 font-medium transition whitespace-nowrap ${
              activeTab === "categories"
                ? "border-b-2 border-amber-600 text-amber-600"
                : "text-gray-600 hover:text-amber-600"
            }`}
          >
            <Search className="w-4 h-4 inline mr-2" />
            Categories ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab("stores")}
            className={`px-4 py-2 font-medium transition whitespace-nowrap ${
              activeTab === "stores"
                ? "border-b-2 border-amber-600 text-amber-600"
                : "text-gray-600 hover:text-amber-600"
            }`}
          >
            <Store className="w-4 h-4 inline mr-2" />
            Stores ({stores.length})
          </button>
        </div>

        {activeTab === "products" && (
          <div>
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => navigate(`/product/${product.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">
                  No products found matching your search
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "categories" && (
          <div>
            {categories.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() =>
                      navigate(
                        `/category/${category.name
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`
                      )
                    }
                    className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition group"
                  >
                    <div className="aspect-square rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform overflow-hidden">
                      {category.image_url ? (
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <Search className="h-12 w-12 text-amber-600" />
                      )}
                    </div>
                    <h3 className="text-center font-semibold text-gray-800 group-hover:text-amber-600 transition">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-sm text-gray-600 text-center mt-2">
                        {category.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">
                  No categories found matching your search
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "stores" && (
          <div>
            {stores.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores.map((store) => (
                  <button
                    key={store.id}
                    onClick={() =>
                      navigate(
                        `/store/${store.name
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`
                      )
                    }
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition overflow-hidden group"
                  >
                    {store.banner_url && (
                      <div className="h-32 overflow-hidden">
                        <img
                          src={store.banner_url}
                          alt={store.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-3">
                        {store.logo_url ? (
                          <img
                            src={store.logo_url}
                            alt={store.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                            <Store className="h-8 w-8 text-amber-600" />
                          </div>
                        )}
                        <div className="text-left flex-1">
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-amber-600 transition">
                            {store.name}
                          </h3>
                        </div>
                      </div>
                      {store.description && (
                        <p className="text-gray-600 text-sm text-left line-clamp-2">
                          {store.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">
                  No stores found matching your search
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
