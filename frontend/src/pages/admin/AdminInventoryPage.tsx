import { useEffect, useState } from 'react';
import { Minus, Plus, PlusCircle, Upload, X } from 'lucide-react';
import { birdsApi } from '../../api/endpoints';
import { getApiErrorMessage } from '../../api/client';
import { BottomNav } from '../../components/BottomNav';
import { TopBar } from '../../components/TopBar';
import { useToast } from '../../context/ToastContext';
import type { Bird } from '../../types';
import { sanitizeImageUrl } from '../../utils/validation';

const CATEGORIES = ['Parakeets', 'Lovebirds', 'Cockatiels', 'Conures'];

export function AdminInventoryPage() {
  const [birds, setBirds] = useState<Bird[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Add Bird form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Parakeets');
  const [ageTag, setAgeTag] = useState('');
  const [description, setDescription] = useState('');
  const [priceInr, setPriceInr] = useState('');
  const [stockQuantity, setStockQuantity] = useState('5');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    birdsApi
      .listAdmin()
      .then((data) => {
        if (active) setBirds(data);
      })
      .catch((err) => {
        if (active) showToast(getApiErrorMessage(err, 'Failed to load inventory'), 'error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  const updateBirdFields = async (bird: Bird, patch: Partial<Bird>) => {
    try {
      const updated = await birdsApi.update(bird.id, {
        name: patch.name ?? bird.name,
        category: patch.category ?? bird.category,
        ageTag: patch.ageTag ?? bird.ageTag,
        description: patch.description ?? bird.description,
        priceInr: patch.priceInr ?? bird.priceInr,
        stockQuantity: patch.stockQuantity ?? bird.stockQuantity,
        imageUrl: patch.imageUrl ?? bird.imageUrl,
        active: patch.active ?? bird.active,
      });
      setBirds((prev) => prev.map((b) => (b.id === bird.id ? updated : b)));
      showToast(`Updated ${updated.name}`, 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to update bird'), 'error');
    }
  };

  const handleImageUpload = async (birdId: number, file?: File) => {
    if (!file) return;
    try {
      const updated = await birdsApi.uploadImage(birdId, file);
      setBirds((prev) => prev.map((b) => (b.id === birdId ? updated : b)));
      showToast('Bird photo updated', 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Image upload failed'), 'error');
    }
  };

  const handleCreateBird = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await birdsApi.create({
        name: name.trim(),
        category,
        ageTag: ageTag.trim() || undefined,
        description: description.trim() || undefined,
        priceInr: Number(priceInr),
        stockQuantity: Number(stockQuantity),
        imageUrl: imageUrl.trim() || undefined,
        active: true,
      });
      setBirds((prev) => [...prev, created]);
      showToast(`Added ${created.name}`, 'success');
      setModalOpen(false);
      setName('');
      setAgeTag('');
      setDescription('');
      setPriceInr('');
      setStockQuantity('5');
      setImageUrl('');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to add bird'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8F6] pb-24">
      <TopBar subtitle="Bird Inventory & Pricing" />

      <main className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-[#111827]">Aviary Stock ({birds.length})</h1>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1B5E42] hover:bg-[#144832] text-white text-xs font-semibold"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Bird</span>
          </button>
        </div>

        {loading ? (
          [1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-[#E4EBE5] h-28 animate-pulse" />
          ))
        ) : (
          <div className="space-y-3">
            {birds.map((bird) => (
              <article
                key={bird.id}
                className="bg-white rounded-2xl border border-[#E4EBE5] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={sanitizeImageUrl(bird.imageUrl)}
                    alt={bird.name}
                    className="w-16 h-16 rounded-xl object-cover border border-[#E4EBE5] shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#111827] truncate">{bird.name}</h3>
                    <p className="text-xs text-[#6B7280]">
                      {bird.category} • Sold: {bird.unitsSold}
                    </p>
                    <label className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-[#1B5E42] cursor-pointer hover:underline">
                      <Upload className="w-3 h-3" />
                      <span>Upload photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(bird.id, e.target.files?.[0])}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Price Editor */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[#6B7280]">₹</span>
                    <input
                      type="number"
                      min={1}
                      aria-label={`Price for ${bird.name}`}
                      defaultValue={bird.priceInr}
                      onBlur={(e) => {
                        const val = Number(e.target.value);
                        if (val > 0 && val !== bird.priceInr) {
                          updateBirdFields(bird, { priceInr: val });
                        }
                      }}
                      className="w-24 px-2.5 py-1.5 rounded-xl border border-[#E4EBE5] text-xs font-semibold text-[#111827]"
                    />
                  </div>

                  {/* Quick Stock Stepper */}
                  <div className="inline-flex items-center gap-1.5 bg-[#F6F8F6] border border-[#E4EBE5] rounded-xl p-1">
                    <button
                      type="button"
                      disabled={bird.stockQuantity <= 0}
                      onClick={() =>
                        updateBirdFields(bird, { stockQuantity: Math.max(0, bird.stockQuantity - 1) })
                      }
                      className="w-7 h-7 rounded-lg bg-white border border-[#E4EBE5] flex items-center justify-center disabled:opacity-40"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-[#111827]">
                      {bird.stockQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateBirdFields(bird, { stockQuantity: bird.stockQuantity + 1 })}
                      className="w-7 h-7 rounded-lg bg-[#1B5E42] text-white flex items-center justify-center"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Add Bird Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#E4EBE5] p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#111827]">Add New Bird</h2>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-[#6B7280]" />
              </button>
            </div>

            <form onSubmit={handleCreateBird} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1">Bird Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Blue Fischer Lovebird"
                  className="w-full px-3 py-2 rounded-xl border border-[#E4EBE5] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E4EBE5] text-sm bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1">Age Tag</label>
                  <input
                    type="text"
                    value={ageTag}
                    onChange={(e) => setAgeTag(e.target.value)}
                    placeholder="4 Months"
                    className="w-full px-3 py-2 rounded-xl border border-[#E4EBE5] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={priceInr}
                    onChange={(e) => setPriceInr(e.target.value)}
                    placeholder="1500"
                    className="w-full px-3 py-2 rounded-xl border border-[#E4EBE5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#4B5563] mb-1">Stock Qty</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E4EBE5] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1">
                  Image URL (optional)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E4EBE5] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4B5563] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E4EBE5] text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 rounded-xl bg-[#1B5E42] hover:bg-[#144832] text-white text-sm font-semibold disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Bird Listing'}
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNav mode="admin" />
    </div>
  );
}
