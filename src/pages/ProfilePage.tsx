import {
  useEffect,
  useState,
} from 'react';

import {
  Clock,
  MapPin,
  Package,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import {
  Order,
  OrderTracking,
  supabase,
} from '../lib/supabase';

export function ProfilePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<OrderTracking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      navigate("/signin");
      return;
    }
    loadOrders();
  }, [profile]);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_id", profile!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTracking = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from("order_tracking")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setTracking(data || []);
    } catch (error) {
      console.error("Error loading tracking:", error);
    }
  };

  const handleViewTracking = (order: Order) => {
    setSelectedOrder(order);
    loadTracking(order.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-amber-100 text-amber-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">My Profile</h1>
          <div className="space-y-2">
            <p className="text-gray-700">
              <span className="font-semibold">Name:</span>{" "}
              {profile?.full_name || "Not set"}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Email:</span> {profile?.email}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Phone:</span>{" "}
              {profile?.phone || "Not set"}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Account Type:</span>{" "}
              <span className="capitalize">{profile?.role}</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h2>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-24 w-24 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No orders yet</p>
              <button
                onClick={() => navigate("/")}
                className="bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border rounded-lg p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        Order{" "}
                        <span className="text-sm">
                          {" "}
                          #{order.tracking_number}
                        </span>
                      </p>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                      <p className="text-gray-600 text-sm mb-1">
                        Placed on{" "}
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-gray-600 text-sm mb-1">
                        Payment: {order.payment_method} - {order.payment_status}
                      </p>
                      <p className="text-xl font-bold text-amber-600 mt-2">
                        ₦{order.total_amount.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleViewTracking(order)}
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

        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Order Tracking
                  </h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-6 p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Tracking Number</p>
                  <p className="text-sm font-bold text-gray-900">
                    {selectedOrder.tracking_number}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Order Status:{" "}
                    <span className="font-semibold capitalize">
                      {selectedOrder.status}
                    </span>
                  </p>
                </div>

                <div className="space-y-6">
                  {tracking.map((item, index) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="bg-amber-600 rounded-full p-2">
                          {index === 0 ? (
                            <Clock className="h-4 w-4 text-white" />
                          ) : (
                            <MapPin className="h-4 w-4 text-white" />
                          )}
                        </div>
                        {index < tracking.length - 1 && (
                          <div className="w-0.5 h-full bg-amber-200 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <p className="font-semibold text-gray-900">
                          {item.status}
                        </p>
                        {item.location && (
                          <p className="text-sm text-gray-600 mt-1">
                            <MapPin className="h-4 w-4 inline mr-1" />
                            {item.location}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-sm text-gray-600 mt-1">
                            {item.notes}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {tracking.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="h-16 w-16 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-600">
                      No tracking information available yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
