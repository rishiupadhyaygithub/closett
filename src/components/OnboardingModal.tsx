import { useState } from 'react';
import { Gender, SkinTone, Undertone, BodyType, UserProfile } from '../types';
import { MALE_BODY_TYPES, FEMALE_BODY_TYPES } from '../bodyTypeData';

interface OnboardingModalProps {
  onComplete: (profile: UserProfile) => void;
}

const SKIN_TONES: { id: SkinTone; label: string; desc: string; hex: string }[] = [
  { id: 'fair',     label: 'Fair',     desc: 'Light, pale skin tone',              hex: '#F2C9A0' },
  { id: 'wheatish', label: 'Wheatish', desc: 'Medium tan — most common in India',  hex: '#C8956C' },
  { id: 'dusky',    label: 'Dusky',    desc: 'Warm medium-dark tone',              hex: '#96613A' },
  { id: 'dark',     label: 'Dark',     desc: 'Deep, rich skin tone',               hex: '#5C3317' },
];

const UNDERTONES: { id: Undertone; label: string; desc: string; detail: string; hex: string }[] = [
  {
    id: 'warm',
    label: 'Warm',
    desc: 'Golden or yellowish cast',
    detail: 'Veins look green · Gold jewelry flatters more than silver · Earth tones glow on you',
    hex: '#C8A96E',
  },
  {
    id: 'cool',
    label: 'Cool',
    desc: 'Pink or bluish cast',
    detail: 'Veins look blue-purple · Silver flatters more than gold · Jewel tones and cool blues suit you',
    hex: '#8BAED4',
  },
  {
    id: 'neutral',
    label: 'Neutral',
    desc: 'Balanced — hard to tell',
    detail: 'Veins look blue-green · Both gold and silver work · Most colors flatter you',
    hex: '#B4AFA9',
  },
  {
    id: 'olive',
    label: 'Olive',
    desc: 'Green or grey-yellow cast',
    detail: 'Veins look blue-green with brown/grey tint · Muted metals (antique gold, bronze) · Rich, muted tones suit you',
    hex: '#8B8B5A',
  },
];

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [gender, setGender] = useState<Gender | null>(null);
  const [skinTone, setSkinTone] = useState<SkinTone | null>(null);
  const [undertone, setUndertone] = useState<Undertone | null>(null);
  const [bodyType, setBodyType] = useState<BodyType | null>(null);

  const bodyTypes =
    gender === 'male'   ? MALE_BODY_TYPES :
    gender === 'female' ? FEMALE_BODY_TYPES :
    [...MALE_BODY_TYPES, ...FEMALE_BODY_TYPES];

  const canNext = () => {
    if (step === 1) return !!gender;
    if (step === 2) return !!skinTone;
    if (step === 3) return !!undertone;
    if (step === 4) return !!bodyType;
    return false;
  };

  const handleFinish = () => {
    if (!gender || !skinTone || !undertone || !bodyType) return;
    onComplete({ gender, skinTone, undertone, bodyType });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box onboarding-box">
        {/* Header */}
        <div className="onboarding-header">
          <span className="onboarding-brand">✦ Closett</span>
          <div className="onboarding-steps">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`onboarding-dot ${s === step ? 'onboarding-dot--active' : s < step ? 'onboarding-dot--done' : ''}`}
              />
            ))}
          </div>
        </div>

        {/* Step 1 — Gender */}
        {step === 1 && (
          <div className="onboarding-body">
            <h2 className="onboarding-title">Welcome to Closett</h2>
            <p className="onboarding-subtitle">Personalised style for Indian skin tones and body types. Takes 60 seconds.</p>
            <p className="onboarding-question">How do you identify?</p>
            <div className="onboarding-grid onboarding-grid--3">
              {([
                { id: 'male'   as Gender, label: 'Male',   icon: '♂' },
                { id: 'female' as Gender, label: 'Female', icon: '♀' },
                { id: 'other'  as Gender, label: 'Other',  icon: '◈' },
              ] as const).map(opt => (
                <button
                  key={opt.id}
                  className={`ob-option ${gender === opt.id ? 'ob-option--active' : ''}`}
                  onClick={() => setGender(opt.id)}
                >
                  <span className="ob-option__icon">{opt.icon}</span>
                  <span className="ob-option__label">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Skin Tone (overtone) */}
        {step === 2 && (
          <div className="onboarding-body">
            <h2 className="onboarding-title">Your Skin Tone</h2>
            <p className="onboarding-subtitle">Pick your visible skin depth in natural daylight — no filter, no makeup.</p>
            <p className="onboarding-question">Which is closest?</p>
            <div className="onboarding-grid onboarding-grid--2">
              {SKIN_TONES.map(st => (
                <button
                  key={st.id}
                  className={`ob-option ob-option--tone ${skinTone === st.id ? 'ob-option--active' : ''}`}
                  onClick={() => setSkinTone(st.id)}
                >
                  <span className="ob-tone-swatch" style={{ background: st.hex }} />
                  <div className="ob-option__text">
                    <span className="ob-option__label">{st.label}</span>
                    <span className="ob-option__desc">{st.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 — Undertone */}
        {step === 3 && (
          <div className="onboarding-body">
            <h2 className="onboarding-title">Your Undertone</h2>
            <p className="onboarding-subtitle">
              Undertone is the hue <em>beneath</em> your skin — it drives your colour recommendations.
              It's biologically independent of how light or dark your skin is.
            </p>
            <p className="onboarding-question">Which best matches you?</p>
            <div className="ob-undertone-list">
              {UNDERTONES.map(ut => (
                <button
                  key={ut.id}
                  className={`ob-option ob-option--undertone ${undertone === ut.id ? 'ob-option--active' : ''}`}
                  onClick={() => setUndertone(ut.id)}
                >
                  <span className="ob-undertone-swatch" style={{ background: ut.hex }} />
                  <div className="ob-option__text">
                    <span className="ob-option__label">{ut.label} <span className="ob-undertone-subdesc">— {ut.desc}</span></span>
                    <span className="ob-option__desc">{ut.detail}</span>
                  </div>
                  {undertone === ut.id && <span className="ob-check">✓</span>}
                </button>
              ))}
            </div>
            <p className="ob-undertone-hint">
              Not sure? Check your wrist veins in daylight: green = warm · blue-purple = cool · blue-green mix = neutral · grey-green = olive
            </p>
          </div>
        )}

        {/* Step 4 — Body Type */}
        {step === 4 && (
          <div className="onboarding-body">
            <h2 className="onboarding-title">Your Body Type</h2>
            <p className="onboarding-subtitle">We'll recommend silhouettes that work for your shape — and flag what to avoid in Western and Indian ethnic wear.</p>
            <p className="onboarding-question">Which best describes your build?</p>
            <div className="onboarding-body-list">
              {bodyTypes.map(bt => (
                <button
                  key={bt.id}
                  className={`ob-option ob-option--bodytype ${bodyType === bt.id ? 'ob-option--active' : ''}`}
                  onClick={() => setBodyType(bt.id as BodyType)}
                >
                  <div className="ob-option__text">
                    <span className="ob-option__label">{bt.label}</span>
                    <span className="ob-option__desc">{bt.description}</span>
                  </div>
                  {bodyType === bt.id && <span className="ob-check">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="onboarding-footer">
          {step > 1
            ? <button className="btn-ghost" onClick={() => setStep(s => s - 1)}>← Back</button>
            : <div />
          }
          {step < 4
            ? (
              <button className="btn-primary" disabled={!canNext()} onClick={() => setStep(s => s + 1)}>
                Next →
              </button>
            ) : (
              <button className="btn-primary" disabled={!canNext()} onClick={handleFinish}>
                Build My Closett ✦
              </button>
            )
          }
        </div>
      </div>
    </div>
  );
}
