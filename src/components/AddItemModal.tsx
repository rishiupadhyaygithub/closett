import { useState, useRef, useEffect } from 'react';
import { Item, Category, ColorRule, UserProfile } from '../types';
import { COLOR_PALETTE, getColorName, isColorRecommended } from '../colorData';
import { getBodyTypeAdvice } from '../bodyTypeData';
import { suggestColorFromImage } from '../lib/imagePixels';
import { guessCategory, guessGarmentType } from '../lib/guess';
import { bookmarkletHref, type Prefill } from '../lib/bookmarklet';
import { safeHttpUrl } from '../lib/url';
import { downscaleDataUrl } from '../lib/downscale';
import { parsePriceInput } from '../lib/price';
import { flattenCategories } from '../lib/items';
import { useModal } from '../lib/useModal';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Resolve false when the save failed, so the form keeps what the user typed. */
  onSave: (item: Item) => Promise<boolean | void> | boolean | void;
  categories: Category[];
  editingItem: Item | null;
  colorRules: ColorRule[];
  userProfile: UserProfile | null;
  /** Product data handed over by the bookmarklet; fills the form when the modal opens. */
  prefill?: Prefill | null;
  onPrefillUsed?: () => void;
}

export default function AddItemModal({
  isOpen,
  onClose,
  onSave,
  categories,
  editingItem,
  colorRules,
  userProfile,
  prefill,
  onPrefillUsed,
}: AddItemModalProps) {
  const [image, setImage] = useState<string>('');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [garmentType, setGarmentType] = useState<'top' | 'bottom' | 'layer' | 'accessory' | 'other'>('other');
  const [color, setColor] = useState('');
  const [colorSuggested, setColorSuggested] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageError, setImageError] = useState('');
  const [discardHint, setDiscardHint] = useState(false);
  const savingRef = useRef(false); // state is stale between two clicks in the same tick
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [copied, setCopied] = useState(false);
  const [dragHint, setDragHint] = useState(false);
  const bookmarkletRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (editingItem) {
      setImage(editingItem.image);
      setTitle(editingItem.title);
      setPrice(editingItem.price ? editingItem.price.toString() : '');
      setCurrency(editingItem.currency || 'INR');
      setLink(editingItem.link);
      setNotes(editingItem.notes);
      setCategoryId(editingItem.categoryId);
      setColor(editingItem.color || '');
      setColorSuggested(false);
      setGarmentType(editingItem.garmentType || 'other');
    } else {
      resetForm();
      if (isOpen && prefill) applyPrefill(prefill);
    }
  }, [editingItem, categories, isOpen, prefill]);

  // React refuses javascript: hrefs, so the bookmarklet link is set on the element directly
  useEffect(() => {
    bookmarkletRef.current?.setAttribute('href', bookmarkletHref(window.location.origin));
  }, [isOpen]);

  // Suggest a colour from the photo, but never overwrite a colour the user picked
  useEffect(() => {
    if (!image || (color && !colorSuggested)) return;
    let cancelled = false;
    suggestColorFromImage(image).then(id => {
      if (cancelled || !id) return;
      setColor(id);
      setColorSuggested(true);
    });
    return () => { cancelled = true; };
  }, [image]);

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
    setImageError('');
    if (!file.type.startsWith('image/')) { setImageError('That file is not an image.'); return; }
    if (file.size > 25 * 1024 * 1024) { setImageError('That image is over 25 MB. Pick a smaller one.'); return; }
    const reader = new FileReader();
    reader.onload = async e => {
      const url = await downscaleDataUrl(e.target?.result as string);
      if (!url) { setImageError('Could not read that image. iPhone HEIC photos need converting to JPEG first, or take a screenshot of the photo.'); return; }
      setImage(url);
    };
    reader.onerror = () => setImageError('Could not read that file.');
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
    if (file) handleImageFile(file);
  };

  const handleSave = async () => {
    if (!image || !title.trim() || savingRef.current) return;
    const item: Item = {
      id: editingItem?.id || crypto.randomUUID(),
      image,
      title: title.trim(),
      price: parsePriceInput(price),
      currency: currency || 'INR',
      link: safeHttpUrl(link) ?? '',
      notes: notes.trim(),
      categoryId: categoryId || 'uncategorized',
      createdAt: editingItem?.createdAt || Date.now(),
      color,
      garmentType,
    };
    savingRef.current = true;
    setIsSaving(true);
    try {
      const ok = await onSave(item);
      if (ok !== false) { resetForm(); onPrefillUsed?.(); }
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setImage('');
    setTitle('');
    setPrice('');
    setCurrency('INR');
    setLink('');
    setNotes('');
    setColor('');
    setColorSuggested(false);
    setImageError('');
    setDiscardHint(false);
    setGarmentType('other');
    setCategoryId(categories.find(c => c.id === 'uncategorized')?.id || categories[0]?.id || '');
  };

  const handleClose = () => {
    resetForm();
    onPrefillUsed?.();
    onClose();
  };

  const applyPrefill = (data: Prefill) => {
    if (data.title) setTitle(data.title);
    if (data.price) setPrice(data.price);
    if (data.currency) setCurrency(data.currency);
    if (data.link) setLink(data.link);
    if (data.image) setImage(data.image);
    const guessedType = guessGarmentType(data.title, '', data.link);
    if (guessedType !== 'other') setGarmentType(guessedType);
    const guessed = guessCategory(data.title, '', data.link);
    if (guessed) {
      const match = categories.find(c => c.name.toLowerCase().includes(guessed) || guessed.includes(c.name.toLowerCase()));
      if (match) setCategoryId(match.id);
    }
  };

  const copyBookmarklet = async () => {
    try {
      await navigator.clipboard.writeText(bookmarkletHref(window.location.origin));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* clipboard blocked: the drag-to-bookmarks-bar route still works */ }
  };

  const isDirty = editingItem
    ? title !== editingItem.title || image !== editingItem.image || notes !== editingItem.notes || link !== editingItem.link ||
      color !== (editingItem.color || '') || garmentType !== (editingItem.garmentType || 'other') || categoryId !== editingItem.categoryId ||
      price !== (editingItem.price ? editingItem.price.toString() : '')
    : !!(image || title.trim() || price || notes.trim() || link.trim());

  // Esc and a click outside must not silently throw away typed data; Cancel / ✕ still do so on purpose
  const requestClose = () => { if (isDirty) setDiscardHint(true); else handleClose(); };
  const modalRef = useModal(isOpen, requestClose);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={requestClose}>
      <div ref={modalRef} className="modal-box" role="dialog" aria-modal="true" aria-labelledby="add-item-title" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 id="add-item-title" className="modal-title">{editingItem ? 'Edit Piece' : 'Add New Piece'}</h2>
          <button onClick={handleClose} className="modal-close" aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div className="modal-body">

          {/* ── Add from any shop (bookmarklet) ── */}
          <div className="url-fetch-section">
            <label className="field-label">🔗 Add from any shop</label>
            <p className="bookmarklet-help">
              1. Drag <a
                ref={bookmarkletRef}
                className="bookmarklet-link"
                draggable
                onClick={e => { e.preventDefault(); setDragHint(true); }}
              >✦ Add to Closett</a> up onto your bookmarks bar (the row under the address bar).<br />
              {dragHint && (
                <strong className="bookmarklet-warning">↑ Don't click it here: press, hold, and drag it up to the bookmarks bar. Press Cmd+Shift+B if the bar is hidden.<br /></strong>
              )}
              2. Open a product page (Zara, Myntra, anything) and click that bookmark.<br />
              The details land here, ready to review. On a phone, <button type="button" className="bookmarklet-copy" onClick={copyBookmarklet}>{copied ? 'Copied ✓' : 'copy the bookmark'}</button> and paste it as a bookmark's address.
            </p>
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
                  aria-label="Remove image"
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
          {imageError && <p className="fetch-status fetch-status--error" role="alert">{imageError}</p>}

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
              <label className="field-label">Price ({currency})</label>
              <input
                type="text"
                inputMode="decimal"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="0.00"
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
              {colorSuggested && color && (
                <span className="tone-badge" data-testid="color-suggested">✦ Suggested from photo. Change it if it's wrong.</span>
              )}
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
                    onClick={() => { setColor(''); setColorSuggested(false); }}
                    className={`color-chip color-chip--none ${!color ? 'color-chip--active' : ''}`}
                    title="No colour"
                    aria-label="No colour"
                    aria-pressed={!color}
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
                              aria-label={`${c.name}${rec === true ? ', recommended for your undertone' : rec === false ? ', may clash with your undertone' : ''}`}
                              aria-pressed={color === c.id}
                              onClick={() => { setColor(c.id); setColorSuggested(false); }}
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
              {flattenCategories(categories).map(cat => (
                <option key={cat.id} value={cat.id}>{'\u00A0\u00A0'.repeat(cat.depth) + (cat.depth ? '↳ ' : '') + cat.name}</option>
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
          {discardHint && <span className="discard-hint" role="status">Unsaved changes. Use Cancel to discard them.</span>}
          <button onClick={handleClose} className="btn-ghost">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!image || !title.trim() || isSaving}
            className="btn-primary"
          >
            {isSaving ? 'Saving…' : editingItem ? 'Save Changes' : 'Add to Wardrobe'}
          </button>
        </div>
      </div>
    </div>
  );
}
