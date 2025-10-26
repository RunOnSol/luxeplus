import {
  useEffect,
  useState,
} from 'react';

import {
  DollarSign,
  UserCheck,
  Users,
  UserX,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  available_balance: number;
  created_at: string;
}

interface VendorRequest {
  id: string;
  user_id: string;
  phone: string;
  bvn: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  status: string;
  created_at: string;
  profiles?: {
    email?: string | null;
    full_name?: string;
  };
}

interface CashoutRequest {
  id: string;
  vendor_id: string;
  amount: number;
  status: string;
  created_at: string;
  profiles: {
    email: string;
    full_name: string;
  };
}

export function AdminUsersPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [vendorRequests, setVendorRequests] = useState<VendorRequest[]>([]);
  const [cashoutRequests, setCashoutRequests] = useState<CashoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "users" | "vendor-requests" | "cashouts"
  >("users");

  useEffect(() => {
    if (profile && profile.role !== "admin") {
      navigate("/");
      return;
    }
    loadData();
  }, [profile, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, vendorRes, cashoutRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("vendor_upgrade_requests")
          .select("*, profiles(email, full_name)")
          .order("created_at", { ascending: false }),
        supabase
          .from("cashout_requests")
          .select("*, profiles(email, full_name)")
          .order("created_at", { ascending: false }),
      ]);

      if (usersRes.data) setUsers(usersRes.data);
      if (vendorRes.data) setVendorRequests(vendorRes.data);
      if (cashoutRes.data) setCashoutRequests(cashoutRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;
      alert("User role updated successfully");
      loadData();
    } catch (error: any) {
      alert("Error updating user role: " + error.message);
    }
  };

  const handleVendorRequest = async (
    requestId: string,
    userId: string,
    approve: boolean,
    requestData: VendorRequest
  ) => {
    try {
      if (approve) {
        await supabase
          .from("profiles")
          .update({
            role: "vendor",
            phone: requestData.phone,
            bvn: requestData.bvn,
            account_number: requestData.account_number,
            account_name: requestData.account_name,
            bank_name: requestData.bank_name,
          })
          .eq("id", userId);
      }

      const { error } = await supabase
        .from("vendor_upgrade_requests")
        .update({
          status: approve ? "approved" : "rejected",
          admin_notes: approve ? "Approved by admin" : "Rejected by admin",
        })
        .eq("id", requestId);

      if (error) throw error;
      alert(approve ? "Vendor request approved" : "Vendor request rejected");
      loadData();
    } catch (error: any) {
      alert("Error handling vendor request: " + error.message);
    }
  };

  const handleCashoutRequest = async (
    requestId: string,
    vendorId: string,
    amount: number,
    approve: boolean
  ) => {
    try {
      if (approve) {
        const { data: vendor } = await supabase
          .from("profiles")
          .select("available_balance")
          .eq("id", vendorId)
          .single();

        if (!vendor || vendor.available_balance < amount) {
          alert("Insufficient balance");
          return;
        }

        await supabase
          .from("profiles")
          .update({ available_balance: vendor.available_balance - amount })
          .eq("id", vendorId);
      }

      const { error } = await supabase
        .from("cashout_requests")
        .update({
          status: approve ? "completed" : "rejected",
          admin_notes: approve ? "Processed by admin" : "Rejected by admin",
        })
        .eq("id", requestId);

      if (error) throw error;
      alert(approve ? "Cashout approved and processed" : "Cashout rejected");
      loadData();
    } catch (error: any) {
      alert("Error handling cashout: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">User Management</h1>

      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 font-medium transition ${
            activeTab === "users"
              ? "border-b-2 border-amber-600 text-amber-600"
              : "text-gray-600 hover:text-amber-600"
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          All Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab("vendor-requests")}
          className={`px-4 py-2 font-medium transition ${
            activeTab === "vendor-requests"
              ? "border-b-2 border-amber-600 text-amber-600"
              : "text-gray-600 hover:text-amber-600"
          }`}
        >
          <UserCheck className="w-4 h-4 inline mr-2" />
          Vendor Requests (
          {vendorRequests.filter((r) => r.status === "pending").length})
        </button>
        <button
          onClick={() => setActiveTab("cashouts")}
          className={`px-4 py-2 font-medium transition ${
            activeTab === "cashouts"
              ? "border-b-2 border-amber-600 text-amber-600"
              : "text-gray-600 hover:text-amber-600"
          }`}
        >
          <DollarSign className="w-4 h-4 inline mr-2" />
          Cashout Requests (
          {cashoutRequests.filter((r) => r.status === "pending").length})
        </button>
      </div>

      {activeTab === "users" && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.full_name || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === "admin"
                          ? "bg-red-100 text-red-800"
                          : user.role === "vendor"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {user.role === "vendor"
                      ? `₦${user.available_balance?.toLocaleString() || 0}`
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="customer">Customer</option>
                      <option value="vendor">Vendor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "vendor-requests" && (
        <div className="space-y-4">
          {vendorRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    {request.profiles?.full_name}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {request.profiles?.email}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    request.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : request.status === "approved"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {request.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <span className="ml-2 font-medium">{request.phone}</span>
                </div>
                <div>
                  <span className="text-gray-600">BVN:</span>
                  <span className="ml-2 font-medium">{request.bvn}</span>
                </div>
                <div>
                  <span className="text-gray-600">Account:</span>
                  <span className="ml-2 font-medium">
                    {request.account_number}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Bank:</span>
                  <span className="ml-2 font-medium">{request.bank_name}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Account Name:</span>
                  <span className="ml-2 font-medium">
                    {request.account_name}
                  </span>
                </div>
              </div>

              {request.status === "pending" && (
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      handleVendorRequest(
                        request.id,
                        request.user_id,
                        true,
                        request
                      )
                    }
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    <UserCheck className="w-4 h-4 inline mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      handleVendorRequest(
                        request.id,
                        request.user_id,
                        false,
                        request
                      )
                    }
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                  >
                    <UserX className="w-4 h-4 inline mr-2" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
          {vendorRequests.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No vendor requests found
            </p>
          )}
        </div>
      )}

      {activeTab === "cashouts" && (
        <div className="space-y-4">
          {cashoutRequests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    {request.profiles.full_name}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {request.profiles.email}
                  </p>
                  <p className="text-2xl font-bold text-amber-600 mt-2">
                    ₦{request.amount.toLocaleString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    request.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : request.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {request.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Requested on {new Date(request.created_at).toLocaleDateString()}
              </p>

              {request.status === "pending" && (
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      handleCashoutRequest(
                        request.id,
                        request.vendor_id,
                        request.amount,
                        true
                      )
                    }
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    Approve & Process
                  </button>
                  <button
                    onClick={() =>
                      handleCashoutRequest(
                        request.id,
                        request.vendor_id,
                        request.amount,
                        false
                      )
                    }
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
          {cashoutRequests.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              No cashout requests found
            </p>
          )}
        </div>
      )}
    </div>
  );
}
