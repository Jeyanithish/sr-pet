import { useState } from 'react';
import { Bird as BirdIcon, ShieldCheck, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/endpoints';
import { getApiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  containsHtmlOrScript,
  validateEmail,
  validateIndianPhone,
  validateStrongPassword,
} from '../utils/validation';

type RoleTab = 'customer' | 'admin';
type AuthMode = 'login' | 'register';

export function AuthPage() {
  const [roleTab, setRoleTab] = useState<RoleTab>('customer');
  const [mode, setMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginSuccess } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const switchRoleTab = (tab: RoleTab) => {
    setRoleTab(tab);
    if (tab === 'admin') {
      setMode('login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    if (emailErr) {
      showToast(emailErr, 'error');
      return;
    }

    if (mode === 'register' && roleTab === 'customer') {
      if (containsHtmlOrScript(fullName)) {
        showToast('Name cannot contain HTML or script content', 'error');
        return;
      }
      if (phone.trim()) {
        const phoneErr = validateIndianPhone(phone);
        if (phoneErr) {
          showToast(phoneErr, 'error');
          return;
        }
      }
      const passErr = validateStrongPassword(password);
      if (passErr) {
        showToast(passErr, 'error');
        return;
      }
    }

    setLoading(true);
    try {
      const res =
        mode === 'register' && roleTab === 'customer'
          ? await authApi.register({ fullName, email, phone, password })
          : await authApi.login(email, password);

      if (roleTab === 'admin' && res.user.role !== 'ROLE_ADMIN') {
        showToast('This account is not a Farm Admin account', 'error');
        setLoading(false);
        return;
      }
      if (roleTab === 'customer' && res.user.role === 'ROLE_ADMIN') {
        showToast('Signed in as Farm Admin — redirecting to Dashboard', 'info');
      } else {
        showToast(`Welcome, ${res.user.fullName}`, 'success');
      }

      loginSuccess(res);
      navigate(res.user.role === 'ROLE_ADMIN' ? '/admin/analytics' : '/shop', { replace: true });
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Authentication failed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8F6] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#E4EBE5] shadow-sm p-6 sm:p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#1B5E42] text-white flex items-center justify-center mb-3">
            <BirdIcon className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-[#111827]">SR Pet World</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Healthy farm-raised birds &amp; aviary care
          </p>
        </div>

        {/* Role Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#F6F8F6] rounded-xl border border-[#E4EBE5] mb-5">
          <button
            type="button"
            onClick={() => switchRoleTab('customer')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              roleTab === 'customer'
                ? 'bg-white text-[#1B5E42] shadow-sm border border-[#E4EBE5]'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Customer</span>
          </button>
          <button
            type="button"
            onClick={() => switchRoleTab('admin')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              roleTab === 'admin'
                ? 'bg-white text-[#1B5E42] shadow-sm border border-[#E4EBE5]'
                : 'text-[#6B7280] hover:text-[#111827]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Farm Admin</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && roleTab === 'customer' && (
            <>
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Karthik Rajan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4EBE5] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E42]/20 focus:border-[#1B5E42]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9840098765"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4EBE5] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E42]/20 focus:border-[#1B5E42]"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-[#4B5563] mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={roleTab === 'admin' ? 'admin@srpetworld.in' : 'user@srpetworld.in'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4EBE5] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E42]/20 focus:border-[#1B5E42]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#4B5563] mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4EBE5] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E42]/20 focus:border-[#1B5E42]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#1B5E42] hover:bg-[#144832] text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {loading
              ? 'Please wait...'
              : mode === 'register' && roleTab === 'customer'
              ? 'Create Customer Account'
              : roleTab === 'admin'
              ? 'Sign in to Farm Dashboard'
              : 'Sign in'}
          </button>
        </form>

        {roleTab === 'customer' && (
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-xs font-medium text-[#1B5E42] hover:underline"
            >
              {mode === 'login'
                ? "New to SR Pet World? Create an account"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
