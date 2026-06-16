# RouteWise — Setup Guide

## What you need before starting
- Node.js installed (nodejs.org — download LTS)
- VS Code installed (code.visualstudio.com)
- Expo Go app on your Android phone (Play Store)
- A free Supabase account (supabase.com)
- A Google Cloud account with billing enabled (you get $300 free credit)

---

## Step 1 — Install the project

Open VS Code, open a terminal (Terminal → New Terminal), then run:

```bash
# Navigate to where you want the project
cd Desktop

# Copy the routewise folder here, then install packages
cd routewise
npm install
```

---

## Step 2 — Set up Supabase

1. Go to https://supabase.com and create a free account
2. Click **New Project**, name it `routewise`, set a database password, choose region (Singapore is closest for India)
3. Wait for it to provision (~2 mins)
4. Go to **SQL Editor** → **New query**
5. Copy the entire contents of `supabase-schema.sql` and paste it, then click **Run**
6. Go to **Settings** → **API**
7. Copy your **Project URL** and **anon public key**

---

## Step 3 — Set up Google Maps API

1. Go to https://console.cloud.google.com
2. Create a new project called `routewise`
3. Go to **APIs & Services** → **Enable APIs**
4. Enable these 3 APIs:
   - Maps SDK for Android
   - Places API
   - Directions API
5. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **API Key**
6. Copy the API key

---

## Step 4 — Add your API keys

Open the `.env` file and replace the placeholder values:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
EXPO_PUBLIC_GOOGLE_MAPS_KEY=your-actual-google-maps-key
```

---

## Step 5 — Enable Phone Auth in Supabase

1. In Supabase → **Authentication** → **Providers**
2. Enable **Phone** provider
3. For testing, enable **"Confirm phone"** and use Supabase's built-in OTP (no Twilio needed for dev)

---

## Step 6 — Run the app

```bash
npx expo start
```

Scan the QR code with Expo Go on your Android phone. The app will open live.

---

## Project structure

```
routewise/
├── app/
│   ├── _layout.tsx          ← Root layout + auth guard
│   ├── auth/
│   │   ├── login.tsx        ← Phone number screen
│   │   ├── verify.tsx       ← OTP screen
│   │   └── profile-setup.tsx ← Name + vehicle setup
│   ├── tabs/
│   │   ├── _layout.tsx      ← Tab bar
│   │   ├── home.tsx         ← Today's route overview
│   │   ├── add-stops.tsx    ← Add delivery addresses
│   │   ├── history.tsx      ← Past sessions
│   │   └── profile.tsx      ← Driver settings
│   └── delivery/
│       └── active.tsx       ← Live delivery screen
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── StopCard.tsx
│   │   └── FuelSavingsBanner.tsx
│   └── map/
│       └── RouteMap.tsx
├── lib/
│   ├── supabase.ts          ← Supabase client
│   ├── api.ts               ← All database functions
│   ├── optimizer.ts         ← Route optimization algorithm
│   └── store.ts             ← Global state (Zustand)
├── hooks/
│   ├── useAuth.ts           ← Auth state hook
│   └── useLocation.ts       ← GPS location hook
├── types/index.ts           ← TypeScript types
├── constants/index.ts       ← Colors, vehicle data
├── supabase-schema.sql      ← Run this in Supabase
└── .env                     ← Your API keys (never share this)
```

---

## Building for Play Store (when ready)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build Android APK
eas build --platform android --profile preview
```

---

## Common issues

**"Network request failed"** → Check your `.env` keys are correct, no extra spaces

**Map not showing** → Make sure Maps SDK for Android is enabled in Google Cloud and billing is on

**OTP not arriving** → In Supabase dashboard, check Authentication → Logs for errors. For testing, Supabase shows the OTP in the dashboard logs.

**App crashes on start** → Run `npx expo start --clear` to clear the cache
