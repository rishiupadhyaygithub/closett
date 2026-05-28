# Firebase Setup - Step by Step

## Step 1: Go to Firebase
- Open your browser
- Go to: https://console.firebase.google.com/
- Sign in with your Google account

**Click "Create a project" (big blue button)**

## Step 2: Project Name
- Name: `my-fashion-wishlist`
- Click CONTINUE

## Step 3: Google Analytics
- Click the toggle to **OFF** (we don't need it)
- Click CREATE PROJECT

## Step 4: Wait
- Wait for it to say "Your new project is ready"
- Click CONTINUE

## Step 5: Create Database
- On left sidebar, click **"Build"** → **"Firestore Database"**
- Click **"Create database"** (blue button)
- Select **"Start in production mode"**
- Click NEXT
- Choose region: **asia-south1** (if you're in India) or **us-central**
- Click ENABLE

## Step 6: Get Your Config
- Click the **⚙️ gear icon** next to "Project Overview" at top left
- Click **"Project settings"**
- Scroll down to "Your apps" section
- Click the **</>** icon (web)
- App nickname: `FashionApp`
- Click **REGISTER APP**
- You'll see a green box with code - **copy that entire code block**

## Step 7: Paste It
- Come back here
- Open `src/firebase.ts`
- Replace the placeholder with your copied code
- Save

## Step 8: Security Rules
- In Firebase console, click Firestore Database
- Click **"Rules"** tab at top
- Change the rules to:
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
- Click **PUBLISH**

## Done!
Run `npm run dev` and your data syncs to cloud!
