import type { OrderStatus } from '../types';

const STATUS_MAP: Record<OrderStatus, { label: string; classes: string }> = {
  PENDING_PAYMENT: { label: 'Pending Payment', classes: 'bg-gray-100 text-gray-700' },
  CONFIRMED: { label: 'Confirmed', classes: 'bg-emerald-100 text-[#1B5E42]' },
  READY: { label: 'Ready', classes: 'bg-amber-100 text-[#D97706]' },
  DELIVERED: { label: 'Delivered', classes: 'bg-blue-100 text-blue-700' },
  CANCELLED: { label: 'Cancelled', classes: 'bg-red-100 text-red-700' },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_MAP[status] ?? STATUS_MAP.PENDING_PAYMENT;
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.classes}`}>
      {cfg.label}
    </span>
  );
}
