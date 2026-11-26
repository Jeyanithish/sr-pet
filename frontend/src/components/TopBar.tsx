import { Bird as BirdIcon, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function TopBar({ subtitle }: { subtitle?: string }) {
  const { user, logout } = useAuth();
  const { clearCart } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    clearCart();
    navigate('/auth', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E4EBE5]">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#1B5E42] text-white flex items-center justify-center shrink-0">
            <BirdIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#111827] text-base tracking-tight truncate">
                SR Pet World
              </span>
              {user?.role === 'ROLE_ADMIN' && (
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-amber-100 text-[#D97706]">
                  Farm Admin
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-[#6B7280] truncate">{subtitle}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#4B5563] hover:text-[#111827] hover:bg-[#F6F8F6] border border-[#E4EBE5] transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign out</span>
        </button>
      </div>
    </header>
  );
}
