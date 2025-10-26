import {
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import {
  Link,
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

export function CartPage() {
  const { items, updateQuantity, removeFromCart, totalAmount } = useCart();
  const { profile } = useAuth();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Your cart is empty
          </h2>
          <p className="text-gray-500 mb-6">Add some products to get started</p>
          <Link
            to="/"
            className="inline-block bg-amber-600 text-white px-6 py-3 rounded-lg hover:bg-amber-700 transition"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex gap-4">
                  <img
                    src={
                      item.images?.[0] ||
                      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200"
                    }
                    alt={item.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {item.name}
                    </h3>
                    <p className="text-amber-600 font-bold mb-3">
                      ₦{item.price.toLocaleString()}
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="p-2 hover:bg-gray-100 transition"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-4 font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.stock_quantity}
                          className="p-2 hover:bg-gray-100 transition disabled:opacity-50"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-600 hover:text-red-700 transition"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₦{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span>₦{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {profile ? (
                <button
                  onClick={() => navigate("/checkout")}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition"
                >
                  Proceed to Checkout
                </button>
              ) : (
                <Link
                  to="/signin"
                  className="block w-full text-center bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition"
                >
                  Sign In to Checkout
                </Link>
              )}

              <Link
                to="/"
                className="block w-full mt-3 text-center border-2 border-amber-600 text-amber-600 py-3 rounded-lg font-semibold hover:bg-amber-50 transition"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
