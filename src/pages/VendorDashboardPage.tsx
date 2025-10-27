import {
  useEffect,
  useState,
} from 'react';

import {
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Truck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  status: string;
  payment_status: string;
  shipping_address: any;
  created_at: string;
  tracking_number: string | null;
  profiles: {
    full_name: string;
    email: string;
    phone: string;
  };
  order_items: {
    id: string;
    quantity: number;
    price: number;
    product_id: string;
    products: {
      name: string;
      images: string[];
    };
  }[];
}

interface Review {
  id: string;
  product_id: string;
  customer_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
  products: {
    name: string;
  };
}

interface CashoutRequest {
  id: string;
  amount: number;
  status: string;
  admin_notes: string;
  created_at: string;
}
interface VendorPageProps {
  onNavigate: (page: string) => void;
}
export function VendorDashboardPage({ onNavigate }: VendorPageProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [cashoutRequests, setCashoutRequests] = useState<CashoutRequest[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "reviews" | "cashouts">(
    "orders"
  );
  const [cashoutAmount, setCashoutAmount] = useState("");
  const [showCashoutForm, setShowCashoutForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingLocation, setTrackingLocation] = useState("");
  const [trackingNotes, setTrackingNotes] = useState("");

  useEffect(() => {
    if (profile?.role == "customer") {
      alert("Access denied. Vendor account required.");
      onNavigate("dashboard");
      return;
    }
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile) return;

    try {
      const storeRes = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", profile.id)
        .maybeSingle();

      if (!storeRes.data) {
        navigate("/vendor");
        return;
      }

      setStore(storeRes.data);

      const productIds = await supabase
        .from("products")
        .select("id")
        .eq("store_id", storeRes.data.id);

      const [ordersRes, cashoutRes, reviewsRes] = await Promise.all([
        supabase
          .from("orders")
          .select(
            `
            *,
            profiles(full_name, email, phone),
            order_items(
              id,
              quantity,
              price,
              product_id,
              products(name, images)
            )
          `
          )
          .eq("store_id", storeRes.data.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("cashout_requests")
          .select("*")
          .eq("vendor_id", profile.id)
          .order("created_at", { ascending: false }),
        productIds.data && productIds.data.length > 0
          ? supabase
              .from("reviews")
              .select(
                `
                *,
                profiles(full_name),
                products(name)
              `
              )
              .in(
                "product_id",
                productIds.data.map((p) => p.id)
              )
              .order("created_at", { ascending: false })
          : { data: [], error: null },
      ]);

      if (ordersRes.data) setOrders(ordersRes.data);
      if (cashoutRes.data) setCashoutRequests(cashoutRes.data);
      if (reviewsRes.data) setReviews(reviewsRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: string,
    location?: string,
    notes?: string
  ) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      await supabase.from("order_tracking").insert({
        order_id: orderId,
        status: newStatus,
        location: location || null,
        notes: notes || `Order status updated to ${newStatus}`,
      });

      alert("Order status updated successfully");
      setSelectedOrder(null);
      setTrackingLocation("");
      setTrackingNotes("");
      loadData();
    } catch (error: any) {
      alert("Error updating order: " + error.message);
    }
  };

  const requestCashout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const amount = parseFloat(cashoutAmount);
    if (amount <= 0 || amount > (profile.available_balance || 0)) {
      alert("Invalid amount");
      return;
    }

    try {
      const { error } = await supabase.from("cashout_requests").insert({
        vendor_id: profile.id,
        amount,
      });

      if (error) throw error;
      alert("Cashout request submitted successfully!");
      setCashoutAmount("");
      setShowCashoutForm(false);
      loadData();
    } catch (error: any) {
      alert("Error submitting cashout: " + error.message);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      processing: "bg-cyan-100 text-cyan-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      completed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  const totalRevenue = orders
    .filter((o) => o.payment_status === "completed")
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  const pendingOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "confirmed"
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Vendor Dashboard</h1>
        <p className="text-gray-600">{store?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Available Balance</span>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">
            ₦{(profile?.available_balance || 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Revenue</span>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-600">
            ₦{totalRevenue.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Total Orders</span>
            <ShoppingCart className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-600">{orders.length}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 text-sm">Pending Orders</span>
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-600">{pendingOrders}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 font-medium transition whitespace-nowrap ${
            activeTab === "orders"
              ? "border-b-2 border-amber-600 text-amber-600"
              : "text-gray-600 hover:text-amber-600"
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`px-4 py-2 font-medium transition whitespace-nowrap ${
            activeTab === "reviews"
              ? "border-b-2 border-amber-600 text-amber-600"
              : "text-gray-600 hover:text-amber-600"
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Reviews ({reviews.length})
        </button>
        <button
          onClick={() => setActiveTab("cashouts")}
          className={`px-4 py-2 font-medium transition whitespace-nowrap ${
            activeTab === "cashouts"
              ? "border-b-2 border-amber-600 text-amber-600"
              : "text-gray-600 hover:text-amber-600"
          }`}
        >
          <DollarSign className="w-4 h-4 inline mr-2" />
          Cashouts ({cashoutRequests.length})
        </button>
      </div>

      {activeTab === "orders" && (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    Order #{order.id.slice(0, 8)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {order.profiles.full_name} - {order.profiles.email}
                  </p>
                  {order.profiles.phone && (
                    <p className="text-sm text-gray-600">
                      Phone: {order.profiles.phone}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-amber-600">
                    ₦{Number(order.total_amount).toLocaleString()}
                  </p>
                  <span
                    className={`inline-block px-3 py-1 text-xs font-medium rounded-full mt-2 ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4 mb-4">
                <h4 className="font-medium mb-2">Items:</h4>
                {order.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-sm mb-2"
                  >
                    <span>
                      {item.products.name} x {item.quantity}
                    </span>
                    <span className="font-medium">
                      ₦{(Number(item.price) * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {order.shipping_address && (
                <div className="border-t pt-4 mb-4">
                  <h4 className="font-medium mb-2">Shipping Address:</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>
                      <span className="font-medium">Name:</span>{" "}
                      {order.shipping_address.fullName}
                    </p>
                    <p>
                      <span className="font-medium">Phone:</span>{" "}
                      {order.shipping_address.phone}
                    </p>
                    <p>
                      <span className="font-medium">Address:</span>{" "}
                      {order.shipping_address.address}
                    </p>
                    <p>
                      <span className="font-medium">City:</span>{" "}
                      {order.shipping_address.city},{" "}
                      {order.shipping_address.state}
                    </p>
                  </div>
                </div>
              )}

              {order.tracking_number && (
                <div className="border-t pt-4 mb-4">
                  <h4 className="font-medium mb-2">Tracking Number:</h4>
                  <p className="text-sm font-mono bg-gray-100 px-3 py-2 rounded">
                    {order.tracking_number}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {order.status === "pending" && (
                  <button
                    onClick={() => updateOrderStatus(order.id, "confirmed")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    Accept Order
                  </button>
                )}
                {order.status === "confirmed" && (
                  <button
                    onClick={() => updateOrderStatus(order.id, "processing")}
                    className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition text-sm"
                  >
                    Start Processing
                  </button>
                )}
                {order.status === "processing" && (
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-sm"
                  >
                    <Truck className="w-4 h-4 inline mr-1" />
                    Ship Order
                  </button>
                )}
                {order.status === "shipped" && (
                  <button
                    onClick={() => updateOrderStatus(order.id, "delivered")}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                  >
                    <CheckCircle className="w-4 h-4 inline mr-1" />
                    Mark as Delivered
                  </button>
                )}
                {(order.status === "pending" ||
                  order.status === "confirmed") && (
                  <button
                    onClick={() => {
                      if (
                        confirm("Are you sure you want to cancel this order?")
                      ) {
                        updateOrderStatus(
                          order.id,
                          "cancelled",
                          "",
                          "Order cancelled by vendor"
                        );
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <p className="text-center text-gray-500 py-8">No orders yet</p>
          )}
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    {review.products.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    by {review.profiles.full_name}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`text-lg ${
                            i < review.rating
                              ? "text-amber-500"
                              : "text-gray-300"
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      ({review.rating}/5)
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(review.created_at).toLocaleString()}
                </p>
              </div>
              {review.comment && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              )}
            </div>
          ))}
          {reviews.length === 0 && (
            <p className="text-center text-gray-500 py-8">No reviews yet</p>
          )}
        </div>
      )}

      {activeTab === "cashouts" && (
        <div>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold">Request Cashout</h3>
                <p className="text-sm text-gray-600">
                  Available Balance: ₦
                  {(profile?.available_balance || 0).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setShowCashoutForm(!showCashoutForm)}
                className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition"
              >
                {showCashoutForm ? "Cancel" : "New Cashout"}
              </button>
            </div>

            {showCashoutForm && (
              <form onSubmit={requestCashout} className="mt-4">
                <div className="flex gap-4">
                  <input
                    type="number"
                    required
                    min="1"
                    max={profile?.available_balance || 0}
                    value={cashoutAmount}
                    onChange={(e) => setCashoutAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="space-y-4">
            {cashoutRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-2xl font-bold text-amber-600">
                      ₦{request.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(request.created_at).toLocaleString()}
                    </p>
                    {request.admin_notes && (
                      <p className="text-sm text-gray-700 mt-2">
                        Note: {request.admin_notes}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                      request.status
                    )}`}
                  >
                    {request.status}
                  </span>
                </div>
              </div>
            ))}
            {cashoutRequests.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No cashout requests yet
              </p>
            )}
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Ship Order
                  </h2>
                  <p className="text-gray-600">
                    Order #{selectedOrder.id.slice(0, 8)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <p className="text-sm text-gray-700">
                    {selectedOrder.profiles.full_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedOrder.profiles.email}
                  </p>
                  {selectedOrder.profiles.phone && (
                    <p className="text-sm text-gray-600">
                      {selectedOrder.profiles.phone}
                    </p>
                  )}
                </div>

                {selectedOrder.shipping_address && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Delivery Address</h3>
                    <p className="text-sm text-gray-700">
                      {selectedOrder.shipping_address.fullName}
                    </p>
                    <p className="text-sm text-gray-700">
                      {selectedOrder.shipping_address.phone}
                    </p>
                    <p className="text-sm text-gray-700">
                      {selectedOrder.shipping_address.address}
                    </p>
                    <p className="text-sm text-gray-700">
                      {selectedOrder.shipping_address.city},{" "}
                      {selectedOrder.shipping_address.state}
                    </p>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Order Items</h3>
                  {selectedOrder.order_items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm mb-1"
                    >
                      <span>
                        {item.products.name} x {item.quantity}
                      </span>
                      <span className="font-medium">
                        ₦{(Number(item.price) * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span>
                      ₦{Number(selectedOrder.total_amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={trackingLocation}
                    onChange={(e) => setTrackingLocation(e.target.value)}
                    placeholder="e.g., Warehouse, Lagos"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipment Notes (Optional)
                  </label>
                  <textarea
                    value={trackingNotes}
                    onChange={(e) => setTrackingNotes(e.target.value)}
                    placeholder="Add any notes about the shipment..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    updateOrderStatus(
                      selectedOrder.id,
                      "shipped",
                      trackingLocation || undefined,
                      trackingNotes ||
                        "Order has been shipped and is on the way to customer"
                    );
                  }}
                  className="flex-1 bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition font-semibold"
                >
                  <Truck className="w-5 h-5 inline mr-2" />
                  Confirm Shipment
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
