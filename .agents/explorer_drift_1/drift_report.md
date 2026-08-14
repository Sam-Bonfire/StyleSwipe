# StyleSwipe POC — Specification vs. Implementation Drift Analysis Report

**Date**: 2026-08-13  
**Author**: Specification Miner Agent (`explorer_drift_1`)  
**Target Repository**: `c:\Users\Sam\Consusson\Projects\StyleSwipe`  
**Reference Specification**: `docs/StyleSwipe_POC_PRD.txt` & `docs/Architecture.md`

---

## 1. Executive Summary

This report presents a thorough, line-by-line comparison between the authoritative PRD specification (`docs/StyleSwipe_POC_PRD.txt`), architectural specifications (`docs/Architecture.md`), project coding standards (`.agents/rules/coding-standards.md`), and the actual implementation state of the StyleSwipe monorepo.

### Key Audit Findings:
1. **Core Discover (Swipe) Engine**: High fidelity. Vector displacement math (`StyleDNA.ts`), card stack gestures (`SwipeDeck.tsx`), and offline event buffering (`LocalDatabase.ts`) are fully functional.
2. **Onboarding & Style Profiling**: Partially implemented. The app features a 5-question text-chip onboarding flow, but lacks the PRD-mandated visual card grid for Vibe Check, multi-field top/bottom/shoe size selectors, visual color palette swatches, age prompt, and tiered budget comfort bands.
3. **Cart & Checkout Architecture**: Dual-behavior drift. `CartScreen.tsx` opens a modal redirecting users to buy on external platforms (Myntra/Ajio) rather than routing to `CheckoutScreen.tsx`. Furthermore, native e-commerce order placement (`CheckoutScreen.tsx`) is disconnected from backend persistence — Convex lacks `orders` and `addresses` tables, relying instead on system boards (`boards.ts`) to track external click history.
4. **Partner Profile Sync**: Core recommendation blending algorithm (`GetRecommendations.ts`) and link/QR sharing UI (`PartnerSyncSettingsScreen.tsx`) are implemented. However, the invitation acceptance sheet (`app/sync/[inviteCode].tsx`) auto-accepts without showing an explicit privacy disclosure sheet, the influence slider (`BlendSlider.tsx`) is not mounted on the Discover feed, feed visual labels ("Blended with {PartnerName}") are missing, and push/in-app notifications are unimplemented.
5. **Coding Standards & Architectural Compliance**:
   - **Hexagonal Layering**: `packages/core` is clean and pure TS. However, `packages/infrastructure/src/hooks/` frequently bypasses core ports/adapters by calling Convex queries/mutations directly.
   - **Type Safety**: Over 300+ `any` / `as any` type escapes exist across `infrastructure`, `convex`, `ports.ts`, and UI screens.
   - **Zod Validation**: **Zero Zod schemas** exist across the entire codebase despite mandatory coding standard rules.

---

## 2. Implementation Status Summary Matrix

| Feature / Category | PRD Spec Requirement | Codebase Implementation State | Status |
| :--- | :--- | :--- | :--- |
| **Auth & Sign Up** | Phone OTP default, email/name secondary, redirect to onboarding on first signup | `PhoneAuthScreen.tsx`, `OTPScreen.tsx`, Better Auth setup in Convex | **Fully Implemented** |
| **Onboarding & Style Profiling** | 5-6 visual questions: Gender, Age, Sizing (Top/Waist/Shoe), Fit, Visual Vibe Grid, Color Swatches, Budget Tiers | 5 text-chip questions (`GetOnboardingQuestions.ts`, `OnboardingScreen.tsx`). Lacks Age, detailed Sizing, Visual Vibe grid, Color swatches, and Budget bands | **Partially Implemented** |
| **Discovery Choice Screen** | Post-onboarding split screen: Left (Shop Mode) vs. Right (Discover Mode) | Omitted from navigation flow; app routes straight to main tab shell | **Missing / Unimplemented** |
| **Discover (Swipe) Engine** | Full-screen card stack, Right/Left/Up swipe actions, automatic wishlist, real-time vector displacement | `DiscoveryScreen.tsx`, `SwipeDeck.tsx`, `StyleDNA.ts`, Convex `swipes` table, local SQLite fallback | **Fully Implemented** |
| **Shop (Browse) Hub** | Clean grid layout, category tree (Topwear, Bottomwear, Ethnic), advanced filters (Size, Color, Brand, Price, Fit) | 3 carousels on `HomeScreen.tsx`, search input on `SearchScreen.tsx`. No category tree browser or advanced filter UI modal | **Partially Implemented** |
| **Navigation & Main Shell** | Bottom Nav: Home \| Discover \| Categories \| Account. Top Nav: Locality/Pincode address (Left), Search \| Shortlist \| Cart (Right) | Bottom Nav: Home \| Search \| Discover \| Cart \| Profile (5 tabs). Top Nav: AppLogo (Left), Plus \| Bell \| Bag (Right) | **Partially Implemented / Drift** |
| **Partner Profile Sync** | Invite via link/QR/OTP, time-boxed (30m-24h), Accept Sheet with privacy warning, active session card, 0-100% influence slider, blended feed label, shop rail, stop sharing, notifications | `PartnerSyncSettingsScreen.tsx`, QR modal, invite link `/sync/[inviteCode]`, vector blending in `GetRecommendations.ts`. Auto-accepts link without consent sheet, slider unmounted, feed label missing, notifications missing | **Partially Implemented** |
| **Product Detail Page** | Image gallery with pinch-zoom, core info, size selector with unavailable striking, sticky footer with qty counter, wishlist heart, accordion dropdowns, customer reviews | `ProductDetailScreen.tsx`, gallery, core info, size selector, sticky footer (toggles to "Go to Cart" button, no inline +/- qty), heart icon, static details grid, static rating | **Partially Implemented** |
| **Cart Tab** | Item list with qty counter, price summary breakdown, coupon validation, empty view, proceed to checkout button | `CartScreen.tsx`, items, price breakdown (`PriceSummary`), empty view. "Proceed to Buy" opens external store redirect modal. Coupon input unintegrated | **Partially Implemented / Drift** |
| **Checkout Flow** | Multi-step: Address form -> Payment selection (COD/UPI/Card) -> Order confirmation screen -> Persistence to order history | `CheckoutScreen.tsx` multi-step UI exists. However, submitting an order only emits an analytics event (`checkout_initiated`). Convex lacks `orders` and `addresses` tables | **Partially Implemented / Gap** |
| **User Profile Tab** | User details, Your Orders, My Addresses, Payment Methods, Style Quiz update, Settings, Support (FAQ/Contact Us), Logout | `ProfileScreen.tsx`, avatar/details, Orders (points to external click history board), Wishlist, Feedback, Sign Out. Missing Addresses, Payment Methods, Settings, Help Center FAQ | **Partially Implemented** |

---

## 3. Features Discovered & Line-by-Line Comparison

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via / Implementation File | Status |
|---|----------|---------|-------------|--------|---------|----------------|----------------|--------|
| 1 | Identity | Phone OTP Authentication | Primary sign-in method using phone number and OTP code | `phoneNumber: string`, `otp: string` | Auth Session | Triggers alert on invalid OTP or network failure | `PhoneAuthScreen.tsx`, `OTPScreen.tsx`, `AuthAdapter.ts` | Fully Implemented |
| 2 | Identity | Email Sign In / Sign Up | Secondary sign-in method using email and password | `email`, `password`, `name` | Auth Session | Displays error message | `EmailAuthScreen.tsx` | Fully Implemented |
| 3 | Identity | Onboarding Style Quiz | Questionnaire to capture user's style preferences upon first login | 5 question answers (gender, vibe, fit, color, lifestyle) | `StyleProfile` object with preference vector | Logs error if save fails | `OnboardingScreen.tsx`, `GetOnboardingQuestions.ts`, `CompleteOnboarding.ts` | Partially Implemented |
| 4 | Discovery | Discovery Choice Screen | Split choice screen after onboarding allowing user to enter Shop or Discover mode | User selection (Shop vs. Discover) | Screen navigation | N/A | PRD Section 6 & "Swipe/Browse Screen" | Missing / Unimplemented |
| 5 | Discovery | Discover Swipe Deck | Full screen product card interface for Tinder-style swiping | Swipe gestures (Right=Like, Left=Pass, Up=Super, Down=Detail) | Swipe event recorded, vector displacement applied, card popped | Offline fallback buffers event locally | `DiscoveryScreen.tsx`, `SwipeDeck.tsx`, `ProcessSwipe.ts`, `StyleDNA.ts` | Fully Implemented |
| 6 | Discovery | Vector Recommendation Feed | Real-time AI recommendation feed based on 384-dim BGE-Small vector similarity | `userId`, `limit`, optional `overrideVector` | Array of `Product` items | Returns empty array or fallback latest products | `GetRecommendations.ts`, Convex `recommendations.ts` | Fully Implemented |
| 7 | Catalog | Shop Mode Grid & Carousels | Traditional e-commerce discovery rails for browsing products | Scroll / tap actions | Horizontal product carousels (Latest, Recently Viewed, Recommended) | Shows empty state if no products | `HomeScreen.tsx`, `ProductCarousel.tsx` | Partially Implemented |
| 8 | Catalog | Category Tree Navigation | Hierarchical category browsing (Men/Women, Topwear, Bottomwear, Ethnic, etc.) | Category selection | Filtered product grid | N/A | PRD Section 5 & Convex `categories` table | Missing / Unimplemented |
| 9 | Catalog | Advanced Filtering UI | Modal/Drawer to filter products by Size, Color, Brand, Price, and Fit | Filter criteria selections | Refreshed product listing | N/A | PRD Section 5 | Missing / Unimplemented |
| 10 | Catalog | Product Text & Vector Search | Search bar supporting full-text title search and semantic vector search | Query string | Array of matching `Product` items and suggestions | Displays empty search state | `SearchScreen.tsx`, `SearchProducts.ts`, `OnnxEmbedder.ts` | Fully Implemented |
| 11 | Discovery | Partner Profile Sync Session Creation | Generate time-boxed invite link & QR code to blend recommendations with partner | Duration choice ('30m', '1h', '2h', '24h') | `inviteCode`, share link URL, QR modal | Displays alert if link generation fails | `PartnerSyncSettingsScreen.tsx`, `useCreatePartnerSync` | Fully Implemented |
| 12 | Discovery | Partner Profile Sync Consent Sheet | Explicit confirmation sheet displaying partner info, duration, data privacy, and Accept/Decline buttons | `inviteCode` tap | Acceptance or rejection | Shows error card if link expired/invalid | PRD Partner Profile Sync section vs. `app/sync/[inviteCode].tsx` | Missing / Unimplemented (Auto-accepts) |
| 13 | Discovery | Partner Sync Influence Slider | Slider on active session screen / Discover tab to adjust partner feed weighting (0-100%) | Slider position (0.0 to 1.0) | Updates `influenceRatio` in sync session | N/A | `BlendSlider.tsx` (unmounted on DiscoverScreen) | Partially Implemented |
| 14 | Discovery | Partner Sync Blended Feed Label | Visual badge on Discover feed indicating "Blended with {PartnerName}" | Active sync session state | Header/Card label overlay | N/A | PRD Partner Profile Sync section | Missing / Unimplemented |
| 15 | Commerce | Product Detail Page (PDP) | Comprehensive product view with image gallery, pricing, sizes, description, details | `productId` route parameter | Product information layout | Displays "Product not found" view | `ProductDetailScreen.tsx` | Fully Implemented |
| 16 | Commerce | PDP Sticky Footer Quantity Counter | Interactive +/- quantity counter toggling in sticky footer after adding to cart | Tap + or - buttons | Updated cart quantity | Prompts size selection if missing | PRD PDP section vs. `TransactionalFooter.tsx` | Partially Implemented |
| 17 | Commerce | PDP Expandable Accordions | Dropdown accordions for Description, Materials & Care, and Size & Fit | Accordion toggle tap | Expanded section content | N/A | PRD PDP section vs. `ProductDetailScreen.tsx` | Partially Implemented (Flat static cards) |
| 18 | Commerce | PDP Customer Reviews List | Section showing average rating stars and list of buyer reviews | `productId` | Review list and rating breakdown | N/A | PRD PDP section vs. `ProductDetailScreen.tsx` | Partially Implemented (Static rating only) |
| 19 | Commerce | Shopping Cart Management | Cart view with item list, quantity adjustment, price breakdown, and removal | Item quantity tap, remove tap | Updated cart subtotal, shipping, tax, total | Displays empty cart graphic | `CartScreen.tsx`, `ManageCart.ts`, `CartItem.tsx`, `PriceSummary.tsx` | Fully Implemented |
| 20 | Commerce | Cart Coupon Code Input | Field to enter discount codes with real-time total recalculation | Coupon code string | Applied discount amount | Displays error if coupon invalid | `CouponInput.tsx` (unintegrated in `CartScreen.tsx`) | Partially Implemented |
| 21 | Commerce | External Store Redirect Sheet | Modal presenting external buy links (Myntra/Ajio) when clicking "Proceed to Buy" | Tap "Proceed to Buy" | External browser redirection, tracks purchase click | N/A | `CartScreen.tsx` | Technical Drift / Unintended Flow |
| 22 | Commerce | Multi-Step Checkout Screen | Native checkout flow with shipping address form, COD payment selection, and confirmation | Address input, payment confirmation | Placed order confirmation view | Emits analytics event, clears cart | `CheckoutScreen.tsx`, `AddressForm.tsx` | Partially Implemented |
| 23 | Commerce | Order History Persistence | Database storage and retrieval of completed native orders with statuses and tracking | `userId` | List of past orders | N/A | PRD Profile section vs. Convex schema & `OrdersScreen.tsx` | Architectural Gap (Uses external click history) |
| 24 | Profile | Saved Delivery Addresses Management | Dedicated section in user profile to add, edit, and delete saved shipping addresses | Address CRUD forms | List of saved addresses | N/A | PRD Profile section | Missing / Unimplemented |
| 25 | Profile | Saved Payment Methods | Section to manage saved credit cards or UPI handles | Payment method inputs | List of saved payment options | N/A | PRD Profile section | Missing / Unimplemented |
| 26 | Profile | Application Settings | Controls for app preferences, notification toggles, and visual theme | Toggle switches | Updated user preferences | N/A | PRD Profile section | Missing / Unimplemented |
| 27 | Support | Help Center & FAQ | FAQ documentation and contact support form for customer care | Navigation tap | FAQ list / contact page | N/A | PRD Profile section | Missing / Unimplemented |
| 28 | Governance | System Logging & Tracing | High-fidelity structured logs with trace IDs, context, and error details | Log entries | Convex `logs` table | N/A | Convex `logs.ts`, `ManageLogs.ts`, Admin `LogsScreen.tsx` | Fully Implemented |
| 29 | Governance | Feature Flag & Rollout System | Feature toggle system supporting targeting rules (percentage, user_id, org_id) | Flag name, environment | Boolean flag evaluation | Defaults to false if flag missing | Convex `featureFlags.ts`, `FeatureFlagRepository.ts` | Fully Implemented |
| 30 | Admin | Operations Dashboard | Internal dashboard for monitoring products, scraping jobs, logs, feedback, users | Admin authentication | Admin Panel Web UI | Shows error state on unauthorized | `apps/admin-panel` | Fully Implemented |

---

## 4. Observed Edge Cases & Behavioral Findings

| # | Feature | Input / Scenario | Observed Behavior | Analysis / Risk |
|---|---------|------------------|-------------------|-----------------|
| 1 | Onboarding | Completing quiz with empty or partial answers | `initializeStyleProfile` assigns default empty vector `[]` and default fallback budget `₹0-10000` | Cold-start preference vector lacks initial clustering if user skips questions. |
| 2 | Partner Sync | User opens deep link `/sync/[inviteCode]` while unauthenticated | Screen prompts "Sign in to accept this style sync request" | Good auth protection, but after login redirect path back to invite link is unhandled. |
| 3 | Partner Sync | Partner opens active or expired invite link | Route auto-executes `acceptSync` mutation without user consent confirmation sheet | Violates PRD privacy requirement ("Accept sheet shows initiator identity... what's shared... Buttons: Accept / Decline"). |
| 4 | Product Detail | User taps "Add to Cart" without picking a size | Red error text appears and screen smoothly auto-scrolls to Size Selector | Excellent UX handling for size validation failure. |
| 5 | Commerce | User taps "Proceed to Buy" in Cart | Opens external marketplace redirect sheet (Myntra/Ajio) instead of navigating to native `CheckoutScreen` | Completely disconnects the built-in native Checkout flow (`CheckoutScreen.tsx`). |
| 6 | Checkout | User completes address and payment steps in `CheckoutScreen` | App shows "Order Placed!", emits analytics event, and clears cart. **No database record is created in Convex.** | Severe data gap. Refreshing or visiting "Your Orders" later will show zero native order history. |
| 7 | Orders History | User navigates to Profile -> "Your Orders" | Screen queries system board `"Your orders"` which tracks external links clicked, displaying "Tracked orders you have initiated checkout on external marketplaces" | Confuses native purchase history with affiliate/redirect link tracking. |
| 8 | Search | User types query < 3 characters in Search bar | Search suppresses network request and returns empty list | Prevents unnecessary backend queries for short strings. |

---

## 5. Technical Drift & Architectural Compliance Matrix

### 5.1 Hexagonal Layering (`packages/core` vs. `packages/infrastructure`)

| Layer | Rule | Compliance State | Violations / Evidence |
| :--- | :--- | :--- | :--- |
| **`packages/core`** | Must be "Pure TS" — ZERO imports from `convex`, `react`, `tamagui`, `expo`, `ui-kit` | **100% Compliant** | Verified via grep. Core contains zero UI or database imports. |
| **`packages/infrastructure/src/hooks`** | Must wrap external database calls via Ports & Adapters and call core use cases via `Effect.runPromise` | **Non-Compliant** | Hooks like `usePartnerSync.ts`, `useBoards.ts`, `useAuth.ts`, `useFeedback.ts` directly import `api` from `@app/convex` and invoke `useQuery` / `useMutation` directly, bypassing core ports and domain logic. |
| **Monorepo Dependencies** | Dependencies move inward: Apps -> Infra/UI-Kit -> Core | **Compliant** | `package.json` dependency declarations follow hexagonal rules. |

### 5.2 Coding Standards Compliance (`.agents/rules/coding-standards.md`)

| Rule | Requirement | Observed State | Compliance Status |
| :--- | :--- | :--- | :--- |
| **Strict Typing** | No `any` or `as any` allowed unless explicitly commented and justified | Over 300+ `any` / `as any` casts found in `infrastructure/`, `convex/`, `ports.ts`, `AuthAdapter.ts`, and UI screens | ❌ **FAIL** |
| **Runtime Validation** | MUST use **Zod** wherever runtime validation is applicable (Forms, Configs, API, Env Vars) | **Zero Zod schemas** exist in the entire codebase (`from 'zod'` returned 0 results) | ❌ **FAIL** |
| **Effect TS Errors** | Tagged Error types with `readonly _tag` discriminant | Domain errors in `core/` use tagged classes (`SwipeError`, `RecommendationError`, `CartNotFoundError`) | ✅ **PASS** |
| **Use Case Returns** | Return `Effect.Effect<Success, ErrorType>`, never raw `Promise` | All use case functions in `packages/core/src/*/application/` return `Effect.Effect` | ✅ **PASS** |
| **Queue Service** | Must use `QueueService<T>` interface | Implemented in `ports.ts` as `QueueService<T>` | ✅ **PASS** |

---

## 6. Prioritized Remediation Roadmap

To bring the StyleSwipe codebase into full alignment with the PRD specification and strict coding standards, the following steps are recommended:

### Phase 1: High Priority (Architectural & Data Gaps)
1. **Convex Order & Address Schema**: Create native Convex schema tables for `orders` (with line items, order statuses, totals, address snapshots) and `addresses` (user saved shipping addresses).
2. **Native Checkout Wire-up**: Connect `CartScreen.tsx`'s "Proceed to Checkout" button to navigate to `CheckoutScreen.tsx`, and update `CheckoutScreen` to execute a native `CreateOrder` use case persisting orders in Convex.
3. **Zod Integration**: Add Zod validation schemas for Onboarding forms, AddressForm, Auth inputs, and API responses across `core` and `infrastructure`.
4. **Partner Sync Consent Sheet**: Update `app/sync/[inviteCode].tsx` to present an explicit Accept/Decline sheet with initiator name, duration, and privacy terms before invoking `acceptSync`.

### Phase 2: Medium Priority (UI & Specification Gaps)
1. **Onboarding Questionnaire Enhancement**: Upgrade `OnboardingScreen.tsx` to include Age selection, multi-field top/waist/shoe size dropdowns, 4-photo visual Vibe grid, visual color swatches, and tiered budget comfort bands.
2. **Category Browser & Advanced Filters**: Build a dedicated Category Browser screen (Men/Women hierarchy) and a slide-out Advanced Filter UI drawer (Size, Color, Brand, Price, Fit) for Shop mode.
3. **Partner Sync UI Controls**: Mount `BlendSlider.tsx` on the Discover feed and active session view, and add the "Blended with {PartnerName}" overlay label on product cards.
4. **Profile Sub-screens**: Implement `My Addresses` management screen, `Settings` screen, and `Support/FAQ` screen in `apps/consumer-app`.

### Phase 3: Technical Debt & Cleanup
1. **Eliminate `any` Casts**: Refine TypeScript types across `packages/infrastructure/src/hooks/` and `shared/application/ports.ts` to eliminate `as any` casts.
2. **Infrastructure Hook Refactoring**: Refactor direct `useQuery`/`useMutation` calls in `usePartnerSync.ts`, `useBoards.ts`, and `useAuth.ts` to go through core Ports & `Effect.runPromise` execution.

---
*Report compiled and verified by Specification Miner Agent (`explorer_drift_1`).*
