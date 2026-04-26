# Mobile App — React Native + Expo

**Stack:** Expo 54 · React Native 0.81.5 · React 19 · TypeScript strict · expo-router v4 · TanStack Query v5 · Zustand v5 · MMKV v4 · Axios

## Critical Rules (read first)

1. **Path alias** `@/*` → `src/*`. Never use relative paths across src boundaries.
2. **MMKV v4 API**: `createMMKV({ id })` not `new MMKV()`. Method is `storage.remove(key)` not `storage.delete(key)`.
3. **Query keys always start with storeId**: `[storeId, 'products', filters]`. Without storeId prefix, cache leaks across stores.
4. **Every request sends two headers** (injected in `src/api/client.ts`):
   - `Host: <domain>` — tenant resolution
   - `Cookie: customer-token=<jwt>` — auth
5. **Auth cookies**: browser blocks `Set-Cookie` reads; React Native does not. Interceptor parses `Set-Cookie` → stores JWT in SecureStore.
6. **MMKV requires dev client** — incompatible with Expo Go. Build with `npx expo run:android` or `npx expo run:ios`.
7. **`ProductCard` reads theme/locale from stores internally** — do not pass `primaryColor` or `locale` as props.
8. **`AuthUser` shape** (from `/api/auth/customer`) has `{ userId, email, name }` — NOT `_id`. Full `IUser` (from login/register) has `_id`.

---

## Project Structure

```
mobile-app/
├── app.config.ts              # Dynamic Expo config (reads EXPO_PUBLIC_* env vars)
├── eas.json                   # Build profiles: development/preview/production/per-store
├── app/
│   ├── _layout.tsx            # Root: QueryClient + ThemeProvider + push notifications + hydration
│   ├── index.tsx              # Redirect: no store → onboarding, else → (tabs)
│   ├── onboarding/
│   │   └── store-select.tsx   # Domain input; auto-skips if BAKED_STORE_DOMAIN set
│   ├── search.tsx             # Full-screen search + MMKV recent history
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx          # Email + password; setFullUser on success
│   │   └── register.tsx       # name(req) + phone BD(req) + email(opt) + password
│   ├── (tabs)/
│   │   ├── _layout.tsx        # Tab bar: CartBadge + NotifBadge on Account tab
│   │   ├── index.tsx          # Home: hero carousel + categories + featured + WhatsApp/FB
│   │   ├── products.tsx       # Grid + category filter chips + sort bottom sheet modal
│   │   ├── cart.tsx           # CartItemRow + coupon + order summary
│   │   ├── orders.tsx         # Auth-gated order list (FlashList)
│   │   └── account.tsx        # Guest CTA or profile + menu + lang switcher
│   ├── products/[slug].tsx    # Detail: gallery + variants + qty + WhatsApp order + ReviewSection
│   ├── orders/[id].tsx        # Order detail + status timeline; ?confirmed=1 shows banner
│   ├── checkout/index.tsx     # Saved address picker (logged-in) + guest form + COD
│   └── account/
│       ├── addresses.tsx      # CRUD address list with set-default
│       ├── address-form.tsx   # Add/edit; pre-fills when ?id= param given
│       └── notifications.tsx  # List + mark read + mark all read
│
└── src/
    ├── api/
    │   ├── client.ts          # Axios instance; Host + Cookie interceptors; 401 auto-logout
    │   ├── auth.ts            # login/register → IUser; getMe() → AuthUser|null
    │   ├── products.ts        # getProducts(filters+pagination), getProduct(slug)
    │   ├── categories.ts      # getCategories()
    │   ├── orders.ts          # getOrders, getOrder(id), createOrder
    │   ├── addresses.ts       # CRUD + setDefault
    │   ├── notifications.ts   # list, unreadCount, markRead, markAllRead
    │   ├── reviews.ts         # getReviews, createReview, checkEligibility
    │   ├── coupons.ts         # validateCoupon
    │   ├── points.ts          # getPointsBalance
    │   └── stores.ts          # resolveStore(domain) → IStore
    │
    ├── store/
    │   ├── tenant.store.ts    # MMKV; holds IStore + domain; hydrate() on boot
    │   ├── auth.store.ts      # SecureStore; user(AuthUser) + fullUser(IUser) + token
    │   ├── cart.store.ts      # MMKV key 'cart-v1'; keyed by storeId; initForStore()
    │   └── settings.store.ts  # MMKV; locale(en|bn) + colorScheme
    │
    ├── hooks/
    │   ├── useProducts.ts     # useProducts(filters) infinite; useProduct(slug)
    │   ├── useCategories.ts   # staleTime 10min
    │   ├── useOrders.ts       # useOrders() auth-gated; useOrder(id) guest-ok
    │   ├── useAddresses.ts    # useAddresses + CRUD mutations
    │   ├── useNotifications.ts # useNotifications; useUnreadCount polls 60s
    │   └── useReviews.ts      # useReviews(productId); useCreateReview; useEligibility
    │
    ├── components/
    │   ├── product/ProductCard.tsx    # Reads theme+locale from stores internally
    │   └── reviews/ReviewSection.tsx  # List approved + write form (auth-gated)
    │
    ├── context/
    │   └── ThemeContext.tsx    # useTheme() → { primaryColor, bgColor, isDark, … }
    │
    ├── lib/
    │   └── pushNotifications.ts # register token, save to server, foreground handler
    │
    ├── config/
    │   └── env.ts             # API_BASE_URL, BAKED_STORE_DOMAIN from Constants.expoConfig.extra
    │
    └── shared/
        ├── types/             # auth, store, product, order, cart, category, review, etc.
        └── lib/
            ├── i18n.ts        # t(LocalizedString, locale) → string
            └── phone.ts       # normalizePhone(bd format)
```

---

## State Management

### Auth Store (`src/store/auth.store.ts`)
```ts
user: AuthUser | null        // { userId, email, name } — from /api/auth/customer
fullUser: IUser | null       // full user — from login/register response
token: string | null         // JWT stored in SecureStore
```
- `setUser(AuthUser)` — lightweight, from getMe()
- `setFullUser(IUser)` — full, from login/register
- `logout()` — clears both + SecureStore
- `hydrate()` — called on app boot, loads token from SecureStore

### Tenant Store (`src/store/tenant.store.ts`)
```ts
store: IStore | null
domain: string
```
- `setStore(store, domain)` — saves to MMKV
- `hydrate()` — loads from MMKV on boot

### Cart Store (`src/store/cart.store.ts`)
- Keyed by storeId in MMKV. `initForStore(storeId)` clears cart on store switch.
- `itemCount`, `subtotal`, `total`, `discount` are computed selectors.

### Settings Store (`src/store/settings.store.ts`)
- `locale`: `"en"` | `"bn"`. `setLocale(l)` persists to MMKV.
- `colorScheme`: `"light"` | `"dark"`. ThemeContext reads this.

---

## API Client (`src/api/client.ts`)

Request interceptor injects:
```
Host: <tenantStore.domain>
Cookie: customer-token=<authStore.token>
```

Response interceptor:
- Parses `Set-Cookie` for `customer-token=` → calls `authStore.setToken()`
- On 401 → calls `authStore.logout()`

---

## TanStack Query Conventions

- Default: `staleTime 2min`, `gcTime 24h`, `networkMode offlineFirst`
- App foreground triggers refetch via `focusManager` in `_layout.tsx`
- All keys: `[storeId, 'entity', ...params]`
- Mutations invalidate with same `[storeId, 'entity', userId]` key

---

## Theming (`src/context/ThemeContext.tsx`)

```ts
const { primaryColor, bgColor, textColor, headerBg, isDark } = useTheme();
```
- Provided by `<ThemeProvider>` in root layout
- Reads `store.theme` + `settingsStore.colorScheme`
- Dark mode uses `store.theme.dark.*` overrides when `colorScheme === 'dark'`
- `ProductCard` and existing components read from stores directly — use `useTheme()` for new components

---

## White-Label Builds

Each store = separate EAS build profile that bakes in domain + bundle ID:
```bash
eas build --profile shirts-store --platform android
eas build --profile punjabi-store --platform ios
```

Config in `eas.json`. Dynamic config in `app.config.ts` reads `EXPO_PUBLIC_*` env vars.

Auto-connects without onboarding when `EXPO_PUBLIC_STORE_DOMAIN` is set.

---

## Internationalization

- `locale` from `settingsStore` — `"en"` or `"bn"`
- `t(localizedString, locale)` from `src/shared/lib/i18n.ts` resolves `LocalizedString`
- Account tab has language toggle (tap en ↔ bn, persists to MMKV)
- Products, categories, hero banners all use `t()` for names

---

## Push Notifications

Registered in `_layout.tsx` after auth token hydrates.  
Token sent to `POST /api/notifications/push-token`.  
Foreground handler invalidates `notifications-unread` query (updates tab badge).  
Requires real device or dev client — won't get token on simulator.

---

## Dev Setup

```bash
cd mobile-app
npm install
# Add to /etc/hosts: 127.0.0.1 shirts.localhost punjabi.localhost
npx expo run:android        # builds dev client (required for MMKV)
# OR
npx expo run:ios
```

Backend must run at `http://localhost:3000` (or set `EXPO_PUBLIC_API_URL`).

---

## Known Gotchas

| Issue | Fix |
|---|---|
| `createMMKV` not `new MMKV` | MMKV v4 breaking change |
| `storage.remove()` not `storage.delete()` | MMKV v4 breaking change |
| `AuthUser.userId` not `._id` | Lightweight shape from `/api/auth/customer` |
| `ProductCard` ignores `primaryColor` prop | It reads from store — don't pass it |
| Search screen needs `fullScreenModal` presentation | Set in `_layout.tsx` Stack.Screen |
| `expo-device` not installed | Removed from pushNotifications.ts; uses try/catch instead |
