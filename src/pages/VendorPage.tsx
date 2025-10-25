import { useEffect, useState } from 'react';
import { supabase, Store, Product } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Package, Edit, Trash2, Upload } from 'lucide-react';

interface VendorPageProps {
  onNavigate: (page: string) => void;
}

export function VendorPage({ onNavigate }: VendorPageProps) {
  const { profile } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const [storeForm, setStoreForm] = useState({
    name: '',
    description: '',
    logo_url: '',
    banner_url: '',
  });

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category_id: '',
    images: [] as string[],
  });

  useEffect(() => {
    if (profile?.role !== 'vendor') {
      alert('Access denied. Vendor account required.');
      onNavigate('home');
      return;
    }
    loadData();
  }, [profile]);

  const loadData = async () => {
    try {
      const [storeRes, categoriesRes] = await Promise.all([
        supabase
          .from('stores')
          .select('*')
          .eq('owner_id', profile!.id)
          .maybeSingle(),
        supabase.from('categories').select('*')
      ]);

      if (storeRes.error) throw storeRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      setStore(storeRes.data);
      setCategories(categoriesRes.data || []);

      if (storeRes.data) {
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', storeRes.data.id)
          .order('created_at', { ascending: false });

        if (productsError) throw productsError;
        setProducts(productsData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('stores')
        .insert({
          owner_id: profile!.id,
          ...storeForm,
        })
        .select()
        .single();

      if (error) throw error;
      setStore(data);
      setShowStoreForm(false);
      alert('Store created successfully!');
    } catch (error: any) {
      alert('Failed to create store: ' + error.message);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    try {
      const { error } = await supabase
        .from('products')
        .insert({
          store_id: store.id,
          name: productForm.name,
          description: productForm.description,
          price: parseFloat(productForm.price),
          stock_quantity: parseInt(productForm.stock_quantity),
          category_id: productForm.category_id || null,
          images: productForm.images,
        });

      if (error) throw error;

      setShowProductForm(false);
      setProductForm({
        name: '',
        description: '',
        price: '',
        stock_quantity: '',
        category_id: '',
        images: [],
      });
      loadData();
      alert('Product added successfully!');
    } catch (error: any) {
      alert('Failed to add product: ' + error.message);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      loadData();
      alert('Product deleted successfully!');
    } catch (error: any) {
      alert('Failed to delete product: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Your Store</h1>

            {!showStoreForm ? (
              <div className="text-center">
                <Package className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-6">You don't have a store yet. Create one to start selling!</p>
                <button
                  onClick={() => setShowStoreForm(true)}
                  className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition"
                >
                  Create Store
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateStore} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Store Name
                  </label>
                  <input
                    type="text"
                    required
                    value={storeForm.name}
                    onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={storeForm.description}
                    onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    value={storeForm.logo_url}
                    onChange={(e) => setStoreForm({ ...storeForm, logo_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition"
                  >
                    Create Store
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStoreForm(false)}
                    className="flex-1 border-2 border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{store.name}</h1>
              <p className="text-gray-600 mt-2">{store.description}</p>
            </div>
            <button
              onClick={() => setShowProductForm(true)}
              className="flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition"
            >
              <Plus className="h-5 w-5" />
              Add Product
            </button>
          </div>
        </div>

        {showProductForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Product</h2>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (₦)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productForm.stock_quantity}
                    onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  onBlur={(e) => {
                    if (e.target.value) {
                      setProductForm({ ...productForm, images: [e.target.value] });
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition"
                >
                  Add Product
                </button>
                <button
                  type="button"
                  onClick={() => setShowProductForm(false)}
                  className="flex-1 border-2 border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <img
                src={product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl font-bold text-amber-600">
                    ₦{product.price.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-600">
                    Stock: {product.stock_quantity}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && !showProductForm && (
          <div className="text-center py-12">
            <Package className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No products yet. Add your first product to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
