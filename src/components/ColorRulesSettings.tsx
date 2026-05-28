import { useState, useEffect } from 'react';
import { ColorRule } from '../types';
import { COLOR_PALETTE, getColorName, getColorHex } from '../colorData';

interface ColorRulesSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  rules: ColorRule[];
  onSave: (rules: ColorRule[]) => void;
}

const COLOR_GROUPS = [
  { id: 'neutral', label: 'Neutrals' },
  { id: 'blue',    label: 'Blues' },
  { id: 'green',   label: 'Greens' },
  { id: 'red',     label: 'Reds & Pinks' },
  { id: 'purple',  label: 'Purples' },
  { id: 'warm',    label: 'Warm' },
  { id: 'brown',   label: 'Browns' },
];

export default function ColorRulesSettings({ isOpen, onClose, rules, onSave }: ColorRulesSettingsProps) {
  const [localRules, setLocalRules] = useState<ColorRule[]>([]);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  useEffect(() => {
    setLocalRules(JSON.parse(JSON.stringify(rules)));
    setExpandedRule(null);
  }, [rules, isOpen]);

  const toggleBottomColor = (ruleId: string, bottomColor: string) => {
    setLocalRules(prev => prev.map(rule => {
      if (rule.id !== ruleId) return rule;
      const idx = rule.bottomColors.indexOf(bottomColor);
      const next = [...rule.bottomColors];
      if (idx >= 0) next.splice(idx, 1); else next.push(bottomColor);
      return { ...rule, bottomColors: next };
    }));
  };

  const handleSave = () => { onSave(localRules); onClose(); };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--large crs-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Color Combination Rules</h2>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>

        <p className="crs-description">
          Set which bottom colors pair with each top color. Powers outfit suggestions in Closet view.
          Click a top color to expand and toggle its matching bottoms.
        </p>

        <div className="modal-body crs-body">
          {COLOR_GROUPS.map(group => {
            const groupRules = localRules.filter(r =>
              COLOR_PALETTE.find(c => c.id === r.topColor && c.group === group.id)
            );
            if (!groupRules.length) return null;
            return (
              <div key={group.id} className="crs-group">
                <div className="crs-group-label">{group.label}</div>
                {groupRules.map(rule => {
                  const topColor = COLOR_PALETTE.find(c => c.id === rule.topColor);
                  if (!topColor) return null;
                  const isExpanded = expandedRule === rule.id;
                  return (
                    <div key={rule.id} className={`crs-rule ${isExpanded ? 'crs-rule--open' : ''}`}>
                      {/* Top color row — click to expand */}
                      <button
                        className="crs-rule-header"
                        onClick={() => setExpandedRule(isExpanded ? null : rule.id)}
                      >
                        <span className="crs-top-chip" style={{ background: topColor.hex }} />
                        <span className="crs-top-name">{topColor.name}</span>
                        <span className="crs-match-count">
                          {rule.bottomColors.length} match{rule.bottomColors.length !== 1 ? 'es' : ''}
                        </span>
                        <span className="crs-chevron">{isExpanded ? '▲' : '▼'}</span>
                      </button>

                      {/* Expanded bottom color picker */}
                      {isExpanded && (
                        <div className="crs-bottom-picker">
                          {COLOR_GROUPS.map(bg => {
                            const bgColors = COLOR_PALETTE.filter(c => c.group === bg.id);
                            return (
                              <div key={bg.id} className="crs-bottom-group">
                                <span className="crs-bottom-group-label">{bg.label}</span>
                                <div className="crs-bottom-chips">
                                  {bgColors.map(c => {
                                    const selected = rule.bottomColors.includes(c.id);
                                    return (
                                      <button
                                        key={c.id}
                                        type="button"
                                        title={getColorName(c.id)}
                                        onClick={() => toggleBottomColor(rule.id, c.id)}
                                        className={`crs-chip ${selected ? 'crs-chip--on' : ''}`}
                                        style={{ background: getColorHex(c.id) }}
                                      >
                                        {selected && <span className="crs-chip-check">✓</span>}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={handleSave} className="btn-primary">Save Rules</button>
        </div>
      </div>
    </div>
  );
}
