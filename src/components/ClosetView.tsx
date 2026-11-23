import { useMemo, useState } from 'react';
import { Item, ColorRule, UserProfile } from '../types';
import { getColorName } from '../colorData';
import { SHELVES, ShelfId, groupShelves, rankForTop, Ranked } from '../lib/wardrobe';
import { useFlip } from '../lib/useFlip';
import ItemCard from './ItemCard';

interface ClosetViewProps {
  items: Item[];
  colorRules: ColorRule[];
  getCategoryName: (id: string) => string;
  onEditItem: (item: Item) => void;
  onDeleteItem: (id: string) => void;
  userProfile: UserProfile | null;
}

interface ShelfProps {
  id: ShelfId;
  label: string;
  hint: string;
  rows: Ranked[];
  selectedId: string | null;
  onPick?: (item: Item) => void;
  card: (r: Ranked, highlight: boolean) => JSX.Element;
}

function Shelf({ id, label, hint, rows, selectedId, onPick, card }: ShelfProps) {
  const ref = useFlip<HTMLDivElement>(rows.map(r => r.item.id).join(','));
  const matches = rows.filter(r => r.match).length;
  return (
    <section className={`shelf shelf--${id}`} aria-label={label}>
      <header className="shelf__head">
        <h3 className="shelf__label">{label} <span className="count-badge">{rows.length}</span></h3>
        <span className="shelf__hint">{id !== 'tops' && selectedId && matches ? `${matches} go with it` : hint}</span>
      </header>
      {rows.length === 0 ? (
        <p className="shelf__empty">Nothing here yet.</p>
      ) : (
        <div className="shelf__rail" ref={ref}>
          {rows.map(r => (
            <div
              key={r.item.id}
              data-flip-id={r.item.id}
              className={`shelf__slot${onPick && selectedId === r.item.id ? ' shelf__slot--picked' : ''}`}
              onMouseEnter={onPick ? () => onPick(r.item) : undefined}
              onClick={onPick ? () => onPick(r.item) : undefined}
              // Keyboard: Tab onto a top, then Enter or Space to match with it. Passing by does not re-sort.
              onKeyDown={onPick ? e => {
                if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onPick(r.item); }
              } : undefined}
              role={onPick ? 'button' : undefined}
              aria-pressed={onPick ? selectedId === r.item.id : undefined}
              tabIndex={onPick ? 0 : undefined}
              aria-label={onPick ? `Match outfits with ${r.item.title}` : undefined}
            >
              {card(r, id === 'tops' ? selectedId === r.item.id : r.match)}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/** A wardrobe: one shelf per kind of piece. Choosing a top slides the best matches forward. */
export default function ClosetView({ items, colorRules, getCategoryName, onEditItem, onDeleteItem, userProfile }: ClosetViewProps) {
  const shelves = useMemo(() => groupShelves(items, getCategoryName), [items, getCategoryName]);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const top = shelves.tops.find(t => t.id === pickedId) ?? null;

  if (items.length === 0) {
    return (
      <div className="closet-empty">
        <h3 className="empty-title">Your wardrobe is empty</h3>
        <p className="empty-subtitle">Add pieces and they land on their shelf here.</p>
      </div>
    );
  }

  const card = (r: Ranked, highlight: boolean) => (
    <ItemCard
      item={r.item}
      categoryName={getCategoryName(r.item.categoryId)}
      onEdit={() => onEditItem(r.item)}
      onDelete={() => onDeleteItem(r.item.id)}
      userProfile={userProfile}
      highlight={highlight}
    />
  );

  return (
    <div className="wardrobe">
      <p className="wardrobe__status" aria-live="polite">
        {top
          ? <>Matching with <strong>{top.title}</strong>{top.color ? ` (${getColorName(top.color)})` : ' (no colour set, so nothing re-sorts)'}</>
          : 'Hover or tap a top. The shelves below re-sort to the best matches.'}
        {top && <button className="wardrobe__clear" onClick={() => setPickedId(null)}>Clear</button>}
      </p>
      <div className="wardrobe__cabinet">
        {SHELVES.map(s => (
          <Shelf
            key={s.id}
            {...s}
            rows={s.id === 'tops' ? rankForTop(null, shelves.tops, colorRules, userProfile) : rankForTop(top, shelves[s.id], colorRules, userProfile)}
            selectedId={top?.id ?? null}
            onPick={s.id === 'tops' ? (it: Item) => setPickedId(it.id) : undefined}
            card={card}
          />
        ))}
      </div>
    </div>
  );
}
