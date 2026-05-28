# Fashion Wishlist

Personal fashion collection manager with cloud sync. Save items from any shopping site, organize by category, access from any device.

## Features

- 📸 Paste screenshots or upload images
- 🏷️ Custom categories (Jeans, Shirts, etc.)
- 🔗 Save links to original sites
- 💰 Track prices
- 📝 Add notes (size charts, etc.)
- 🔍 Search and sort
- ☁️ Cloud sync across devices (via Firebase)
- 💾 Export/Import backups

## Quick Start

### Option 1: Local Only (No Cloud)
```bash
npm install
npm run dev
```
Data stays in your browser only.

### Option 2: With Cloud Sync
1. Follow [FIREBASE_SETUP.md](FIREBASE_SETUP.md)
2. Update `src/firebase.ts` with your config
3. `npm run dev`

Data syncs to Firebase and works on all your devices.

## How to Use

1. Click "+ Add Item"
2. Paste a screenshot (Ctrl+V) or upload image
3. Fill in details
4. Click "Open site →" to visit original link

## Building for Production

```bash
npm run build
```

Static files go to `dist/` folder.

## Deploy

Deploy `dist/` folder to Netlify, Vercel, or any static host.
