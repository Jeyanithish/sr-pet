import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Bird as BirdIcon, IndianRupee, PackageCheck, ShoppingBag } from 'lucide-react';
import { analyticsApi } from '../../api/endpoints';
import { getApiErrorMessage } from '../../api/client';
import { BottomNav } from '../../components/BottomNav';
import { TopBar } from '../../components/TopBar';
import { useToast } from '../../context/ToastContext';
import type { AnalyticsSummary } from '../../types';

const PIE_COLORS = ['#1B5E42', '#D97706', '#2563EB', '#10B981', '#6366F1'];

export function AnalyticsDashboardPage() {
  const [range, setRange] = useState<'7d' | '6m'>('7d');
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    setLoading(true);
    analyticsApi
      .getSummary(range)
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err) => {
        if (active) showToast(getApiErrorMessage(err, 'Failed to load analytics'), 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [range, showToast]);

  const kpis = data
    ? [
        {
          label: 'Total Revenue',
          value: `₹${Number(data.totalRevenue).toLocaleString('en-IN')}`,
          sub: `Avg ₹${Number(data.avgOrderValue).toLocaleString('en-IN')}/order`,
          icon: IndianRupee,
        },
        {
          label: 'Completed Orders',
          value: String(data.totalOrders),
          sub: 'Paid & confirmed',
          icon: ShoppingBag,
        },
        {
          label: 'Active Orders',
          value: String(data.activeOrders),
          sub: 'Confirmed / Ready',
          icon: PackageCheck,
        },
        {
          label: 'Available Stock',
          value: String(data.totalStock),
          sub: 'Live birds on farm',
          icon: BirdIcon,
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#F6F8F6] pb-24">
      <TopBar subtitle="Farm Analytics & Insights" />

      <main className="max-w-5xl mx-auto px-4 pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-[#111827]">Aviary Overview</h1>
          <div className="inline-flex p-1 bg-white rounded-xl border border-[#E4EBE5]">
            <button
              type="button"
              onClick={() => setRange('7d')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                range === '7d' ? 'bg-[#1B5E42] text-white' : 'text-[#6B7280]'
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setRange('6m')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                range === '6m' ? 'bg-[#1B5E42] text-white' : 'text-[#6B7280]'
              }`}
            >
              6 Months
            </button>
          </div>
        </div>

        {loading || !data ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-[#E4EBE5] h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {kpis.map((k) => {
                const Icon = k.icon;
                return (
                  <div
                    key={k.label}
                    className="bg-white rounded-2xl border border-[#E4EBE5] p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between text-[#6B7280] mb-2">
                      <span className="text-xs font-medium">{k.label}</span>
                      <Icon className="w-4 h-4 text-[#1B5E42]" />
                    </div>
                    <p className="text-xl font-bold text-[#111827]">{k.value}</p>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">{k.sub}</p>
                  </div>
                );
              })}
            </section>

            {/* Revenue Trend Area Chart */}
            <section className="bg-white rounded-2xl border border-[#E4EBE5] p-4 shadow-sm">
              <h2 className="text-sm font-bold text-[#111827] mb-3">
                Revenue Trend ({range === '7d' ? 'Last 7 Days' : 'Last 6 Months'})
              </h2>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.revenueTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1B5E42" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1B5E42" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E4EBE5" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                    <Tooltip
                      formatter={(val: number) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenueInr"
                      stroke="#1B5E42"
                      strokeWidth={2.2}
                      fill="url(#revGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Species Share & Stock vs Sold */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <section className="bg-white rounded-2xl border border-[#E4EBE5] p-4 shadow-sm">
                <h2 className="text-sm font-bold text-[#111827] mb-3">Sales Share by Species</h2>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.speciesShare}
                        dataKey="revenueInr"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={82}
                        paddingAngle={3}
                      >
                        {data.speciesShare.map((entry, idx) => (
                          <Cell key={entry.category} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Sales']}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="bg-white rounded-2xl border border-[#E4EBE5] p-4 shadow-sm">
                <h2 className="text-sm font-bold text-[#111827] mb-3">
                  Available Stock vs. Units Sold
                </h2>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.stockVsSold} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E4EBE5" />
                      <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#6B7280' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="availableStock" name="In Stock" fill="#1B5E42" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="unitsSold" name="Units Sold" fill="#D97706" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
          </>
        )}
      </main>

      <BottomNav mode="admin" />
    </div>
  );
}
