import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { ordersApi } from '../../api/endpoints';
import { getApiErrorMessage } from '../../api/client';
import { BottomNav } from '../../components/BottomNav';
import { StatusBadge } from '../../components/StatusBadge';
import { TopBar } from '../../components/TopBar';
import { useToast } from '../../context/ToastContext';
import type { Order, OrderStatus } from '../../types';

const ADMIN_STATUSES: OrderStatus[] = ['CONFIRMED', 'READY', 'DELIVERED', 'CANCELLED'];

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    ordersApi
      .allAdminOrders()
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

  const handleStatusChange = async (orderCode: string, status: OrderStatus) => {
    try {
      const updated = await ordersApi.updateStatus(orderCode, status);
      setOrders((prev) => prev.map((o) => (o.orderCode === orderCode ? updated : o)));
      showToast(`Order ${orderCode} updated to ${status}`, 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to update status'), 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8F6] pb-24">
      <TopBar subtitle="Customer Orders Management" />

      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-3">
        {loading ? (
          [1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-[#E4EBE5] h-32 animate-pulse" />
          ))
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E4EBE5] p-10 text-center">
            <ClipboardList className="w-10 h-10 text-[#6B7280] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#111827]">No customer orders yet</p>
          </div>
        ) : (
          orders.map((order) => (
            <article
              key={order.orderCode}
              className="bg-white rounded-2xl border border-[#E4EBE5] p-4 space-y-3 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#111827]">{order.orderCode}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-[#4B5563] mt-1">
                    {order.customerName} • {order.customerPhone}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {order.fulfillmentType} • {order.deliveryAddress}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    aria-label={`Update status for ${order.orderCode}`}
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order.orderCode, e.target.value as OrderStatus)
                    }
                    className="px-3 py-1.5 rounded-xl border border-[#E4EBE5] bg-[#F6F8F6] text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#1B5E42]"
                  >
                    {order.status === 'PENDING_PAYMENT' && (
                      <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                    )}
                    {ADMIN_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
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
                <span className="text-[#6B7280] font-mono">
                  {order.razorpayPaymentId ? `RZP: ${order.razorpayPaymentId}` : 'Unpaid'}
                </span>
                <span className="text-sm font-bold text-[#111827]">
                  ₹{order.totalInr.toLocaleString('en-IN')}
                </span>
              </div>
            </article>
          ))
        )}
      </main>

      <BottomNav mode="admin" />
    </div>
  );
}
