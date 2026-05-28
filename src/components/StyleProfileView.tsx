import { UserProfile } from '../types';
import { COLOR_PALETTE, isColorRecommended } from '../colorData';
import { getBodyTypeAdvice } from '../bodyTypeData';
import { deriveColorSeason, SEASON_INFO } from '../seasonData';

interface StyleProfileViewProps {
  userProfile: UserProfile | null;
  onEditProfile: () => void;
}

const SKIN_TONE_META: Record<string, { hex: string; label: string }> = {
  fair:     { hex: '#F2C9A0', label: 'Fair' },
  wheatish: { hex: '#C8956C', label: 'Wheatish' },
  dusky:    { hex: '#96613A', label: 'Dusky' },
  dark:     { hex: '#5C3317', label: 'Dark' },
};

const UNDERTONE_META: Record<string, { hex: string; label: string }> = {
  warm:    { hex: '#C8A96E', label: 'Warm' },
  cool:    { hex: '#8BAED4', label: 'Cool' },
  neutral: { hex: '#B4AFA9', label: 'Neutral' },
  olive:   { hex: '#8B8B5A', label: 'Olive' },
};

const COLOR_GROUPS = [
  { id: 'neutral', label: 'Neutrals' },
  { id: 'blue',    label: 'Blues' },
  { id: 'green',   label: 'Greens' },
  { id: 'red',     label: 'Reds & Pinks' },
  { id: 'purple',  label: 'Purples' },
  { id: 'warm',    label: 'Warm Tones' },
  { id: 'brown',   label: 'Browns' },
];

export default function StyleProfileView({ userProfile, onEditProfile }: StyleProfileViewProps) {
  if (!userProfile) {
    return (
      <div className="style-empty">
        <div className="style-empty-icon">✦</div>
        <h3 className="style-empty-title">No style profile yet</h3>
        <p className="style-empty-sub">Set up your profile to get personalised colour and fit recommendations.</p>
        <button onClick={onEditProfile} className="btn-primary" style={{ marginTop: 16 }}>
          Set Up My Profile
        </button>
      </div>
    );
  }

  const advice      = getBodyTypeAdvice(userProfile.bodyType, userProfile.gender);
  const toneMeta    = SKIN_TONE_META[userProfile.skinTone];
  const underMeta   = UNDERTONE_META[userProfile.undertone];
  const season      = deriveColorSeason(userProfile.skinTone, userProfile.undertone);
  const seasonInfo  = SEASON_INFO[season];
  const recommended = COLOR_PALETTE.filter(c => isColorRecommended(c.id, userProfile.undertone) === true);
  const avoid       = COLOR_PALETTE.filter(c => isColorRecommended(c.id, userProfile.undertone) === false);

  return (
    <div className="style-profile-view">

      {/* ── Hero ── */}
      <div className="style-hero">
        <div className="style-hero-left">
          <div className="style-hero-swatches">
            <span className="style-hero-swatch" style={{ background: toneMeta.hex }} title={`${toneMeta.label} skin tone`} />
            <span className="style-hero-swatch style-hero-swatch--under" style={{ background: underMeta.hex }} title={`${underMeta.label} undertone`} />
          </div>
          <div>
            <h2 className="style-hero-title">My Style Profile</h2>
            <div className="style-hero-tags">
              <span className="style-tag">{toneMeta.label} tone</span>
              <span className="style-tag style-tag--undertone">{underMeta.label} undertone</span>
              <span className="style-tag">{advice?.label ?? userProfile.bodyType} build</span>
              <span className="style-tag" style={{ textTransform: 'capitalize' }}>{userProfile.gender}</span>
            </div>
          </div>
        </div>
        <button onClick={onEditProfile} className="btn-ghost btn-sm">Edit Profile</button>
      </div>

      {/* ── Color Season ── */}
      <div className="style-section">
        <div className="style-season-card">
          <div className="style-season-header">
            <div>
              <span className="style-season-label">Your Colour Season</span>
              <h3 className="style-season-name">{seasonInfo.name}</h3>
              <p className="style-season-tagline">{seasonInfo.tagline}</p>
            </div>
            <div className="style-season-meta">
              <span className={`style-season-badge style-season-badge--${seasonInfo.contrastLevel}`}>
                {seasonInfo.contrastLevel} contrast
              </span>
              <span className="style-season-freq">{seasonInfo.indianFrequency} in India</span>
            </div>
          </div>
          <p className="style-season-desc">{seasonInfo.description}</p>
          <div className="style-season-row">
            <div className="style-season-col">
              <span className="style-season-col-label">✦ Your metals</span>
              <p className="style-season-col-value">{seasonInfo.metals.join(' · ')}</p>
            </div>
            <div className="style-season-col">
              <span className="style-season-col-label">✓ Key colors</span>
              <p className="style-season-col-value">{seasonInfo.bestColors.slice(0, 5).join(', ')}</p>
            </div>
            <div className="style-season-col">
              <span className="style-season-col-label">✕ Avoid</span>
              <p className="style-season-col-value">{seasonInfo.avoidColors.slice(0, 3).join(', ')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Colour Palette ── */}
      <div className="style-section">
        <div className="style-section-header">
          <h3 className="style-section-title">Your Colour Palette</h3>
          <p className="style-section-sub">Based on your <strong>{underMeta.label}</strong> undertone — the biological hue beneath your skin</p>
        </div>

        <div className="style-palette-block style-palette-block--good">
          <div className="style-palette-label">
            <span className="style-palette-dot style-palette-dot--good" />
            Recommended — {recommended.length} colours
          </div>
          <div className="style-palette-groups">
            {COLOR_GROUPS.map(group => {
              const cols = recommended.filter(c => c.group === group.id);
              if (!cols.length) return null;
              return (
                <div key={group.id} className="style-palette-group">
                  <span className="style-palette-group-label">{group.label}</span>
                  <div className="style-palette-swatches">
                    {cols.map(c => (
                      <div key={c.id} className="style-swatch-item" title={c.name}>
                        <span className="style-swatch" style={{ background: c.hex }} />
                        <span className="style-swatch-name">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="style-palette-block style-palette-block--avoid">
          <div className="style-palette-label">
            <span className="style-palette-dot style-palette-dot--avoid" />
            Avoid — {avoid.length} colours
          </div>
          <div className="style-palette-swatches" style={{ flexWrap: 'wrap', gap: 10 }}>
            {avoid.map(c => (
              <div key={c.id} className="style-swatch-item style-swatch-item--avoid" title={c.name}>
                <span className="style-swatch style-swatch--avoid" style={{ background: c.hex }} />
                <span className="style-swatch-name">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body Type Advice ── */}
      {advice && (
        <div className="style-section">
          <div className="style-section-header">
            <h3 className="style-section-title">{advice.label} Build</h3>
            <p className="style-section-sub">{advice.description}</p>
          </div>

          <div className="style-advice-grid">
            <div className="style-advice-card style-advice-card--good">
              <h4 className="style-advice-title">✓ Wear These</h4>
              <ul className="style-advice-list">
                {advice.recommendedFits.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
            <div className="style-advice-card style-advice-card--avoid">
              <h4 className="style-advice-title">✕ Avoid These</h4>
              <ul className="style-advice-list">
                {advice.avoidFits.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          </div>

          <div className="style-tips-card">
            <h4 className="style-tips-title">✦ Pro Tips</h4>
            <ul className="style-tips-list">
              {advice.tips.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>

          {/* Indian Ethnic Wear */}
          <div className="style-indian-wear">
            <h4 className="style-indian-wear-title">🇮🇳 Indian Ethnic Wear</h4>
            <div className="style-advice-grid">
              <div className="style-advice-card style-advice-card--good">
                <h4 className="style-advice-title">✓ Best Outfits</h4>
                <ul className="style-advice-list">
                  {advice.indianWear.recommended.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
              <div className="style-advice-card style-advice-card--avoid">
                <h4 className="style-advice-title">✕ Avoid</h4>
                <ul className="style-advice-list">
                  {advice.indianWear.avoid.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            </div>
            {advice.indianWear.tips.length > 0 && (
              <div className="style-tips-card" style={{ marginTop: 12 }}>
                <h4 className="style-tips-title">✦ Ethnic Wear Tips</h4>
                <ul className="style-tips-list">
                  {advice.indianWear.tips.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
