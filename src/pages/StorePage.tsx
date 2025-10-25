import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, Store, Product } from '../lib/supabase';
import { ProductCard } from '../components/ProductCard';
import { Store as StoreIcon, MapPin } from 'lucide-react';

export function StorePage() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStore();
  }, [storeSlug]);

  const loadStore = async () => {
    if (!storeSlug) {
      navigate('/');
      return;
    }

    try {
      const storeName = storeSlug.replace(/-/g, ' ');

      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .ilike('name', storeName)
        .eq('is_active', true)
        .maybeSingle();

      if (storeError) throw storeError;

      if (!storeData) {
        navigate('/');
        return;
      }

      setStore(storeData);

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeData.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error loading store:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!store) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start gap-6">
            {store.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-amber-100"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center border-4 border-amber-100">
                <StoreIcon className="h-12 w-12 text-amber-600" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{store.name}</h1>
              {store.description && (
                <p className="text-gray-600 mb-3">{store.description}</p>
              )}
              <div className="text-sm text-gray-500">
                {products.length} {products.length === 1 ? 'Product' : 'Products'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
          <div className="text-center py-16">
            <StoreIcon className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No products yet</h3>
            <p className="text-gray-600">This store hasn't added any products yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
