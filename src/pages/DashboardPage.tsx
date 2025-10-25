import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Store, Order, uploadImage } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Store as StoreIcon, Package, ShoppingBag, User, Plus, Edit2, Upload } from 'lucide-react';

export function DashboardPage() {
  const { profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'stores' | 'orders' | 'profile'>('overview');
  const [editingProfile, setEditingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
  });

  useEffect(() => {
    if (!profile) {
      navigate('/signin');
      return;
    }
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile) return;

    try {
      if (profile.role === 'vendor' || profile.role === 'admin') {
        const { data: storesData } = await supabase
          .from('stores')
          .select('*')
          .eq('owner_id', profile.id)
          .order('created_at', { ascending: false });
        setStores(storesData || []);
      }

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(profileForm);
      setEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (error: any) {
      alert('Failed to update profile: ' + error.message);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadImage(file, 'avatars', profile!.id);
      await updateProfile({ avatar_url: url });
      alert('Avatar updated successfully!');
    } catch (error: any) {
      alert('Failed to upload avatar: ' + error.message);
    } finally {
      setUploading(false);
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
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <div className="mt-6 flex gap-4 border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-2 font-medium whitespace-nowrap transition ${
                activeTab === 'overview'
                  ? 'border-b-2 border-amber-600 text-amber-600'
                  : 'text-gray-600 hover:text-amber-600'
              }`}
            >
              Overview
            </button>
            {(profile?.role === 'vendor' || profile?.role === 'admin') && (
              <button
                onClick={() => setActiveTab('stores')}
                className={`pb-3 px-2 font-medium whitespace-nowrap transition ${
                  activeTab === 'stores'
                    ? 'border-b-2 border-amber-600 text-amber-600'
                    : 'text-gray-600 hover:text-amber-600'
                }`}
              >
                My Stores
              </button>
            )}
            <button
              onClick={() => setActiveTab('orders')}
              className={`pb-3 px-2 font-medium whitespace-nowrap transition ${
                activeTab === 'orders'
                  ? 'border-b-2 border-amber-600 text-amber-600'
                  : 'text-gray-600 hover:text-amber-600'
              }`}
            >
              My Orders
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-3 px-2 font-medium whitespace-nowrap transition ${
                activeTab === 'profile'
                  ? 'border-b-2 border-amber-600 text-amber-600'
                  : 'text-gray-600 hover:text-amber-600'
              }`}
            >
              Profile
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-3 gap-6">
            {(profile?.role === 'vendor' || profile?.role === 'admin') && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">My Stores</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stores.length}</p>
                  </div>
                  <div className="bg-amber-100 rounded-full p-3">
                    <StoreIcon className="h-8 w-8 text-amber-600" />
                  </div>
                </div>
                <button
                  onClick={() => navigate('/store/create')}
                  className="mt-4 w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition text-sm font-medium"
                >
                  Create Store
                </button>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">My Orders</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{orders.length}</p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <ShoppingBag className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <button
                onClick={() => navigate('/')}
                className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium"
              >
                Shop Now
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Account Type</p>
                  <p className="text-xl font-bold text-gray-900 mt-2 capitalize">{profile?.role}</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stores' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Stores</h2>
              <button
                onClick={() => navigate('/store/create')}
                className="flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition"
              >
                <Plus className="h-5 w-5" />
                Create Store
              </button>
            </div>

            {stores.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <StoreIcon className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">You don't have any stores yet</p>
                <button
                  onClick={() => navigate('/store/create')}
                  className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition"
                >
                  Create Your First Store
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores.map((store) => (
                  <div key={store.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                    <div className="h-40 bg-gradient-to-br from-amber-100 to-orange-100">
                      {store.banner_url && (
                        <img src={store.banner_url} alt={store.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{store.name}</h3>
                          <p className="text-gray-600 text-sm line-clamp-2">{store.description}</p>
                        </div>
                        {store.logo_url && (
                          <img src={store.logo_url} alt="" className="w-12 h-12 rounded-full object-cover ml-3" />
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/store/manage/${store.id}`)}
                          className="flex-1 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition text-sm font-medium"
                        >
                          Manage
                        </button>
                        <button
                          onClick={() => navigate(`/store/${store.name.toLowerCase().replace(/\s+/g, '-')}`)}
                          className="flex-1 border-2 border-amber-600 text-amber-600 py-2 rounded-lg hover:bg-amber-50 transition text-sm font-medium"
                        >
                          View Public
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h2>
            {orders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <Package className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No orders yet</p>
                <button
                  onClick={() => navigate('/')}
                  className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-semibold text-gray-900">Order #{order.tracking_number}</p>
                          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                            {order.status}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-1">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xl font-bold text-amber-600 mt-2">
                          ₦{order.total_amount.toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => navigate('/profile')}
                        className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition"
                      >
                        Track Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-6 mb-6 pb-6 border-b">
                <div className="relative">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                      <User className="h-12 w-12 text-amber-600" />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-amber-600 text-white p-2 rounded-full cursor-pointer hover:bg-amber-700 transition">
                    <Upload className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{profile?.full_name || 'User'}</h3>
                  <p className="text-gray-600">{profile?.email}</p>
                  <p className="text-sm text-gray-500 mt-1 capitalize">
                    {profile?.role} Account
                  </p>
                </div>
              </div>

              {editingProfile ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="flex-1 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 transition"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProfile(false)}
                      className="flex-1 border-2 border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Full Name</p>
                    <p className="text-gray-900 mt-1">{profile?.full_name || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Phone Number</p>
                    <p className="text-gray-900 mt-1">{profile?.phone || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="text-gray-900 mt-1">{profile?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setProfileForm({
                        full_name: profile?.full_name || '',
                        phone: profile?.phone || '',
                      });
                      setEditingProfile(true);
                    }}
                    className="flex items-center gap-2 bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
