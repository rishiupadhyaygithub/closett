# Closett ✦

> Your digital wardrobe — built for Indian skin tones and body types

Closett is a personal wardrobe manager with colour recommendations calibrated for Indian skin and ethnic wear styling advice no generic app offers.

**Live:** [closett-delta.vercel.app](https://closett-delta.vercel.app)

---

## What makes it different

| Feature | Generic wardrobe apps | Closett |
|---|---|---|
| Colour recommendations | Generic RGB theory | Undertone-based (warm / cool / neutral / olive) |
| Indian skin tone support | ❌ | ✅ 4-tier overtone + undertone system |
| Season colour analysis | ❌ | ✅ 7 seasons mapped to Indian skin profiles |
| Body type styling | Generic Western rules | ✅ Indian ethnic wear — saree drapes, anarkali, lehenga, sherwani |
| Outfit builder | ❌ | ✅ 4-step flow: Tops → Layers → Bottoms → Accessories |
| Closet sync | Local only | ✅ Supabase cloud — works across all devices |
| Image storage | Base64 bloat | ✅ Supabase Storage (public CDN URLs) |
| Auto-fill from URL | ❌ | ✅ Paste product link → title, image, price auto-filled |
| Color pairing rules | ❌ | ✅ 35-color combinatorics engine |

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS + custom CSS variables |
| Auth | Supabase Auth (email/password) |
| Database | Supabase PostgreSQL (RLS on all tables) |
| Storage | Supabase Storage (`item-images` bucket) |
| Deployment | Vercel (auto-deploy on push) |

---

## Features

- **Auth** — email/password signup + login, session persists across devices
- **Onboarding** — 4-step quiz: gender → skin overtone → undertone → body type
- **Undertone engine** — warm / cool / neutral / olive; biologically independent of skin depth. Fixes the "dark = warm" myth common in Indian styling advice
- **Season derivation** — overtone × undertone → one of 7 Indian-relevant colour seasons (Deep Autumn, Deep Winter, True Autumn, Warm Spring, Soft Summer, Soft Autumn, True Winter)
- **35-colour palette** — grouped by family (neutrals, blues, greens, reds, purples, warm, browns). Each chip marked ✓ recommended / ✕ avoid based on undertone
- **Body type advice** — 5 male + 5 female builds with recommended fits, avoid fits, pro tips, and **Indian ethnic wear** guidance (saree drapes, blouse styles, lehenga cuts, sherwani fits)
- **My Style page** — colour season card, recommended + avoid palette grouped by family, body type advice, Indian ethnic wear section
- **Closet Matcher** — pick a top colour → see matching layers, bottoms, accessories; undertone chip indicators on all colour swatches
- **Color Rules** — accordion UI to configure which bottom colours pair with each top (35 × 35 combinations)
- **Add piece** — paste product URL → auto-fills title, image, price from OG tags; 3-proxy CORS fallback; image upload via drag/drop, click, or Ctrl+V paste
- **Collections** — nested category tree with subcollections; items move to Uncategorized on delete
- **Export / Import** — full JSON backup and restore

---

## Running locally

```bash
npm install
npm run dev
```

No `.env` needed — Supabase keys are public anon keys (protected by Row Level Security).

---

## Architecture

```
src/
  types.ts              ← all TypeScript types (UserProfile, Item, ColorRule, etc.)
  colorData.ts          ← 35-color palette + undertone-based advice + pairing rules
  seasonData.ts         ← 7 colour seasons, deriveColorSeason(skinTone, undertone)
  bodyTypeData.ts       ← 10 body types (5M + 5F) with Indian ethnic wear advice
  db.ts                 ← all Supabase CRUD (categories, items, color rules, profiles)
  lib/supabase.ts       ← Supabase client + uploadImage() base64→Storage

  components/
    AuthModal.tsx           ← email/password login + signup
    OnboardingModal.tsx     ← 4-step profile quiz
    StyleProfileView.tsx    ← My Style page (season, palette, body type, ethnic wear)
    ClosetView.tsx          ← outfit builder (4-section flow + undertone chip hints)
    AddItemModal.tsx        ← add/edit piece (URL scrape, image upload, colour picker)
    ColorRulesSettings.tsx  ← accordion colour pairing rules editor
    ItemCard.tsx            ← wardrobe grid card

  App.tsx               ← routing, auth listener, data loading, layout
  index.css             ← full design system (cream theme, all component styles)
```

### Supabase schema

```sql
categories    (id, user_id, name, sort_order, parent_id)
items         (id, user_id, image, title, price, currency, link, notes,
               category_id, created_at, color, garment_type)
color_rules   (id, user_id, top_color, bottom_colors[])
user_profiles (id, gender, skin_tone, undertone, body_type, updated_at)
```

Storage bucket: `item-images/{user_id}/{item_id}.{ext}`

---

## Colour science notes

Indian skin spans Fitzpatrick III–VI. Two independent axes drive recommendations:

- **Overtone** (skin depth) — fair / wheatish / dusky / dark
- **Undertone** (biological hue) — warm / cool / neutral / olive

Most Indian styling content conflates the two ("dark skin = warm tones") which is dermatologically incorrect. Closett separates them. Undertone drives all colour advice; overtone combines with undertone to derive the colour season.

Season mapping (most common Indian profiles):

| Overtone + Undertone | Season |
|---|---|
| Fair + Warm | Warm Spring |
| Fair + Cool | True Winter |
| Wheatish + Warm | True Autumn |
| Wheatish + Cool | Soft Summer |
| Dusky/Dark + Warm | Deep Autumn |
| Dusky/Dark + Cool | Deep Winter |

---

Built by [Rishi Upadhyay](https://github.com/rishiupadhyaygithub)
