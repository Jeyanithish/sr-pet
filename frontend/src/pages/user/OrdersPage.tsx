import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { ordersApi } from '../../api/endpoints';
import { getApiErrorMessage } from '../../api/client';
import { BottomNav } from '../../components/BottomNav';
import { StatusBadge } from '../../components/StatusBadge';
import { TopBar } from '../../components/TopBar';
import { useToast } from '../../context/ToastContext';
import type { Order } from '../../types';

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    ordersApi
      .myOrders()
      .then((data) => {
        if (active) setOrders(data);
      })
      .catch((err) => {
        if (active) showToast(getApiErrorMessage(err, 'Failed to load orders'), 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  return (
    <div className="min-h-screen bg-[#F6F8F6] pb-24">
      <TopBar subtitle="Your Orders & Tracking" />

      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-3">
        {loading ? (
          [1, 2].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-[#E4EBE5] h-32 animate-pulse" />
          ))
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E4EBE5] p-10 text-center">
            <ClipboardList className="w-10 h-10 text-[#6B7280] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#111827]">No orders yet</p>
            <p className="text-xs text-[#6B7280] mt-1">
              Once you place an order, you can track its status here.
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <article
              key={order.orderCode}
              className="bg-white rounded-2xl border border-[#E4EBE5] p-4 space-y-3 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-sm font-bold text-[#111827]">{order.orderCode}</span>
                  <p className="text-xs text-[#6B7280]">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    • {order.fulfillmentType === 'DELIVERY' ? 'Farm Delivery' : 'Farm Pickup'}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="border-t border-[#E4EBE5] pt-2.5 space-y-1">
                {order.items.map((item) => (
                  <div
                    key={`${order.orderCode}-${item.birdId}`}
                    className="flex justify-between text-xs text-[#4B5563]"
                  >
                    <span>
                      {item.birdName} × {item.quantity}
                    </span>
                    <span>₹{(item.unitPriceInr * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#E4EBE5] pt-2.5 flex items-center justify-between text-xs">
                <span className="text-[#6B7280]">
                  {order.razorpayPaymentId ? `Paid • ${order.razorpayPaymentId}` : 'Awaiting Payment'}
                </span>
                <span className="text-sm font-bold text-[#111827]">
                  ₹{order.totalInr.toLocaleString('en-IN')}
                </span>
              </div>
            </article>
          ))
        )}
      </main>

      <BottomNav mode="user" />
    </div>
  );
}
