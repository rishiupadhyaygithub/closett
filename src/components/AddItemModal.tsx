import { useState, useRef, useEffect } from 'react';
import { Item, Category, ColorRule, UserProfile } from '../types';
import { COLOR_PALETTE, getColorName, isColorRecommended } from '../colorData';
import { getBodyTypeAdvice } from '../bodyTypeData';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Item) => void;
  categories: Category[];
  editingItem: Item | null;
  colorRules: ColorRule[];
  userProfile: UserProfile | null;
}

interface ScrapedData {
  title?: string;
  image?: string;
  price?: string;
  currency?: string;
  description?: string;
}

// Smart currency detector from URL hostname
function detectCurrencyFromUrl(_url: string): string {
  return 'INR';
}

// Smart category guesser based on page content
function guessCategory(title: string, description: string, url: string): string {
  const text = (title + ' ' + description + ' ' + url).toLowerCase();
  if (/jean|denim|trouser|pant|legging|shorts|chino/.test(text)) return 'pants';
  if (/shirt|tee|top|blouse|polo|sweatshirt|hoodie|sweater|pullover/.test(text)) return 'tops';
  if (/dress|skirt|gown|frock/.test(text)) return 'dresses';
  if (/shoe|sneaker|boot|heel|sandal|loafer|slipper|footwear/.test(text)) return 'shoes';
  if (/jacket|coat|blazer|cardigan|vest|waistcoat|parka|windbreaker/.test(text)) return 'outerwear';
  if (/bag|purse|handbag|backpack|tote|clutch/.test(text)) return 'bags';
  if (/watch|necklace|bracelet|ring|earring|accessory|accessories|sunglasses|cap|hat|belt|scarf/.test(text)) return 'accessories';
  if (/underwear|bra|boxer|brief|lingerie|innerwear/.test(text)) return 'innerwear';
  return '';
}

async function tryProxy(url: string): Promise<string> {
  // Proxy 1: allorigins (returns JSON wrapper)
  try {
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.contents && json.contents.length > 200) return json.contents;
    }
  } catch { /* try next */ }

  // Proxy 2: corsproxy.io (returns HTML directly)
  try {
    const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const html = await res.text();
      if (html.length > 200) return html;
    }
  } catch { /* try next */ }

  // Proxy 3: codetabs
  try {
    const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const html = await res.text();
      if (html.length > 200) return html;
    }
  } catch { /* all failed */ }

  throw new Error('All proxies failed');
}

async function fetchProductMetadata(url: string): Promise<ScrapedData> {
  const html = await tryProxy(url);
  
  // Parse with DOMParser
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const getMeta = (selectors: string[]): string => {
    for (const sel of selectors) {
      const el = doc.querySelector(sel);
      const val = el?.getAttribute('content') || el?.getAttribute('value') || el?.textContent || '';
      if (val.trim()) return val.trim();
    }
    return '';
  };
  
  // Title
  const title = getMeta([
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
    'meta[name="title"]',
    'meta[property="product:title"]',
  ]) || doc.querySelector('h1')?.textContent?.trim() || doc.title?.trim() || '';
  
  // Image
  const image = getMeta([
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    'meta[name="twitter:image:src"]',
    'meta[property="og:image:secure_url"]',
    'meta[itemprop="image"]',
  ]);
  
  // Description
  const description = getMeta([
    'meta[property="og:description"]',
    'meta[name="description"]',
    'meta[name="twitter:description"]',
  ]);
  
  // Price — try various OG/meta/schema patterns
  let price = getMeta([
    'meta[property="product:price:amount"]',
    'meta[property="og:price:amount"]',
    'meta[name="price"]',
    'meta[itemprop="price"]',
  ]);
  
  // Try JSON-LD for price
  if (!price) {
    const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
    for (const s of scripts) {
      try {
        const ld = JSON.parse(s.textContent || '');
        const candidates = Array.isArray(ld) ? ld : [ld];
        for (const c of candidates) {
          const p = c?.offers?.price || c?.price || c?.offers?.[0]?.price;
          if (p) { price = String(p); break; }
        }
        if (price) break;
      } catch { /* ignore */ }
    }
  }
  
  // Currency from meta
  let currency = getMeta([
    'meta[property="product:price:currency"]',
    'meta[property="og:price:currency"]',
    'meta[name="currency"]',
    'meta[itemprop="priceCurrency"]',
  ]) || detectCurrencyFromUrl(url);
  
  // Normalize currency to 3-letter code
  const currencyMap: Record<string, string> = {
    '$': 'USD', '₹': 'INR', '€': 'EUR', '£': 'GBP', '¥': 'JPY', 'د.إ': 'AED',
    'usd': 'USD', 'inr': 'INR', 'eur': 'EUR', 'gbp': 'GBP', 'jpy': 'JPY', 'aed': 'AED',
  };
  currency = currencyMap[currency.toLowerCase()] || currency.toUpperCase() || 'USD';
  
  // Clean price — remove currency symbols, commas, etc.
  if (price) {
    price = price.replace(/[₹$€£¥,\s]/g, '').replace(/\.(\d{3})/g, '$1').match(/[\d.]+/)?.[0] || '';
  }

  return { title, image, price, currency, description };
}

export default function AddItemModal({
  isOpen,
  onClose,
  onSave,
  categories,
  editingItem,
  colorRules,
  userProfile,
}: AddItemModalProps) {
  const [image, setImage] = useState<string>('');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [_currency, setCurrency] = useState('INR');
  const [garmentType, setGarmentType] = useState<'top' | 'bottom' | 'layer' | 'accessory' | 'other'>('other');
  const [color, setColor] = useState('');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL fetch state
  const [urlInput, setUrlInput] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [fetchSuccess, setFetchSuccess] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setImage(editingItem.image);
      setTitle(editingItem.title);
      setPrice(editingItem.price ? editingItem.price.toString() : '');
      setCurrency('INR');
      setLink(editingItem.link);
      setNotes(editingItem.notes);
      setCategoryId(editingItem.categoryId);
      setColor(editingItem.color || '');
      setGarmentType(editingItem.garmentType || 'other');
      setUrlInput(editingItem.link || '');
    } else {
      resetForm();
    }
  }, [editingItem, categories, isOpen]);

  // Handle Ctrl+V / Cmd+V paste of images
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            handleImageFile(file);
            e.preventDefault();
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleImageFile(file);
  };

  const handleSave = () => {
    if (!image || !title.trim()) return;
    const item: Item = {
      id: editingItem?.id || crypto.randomUUID(),
      image,
      title: title.trim(),
      price: parseFloat(price) || 0,
      currency: 'INR',
      link: link.trim(),
      notes: notes.trim(),
      categoryId: categoryId || 'uncategorized',
      createdAt: editingItem?.createdAt || Date.now(),
      color,
      garmentType,
    };
    onSave(item);
    resetForm();
  };

  const resetForm = () => {
    setImage('');
    setTitle('');
    setPrice('');
    setCurrency('INR');
    setLink('');
    setNotes('');
    setColor('');
    setGarmentType('other');
    setCategoryId(categories.find(c => c.id === 'uncategorized')?.id || categories[0]?.id || '');
    setUrlInput('');
    setFetchError('');
    setFetchSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // ── URL Auto-fill ──
  const handleFetchFromUrl = async () => {
    const rawUrl = urlInput.trim();
    if (!rawUrl) return;

    // Ensure it has a protocol
    const url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

    setIsFetching(true);
    setFetchError('');
    setFetchSuccess(false);

    try {
      const data = await fetchProductMetadata(url);

      // Fill fields only if we got something
      if (data.title) setTitle(data.title);
      if (data.price) setPrice(data.price);
      setCurrency('INR');
      
      // Always set link
      setLink(url);

      // Set image if we got one (could be relative URL)
      if (data.image) {
        try {
          const imgUrl = new URL(data.image, url).href;
          // Set image as URL string directly (not base64)
          setImage(imgUrl);
        } catch {
          if (data.image.startsWith('http')) setImage(data.image);
        }
      }

      // Smart category guess
      if (!editingItem && data.title) {
        const guessed = guessCategory(data.title, data.description || '', url);
        if (guessed) {
          // Find existing category by name (case-insensitive)
          const match = categories.find(c =>
            c.name.toLowerCase().includes(guessed) || guessed.includes(c.name.toLowerCase())
          );
          if (match) setCategoryId(match.id);
        }
      }

      setFetchSuccess(true);
      setTimeout(() => setFetchSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setFetchError('Could not fetch product details. You can fill in manually, or try copying the link again.');
    } finally {
      setIsFetching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">{editingItem ? 'Edit Piece' : 'Add New Piece'}</h2>
          <button onClick={handleClose} className="modal-close">✕</button>
        </div>

        {/* Body */}
        <div className="modal-body">

          {/* ── URL Auto-fill Section ── */}
          <div className="url-fetch-section">
            <label className="field-label">
              🔗 Paste product link to auto-fill
            </label>
            <div className="url-fetch-row">
              <input
                type="url"
                value={urlInput}
                onChange={e => { setUrlInput(e.target.value); setFetchError(''); setFetchSuccess(false); }}
                onKeyDown={e => e.key === 'Enter' && handleFetchFromUrl()}
                placeholder="https://www.zara.com/... or myntra.com/..."
                className="field-input url-fetch-input"
              />
              <button
                onClick={handleFetchFromUrl}
                disabled={!urlInput.trim() || isFetching}
                className={`btn-fetch ${isFetching ? 'btn-fetch--loading' : ''}`}
              >
                {isFetching ? (
                  <span className="fetch-spinner">↻</span>
                ) : '✦ Fetch'}
              </button>
            </div>
            {isFetching && (
              <p className="fetch-status fetch-status--loading">
                Fetching product details…
              </p>
            )}
            {fetchSuccess && (
              <p className="fetch-status fetch-status--success">
                ✓ Details filled in! Review and save.
              </p>
            )}
            {fetchError && (
              <p className="fetch-status fetch-status--error">{fetchError}</p>
            )}
          </div>

          <div className="divider-or">
            <span>or add manually</span>
          </div>

          {/* Image drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`drop-zone ${isDragging ? 'drop-zone--dragging' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {image ? (
              <div className="drop-zone__preview">
                <img src={image} alt="Preview" />
                <button
                  onClick={e => { e.stopPropagation(); setImage(''); }}
                  className="drop-zone__remove"
                  title="Remove image"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <div className="drop-zone__icon">📷</div>
                <p className="drop-zone__title">Click to upload, drag & drop, or paste (Ctrl+V)</p>
                <p className="drop-zone__sub">Supports JPG, PNG, WebP, screenshots</p>
              </>
            )}
          </div>

          {/* Title */}
          <div className="field-group">
            <label className="field-label">Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Slim Fit Black Jeans"
              className="field-input"
              autoFocus
            />
          </div>

          {/* Price + Garment Type */}
          <div className="field-grid">
            <div className="field-group">
              <label className="field-label">Price (₹ INR)</label>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="field-input"
              />
            </div>
            <div className="field-group">
              <label className="field-label">Garment Type</label>
              <select
                value={garmentType}
                onChange={e => setGarmentType(e.target.value as any)}
                className="field-input field-select"
              >
                <option value="top">Top</option>
                <option value="bottom">Bottom</option>
                <option value="layer">Layer</option>
                <option value="accessory">Accessory</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Body Type Fit Tip */}
          {userProfile?.bodyType && garmentType !== 'other' && (() => {
            const advice = getBodyTypeAdvice(userProfile.bodyType, userProfile.gender);
            if (!advice) return null;
            const garmentLabel = garmentType === 'top' ? 'tops' : garmentType === 'bottom' ? 'bottoms' : garmentType === 'layer' ? 'layers' : 'accessories';
            const rec = advice.recommendedFits.slice(0, 3);
            const avoid = advice.avoidFits.slice(0, 2);
            return (
              <div className="fit-tip-card">
                <div className="fit-tip-header">
                  <span className="fit-tip-icon">✦</span>
                  <span className="fit-tip-title">Fit tips for your <strong>{advice.label}</strong> build — {garmentLabel}</span>
                </div>
                <div className="fit-tip-body">
                  <div className="fit-tip-section">
                    <span className="fit-tip-label fit-tip-label--good">✓ Wear</span>
                    <ul className="fit-tip-list">
                      {rec.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                  <div className="fit-tip-section">
                    <span className="fit-tip-label fit-tip-label--avoid">✕ Avoid</span>
                    <ul className="fit-tip-list">
                      {avoid.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Color Selection */}
          <div className="field-group">
            <div className="color-label-row">
              <label className="field-label" style={{ margin: 0 }}>Dominant Color</label>
              {userProfile?.undertone && (
                <span className="tone-badge">
                  ◈ {userProfile.undertone.charAt(0).toUpperCase() + userProfile.undertone.slice(1)} undertone
                </span>
              )}
            </div>
            {userProfile?.undertone && (
              <div className="tone-legend">
                <span className="tone-legend__item tone-legend__item--good">✓ Recommended</span>
                <span className="tone-legend__item tone-legend__item--avoid">✕ Avoid</span>
                <span className="tone-legend__item tone-legend__item--neutral">· Neutral</span>
              </div>
            )}
            <div className="color-picker-grouped" style={{ marginTop: 10 }}>
              {/* None option */}
              <div className="color-group-row">
                <span className="color-group-label">None</span>
                <div className="color-chips">
                  <button
                    type="button"
                    onClick={() => setColor('')}
                    className={`color-chip color-chip--none ${!color ? 'color-chip--active' : ''}`}
                    title="No colour"
                  >🚫</button>
                </div>
              </div>
              {/* Grouped by colour family */}
              {[
                { id: 'neutral', label: 'Neutrals' },
                { id: 'blue',    label: 'Blues' },
                { id: 'green',   label: 'Greens' },
                { id: 'red',     label: 'Reds & Pinks' },
                { id: 'purple',  label: 'Purples' },
                { id: 'warm',    label: 'Warm' },
                { id: 'brown',   label: 'Browns' },
              ].map(group => {
                const groupColors = COLOR_PALETTE.filter(c => c.group === group.id);
                return (
                  <div key={group.id} className="color-group-row">
                    <span className="color-group-label">{group.label}</span>
                    <div className="color-chips">
                      {groupColors.map(c => {
                        const rec = isColorRecommended(c.id, userProfile?.undertone ?? null);
                        return (
                          <div key={c.id} className="color-chip-wrap" title={`${c.name}${rec === true ? ' ✓ Recommended for your undertone' : rec === false ? ' ✕ May clash with undertone' : ''}`}>
                            <button
                              type="button"
                              onClick={() => setColor(c.id)}
                              className={`color-chip ${color === c.id ? 'color-chip--active' : ''} ${rec === false ? 'color-chip--avoid' : ''}`}
                              style={{ backgroundColor: c.hex }}
                            />
                            {rec === true  && <span className="chip-indicator chip-indicator--good">✓</span>}
                            {rec === false && <span className="chip-indicator chip-indicator--avoid">✕</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            {color && garmentType === 'top' && (
              <p className="color-hint">
                <span className="color-hint-icon">💡</span> Pairs well with bottoms: {
                  colorRules.find(r => r.topColor === color)?.bottomColors.map(getColorName).join(', ') || 'Any'
                }
              </p>
            )}
            {color && garmentType === 'bottom' && (
               <p className="color-hint">
                 <span className="color-hint-icon">💡</span> Pairs well with tops: {
                   colorRules.filter(r => r.bottomColors.includes(color)).map(r => getColorName(r.topColor)).join(', ') || 'Any'
                 }
               </p>
            )}
          </div>

          {/* Link */}
          <div className="field-group">
            <label className="field-label">Link to product page</label>
            <input
              type="url"
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="https://..."
              className="field-input"
            />
          </div>

          {/* Category */}
          <div className="field-group">
            <label className="field-label">Collection</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="field-input field-select"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="field-group">
            <label className="field-label">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Size M, fits true to size, sale ends soon…"
              rows={3}
              className="text-area"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={handleClose} className="btn-ghost">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!image || !title.trim()}
            className="btn-primary"
          >
            {editingItem ? 'Save Changes' : 'Add to Wardrobe'}
          </button>
        </div>
      </div>
    </div>
  );
}
