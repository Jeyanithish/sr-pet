import { useEffect, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { birdsApi } from '../../api/endpoints';
import { getApiErrorMessage } from '../../api/client';
import { BirdCard } from '../../components/BirdCard';
import { BottomNav } from '../../components/BottomNav';
import { TopBar } from '../../components/TopBar';
import { useToast } from '../../context/ToastContext';
import type { Bird } from '../../types';

const CATEGORIES = ['All', 'Parakeets', 'Lovebirds', 'Cockatiels', 'Conures'];

export function ShopPage() {
  const [birds, setBirds] = useState<Bird[]>([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await birdsApi.listActive(category, search);
        if (active) setBirds(data);
      } catch (err) {
        if (active) showToast(getApiErrorMessage(err, 'Failed to load birds'), 'error');
      } finally {
        if (active) setLoading(false);
      }
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [category, search, showToast]);

  return (
    <div className="min-h-screen bg-[#F6F8F6] pb-24">
      <TopBar subtitle="Farm-raised healthy birds • India" />

      <main className="max-w-5xl mx-auto px-4 pt-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search budgies, lovebirds, cockatiels..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E4EBE5] text-sm focus:outline-none focus:ring-2 focus:ring-[#1B5E42]/20 focus:border-[#1B5E42]"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  active
                    ? 'bg-[#1B5E42] text-white border-[#1B5E42]'
                    : 'bg-white text-[#4B5563] border-[#E4EBE5] hover:border-[#1B5E42]/40'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-[#E4EBE5] h-72 animate-pulse"
              />
            ))}
          </div>
        ) : birds.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E4EBE5] p-10 text-center">
            <Sparkles className="w-8 h-8 text-[#D97706] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#111827]">No birds match your filter</p>
            <p className="text-xs text-[#6B7280] mt-1">
              Try clearing your search or selecting All categories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {birds.map((bird) => (
              <BirdCard key={bird.id} bird={bird} />
            ))}
          </div>
        )}
      </main>

      <BottomNav mode="user" />
    </div>
  );
}
