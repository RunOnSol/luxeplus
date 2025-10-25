import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, uploadImage } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Upload, ArrowLeft } from 'lucide-react';

export function CreateStorePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [storeForm, setStoreForm] = useState({
    name: '',
    description: '',
    logo_url: '',
    banner_url: '',
  });

  const [logoPreview, setLogoPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const url = await uploadImage(file, 'store-logos');
      setStoreForm({ ...storeForm, logo_url: url });
      setLogoPreview(URL.createObjectURL(file));
    } catch (error: any) {
      alert('Failed to upload logo: ' + error.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    try {
      const url = await uploadImage(file, 'store-banners');
      setStoreForm({ ...storeForm, banner_url: url });
      setBannerPreview(URL.createObjectURL(file));
    } catch (error: any) {
      alert('Failed to upload banner: ' + error.message);
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .insert({
          owner_id: profile.id,
          ...storeForm,
        })
        .select()
        .single();

      if (error) throw error;

      alert('Store created successfully!');
      navigate(`/store/${data.id}`);
    } catch (error: any) {
      alert('Failed to create store: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!profile || (profile.role !== 'vendor' && profile.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">You need a vendor account to create a store</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-amber-600 hover:text-amber-700 mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Store</h1>
          <p className="text-gray-600 mb-8">
            Set up your online store and start selling to customers
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Name *
              </label>
              <input
                type="text"
                required
                value={storeForm.name}
                onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Enter your store name"
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
                placeholder="Describe what your store sells..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Logo
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-amber-500 transition">
                  {logoPreview || storeForm.logo_url ? (
                    <div className="space-y-3">
                      <img
                        src={logoPreview || storeForm.logo_url}
                        alt="Logo preview"
                        className="w-32 h-32 object-cover rounded-lg mx-auto"
                      />
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg cursor-pointer hover:bg-amber-700 transition">
                        <Upload className="h-4 w-4" />
                        Change Logo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-1">
                        {uploadingLogo ? 'Uploading...' : 'Click to upload logo'}
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Banner
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-amber-500 transition">
                  {bannerPreview || storeForm.banner_url ? (
                    <div className="space-y-3">
                      <img
                        src={bannerPreview || storeForm.banner_url}
                        alt="Banner preview"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg cursor-pointer hover:bg-amber-700 transition">
                        <Upload className="h-4 w-4" />
                        Change Banner
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerUpload}
                          disabled={uploadingBanner}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-1">
                        {uploadingBanner ? 'Uploading...' : 'Click to upload banner'}
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        disabled={uploadingBanner}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading || uploadingLogo || uploadingBanner}
                className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition disabled:opacity-50"
              >
                {loading ? 'Creating Store...' : 'Create Store'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
