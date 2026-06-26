# Changelog

All notable changes to FWRP are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/)

---

## [Unreleased]

---

## [1.2.0] - 2026-06-26 — Localization & Admin UI Refinement

### Added
- Multi-language / localization support (English and Arabic) via `LanguageContext` and `LanguageProvider`.
- Comprehensive translation dictionaries (`src/utils/translations.ts`) for all user-facing interface text.
- Integrated language selectors in Header and Sidebar components.
- Automatic RTL (Right-to-Left) direction and Tailwind configuration support when Arabic is selected.

### Changed
- Redesigned and modernized the Admin Dashboard UI (`src/app/admin/page.tsx`) with dynamic translation support, improved layout styling, cards, stats, and a cleaner table view.
- Refactored main application pages and shared components (Hero, Features, About, CTA, Header, Footer, Sidebar, Login, Signup, Dashboard, Complete Profile) to use dynamic translation hooks.

---

## [1.1.0] - 2026-06-20 — UI & Security Modernization

### Added
- Design token system (`src/styles/tokens.css`) covering palette, typography, spacing, shadows, and radius
- Skeleton loading states for all async data fetches across Listings, Dashboard, and Profile settings
- Empty state components for Listings grid and Claims list with contextual CTAs
- Toast notification system (react-hot-toast) replacing all browser `alert()` calls
- `OfflineBanner` component that detects loss of connectivity and surfaces a persistent warning
- Offline Firestore persistence via IndexedDB (`enableIndexedDbPersistence`)
- `ProtectedRoute` component with role-based access control and redirect-to-origin on login
- `AuthContext` with real-time Firestore profile listener and proper unmount cleanup
- Service layer (`listingsService`, `usersService`, `chatsService`, `storageService`) — all Firestore and Storage operations now abstracted from components
- Firebase error mapper (`src/utils/firebaseErrors.ts`) converting error codes to user-friendly messages
- DOMPurify input sanitization applied to all user-supplied text before Firestore writes
- Sidebar navigation layout for authenticated views with active-item highlight
- Status badge components: Fresh, Expiring Soon, Expired
- Unauthorized access redirection page (`src/app/unauthorized/page.tsx`)

### Changed
- All hardcoded color values replaced with CSS custom properties from `tokens.css`
- Auth pages (Login/Signup) redesigned to split-screen layout (brand panel left, form right)
- Profile page converted to tabbed layout: Profile Info | Security & Danger Zone
- `createUserWithEmailAndPassword` flow now writes user document to Firestore with locked safety defaults
- Listings / Donated Food layout refactored to support responsive previews and metrics overview

### Security
- Firestore security rules hardened: replaced permissive rules with role-aware, ownership-checked rules per collection
- Storage security rules added: file type restricted to `image/*`, size capped at 2MB per upload for user avatars
- Client-side role assignment removed — role is set to false/donor and cannot be escalated to admin via local storage overrides
- Route guards added to all authenticated routes; admin-only routes require `isAdmin === true`

### Fixed
- Auth listener not cleaned up on component unmount (memory leak)
- Firestore `onSnapshot` subscriptions not unsubscribed on page navigation
- Missing error handling on image upload causing silent failures
- Form submission not disabled during async operations, allowing duplicate Firestore writes

### Removed
- All raw browser `alert()` calls
- Client-side `isAdmin` local storage override option
- Redundant authentication checks in pages, unified under the global `AuthContext` provider

---

## [1.0.0] - 2026-06-20 — Initial Release

### Added
- Food listing creation, editing, and deletion
- Firebase Authentication (email/password)
- Firestore integration for listings and user data
- Firebase Storage for listing images
- Basic dashboard with listing overview
- Claim/reservation flow for available listings
- Donor and recipient user roles
