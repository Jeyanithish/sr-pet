import { Minus, Plus, ShoppingBasket } from 'lucide-react';
import type { Bird } from '../types';
import { useCart } from '../context/CartContext';
import { FALLBACK_BIRD_IMG, sanitizeImageUrl } from '../utils/validation';

export function BirdCard({ bird }: { bird: Bird }) {
  const { getQuantity, setQuantity } = useCart();
  const qty = getQuantity(bird.id);
  const outOfStock = bird.stockQuantity <= 0;

  return (
    <article className="bg-white rounded-2xl border border-[#E4EBE5] overflow-hidden flex flex-col shadow-sm">
      <div className="relative aspect-[4/3] bg-[#F6F8F6] overflow-hidden">
        <img
          src={sanitizeImageUrl(bird.imageUrl)}
          alt={bird.name}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = FALLBACK_BIRD_IMG;
          }}
        />
        <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/95 text-[#1B5E42] border border-[#E4EBE5]">
          {bird.category}
        </span>
        <span
          className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
            outOfStock
              ? 'bg-red-100 text-red-700'
              : bird.stockQuantity <= 3
              ? 'bg-amber-100 text-[#D97706]'
              : 'bg-emerald-50 text-[#1B5E42]'
          }`}
        >
          {outOfStock ? 'Sold Out' : `${bird.stockQuantity} left`}
        </span>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <h3 className="font-semibold text-[#111827] text-base leading-snug">
            {bird.name}
          </h3>
          {bird.ageTag && (
            <p className="text-xs text-[#D97706] font-medium mt-0.5">{bird.ageTag}</p>
          )}
          {bird.description && (
            <p className="text-xs text-[#4B5563] mt-1.5 line-clamp-2">{bird.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#E4EBE5]">
          <div>
            <span className="text-lg font-bold text-[#111827]">
              ₹{bird.priceInr.toLocaleString('en-IN')}
            </span>
          </div>

          {qty === 0 ? (
            <button
              type="button"
              disabled={outOfStock}
              onClick={() => setQuantity(bird, 1)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#1B5E42] hover:bg-[#144832] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ShoppingBasket className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 bg-[#F6F8F6] border border-[#E4EBE5] rounded-xl p-1">
              <button
                type="button"
                aria-label={`Decrease ${bird.name} quantity`}
                onClick={() => setQuantity(bird, qty - 1)}
                className="w-7 h-7 rounded-lg bg-white border border-[#E4EBE5] flex items-center justify-center text-[#111827] hover:bg-gray-50"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center text-sm font-semibold text-[#111827]">
                {qty}
              </span>
              <button
                type="button"
                aria-label={`Increase ${bird.name} quantity`}
                disabled={qty >= bird.stockQuantity}
                onClick={() => setQuantity(bird, qty + 1)}
                className="w-7 h-7 rounded-lg bg-[#1B5E42] text-white flex items-center justify-center hover:bg-[#144832] disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
