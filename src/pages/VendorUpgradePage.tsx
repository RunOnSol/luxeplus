import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Store, CheckCircle, XCircle, Clock } from 'lucide-react';

interface UpgradeRequest {
  id: string;
  phone: string;
  bvn: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  status: string;
  admin_notes: string;
  created_at: string;
}

export function VendorUpgradePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [existingRequest, setExistingRequest] = useState<UpgradeRequest | null>(null);
  const [formData, setFormData] = useState({
    phone: '',
    bvn: '',
    account_number: '',
    account_name: '',
    bank_name: '',
  });

  useEffect(() => {
    if (!profile) return;
    if (profile.role === 'vendor') {
      navigate('/dashboard');
      return;
    }
    loadExistingRequest();
  }, [profile, navigate]);

  const loadExistingRequest = async () => {
    if (!profile) return;
    try {
      const { data } = await supabase
        .from('vendor_upgrade_requests')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) setExistingRequest(data);
    } catch (error) {
      console.error('Error loading request:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('vendor_upgrade_requests')
        .insert({
          user_id: profile.id,
          ...formData,
        });

      if (error) throw error;
      alert('Vendor upgrade request submitted successfully!');
      loadExistingRequest();
    } catch (error: any) {
      alert('Error submitting request: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <Store className="w-16 h-16 text-amber-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Become a Vendor</h1>
          <p className="text-gray-600">
            Start selling your products on LuxePlus marketplace
          </p>
        </div>

        {existingRequest && (
          <div className={`mb-6 p-4 rounded-lg ${
            existingRequest.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
            existingRequest.status === 'approved' ? 'bg-green-50 border border-green-200' :
            'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {existingRequest.status === 'pending' && <Clock className="w-5 h-5 text-yellow-600" />}
              {existingRequest.status === 'approved' && <CheckCircle className="w-5 h-5 text-green-600" />}
              {existingRequest.status === 'rejected' && <XCircle className="w-5 h-5 text-red-600" />}
              <h3 className="font-semibold">
                {existingRequest.status === 'pending' && 'Request Pending'}
                {existingRequest.status === 'approved' && 'Request Approved'}
                {existingRequest.status === 'rejected' && 'Request Rejected'}
              </h3>
            </div>
            <p className="text-sm text-gray-700">
              {existingRequest.status === 'pending' && 'Your vendor upgrade request is being reviewed by our admin team.'}
              {existingRequest.status === 'approved' && 'Congratulations! Your vendor account has been approved.'}
              {existingRequest.status === 'rejected' && `Your request was rejected. ${existingRequest.admin_notes || ''}`}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Submitted on {new Date(existingRequest.created_at).toLocaleDateString()}
            </p>
          </div>
        )}

        {(!existingRequest || existingRequest.status === 'rejected') && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="+234 800 000 0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Verification Number (BVN)
              </label>
              <input
                type="text"
                required
                maxLength={11}
                value={formData.bvn}
                onChange={(e) => setFormData({ ...formData, bvn: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="12345678901"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your BVN is required for identity verification
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name
              </label>
              <input
                type="text"
                required
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="First Bank"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number
              </label>
              <input
                type="text"
                required
                maxLength={10}
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="0123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Holder Name
              </label>
              <input
                type="text"
                required
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="John Doe"
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-semibold text-amber-900 mb-2">Requirements</h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• Valid phone number for customer contact</li>
                <li>• BVN for identity verification</li>
                <li>• Bank account details for payment processing</li>
                <li>• Admin approval required before activation</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        )}

        {existingRequest && existingRequest.status === 'pending' && (
          <div className="text-center">
            <button
              onClick={() => navigate('/')}
              className="text-amber-600 hover:text-amber-700 font-medium"
            >
              Return to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
