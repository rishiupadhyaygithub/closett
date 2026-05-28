# Firebase Setup for Cloud Sync

## Step 1: Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Create project"
3. Name it: `fashion-wishlist`
4. Disable Google Analytics (optional)
5. Click "Create project"

## Step 2: Create Firestore Database
1. In Firebase console, click "Firestore Database" on left sidebar
2. Click "Create database"
3. Choose "Start in production mode"
4. Select a region close to you (e.g., `asia-south1` for India, `us-central` for US)
5. Click "Enable"

## Step 3: Get Your Config
1. Click the gear icon ⚙️ next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon `</>`
5. Give it a nickname: `Fashion Wishlist App`
6. Click "Register app"
7. Copy the `firebaseConfig` object

## Step 4: Update Code
Open `src/firebase.ts` and replace the placeholder config with yours:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 5: Set Security Rules
In Firebase console:
1. Go to Firestore Database → Rules
2. Replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **Warning**: These rules allow anyone to read/write. For personal use this is fine, but for production apps, add authentication.

## Step 6: Run the App
```bash
npm run dev
```

Your data now syncs to the cloud! Access the same URL on any device, same data appears instantly.
