import { useEffect, useState } from 'react';
import { supabase, Category, uploadImage } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, Package, Users, ShoppingBag, TrendingUp, Upload } from 'lucide-react';

interface AdminPageProps {
  onNavigate: (page: string) => void;
}

export function AdminPage({ onNavigate }: AdminPageProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'orders' | 'users'>('overview');
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
      const [categoriesRes, productsRes, ordersRes, usersRes] = await Promise.all([
        supabase.from('categories').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('id'),
        supabase.from('orders').select('id, total_amount'),
        supabase.from('profiles').select('id'),
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);

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
            <div className="mt-6 flex gap-4 border-b">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-3 px-2 font-medium transition ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-amber-600 text-amber-600'
                    : 'text-gray-600 hover:text-amber-600'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`pb-3 px-2 font-medium transition ${
                  activeTab === 'categories'
                    ? 'border-b-2 border-amber-600 text-amber-600'
                    : 'text-gray-600 hover:text-amber-600'
                }`}
              >
                Categories
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
