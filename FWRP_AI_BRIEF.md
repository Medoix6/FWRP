# FWRP — Food Waste Reduction Platform
## AI Developer Brief: UI Modernization, Security Hardening & Firebase Integration

---

## 1. Project Overview

**Project Name:** FWRP — Food Waste Reduction Platform
**Stack:** React.js, JavaScript (ES6+), Firebase (Auth + Firestore + Storage), CSS/Tailwind
**Goal of this brief:** Bring the existing codebase up to a modern, production-ready standard across three pillars — UI/UX modernization, security hardening, and Firebase integration quality.

> **Important:** Do NOT rewrite or re-architect the business logic or data models unless explicitly instructed. The focus is on presentation, security, and reliability — not feature changes.

---

## 2. Current State Summary

The platform was built as a functional prototype/internship project. It works, but suffers from:

- Inconsistent, dated UI — mixed styling approaches, no unified design system
- Loose Firebase security rules — Firestore/Storage rules are too permissive
- Fragile Firebase integration — missing error handling, no loading/offline states
- No environment variable discipline — potential for exposed API keys
- Auth flows lack proper guards, redirects, and session handling

---

## 3. Pillar 1 — UI/UX Modernization

### 3.1 Design System (Establish First, Apply Everywhere)

Before touching any component, establish a single source of truth for design tokens. Create `src/styles/tokens.css` (or a `theme.js` if using Tailwind config):

```css
/* src/styles/tokens.css */
:root {
  /* Brand Palette — green-forward, clean, trustworthy */
  --color-primary:       #2D6A4F;   /* deep forest green */
  --color-primary-light: #52B788;   /* fresh mid-green */
  --color-primary-soft:  #D8F3DC;   /* pale green tint for backgrounds */
  --color-accent:        #F4A261;   /* warm amber — food/warmth signal */
  --color-danger:        #E63946;
  --color-warning:       #F4A261;
  --color-success:       #52B788;
  --color-neutral-50:    #F8FAFB;
  --color-neutral-100:   #EEF2F0;
  --color-neutral-300:   #C4CCCA;
  --color-neutral-600:   #5A6B65;
  --color-neutral-900:   #1A2420;

  /* Typography */
  --font-display: 'Plus Jakarta Sans', sans-serif;
  --font-body:    'Inter', sans-serif;
  --text-xs:   0.75rem;
  --text-sm:   0.875rem;
  --text-base: 1rem;
  --text-lg:   1.125rem;
  --text-xl:   1.25rem;
  --text-2xl:  1.5rem;
  --text-3xl:  1.875rem;
  --text-4xl:  2.25rem;

  /* Spacing scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* Elevation / Shadow */
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md:  0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
  --shadow-lg:  0 10px 30px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.06);

  /* Radius */
  --radius-sm:  6px;
  --radius-md:  10px;
  --radius-lg:  16px;
  --radius-xl:  24px;
  --radius-full: 9999px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 400ms ease;
}
```

If using **Tailwind**, extend `tailwind.config.js` with the same values as a custom palette rather than overriding defaults.

### 3.2 Global Layout & Navigation

**Current issues:** Likely a flat, top-level nav with no hierarchy. Sidebar/topbar inconsistency.

**Target:** Clean sidebar layout for authenticated views, top bar for public pages.

```
┌─────────────────────────────────────────┐
│  TOPBAR  [Logo]          [User Avatar ▾] │
├──────────┬──────────────────────────────┤
│          │                              │
│ SIDEBAR  │   MAIN CONTENT AREA          │
│  (240px) │   (fluid, max-w: 1200px)     │
│          │                              │
│  Nav     │                              │
│  Items   │                              │
│          │                              │
│ [Logout] │                              │
└──────────┴──────────────────────────────┘
```

- Sidebar collapses to icon-only on `<768px` screens, becomes a bottom drawer on mobile
- Topbar height: 56px. Sidebar width: 240px (open) / 64px (collapsed)
- Active nav item: left border accent `4px solid var(--color-primary)`, soft background `var(--color-primary-soft)`
- Use `React.lazy` + `<Suspense>` for all route-level components

### 3.3 Component Modernization Rules

Apply these rules to **every component** you touch:

#### Cards
```jsx
/* Modern card — use this pattern for all data cards */
<div className="card">
  {/* card content */}
</div>

/* CSS */
.card {
  background: white;
  border: 1px solid var(--color-neutral-100);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-fast), transform var(--transition-fast);
}
.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
```

#### Buttons
```jsx
/* Primary */
<button className="btn btn-primary">Save Listing</button>

/* Ghost */
<button className="btn btn-ghost">Cancel</button>

/* Danger */
<button className="btn btn-danger">Delete</button>

/* CSS */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0.625rem var(--space-4);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1.5px solid transparent;
}
.btn-primary  { background: var(--color-primary); color: white; }
.btn-primary:hover { background: #245c43; }
.btn-ghost    { background: transparent; border-color: var(--color-neutral-300); color: var(--color-neutral-900); }
.btn-ghost:hover { background: var(--color-neutral-100); }
.btn-danger   { background: var(--color-danger); color: white; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
```

#### Form Inputs
```css
.input {
  width: 100%;
  padding: 0.625rem var(--space-3);
  border: 1.5px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-family: var(--font-body);
  color: var(--color-neutral-900);
  background: white;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  outline: none;
}
.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(45, 106, 79, 0.12);
}
.input.error {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 3px rgba(230, 57, 70, 0.10);
}
```

#### Badges / Status Tags
```jsx
/* Food status badges */
<span className="badge badge-fresh">Fresh</span>
<span className="badge badge-expiring">Expiring Soon</span>
<span className="badge badge-expired">Expired</span>

/* CSS */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.badge-fresh    { background: var(--color-primary-soft); color: var(--color-primary); }
.badge-expiring { background: #FFF3E0; color: #E65100; }
.badge-expired  { background: #FFEBEE; color: var(--color-danger); }
```

#### Loading States
**Every async operation needs a loading state. No exceptions.**
```jsx
// Skeleton loader pattern
const SkeletonCard = () => (
  <div className="card skeleton-card">
    <div className="skeleton skeleton-title" />
    <div className="skeleton skeleton-text" />
    <div className="skeleton skeleton-text short" />
  </div>
);

/* CSS */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-neutral-100) 25%,
    var(--color-neutral-50) 50%,
    var(--color-neutral-100) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.skeleton-title { height: 20px; width: 60%; margin-bottom: var(--space-3); }
.skeleton-text  { height: 14px; width: 100%; margin-bottom: var(--space-2); }
.skeleton-text.short { width: 40%; }
```

#### Toast Notifications
Replace all `alert()` calls with a toast system:
```jsx
// src/components/ui/Toast.jsx
// Use react-hot-toast or build a simple context-based toast
// Placement: top-right, z-index: 9999
// Auto-dismiss: 4 seconds
// Variants: success (green), error (red), info (blue), warning (amber)
import toast from 'react-hot-toast';

// Usage throughout the app:
toast.success('Listing saved!');
toast.error('Failed to save. Please try again.');
```

### 3.4 Page-by-Page Modernization Targets

For each page below, apply the design tokens and component patterns above. Specific layout notes:

#### Dashboard / Home
- Hero stat row: 3–4 key metrics in card format (total listings, items saved, kg of food rescued, active donors)
- Recent activity feed below stats
- Quick-action buttons: "Add Listing", "Browse Available"
- Chart if data permits: simple bar or line chart using `recharts`

#### Food Listings Page
- Grid layout: 3 columns desktop, 2 tablet, 1 mobile
- Each card: image thumbnail, food name, quantity, expiry badge, pickup location, donor name, CTA button
- Filter bar at top: category, expiry date range, distance, availability
- Empty state: illustrated message + "Add the first listing" CTA — never show a blank page

#### Add / Edit Listing Form
- Two-column layout on desktop (form left, live preview right)
- Image upload with drag-and-drop zone + preview
- Expiry date picker with visual urgency indicator
- Character counter on description field
- Auto-save draft to `localStorage` every 30 seconds

#### Auth Pages (Login / Register)
- Centered card on a split layout: left = brand illustration/pattern, right = form
- Social auth buttons (Google at minimum) above email/password form with "or" divider
- Inline field validation (on blur, not on change)
- "Remember me" checkbox
- Forgot password link visible but not prominent

#### Profile / Settings
- Avatar with upload capability (click to change)
- Tabbed layout: Profile Info | Notifications | Security
- Danger zone at bottom of Security tab (delete account)

---

## 4. Pillar 2 — Security Hardening

### 4.1 Environment Variables

**Critical — do this first before any Firebase work.**

```bash
# .env.local  (NEVER commit this file)
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

```js
// src/firebase/config.js
const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};
```

Add to `.gitignore`:
```
.env
.env.local
.env.production
```

### 4.2 Firebase Security Rules — Firestore

Replace any permissive rules (`allow read, write: if true;`) with the following hardened ruleset:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── Helper functions ──────────────────────────────────────────
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function isValidListing() {
      let d = request.resource.data;
      return d.keys().hasAll(['title', 'quantity', 'expiryDate', 'category', 'donorId', 'createdAt'])
          && d.title is string && d.title.size() >= 3 && d.title.size() <= 100
          && d.quantity is number && d.quantity > 0
          && d.donorId == request.auth.uid;
    }

    // ── Users collection ──────────────────────────────────────────
    match /users/{userId} {
      // Users can read their own profile; admins can read any
      allow read: if isOwner(userId) || isAdmin();
      // Users can only create their own document on registration
      allow create: if isOwner(userId)
                    && request.resource.data.role == 'donor'; // default role, no self-escalation
      // Users can update their own non-sensitive fields
      allow update: if isOwner(userId)
                    && !request.resource.data.diff(resource.data).affectedKeys()
                        .hasAny(['role', 'createdAt', 'uid']);
      // Only admins can delete users
      allow delete: if isAdmin();
    }

    // ── Listings collection ───────────────────────────────────────
    match /listings/{listingId} {
      // Anyone signed in can read active listings
      allow read: if isSignedIn();
      // Only the donor (owner) can create a listing
      allow create: if isSignedIn() && isValidListing();
      // Owner can update their own listing; admins can update any
      allow update: if (isOwner(resource.data.donorId) || isAdmin())
                    && request.resource.data.donorId == resource.data.donorId; // can't reassign ownership
      // Owner or admin can delete
      allow delete: if isOwner(resource.data.donorId) || isAdmin();
    }

    // ── Claims / Reservations collection ─────────────────────────
    match /claims/{claimId} {
      allow read:   if isSignedIn() &&
                      (resource.data.claimantId == request.auth.uid ||
                       resource.data.donorId    == request.auth.uid ||
                       isAdmin());
      allow create: if isSignedIn()
                    && request.resource.data.claimantId == request.auth.uid
                    && request.resource.data.keys().hasAll(['listingId','claimantId','donorId','status','createdAt']);
      allow update: if isAdmin() ||
                      (isOwner(resource.data.donorId) &&
                       request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status']));
      allow delete: if isAdmin();
    }

    // ── Notifications (read-only for recipient) ───────────────────
    match /notifications/{notifId} {
      allow read:   if isSignedIn() && resource.data.recipientId == request.auth.uid;
      allow create: if isAdmin();
      allow update: if isSignedIn() && resource.data.recipientId == request.auth.uid
                    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']);
      allow delete: if isAdmin();
    }

    // ── Catch-all: deny everything else ──────────────────────────
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 4.3 Firebase Security Rules — Storage

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // ── Listing images ────────────────────────────────────────────
    match /listings/{userId}/{imageId} {
      // Anyone signed in can view listing images
      allow read: if request.auth != null;
      // Only the owning user can upload to their own folder
      allow write: if request.auth != null
                   && request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024       // max 5MB
                   && request.resource.contentType.matches('image/.*'); // images only
      allow delete: if request.auth != null && request.auth.uid == userId;
    }

    // ── User avatars ──────────────────────────────────────────────
    match /avatars/{userId}/{fileName} {
      allow read:   if request.auth != null;
      allow write:  if request.auth != null
                    && request.auth.uid == userId
                    && request.resource.size < 2 * 1024 * 1024
                    && request.resource.contentType.matches('image/.*');
      allow delete: if request.auth != null && request.auth.uid == userId;
    }

    // ── Deny everything else ──────────────────────────────────────
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### 4.4 Auth Security

```jsx
// src/firebase/auth.js

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from './config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// ── Registration ──────────────────────────────────────────────────
export const registerUser = async ({ email, password, displayName }) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // Update display name in Auth
  await updateProfile(user, { displayName });

  // Create user document in Firestore with safe defaults
  await setDoc(doc(db, 'users', user.uid), {
    uid:         user.uid,
    email:       user.email,
    displayName,
    role:        'donor',       // default — never accept role from client payload
    createdAt:   serverTimestamp(),
    updatedAt:   serverTimestamp(),
    photoURL:    null,
    isActive:    true,
  });

  return user;
};

// ── Login ─────────────────────────────────────────────────────────
export const loginUser = async ({ email, password }) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
};

// ── Google Sign-In ────────────────────────────────────────────────
export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const credential = await signInWithPopup(auth, provider);
  const user = credential.user;

  // Create user doc only if first-time sign-in
  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, {
    uid:         user.uid,
    email:       user.email,
    displayName: user.displayName,
    photoURL:    user.photoURL,
    role:        'donor',
    createdAt:   serverTimestamp(),
    updatedAt:   serverTimestamp(),
    isActive:    true,
  }, { merge: true }); // merge: true prevents overwriting existing role

  return user;
};

// ── Password Reset ────────────────────────────────────────────────
export const resetPassword = (email) => sendPasswordResetEmail(auth, email);

// ── Logout ────────────────────────────────────────────────────────
export const logoutUser = () => signOut(auth);
```

### 4.5 Route Guards

```jsx
// src/components/auth/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from '../ui/LoadingScreen';

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && userProfile?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Usage in router:
// <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
// <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
```

### 4.6 Input Sanitization

```bash
npm install dompurify
```

```js
// src/utils/sanitize.js
import DOMPurify from 'dompurify';

export const sanitizeText = (str) =>
  DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

// Use on all user-supplied text before writing to Firestore:
// title: sanitizeText(formData.title),
// description: sanitizeText(formData.description),
```

---

## 5. Pillar 3 — Firebase Integration Quality

### 5.1 Auth Context (Single Source of Truth)

```jsx
// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]               = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    let profileUnsub = () => {};

    const authUnsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Real-time listener on user profile
        profileUnsub = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (snap) => {
            setUserProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
            setLoading(false);
          },
          (error) => {
            console.error('Profile listener error:', error);
            setLoading(false);
          }
        );
      } else {
        profileUnsub();
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsub();
      profileUnsub();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
```

### 5.2 Firestore Service Layer

**Never call Firestore directly from components.** All database operations go through service files:

```js
// src/services/listingsService.js
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, where, orderBy, limit,
  serverTimestamp, onSnapshot, startAfter,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { sanitizeText } from '../utils/sanitize';

const COLLECTION = 'listings';

// ── Create ────────────────────────────────────────────────────────
export const createListing = async (data, userId) => {
  const payload = {
    title:       sanitizeText(data.title),
    description: sanitizeText(data.description || ''),
    quantity:    Number(data.quantity),
    unit:        data.unit,
    category:    data.category,
    expiryDate:  data.expiryDate,
    imageUrl:    data.imageUrl || null,
    donorId:     userId,
    status:      'available',
    createdAt:   serverTimestamp(),
    updatedAt:   serverTimestamp(),
  };
  const ref = await addDoc(collection(db, COLLECTION), payload);
  return ref.id;
};

// ── Read (paginated) ──────────────────────────────────────────────
export const fetchListings = async ({ pageSize = 12, lastDoc = null, category = null } = {}) => {
  let q = query(
    collection(db, COLLECTION),
    where('status', '==', 'available'),
    orderBy('expiryDate', 'asc'),
    limit(pageSize)
  );

  if (category) q = query(q, where('category', '==', category));
  if (lastDoc)  q = query(q, startAfter(lastDoc));

  const snap = await getDocs(q);
  return {
    listings: snap.docs.map(d => ({ id: d.id, ...d.data() })),
    lastDoc:  snap.docs[snap.docs.length - 1] ?? null,
    hasMore:  snap.docs.length === pageSize,
  };
};

// ── Real-time listener for a single listing ───────────────────────
export const subscribeListing = (listingId, callback, onError) => {
  return onSnapshot(
    doc(db, COLLECTION, listingId),
    (snap) => snap.exists() ? callback({ id: snap.id, ...snap.data() }) : callback(null),
    onError
  );
};

// ── Update ────────────────────────────────────────────────────────
export const updateListing = async (listingId, updates) => {
  const safeUpdates = {
    ...updates,
    title:       updates.title       ? sanitizeText(updates.title)       : undefined,
    description: updates.description ? sanitizeText(updates.description) : undefined,
    updatedAt:   serverTimestamp(),
  };
  // Remove undefined keys
  Object.keys(safeUpdates).forEach(k => safeUpdates[k] === undefined && delete safeUpdates[k]);
  await updateDoc(doc(db, COLLECTION, listingId), safeUpdates);
};

// ── Delete ────────────────────────────────────────────────────────
export const deleteListing = async (listingId) => {
  await deleteDoc(doc(db, COLLECTION, listingId));
};
```

### 5.3 Storage Service

```js
// src/services/storageService.js
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB   = 5;

export const uploadListingImage = (file, userId, onProgress) => {
  // Validate client-side (server rules enforce this too)
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Only JPEG, PNG, and WebP images are allowed.');
  if (file.size > MAX_SIZE_MB * 1024 * 1024) throw new Error(`Image must be under ${MAX_SIZE_MB}MB.`);

  const ext      = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const path     = `listings/${userId}/${fileName}`;
  const storageRef = ref(storage, path);

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      'state_changed',
      (snap) => onProgress && onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ url, path });
      }
    );
  });
};

export const deleteImage = async (path) => {
  try {
    await deleteObject(ref(storage, path));
  } catch (err) {
    // File may already be deleted — log but don't throw
    console.warn('Storage delete warning:', err.message);
  }
};
```

### 5.4 Custom Hooks Pattern

```jsx
// src/hooks/useListings.js
import { useState, useEffect, useCallback } from 'react';
import { fetchListings } from '../services/listingsService';

export const useListings = ({ category } = {}) => {
  const [listings, setListings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [lastDoc, setLastDoc]     = useState(null);
  const [hasMore, setHasMore]     = useState(false);

  const load = useCallback(async (reset = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchListings({
        lastDoc: reset ? null : lastDoc,
        category,
      });
      setListings(prev => reset ? result.listings : [...prev, ...result.listings]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err.message || 'Failed to load listings.');
    } finally {
      setLoading(false);
    }
  }, [category, lastDoc]);

  useEffect(() => { load(true); }, [category]);

  return { listings, loading, error, hasMore, loadMore: () => load(false), reload: () => load(true) };
};
```

### 5.5 Error Handling — Firebase Error Mapper

```js
// src/utils/firebaseErrors.js
const ERROR_MAP = {
  'auth/user-not-found':       'No account found with this email.',
  'auth/wrong-password':       'Incorrect password.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password':        'Password must be at least 6 characters.',
  'auth/invalid-email':        'Please enter a valid email address.',
  'auth/too-many-requests':    'Too many attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'permission-denied':         'You don\'t have permission to do that.',
  'unavailable':               'Service temporarily unavailable. Please try again.',
  'not-found':                 'The requested item no longer exists.',
};

export const getFirebaseErrorMessage = (error) => {
  return ERROR_MAP[error?.code] || error?.message || 'Something went wrong. Please try again.';
};
```

---

## 6. Offline & Resilience

### 6.1 Enable Firestore Offline Persistence

```js
// src/firebase/config.js  (add this)
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed: multiple tabs open.');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence not supported in this browser.');
  }
});
```

### 6.2 Offline Banner Component

```jsx
// src/components/ui/OfflineBanner.jsx
import { useState, useEffect } from 'react';

const OfflineBanner = () => {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on  = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  if (!offline) return null;

  return (
    <div className="offline-banner" role="alert">
      ⚠️ You're offline. Changes will sync when you reconnect.
    </div>
  );
};

/* CSS */
/* .offline-banner { position: fixed; bottom: 0; left: 0; right: 0; background: var(--color-warning);
   color: white; text-align: center; padding: var(--space-2) var(--space-4); z-index: 9000; font-size: var(--text-sm); font-weight: 600; } */
```

---

## 7. Performance

- Lazy-load all route-level page components with `React.lazy` + `Suspense`
- Use `React.memo` on pure list item components (listing cards, notification items)
- Add `loading="lazy"` to all `<img>` tags
- Paginate all Firestore queries (max 12–20 docs per page) — never `getDocs` an entire collection
- Compress images client-side before upload: `browser-image-compression` npm package
- Add `index.js` barrel exports per feature folder to keep imports clean

---

## 8. Accessibility

- All interactive elements must be keyboard-navigable and have visible focus rings
- Form fields: always pair `<label htmlFor="">` with input `id`
- Images: meaningful `alt` text; decorative images get `alt=""`
- Color contrast: all text must meet WCAG AA (4.5:1 for body, 3:1 for large text)
- Status messages (errors, success) use `role="alert"` or `aria-live="polite"`
- Modal dialogs use `role="dialog"` with `aria-modal="true"` and focus trap

---

## 9. File & Folder Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   └── ProtectedRoute.jsx
│   ├── listings/
│   │   ├── ListingCard.jsx
│   │   ├── ListingGrid.jsx
│   │   ├── ListingForm.jsx
│   │   └── ListingFilters.jsx
│   └── ui/
│       ├── Button.jsx
│       ├── Input.jsx
│       ├── Badge.jsx
│       ├── Toast.jsx
│       ├── Skeleton.jsx
│       ├── OfflineBanner.jsx
│       ├── LoadingScreen.jsx
│       └── EmptyState.jsx
├── contexts/
│   └── AuthContext.jsx
├── firebase/
│   ├── config.js
│   └── auth.js
├── hooks/
│   ├── useListings.js
│   ├── useAuth.js
│   └── useUpload.js
├── pages/
│   ├── Dashboard.jsx
│   ├── Listings.jsx
│   ├── ListingDetail.jsx
│   ├── AddListing.jsx
│   ├── Profile.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   └── Unauthorized.jsx
├── services/
│   ├── listingsService.js
│   ├── claimsService.js
│   ├── usersService.js
│   └── storageService.js
├── styles/
│   ├── tokens.css
│   ├── global.css
│   └── components.css
└── utils/
    ├── firebaseErrors.js
    ├── sanitize.js
    └── formatters.js        ← date formatting, quantity display, etc.
```

---

## 10. Packages to Install

```bash
# UI & UX
npm install react-hot-toast          # toast notifications
npm install react-router-dom         # routing (if not already)
npm install recharts                 # charts on dashboard

# Security & Utilities
npm install dompurify                # input sanitization
npm install browser-image-compression # compress before upload

# Optional but recommended
npm install date-fns                 # date formatting/comparison
npm install clsx                     # conditional className utility
```

---

## 11. Checklist — Definition of Done

Before considering any section complete, verify:

**UI**
- [ ] All pages use design tokens from `tokens.css` — no hardcoded colors or font sizes
- [ ] Every async operation shows a loading skeleton (not a spinner alone)
- [ ] Empty states exist for every list/grid view
- [ ] All `alert()` calls replaced with toast notifications
- [ ] Mobile layout tested at 375px width
- [ ] No layout breaks between 375px and 1440px

**Security**
- [ ] `.env.local` is in `.gitignore` and no API keys are in source code
- [ ] Firestore rules deployed and tested with Firebase Emulator
- [ ] Storage rules deployed and tested
- [ ] No client-side `role` assignment — roles only set server-side or in `setDoc` at registration with locked value
- [ ] All user-supplied text sanitized before Firestore writes
- [ ] Route guards in place for all authenticated and admin-only routes

**Firebase**
- [ ] No direct Firestore calls from components — all through service layer
- [ ] All Firebase operations wrapped in try/catch with user-friendly error messages
- [ ] Offline persistence enabled
- [ ] Offline banner renders when `navigator.onLine === false`
- [ ] `onAuthStateChanged` listener cleaned up on unmount
- [ ] All Firestore `onSnapshot` listeners cleaned up on unmount

---

## 12. Changelog

Create a `CHANGELOG.md` file at the project root. Every meaningful change made during this modernization pass must be logged here. The file must follow the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format and [Semantic Versioning](https://semver.org/).

### Format Rules

- Most recent version at the top
- Group entries under one of: `Added`, `Changed`, `Fixed`, `Removed`, `Security`, `Deprecated`
- Each entry is one sentence, written in past tense, starting with a capital letter
- Link each version heading to a GitHub diff where possible
- An `[Unreleased]` section lives at the very top for work not yet tagged

### Starting Template

```markdown
# Changelog

All notable changes to FWRP are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/)

---

## [Unreleased]

### Added
- (list items here as you work)

---

## [1.1.0] - YYYY-MM-DD — UI & Security Modernization

### Added
- Design token system (`src/styles/tokens.css`) covering palette, typography, spacing, shadows, and radius
- Skeleton loading states for all async data fetches across Listings, Dashboard, and Profile pages
- Empty state components for Listings grid and Claims list with contextual CTAs
- Toast notification system (react-hot-toast) replacing all browser `alert()` calls
- `OfflineBanner` component that detects loss of connectivity and surfaces a persistent warning
- Offline Firestore persistence via IndexedDB (`enableIndexedDbPersistence`)
- `ProtectedRoute` component with role-based access control and redirect-to-origin on login
- `AuthContext` with real-time Firestore profile listener and proper unmount cleanup
- Service layer (`listingsService`, `claimsService`, `usersService`, `storageService`) — all Firestore and Storage operations now abstracted from components
- `useListings` custom hook with pagination, error state, and reload support
- Firebase error mapper (`src/utils/firebaseErrors.js`) converting error codes to user-friendly messages
- DOMPurify input sanitization applied to all user-supplied text before Firestore writes
- Google Sign-In with `merge: true` to safely handle returning users without overwriting roles
- Image upload progress indicator on Add Listing form
- Auto-save draft to `localStorage` on Add/Edit Listing form (every 30 seconds)
- Sidebar navigation layout for authenticated views with active-item highlight
- Responsive grid for Listings page (3 col → 2 col → 1 col)
- Status badge components: Fresh, Expiring Soon, Expired
- Recharts bar chart on Dashboard showing food rescued over time

### Changed
- All hardcoded color values replaced with CSS custom properties from `tokens.css`
- Auth pages redesigned to split-screen layout (brand panel left, form right)
- Listing cards updated with hover elevation, expiry badge, and cleaner typography
- Add Listing form restructured to two-column layout with live preview on desktop
- Profile page converted to tabbed layout: Profile Info | Notifications | Security
- Firebase config moved to environment variables — no keys in source code
- `createUserWithEmailAndPassword` flow now writes user document to Firestore with locked `role: 'donor'`
- All Firestore queries paginated (max 12 docs per page) — removed unbounded `getDocs` calls

### Security
- Firestore security rules hardened: replaced `allow read, write: if true` with role-aware, ownership-checked rules per collection
- Storage security rules added: file type restricted to `image/*`, size capped at 5MB per upload
- Environment variables enforced for all Firebase config values; `.env.local` added to `.gitignore`
- Client-side role assignment removed — role is set only at registration with a fixed `'donor'` value
- Route guards added to all authenticated routes; admin-only routes require `role === 'admin'`

### Fixed
- Auth listener not cleaned up on component unmount (memory leak)
- Firestore `onSnapshot` subscriptions not unsubscribed on page navigation
- Missing error handling on image upload causing silent failures
- Form submission not disabled during async operations, allowing duplicate Firestore writes

### Removed
- All `alert()` and `console.error` user-facing calls
- Hardcoded Firebase config object with exposed API keys from `src/firebase/config.js`
- Unbounded Firestore collection reads with no `limit()` clause

---

## [1.0.0] - YYYY-MM-DD — Initial Release

### Added
- Food listing creation, editing, and deletion
- Firebase Authentication (email/password)
- Firestore integration for listings and user data
- Firebase Storage for listing images
- Basic dashboard with listing overview
- Claim/reservation flow for available listings
- Donor and recipient user roles
```

### Changelog Checklist

- [ ] `CHANGELOG.md` exists at project root
- [ ] `[Unreleased]` section is kept updated throughout development
- [ ] Every commit that changes user-facing behaviour has a corresponding changelog entry
- [ ] Version numbers follow SemVer — UI/feature additions bump minor (`1.0.0` → `1.1.0`), bug fixes bump patch (`1.1.0` → `1.1.1`), breaking changes bump major
- [ ] Dates use `YYYY-MM-DD` format
- [ ] No entry says "various fixes" or "improvements" — every item is specific

---

*End of brief. Work through the pillars in order: design tokens → component library → page-by-page UI → security rules → Firebase service layer → changelog. Commit after each pillar.*
