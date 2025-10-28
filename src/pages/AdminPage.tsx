import { useEffect, useState } from 'react';
import { supabase, Category, uploadImage } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, Package, Users, ShoppingBag, TrendingUp, Upload, Store, CheckCircle, XCircle } from 'lucide-react';

interface AdminPageProps {
  onNavigate: (page: string) => void;
}

export function AdminPage({ onNavigate }: AdminPageProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'stores' | 'products' | 'orders'>('overview');
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    image_url: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.role !== 'admin') {
      alert('Access denied. Admin account required.');
      onNavigate('home');
      return;
    }
    loadData();
  }, [profile]);

  const loadData = async () => {
    try {
      const [categoriesRes, productsRes, ordersRes, usersRes, storesRes] = await Promise.all([
        supabase.from('categories').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*, stores(name)').order('created_at', { ascending: false }),
        supabase.from('orders').select(`
          *,
          profiles(full_name, email),
          stores(name),
          order_items(
            id,
            quantity,
            price,
            products(name)
          )
        `).order('created_at', { ascending: false }),
        supabase.from('profiles').select('id'),
        supabase.from('stores').select('*, profiles(full_name, email)').order('created_at', { ascending: false }),
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (productsRes.data) setProducts(productsRes.data);
      if (ordersRes.data) setOrders(ordersRes.data);
      if (storesRes.data) setStores(storesRes.data);

      setStats({
        totalProducts: productsRes.data?.length || 0,
        totalOrders: ordersRes.data?.length || 0,
        totalUsers: usersRes.data?.length || 0,
        totalRevenue: ordersRes.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingImage(true);

    try {
      let imageUrl = categoryForm.image_url;

      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage, 'categories');
      }

      const { error } = await supabase
        .from('categories')
        .insert({
          name: categoryForm.name,
          description: categoryForm.description,
          image_url: imageUrl,
        });

      if (error) throw error;

      setCategoryForm({ name: '', description: '', image_url: '' });
      setSelectedImage(null);
      setImagePreview('');
      setShowCategoryForm(false);
      loadData();
      alert('Category created successfully!');
    } catch (error: any) {
      alert('Failed to create category: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      loadData();
      alert('Category deleted successfully!');
    } catch (error: any) {
      alert('Failed to delete category: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="mt-6 flex gap-4 border-b overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-3 px-2 font-medium transition whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-amber-600 text-amber-600'
                    : 'text-gray-600 hover:text-amber-600'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`pb-3 px-2 font-medium transition whitespace-nowrap ${
                  activeTab === 'categories'
                    ? 'border-b-2 border-amber-600 text-amber-600'
                    : 'text-gray-600 hover:text-amber-600'
                }`}
              >
                Categories
              </button>
              <button
                onClick={() => setActiveTab('stores')}
                className={`pb-3 px-2 font-medium transition whitespace-nowrap ${
                  activeTab === 'stores'
                    ? 'border-b-2 border-amber-600 text-amber-600'
                    : 'text-gray-600 hover:text-amber-600'
                }`}
              >
                Stores
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`pb-3 px-2 font-medium transition whitespace-nowrap ${
                  activeTab === 'products'
                    ? 'border-b-2 border-amber-600 text-amber-600'
                    : 'text-gray-600 hover:text-amber-600'
                }`}
              >
                Products
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`pb-3 px-2 font-medium transition whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'border-b-2 border-amber-600 text-amber-600'
                    : 'text-gray-600 hover:text-amber-600'
                }`}
              >
                Orders
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Products</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProducts}</p>
                  </div>
                  <div className="bg-amber-100 rounded-full p-3">
                    <Package className="h-8 w-8 text-amber-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Orders</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <ShoppingBag className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      ₦{stats.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-purple-100 rounded-full p-3">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Overview</h2>
              <p className="text-gray-600">
                Welcome to the LuxePlus admin dashboard. Use the tabs above to manage categories, orders, and users.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'stores' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">All Stores</h2>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Store Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stores.map((store) => (
                    <tr key={store.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{store.name}</div>
                            <div className="text-sm text-gray-500">{store.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{store.profiles?.full_name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{store.profiles?.email || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            store.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {store.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(store.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={async () => {
                            const { error } = await supabase
                              .from('stores')
                              .update({ is_active: !store.is_active })
                              .eq('id', store.id);
                            if (error) {
                              alert('Failed to update store status');
                            } else {
                              loadData();
                            }
                          }}
                          className="text-amber-600 hover:text-amber-900 mr-4"
                        >
                          {store.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {stores.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <Store className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No stores yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">All Products</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <img
                    src={
                      product.images?.[0] ||
                      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'
                    }
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">Store: {product.stores?.name || 'N/A'}</p>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-bold text-amber-600">
                        ₦{product.price.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-600">Stock: {product.stock_quantity}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          const { error } = await supabase
                            .from('products')
                            .update({ is_active: !product.is_active })
                            .eq('id', product.id);
                          if (error) {
                            alert('Failed to update product status');
                          } else {
                            loadData();
                          }
                        }}
                        className="flex-1 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition text-sm"
                      >
                        {product.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this product?')) {
                            const { error } = await supabase
                              .from('products')
                              .delete()
                              .eq('id', product.id);
                            if (error) {
                              alert('Failed to delete product');
                            } else {
                              loadData();
                            }
                          }
                        }}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition text-sm flex items-center justify-center gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {products.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <Package className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No products yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">All Orders</h2>
            </div>

            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        Order #{order.id.slice(0, 8)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Customer: {order.profiles?.full_name || 'N/A'} - {order.profiles?.email || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Store: {order.stores?.name || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-amber-600">
                        ₦{Number(order.total_amount).toLocaleString()}
                      </p>
                      <span
                        className={`inline-block px-3 py-1 text-xs font-medium rounded-full mt-2 ${
                          order.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.status}
                      </span>
                      <br />
                      <span
                        className={`inline-block px-3 py-1 text-xs font-medium rounded-full mt-2 ${
                          order.payment_status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : order.payment_status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        Payment: {order.payment_status}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Items:</h4>
                    {order.order_items?.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-sm mb-2"
                      >
                        <span>
                          {item.products?.name || 'N/A'} x {item.quantity}
                        </span>
                        <span className="font-medium">
                          ₦{(Number(item.price) * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.shipping_address && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium mb-2">Shipping Address:</h4>
                      <div className="text-sm text-gray-700 space-y-1">
                        <p>
                          <span className="font-medium">Name:</span>{' '}
                          {order.shipping_address.fullName}
                        </p>
                        <p>
                          <span className="font-medium">Phone:</span>{' '}
                          {order.shipping_address.phone}
                        </p>
                        <p>
                          <span className="font-medium">Address:</span>{' '}
                          {order.shipping_address.address}
                        </p>
                        <p>
                          <span className="font-medium">City:</span>{' '}
                          {order.shipping_address.city}, {order.shipping_address.state}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {orders.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No orders yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Product Categories</h2>
              <button
                onClick={() => setShowCategoryForm(true)}
                className="flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition"
              >
                <Plus className="h-5 w-5" />
                Add Category
              </button>
            </div>

            {showCategoryForm && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Category</h3>
                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category Name
                    </label>
                    <input
                      type="text"
                      required
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category Image
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <label className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-amber-500 transition">
                            <Upload className="h-5 w-5 text-gray-600" />
                            <span className="text-gray-600">
                              {selectedImage ? selectedImage.name : 'Choose an image'}
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {imagePreview && (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedImage(null);
                              setImagePreview('');
                            }}
                            className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={uploadingImage}
                      className="flex-1 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
                    >
                      {uploadingImage ? 'Uploading...' : 'Create Category'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCategoryForm(false)}
                      className="flex-1 border-2 border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <div key={category.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <img
                    src={category.image_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500'}
                    alt={category.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{category.description}</p>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {categories.length === 0 && !showCategoryForm && (
              <div className="text-center py-12">
                <Package className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No categories yet. Create your first category!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
