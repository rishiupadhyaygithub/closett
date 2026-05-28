import { Item } from '../types';
import { getColorHex, getColorName } from '../colorData';

interface ItemCardProps {
  item: Item;
  categoryName: string;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ItemCard({ item, categoryName, onEdit, onDelete }: ItemCardProps) {
  const formatPrice = (price: number) => {
    if (!price) return 'No price';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  return (
    <div className="item-card">
      <div className="item-card__image-wrap">
        <img
          src={item.image}
          alt={item.title}
          onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect width="200" height="200" fill="%23f0ece6"/%3E%3Ctext x="100" y="108" text-anchor="middle" font-size="40" fill="%23b8a898"%3E✦%3C/text%3E%3C/svg%3E'; }}
        />
        <div className="item-card__overlay" />

        {/* Category badge */}
        <span className="item-card__category">{categoryName}</span>

        {/* Action buttons */}
        <div className="item-card__actions">
          <button onClick={onEdit} className="action-btn action-btn--edit" title="Edit">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button onClick={onDelete} className="action-btn action-btn--delete" title="Delete">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Open link */}
        {item.link && (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="item-card__open-link"
            onClick={e => e.stopPropagation()}
          >
            View site →
          </a>
        )}
      </div>

      <div className="item-card__body">
        <h3 className="item-card__title" title={item.title}>{item.title}</h3>
        <p className="item-card__price">{formatPrice(item.price)}</p>
        {(item.color || (item.garmentType && item.garmentType !== 'other')) && (
          <div className="item-card__meta">
            {item.color && (
              <span className="item-card__color" style={{ backgroundColor: getColorHex(item.color) }} title={getColorName(item.color)} />
            )}
            {item.garmentType && item.garmentType !== 'other' && (
              <span className="item-card__type">{item.garmentType}</span>
            )}
          </div>
        )}
        {item.notes && (
          <p className="item-card__notes">{item.notes}</p>
        )}
      </div>
    </div>
  );
}
