import { useState } from 'react';
import { CreditCard, MapPin, Minus, Plus, ShoppingBasket, Store, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ordersApi } from '../../api/endpoints';
import { getApiErrorMessage } from '../../api/client';
import { BottomNav } from '../../components/BottomNav';
import { TopBar } from '../../components/TopBar';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import type { FulfillmentType } from '../../types';
import { containsHtmlOrScript, validateIndianPhone } from '../../utils/validation';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function CartCheckoutPage() {
  const { items, subtotalInr, setQuantity, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [fulfillment, setFulfillment] = useState<FulfillmentType>('DELIVERY');
  const [customerName, setCustomerName] = useState(user?.fullName ?? '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone ?? '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const deliveryFee = items.length > 0 && fulfillment === 'DELIVERY' ? 150 : 0;
  const totalInr = subtotalInr + deliveryFee;

  const handlePayWithRazorpay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const phoneErr = validateIndianPhone(customerPhone);
    if (phoneErr) {
      showToast(phoneErr, 'error');
      return;
    }
    if (containsHtmlOrScript(customerName) || containsHtmlOrScript(deliveryAddress)) {
      showToast('Invalid characters in name or address', 'error');
      return;
    }
    if (fulfillment === 'DELIVERY' && !deliveryAddress.trim()) {
      showToast('Please enter a delivery address', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        showToast('Failed to load Razorpay Checkout', 'error');
        setSubmitting(false);
        return;
      }

      const checkout = await ordersApi.checkout({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress: fulfillment === 'DELIVERY' ? deliveryAddress.trim() : undefined,
        fulfillmentType: fulfillment,
        items: items.map((i) => ({ birdId: i.bird.id, quantity: i.quantity })),
      });

      const rzp = new window.Razorpay({
        key: checkout.razorpayKeyId,
        amount: checkout.amountPaise,
        currency: checkout.currency,
        name: 'SR Pet World',
        description: `Order ${checkout.orderCode}`,
        order_id: checkout.razorpayOrderId,
        prefill: {
          name: customerName.trim(),
          email: user?.email ?? '',
          contact: customerPhone.trim(),
        },
        theme: { color: '#1B5E42' },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verified = await ordersApi.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            clearCart();
            showToast(`Order ${verified.orderCode} confirmed!`, 'success');
            navigate('/orders');
          } catch (verifyErr) {
            showToast(getApiErrorMessage(verifyErr, 'Payment verification failed'), 'error');
          }
        },
        modal: {
          ondismiss: () => {
            showToast('Payment cancelled. Your order remains pending.', 'info');
            setSubmitting(false);
          },
        },
      });

      rzp.open();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Checkout failed'), 'error');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8F6] pb-24">
      <TopBar subtitle="Your Basket & Checkout" />

      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E4EBE5] p-10 text-center">
            <ShoppingBasket className="w-10 h-10 text-[#6B7280] mx-auto mb-3" />
            <h2 className="text-base font-semibold text-[#111827]">Your basket is empty</h2>
            <p className="text-xs text-[#6B7280] mt-1">
              Browse healthy farm-raised birds and add them to your basket.
            </p>
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="mt-4 px-5 py-2.5 rounded-xl bg-[#1B5E42] hover:bg-[#144832] text-white text-xs font-semibold"
            >
              Browse Birds
            </button>
          </div>
        ) : (
          <>
            {/* Basket Items */}
            <section className="bg-white rounded-2xl border border-[#E4EBE5] divide-y divide-[#E4EBE5]">
              {items.map(({ bird, quantity }) => (
                <div key={bird.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[#111827] truncate">{bird.name}</h3>
                    <p className="text-xs text-[#6B7280]">
                      ₹{bird.priceInr.toLocaleString('en-IN')} × {quantity}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="inline-flex items-center gap-1.5 bg-[#F6F8F6] border border-[#E4EBE5] rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => setQuantity(bird, quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-[#E4EBE5] flex items-center justify-center"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-semibold">{quantity}</span>
                      <button
                        type="button"
                        disabled={quantity >= bird.stockQuantity}
                        onClick={() => setQuantity(bird, quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-[#1B5E42] text-white flex items-center justify-center disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${bird.name}`}
                      onClick={() => setQuantity(bird, 0)}
                      className="p-2 text-[#6B7280] hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </section>

            {/* Fulfillment & Details */}
            <form
              onSubmit={handlePayWithRazorpay}
              className="bg-white rounded-2xl border border-[#E4EBE5] p-4 space-y-4"
            >
              <div>
                <span className="block text-xs font-semibold text-[#111827] mb-2">
                  Fulfillment Option
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFulfillment('DELIVERY')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                      fulfillment === 'DELIVERY'
                        ? 'border-[#1B5E42] bg-emerald-50 text-[#1B5E42]'
                        : 'border-[#E4EBE5] text-[#4B5563]'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Farm Delivery (₹150)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillment('PICKUP')}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                      fulfillment === 'PICKUP'
                        ? 'border-[#1B5E42] bg-emerald-50 text-[#1B5E42]'
                        : 'border-[#E4EBE5] text-[#4B5563]'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    <span>Farm Pickup (Free)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4EBE5] text-sm focus:outline-none focus:border-[#1B5E42]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="9840098765"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4EBE5] text-sm focus:outline-none focus:border-[#1B5E42]"
                  />
                </div>
              </div>

              {fulfillment === 'DELIVERY' && (
                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1">
                    Delivery Address
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="House no, Street, City, PIN"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4EBE5] text-sm focus:outline-none focus:border-[#1B5E42]"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-[#E4EBE5] space-y-1.5 text-sm">
                <div className="flex justify-between text-[#4B5563]">
                  <span>Subtotal</span>
                  <span>₹{subtotalInr.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#4B5563]">
                  <span>{fulfillment === 'DELIVERY' ? 'Farm Delivery Fee' : 'Farm Pickup'}</span>
                  <span>{deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-[#111827] pt-1">
                  <span>Total Payable</span>
                  <span>₹{totalInr.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-[#1B5E42] hover:bg-[#144832] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                <CreditCard className="w-4 h-4" />
                <span>{submitting ? 'Preparing Razorpay...' : `Pay ₹${totalInr.toLocaleString('en-IN')} with Razorpay`}</span>
              </button>
            </form>
          </>
        )}
      </main>

      <BottomNav mode="user" />
    </div>
  );
}
