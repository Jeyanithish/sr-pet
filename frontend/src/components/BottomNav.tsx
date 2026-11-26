import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Bird,
  ClipboardList,
  Package,
  ShoppingBasket,
} from 'lucide-react';
import { useCart } from '../context/CartContext';

interface BottomNavProps {
  mode: 'user' | 'admin';
}

export function BottomNav({ mode }: BottomNavProps) {
  const { totalItems } = useCart();

  const links =
    mode === 'user'
      ? [
          { to: '/shop', label: 'Birds', icon: Bird, badge: 0 },
          { to: '/cart', label: 'Basket', icon: ShoppingBasket, badge: totalItems },
          { to: '/orders', label: 'Orders', icon: ClipboardList, badge: 0 },
        ]
      : [
          { to: '/admin/analytics', label: 'Charts', icon: BarChart3, badge: 0 },
          { to: '/admin/orders', label: 'Orders', icon: ClipboardList, badge: 0 },
          { to: '/admin/inventory', label: 'Stock', icon: Package, badge: 0 },
        ];

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-[#E4EBE5] pb-safe"
    >
      <div className="max-w-5xl mx-auto grid grid-cols-3 h-16">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                  isActive ? 'text-[#1B5E42]' : 'text-[#6B7280] hover:text-[#111827]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.25]' : 'stroke-[1.75]'}`} />
                    {item.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D97706] text-white text-[10px] font-bold flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
