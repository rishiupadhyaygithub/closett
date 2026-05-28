import { useState, useEffect } from 'react';
import { Item, ColorRule, UserProfile } from '../types';
import { getColorHex, getColorName, isColorRecommended } from '../colorData';
import ItemCard from './ItemCard';

interface ClosetViewProps {
  items: Item[];
  colorRules: ColorRule[];
  getCategoryName: (id: string) => string;
  onEditItem: (item: Item) => void;
  onDeleteItem: (id: string) => void;
  userProfile: UserProfile | null;
}

function EmptySection({ label }: { label: string }) {
  return (
    <p className="closet-section__empty">
      No {label} found. Add items tagged as <strong>{label}</strong> with a colour to see them here.
    </p>
  );
}

export default function ClosetView({ items, colorRules, getCategoryName, onEditItem, onDeleteItem, userProfile }: ClosetViewProps) {
  const undertone = userProfile?.undertone ?? null;

  const topItems = items.filter(i => i.garmentType === 'top' && i.color);
  const uniqueTopColors = Array.from(new Set(topItems.map(i => i.color)));

  const [selectedColor, setSelectedColor] = useState<string>(uniqueTopColors[0] || '');

  useEffect(() => {
    if (selectedColor && !uniqueTopColors.includes(selectedColor)) {
      setSelectedColor(uniqueTopColors[0] || '');
    }
  }, [uniqueTopColors, selectedColor]);

  if (topItems.length === 0) {
    return (
      <div className="closet-empty">
        <h3 className="empty-title">No tops in your closet yet</h3>
        <p className="empty-subtitle">Add items tagged as <strong>Garment Type: Top</strong> with a colour to start building outfits.</p>
      </div>
    );
  }

  const rule = colorRules.find(r => r.topColor === selectedColor);
  const matchingColors = rule?.bottomColors || [];

  const filteredTops       = topItems.filter(i => i.color === selectedColor);
  const filteredLayers     = items.filter(i => i.garmentType === 'layer' && i.color && matchingColors.includes(i.color));
  const filteredBottoms    = items.filter(i => i.garmentType === 'bottom' && i.color && matchingColors.includes(i.color));
  const filteredAccessories = items.filter(i => i.garmentType === 'accessory');

  const scrollRow = (sectionItems: Item[]) => (
    <div className="closet-scroll-row">
      {sectionItems.map(item => (
        <div key={item.id} className="closet-item-wrapper">
          <ItemCard
            item={item}
            categoryName={getCategoryName(item.categoryId)}
            onEdit={() => onEditItem(item)}
            onDelete={() => onDeleteItem(item.id)}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="closet-view">

      {/* ── Color Picker ── */}
      <div className="closet-filters">
        <div className="closet-filters-header">
          <h3 className="closet-title">Pick a Top Colour</h3>
          {undertone && (
            <span className="tone-badge">◈ {undertone.charAt(0).toUpperCase() + undertone.slice(1)} undertone</span>
          )}
        </div>
        {undertone && (
          <p className="closet-tone-hint">✓ green = recommended for your undertone · ✕ red = avoid</p>
        )}
        <div className="color-chips">
          {uniqueTopColors.map(colorId => {
            const rec = isColorRecommended(colorId, undertone);
            return (
              <div
                key={colorId}
                className="color-chip-wrap"
                title={`${getColorName(colorId)}${rec === true ? ' ✓ Recommended for your undertone' : rec === false ? ' ✕ May clash with your undertone' : ''}`}
              >
                <button
                  onClick={() => setSelectedColor(colorId)}
                  className={`color-chip ${selectedColor === colorId ? 'color-chip--active' : ''} ${rec === false ? 'color-chip--avoid' : ''}`}
                  style={{ backgroundColor: getColorHex(colorId) }}
                />
                {rec === true  && <span className="chip-indicator chip-indicator--good">✓</span>}
                {rec === false && <span className="chip-indicator chip-indicator--avoid">✕</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Outfit Flow ── */}
      <div className="closet-outfit-flow">

        {/* 1 — Tops */}
        <div className="closet-section">
          <div className="closet-section-header">
            <h3 className="closet-section__title">
              Tops in {getColorName(selectedColor)}
              <span className="count-badge">{filteredTops.length}</span>
            </h3>
            <span className="closet-step-badge">Step 1</span>
          </div>
          {filteredTops.length === 0 ? <EmptySection label="tops in this colour" /> : scrollRow(filteredTops)}
        </div>

        <div className="closet-flow-arrow">↓ Layer over it</div>

        {/* 2 — Layers */}
        <div className="closet-section">
          <div className="closet-section-header">
            <h3 className="closet-section__title closet-section__title--layer">
              Matching Layers
              <span className="count-badge">{filteredLayers.length}</span>
            </h3>
            <span className="closet-step-badge">Step 2</span>
          </div>
          <p className="closet-section__subtitle">
            Jackets, overshirts, blazers that pair with {getColorName(selectedColor)}.
            Colors: {matchingColors.map(getColorName).join(', ') || 'none set'}
          </p>
          {filteredLayers.length === 0 ? <EmptySection label="layers" /> : scrollRow(filteredLayers)}
        </div>

        <div className="closet-flow-arrow">↓ Bottom half</div>

        {/* 3 — Bottoms */}
        <div className="closet-section">
          <div className="closet-section-header">
            <h3 className="closet-section__title closet-section__title--bottom">
              Matching Bottoms
              <span className="count-badge">{filteredBottoms.length}</span>
            </h3>
            <span className="closet-step-badge">Step 3</span>
          </div>
          <p className="closet-section__subtitle">
            Colours that go with {getColorName(selectedColor)}: {matchingColors.map(getColorName).join(', ') || 'none set'}
            {undertone && matchingColors.length > 0 && (
              <> · <span style={{ color: '#4caf7d' }}>✓</span> = also recommended for your tone</>
            )}
          </p>
          {filteredBottoms.length === 0 ? <EmptySection label="bottoms" /> : scrollRow(filteredBottoms)}
        </div>

        <div className="closet-flow-arrow">↓ Finish the look</div>

        {/* 4 — Accessories */}
        <div className="closet-section">
          <div className="closet-section-header">
            <h3 className="closet-section__title closet-section__title--accent">
              Accessories
              <span className="count-badge">{filteredAccessories.length}</span>
            </h3>
            <span className="closet-step-badge">Step 4</span>
          </div>
          <p className="closet-section__subtitle">
            All your accessories — shoes, bags, watches, belts.
          </p>
          {filteredAccessories.length === 0 ? <EmptySection label="accessories" /> : scrollRow(filteredAccessories)}
        </div>

      </div>
    </div>
  );
}
