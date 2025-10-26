import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MessageSquare } from 'lucide-react';
import { initializePaystack, initializeFlutterwave, initiateWhatsAppPayment } from '../lib/payments';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalAmount, clearCart } = useCart();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'flutterwave' | 'whatsapp'>('paystack');
  const [shippingAddress, setShippingAddress] = useState({
    fullName: profile?.full_name || '',
    phone: profile?.phone || '',
    address: '',
    city: '',
    state: '',
  });

  const createOrderInDatabase = async () => {
    if (!profile) return null;

    const itemsByStore = items.reduce((acc, item) => {
      if (!acc[item.store_id]) {
        acc[item.store_id] = [];
      }
      acc[item.store_id].push(item);
      return acc;
    }, {} as Record<string, typeof items>);

    const orderIds = [];

    for (const [storeId, storeItems] of Object.entries(itemsByStore)) {
      const storeTotal = storeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: profile.id,
          store_id: storeId,
          total_amount: storeTotal,
          payment_method: paymentMethod,
          payment_status: 'completed',
          shipping_address: shippingAddress,
          tracking_number: `LXP${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      orderIds.push(order.id);

      const orderItems = storeItems.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      const { error: trackingError } = await supabase
        .from('order_tracking')
        .insert({
          order_id: order.id,
          status: 'Order Placed',
          notes: 'Your order has been received and is being processed',
        });

      if (trackingError) throw trackingError;

      for (const item of storeItems) {
        await supabase.rpc('decrement_stock', {
          product_id: item.id,
          quantity: item.quantity,
        });
      }
    }

    return orderIds[0];
  };

  const handlePlaceOrder = async () => {
    if (!profile) {
      alert('Please sign in to place an order');
      return;
    }

    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.state) {
      alert('Please fill in all shipping details');
      return;
    }

    if (!profile.email) {
      alert('Email is required for payment processing');
      return;
    }

    setLoading(true);

    try {
      const reference = `LXP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      if (paymentMethod === 'paystack') {
        initializePaystack({
          email: profile.email,
          amount: totalAmount,
          reference,
          onSuccess: async () => {
            try {
              await createOrderInDatabase();
              clearCart();
              alert('Payment successful! Your order has been placed.');
              navigate('/profile');
            } catch (error) {
              console.error('Error creating order:', error);
              alert('Payment succeeded but failed to create order. Please contact support.');
            }
          },
          onClose: () => {
            setLoading(false);
            alert('Payment cancelled');
          },
        });
      } else if (paymentMethod === 'flutterwave') {
        initializeFlutterwave({
          email: profile.email,
          amount: totalAmount,
          reference,
          onSuccess: async () => {
            try {
              await createOrderInDatabase();
              clearCart();
              alert('Payment successful! Your order has been placed.');
              navigate('/profile');
            } catch (error) {
              console.error('Error creating order:', error);
              alert('Payment succeeded but failed to create order. Please contact support.');
            }
          },
          onClose: () => {
            setLoading(false);
            alert('Payment cancelled');
          },
        });
      } else if (paymentMethod === 'whatsapp') {
        await createOrderInDatabase();
        clearCart();

        const whatsappNumber = '2348000000000';
        initiateWhatsAppPayment(whatsappNumber, totalAmount, reference);

        alert('Order placed! Please complete payment via WhatsApp.');
        navigate('/profile');
      }
    } catch (error: any) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      const scripts = document.querySelectorAll('script[src*="paystack"], script[src*="flutterwave"]');
      scripts.forEach(script => script.remove());
    };
  }, []);

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping Information</h2>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.fullName}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.address}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
              <div className="space-y-3">
                <button
                  onClick={() => setPaymentMethod('paystack')}
                  className={`w-full flex items-center gap-3 p-4 border-2 rounded-lg transition ${
                    paymentMethod === 'paystack'
                      ? 'border-amber-600 bg-amber-50'
                      : 'border-gray-300 hover:border-amber-300'
                  }`}
                >
                  <CreditCard className="h-6 w-6 text-amber-600" />
                  <div className="text-left">
                    <p className="font-semibold">Paystack</p>
                    <p className="text-sm text-gray-600">Pay with card or bank transfer</p>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('flutterwave')}
                  className={`w-full flex items-center gap-3 p-4 border-2 rounded-lg transition ${
                    paymentMethod === 'flutterwave'
                      ? 'border-amber-600 bg-amber-50'
                      : 'border-gray-300 hover:border-amber-300'
                  }`}
                >
                  <CreditCard className="h-6 w-6 text-amber-600" />
                  <div className="text-left">
                    <p className="font-semibold">Flutterwave</p>
                    <p className="text-sm text-gray-600">Secure payment gateway</p>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('whatsapp')}
                  className={`w-full flex items-center gap-3 p-4 border-2 rounded-lg transition ${
                    paymentMethod === 'whatsapp'
                      ? 'border-amber-600 bg-amber-50'
                      : 'border-gray-300 hover:border-amber-300'
                  }`}
                >
                  <MessageSquare className="h-6 w-6 text-green-600" />
                  <div className="text-left">
                    <p className="font-semibold">WhatsApp</p>
                    <p className="text-sm text-gray-600">Complete payment via WhatsApp</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name} x {item.quantity}
                    </span>
                    <span className="text-gray-900">
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>₦{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
