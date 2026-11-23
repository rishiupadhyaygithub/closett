import { createPortal } from 'react-dom';
import { Item } from '../types';
import { getColorHex, getColorName } from '../colorData';
import { safeHttpUrl } from '../lib/url';
import { formatPrice } from '../lib/money';
import { useModal } from '../lib/useModal';
import type { Assessment } from '../lib/suitability';

interface ItemInfoModalProps {
  item: Item;
  categoryName: string;
  assessment: Assessment;
  hasProfile: boolean;
  onEdit: () => void;
  onClose: () => void;
}

/** Everything about one piece, photo first. */
export default function ItemInfoModal({ item, categoryName, assessment, hasProfile, onEdit, onClose }: ItemInfoModalProps) {
  const ref = useModal(true, onClose);
  const link = safeHttpUrl(item.link);
  let shop = '';
  try { shop = link ? new URL(link).hostname.replace(/^www\d?\./, '') : ''; } catch { /* no shop name */ }

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div ref={ref} className="modal-box info-box" role="dialog" aria-modal="true" aria-labelledby="info-title" onClick={e => e.stopPropagation()}>
        <div className="info-photo">
          <img src={item.image} alt={item.title} referrerPolicy="no-referrer" />
          <button className="modal-close info-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body info-body">
          <h2 id="info-title" className="info-title">{item.title}</h2>
          <p className="info-price">{formatPrice(item.price, item.currency)}</p>

          <dl className="info-facts">
            <dt>Collection</dt><dd>{categoryName}</dd>
            {item.garmentType && item.garmentType !== 'other' && (<><dt>Type</dt><dd className="info-cap">{item.garmentType}</dd></>)}
            {item.color && (
              <><dt>Colour</dt><dd><span className="item-card__color" style={{ backgroundColor: getColorHex(item.color) }} /> {getColorName(item.color)}</dd></>
            )}
            {link && (<><dt>Shop</dt><dd><a href={link} target="_blank" rel="noopener noreferrer">{shop || 'Open'} →</a></dd></>)}
          </dl>

          {item.notes && <p className="info-notes">{item.notes}</p>}

          {hasProfile ? (
            <div className={`info-verdict ${assessment.avoid ? 'info-verdict--avoid' : 'info-verdict--ok'}`}>
              <p className="info-verdict__head">{assessment.avoid ? '✕ Not a good fit for you' : '✓ Works for you'}</p>
              <ul>
                {assessment.issues.map((i, n) => <li key={'i' + n}>✕ {i.text}</li>)}
                {assessment.goods.map((g, n) => <li key={'g' + n}>✓ {g}</li>)}
                {!assessment.issues.length && !assessment.goods.length && <li>Nothing in your profile speaks against it.</li>}
              </ul>
            </div>
          ) : (
            <p className="info-notes">Fill in your profile to see whether this piece suits you.</p>
          )}
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-ghost">Close</button>
          <button onClick={() => { onClose(); onEdit(); }} className="btn-primary">Edit</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
