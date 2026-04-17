# Multi-Tenant E-Commerce Platform

## Project Overview
A single Next.js application serving multiple e-commerce websites dynamically based on domain name. Each domain gets its own theme, branding, product catalog, and storefront - managed from one admin dashboard and one MongoDB database.

## Tech Stack
- **Framework:** Next.js 16 (App Router, TypeScript strict mode, React 19)
- **Database:** MongoDB with Mongoose ODM
- **Styling:** Tailwind CSS v4 + CSS custom properties for dynamic theming
- **Auth:** JWT via `jose` (Edge-compatible) + `bcryptjs` for password hashing
- **Payment:** Stripe + SSLCommerz (per-store configuration); WhatsApp / Messenger order handoff
- **File Storage:** RustFS (S3-compatible, accessed via @aws-sdk/client-s3); `sharp` for image processing
- **Validation:** Zod for all API input validation
- **i18n:** `next-intl` (locales: `en`, `bn`; default `en`; `localeDetection: false`)
- **Email / SMS:** `nodemailer` for transactional email; SMS helper in `src/shared/lib/sms.ts`
- **Slugs:** `slugify`
- **Client UX:** `react-hot-toast`
- **Icons:** lucide-react
- **SEO:** generateMetadata, JSON-LD structured data, dynamic sitemap/robots

## Architecture Pattern: Feature-Based + Repository/Service

### Separation of Concerns
```
API Route (app/api/) → Service (business logic) → Repository (DB queries)
     ↑                      ↑                          ↑
  Thin handler          Orchestrates              Only place that
  validates input,      business rules,           touches Mongoose
  calls service,        calls repository          models directly
  returns response
```

- **API Routes:** Thin handlers - validate input with Zod, call service, return response. NO business logic here.
- **Services:** Business logic layer - orchestrates operations, calls repositories. Never touches Mongoose directly.
- **Repositories:** Data access layer - the ONLY place that queries Mongoose models. Returns plain objects (`.lean()`).
- **Schemas (Zod):** Input validation schemas for API requests.
- **Models (Mongoose):** Database schema definitions only. No business logic in models.

## Project Structure (MUST follow this layout)

```
ecommerce-website/
├── middleware.ts                              # Domain resolution - resolves Host to storeId
├── next.config.ts
├── tailwind.config.ts
├── .env.local
├── .env.example
├── AGENTS.md                                 # Agent/automation notes
├── messages/                                 # next-intl translation bundles
│   ├── en.json
│   └── bn.json
├── scripts/
│   ├── seed.ts                               # Seed demo stores, products, admin user
│   └── migrate-i18n.ts                       # One-off migration to localized content
│
├── src/
│   ├── i18n/                                 # next-intl configuration
│   │   ├── routing.ts                        # Locales + defaultLocale (en, bn)
│   │   └── request.ts                        # Server-side locale resolver
│   │
│   ├── app/                                  # ONLY routing + page shells. Minimal logic.
│   │   ├── layout.tsx                        # Root layout - reads tenant, injects CSS theme vars
│   │   ├── globals.css
│   │   ├── error.tsx                         # Global error boundary
│   │   ├── sitemap.ts                        # Dynamic sitemap per store
│   │   ├── robots.ts                         # Dynamic robots.txt per store
│   │
│   │   ├── (storefront)/                     # Route group: customer-facing pages
│   │   │   ├── layout.tsx                    # Storefront layout (Header + Footer)
│   │   │   ├── page.tsx                      # Homepage (hero, featured products)
│   │   │   ├── products/
│   │   │   │   ├── page.tsx                  # Product listing
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx              # Product detail
│   │   │   ├── categories/
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx              # Category listing
│   │   │   ├── cart/
│   │   │   │   └── page.tsx
│   │   │   ├── checkout/
│   │   │   │   └── page.tsx
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx                  # Customer order history
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   └── account/
│   │   │       ├── page.tsx                  # Customer profile
│   │   │       ├── login/
│   │   │       │   └── page.tsx
│   │   │       └── register/
│   │   │           └── page.tsx
│   │   │
│   │   ├── (admin)/                          # Route group: admin panel
│   │   │   └── admin/
│   │   │       ├── layout.tsx                # Minimal pass-through (no sidebar)
│   │   │       ├── login/
│   │   │       │   └── page.tsx              # Login page (no sidebar/auth)
│   │   │       ├── _components/              # Shared admin components (MobileAdminNav, AdminLogoutButton)
│   │   │       └── (protected)/              # Auth-guarded route group
│   │   │           ├── layout.tsx            # Sidebar + auth check + permission context
│   │   │           ├── page.tsx              # Dashboard stats
│   │   │           ├── roles/                # Role CRUD (superadmin only)
│   │   │           ├── admins/               # Admin user CRUD (superadmin only)
│   │   │           └── stores/
│   │   │           ├── page.tsx              # List all stores
│   │   │           ├── new/
│   │   │           │   └── page.tsx
│   │   │           └── [storeId]/
│   │   │               ├── page.tsx          # Edit store + theme editor
│   │   │               ├── products/
│   │   │               │   ├── page.tsx
│   │   │               │   ├── new/
│   │   │               │   │   └── page.tsx
│   │   │               │   └── [productId]/
│   │   │               │       └── page.tsx
│   │   │               ├── categories/
│   │   │               │   └── page.tsx
│   │   │               ├── orders/
│   │   │               │   ├── page.tsx
│   │   │               │   └── [orderId]/
│   │   │               │       └── page.tsx
│   │   │               └── customers/
│   │   │                   └── page.tsx
│   │   │
│   │   └── api/                              # API routes (thin handlers)
│   │       ├── auth/                         # login, register, admin-login, me
│   │       ├── addresses/                    # Customer address book
│   │       ├── admin/                        # Admin-only endpoints
│   │       ├── admins/                       # Admin user CRUD (superadmin only)
│   │       ├── announcements/                # Store announcements / banners
│   │       ├── cart/
│   │       ├── categories/
│   │       ├── coupons/                      # Coupon codes + redemption
│   │       ├── locale/                       # Get/set user locale preference
│   │       ├── notifications/                # In-app / transactional notifications
│   │       ├── orders/
│   │       ├── payment/                      # create-intent, webhook
│   │       ├── points/                       # Loyalty points balance + ledger
│   │       ├── products/
│   │       ├── reviews/
│   │       ├── roles/                        # Role CRUD (superadmin only)
│   │       ├── stores/                       # CRUD + resolve (domain → store)
│   │       ├── subscribers/                  # Newsletter subscribers
│   │       ├── track/                        # Order tracking (public)
│   │       └── upload/                       # Presigned / direct file upload
│   │
│   ├── features/                             # Feature-based modules (core business logic)
│   │   │
│   │   ├── stores/
│   │   │   ├── model.ts                      # Mongoose schema for Store
│   │   │   ├── repository.ts                 # DB queries (findByDomain, findById, create, update)
│   │   │   ├── service.ts                    # Business logic (resolveByDomain, createStore, updateTheme)
│   │   │   ├── schemas.ts                    # Zod validation (createStoreSchema, updateThemeSchema)
│   │   │   ├── types.ts                      # TypeScript interfaces (IStore, StoreTheme, etc.)
│   │   │   └── components/                   # Store-specific components
│   │   │       ├── ThemeEditor.tsx
│   │   │       ├── StoreForm.tsx
│   │   │       ├── StoreSelector.tsx
│   │   │       └── StoreCard.tsx
│   │   │
│   │   ├── products/
│   │   │   ├── model.ts                      # Mongoose schema for Product
│   │   │   ├── repository.ts                 # DB queries (findByStore, findBySlug, search)
│   │   │   ├── service.ts                    # Business logic (createProduct, updateStock)
│   │   │   ├── schemas.ts                    # Zod validation
│   │   │   ├── types.ts                      # TypeScript interfaces
│   │   │   └── components/
│   │   │       ├── ProductCard.tsx
│   │   │       ├── ProductGrid.tsx
│   │   │       ├── ProductDetail.tsx
│   │   │       ├── ProductForm.tsx           # Admin product form
│   │   │       └── ProductJsonLd.tsx         # SEO: JSON-LD structured data
│   │   │
│   │   ├── categories/
│   │   │   ├── model.ts
│   │   │   ├── repository.ts
│   │   │   ├── service.ts
│   │   │   ├── schemas.ts
│   │   │   ├── types.ts
│   │   │   └── components/
│   │   │       ├── CategoryNav.tsx
│   │   │       └── CategoryForm.tsx
│   │   │
│   │   ├── auth/
│   │   │   ├── model.ts                      # User + AdminUser Mongoose schemas (AdminUser: roleId, assignedStores)
│   │   │   ├── repository.ts                 # findByEmail, createUser, etc.
│   │   │   ├── service.ts                    # login, register, CRUD admins, populateRole at runtime
│   │   │   ├── schemas.ts                    # loginSchema, registerSchema, createAdminSchema (roleId required)
│   │   │   ├── types.ts                      # IAdminUser, IAdminUserWithRole, JwtAdminPayload
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts                # Client-side auth state
│   │   │   └── components/
│   │   │       ├── LoginForm.tsx
│   │   │       ├── RegisterForm.tsx
│   │   │       └── AuthGuard.tsx             # Protected route wrapper
│   │   │
│   │   ├── cart/
│   │   │   ├── model.ts
│   │   │   ├── repository.ts
│   │   │   ├── service.ts                    # addItem, removeItem, mergeGuestCart
│   │   │   ├── schemas.ts
│   │   │   ├── types.ts
│   │   │   ├── hooks/
│   │   │   │   └── useCart.ts                # Client-side cart state
│   │   │   └── components/
│   │   │       ├── CartDrawer.tsx
│   │   │       ├── CartItem.tsx
│   │   │       └── CartSummary.tsx
│   │   │
│   │   ├── orders/
│   │   │   ├── model.ts
│   │   │   ├── repository.ts
│   │   │   ├── service.ts                    # placeOrder, updateStatus, generateOrderNumber
│   │   │   ├── schemas.ts
│   │   │   ├── types.ts
│   │   │   └── components/
│   │   │       ├── OrderTable.tsx
│   │   │       ├── OrderDetail.tsx
│   │   │       └── CheckoutForm.tsx
│   │   │
│   │   ├── roles/
│   │   │   ├── model.ts                      # Role schema (name, permissions[], isSuperAdmin)
│   │   │   ├── repository.ts
│   │   │   ├── service.ts                    # CRUD + blocks delete if admins assigned
│   │   │   ├── schemas.ts                    # createRoleSchema (includes isSuperAdmin)
│   │   │   ├── types.ts                      # IRole, IRoleDocument
│   │   │   └── components/
│   │   │       └── RoleForm.tsx
│   │   │
│   │   ├── reviews/
│   │   │   ├── model.ts
│   │   │   ├── repository.ts
│   │   │   ├── service.ts
│   │   │   ├── schemas.ts
│   │   │   ├── types.ts
│   │   │   └── components/
│   │   │       ├── ReviewForm.tsx
│   │   │       ├── ReviewList.tsx
│   │   │       └── ReviewStars.tsx
│   │   │
│   │   ├── payment/
│   │   │   ├── service.ts                    # createPaymentSession, handleWebhook
│   │   │   ├── stripe.ts                     # Stripe-specific logic
│   │   │   ├── sslcommerz.ts                 # SSLCommerz-specific logic
│   │   │   ├── schemas.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── analytics/                        # Store analytics (visits, conversions, revenue)
│   │   │   ├── model.ts
│   │   │   ├── repository.ts
│   │   │   ├── service.ts
│   │   │   ├── schemas.ts
│   │   │   ├── types.ts
│   │   │   └── hooks/
│   │   │
│   │   ├── coupons/                          # Coupon codes + redemption tracking
│   │   │   ├── model.ts
│   │   │   ├── repository.ts
│   │   │   ├── service.ts
│   │   │   ├── schemas.ts
│   │   │   ├── types.ts
│   │   │   └── components/
│   │   │
│   │   ├── notifications/                    # In-app / email / SMS notifications
│   │   │   ├── model.ts
│   │   │   ├── repository.ts
│   │   │   ├── service.ts
│   │   │   ├── schemas.ts
│   │   │   ├── types.ts
│   │   │   └── components/
│   │   │
│   │   ├── points/                           # Loyalty points (earn, redeem, ledger)
│   │   │   ├── model.ts
│   │   │   ├── repository.ts
│   │   │   ├── service.ts
│   │   │   └── types.ts
│   │   │
│   │   └── subscribers/                      # Newsletter subscribers
│   │       ├── model.ts
│   │       ├── repository.ts
│   │       ├── service.ts
│   │       ├── schemas.ts
│   │       └── types.ts
│   │
│   ├── shared/                               # Cross-cutting concerns
│   │   ├── components/
│   │   │   ├── ui/                           # Reusable primitives (use these everywhere)
│   │   │   │   ├── Button.tsx                # variants: primary/brand/secondary/ghost/danger/danger-outline
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Textarea.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── Field.tsx                 # label + input + hint + error wrapper (auto-wires a11y)
│   │   │   │   ├── Card.tsx                  # Card + CardHeader
│   │   │   │   ├── Alert.tsx                 # info/success/warning/error
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── ConfirmDialog.tsx         # replaces native confirm()
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   ├── Spinner.tsx
│   │   │   │   ├── PageHeader.tsx            # PageHeader + SectionHeader
│   │   │   │   ├── LangTabs.tsx              # language-tab pattern for i18n forms
│   │   │   │   ├── Price.tsx                 # currency formatter (BDT ৳ + Intl)
│   │   │   │   └── index.ts                  # Barrel export — import from here
│   │   │   ├── storefront/                   # Shared storefront layout components
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   ├── HeroBanner.tsx
│   │   │   │   └── Breadcrumbs.tsx
│   │   │   ├── admin/                        # Shared admin layout components
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── DashboardStats.tsx
│   │   │   │   └── AdminHeader.tsx
│   │   │   └── seo/                          # SEO components
│   │   │       ├── JsonLd.tsx                # Generic JSON-LD wrapper
│   │   │       ├── BreadcrumbJsonLd.tsx
│   │   │       └── OrganizationJsonLd.tsx
│   │   │
│   │   ├── hooks/
│   │   │   └── useTenant.ts                  # Client-side tenant context access
│   │   │
│   │   ├── context/
│   │   │   ├── TenantContext.tsx              # Provides tenant config to client components
│   │   │   └── index.ts
│   │   │
│   │   ├── lib/                              # Core utilities
│   │   │   ├── db.ts                         # MongoDB connection singleton
│   │   │   ├── tenant.ts                     # getTenant() - reads store from request headers
│   │   │   ├── auth.ts                       # JWT sign/verify helpers
│   │   │   ├── permissions.ts                # hasPermission / canAccessStore helpers
│   │   │   ├── storage.ts                    # RustFS upload/delete helpers
│   │   │   ├── email.ts                      # nodemailer transport + transactional email
│   │   │   ├── sms.ts                        # SMS sender helper
│   │   │   ├── phone.ts                      # Phone number parsing / normalization
│   │   │   ├── i18n.ts                       # Shared i18n helpers
│   │   │   ├── seo.ts                        # SEO helpers (generateMetadata factory, JSON-LD builders)
│   │   │   ├── api-response.ts               # Standardized API response helpers
│   │   │   └── constants.ts
│   │   │
│   │   └── types/                            # Shared TypeScript types
│   │       ├── api.ts                        # ApiResponse<T>, PaginatedResponse<T>
│   │       └── common.ts                     # Shared enums, base types
│   │
│   └── config/                               # App configuration
│       └── site.ts                           # Default site config, fallback values
│
└── public/
    └── uploads/                              # Local dev only; production uses RustFS
```

## Critical Architecture Rules

### 1. Every query MUST include storeId
Never query products, orders, users, categories, carts, or reviews without filtering by `storeId`. This is the data isolation mechanism.
```typescript
// CORRECT - in repository
const products = await ProductModel.find({ storeId, isActive: true }).lean();

// WRONG - leaks data across stores
const products = await ProductModel.find({ isActive: true }).lean();
```

### 2. Feature modules are self-contained
Each feature under `src/features/` owns its model, repository, service, schemas, types, and components. Cross-feature imports go through the service layer, never directly to another feature's repository.
```typescript
// CORRECT - feature calls another feature's service
import { StoreService } from '@/features/stores/service';

// WRONG - feature reaches into another feature's repository
import { storeRepository } from '@/features/stores/repository';
```

### 3. API routes are thin handlers
API routes ONLY: validate input (Zod), call service, return response. No business logic in route files.
```typescript
// app/api/products/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  const validated = createProductSchema.parse(body);       // Zod validation
  const product = await ProductService.create(validated);  // Service call
  return NextResponse.json(product, { status: 201 });      // Response
}
```

### 4. Repositories are the ONLY DB access layer
Only repository files import Mongoose models. Services never call `.find()`, `.save()`, etc. directly.

### 5. Middleware handles tenant resolution
`middleware.ts` reads the `Host` header, resolves it to a store, and sets `x-store-id` and `x-store-slug` headers. Server Components read these via `getTenant()` from `src/shared/lib/tenant.ts`.

### 6. Admin routes bypass tenant resolution
The middleware SKIPS paths starting with `/admin`, `/api`, `/_next`. Admin routes get `storeId` from request params or body, NOT from headers.

### 7. Theming via CSS custom properties
Theme colors/fonts are injected as CSS variables on `<html>` by root layout. Tailwind extends with these variables. Components use `bg-primary`, `text-secondary`, etc.

### 8. Role-based authentication system
- **Customers:** per-store accounts, JWT in `customer-token` cookie
- **Admins:** global accounts, JWT in `admin-token` cookie
- **Admin roles** are stored in the `Role` collection with fields: `name`, `description`, `permissions[]`, `isSuperAdmin: boolean`
- **AdminUser** has `roleId` (required ref to Role) and `assignedStores[]` — no inline `role` enum or `permissions` array
- Permissions are resolved **at runtime** by populating `roleId` — no denormalized copy. Update a Role's permissions and all admins with that role get the change immediately.
- `getAdminDbUser()` returns `IAdminUserWithRole` (admin + populated `.role`)
- `hasPermission()` and `canAccessStore()` accept both flat `{ isSuperAdmin, permissions }` and nested `{ role: { isSuperAdmin, permissions } }` shapes
- SuperAdmin bypass: `role.isSuperAdmin === true` grants unrestricted access (replaces old `role === "superadmin"` enum check)
- Role deletion is blocked if admins are still assigned to it

### 9. File uploads go to RustFS
All file uploads go to RustFS via S3-compatible API using `@aws-sdk/client-s3`. Use `src/shared/lib/storage.ts` for all upload/delete operations. Never store files locally in production.

### 10. Mongoose documents must be serialized
Repositories always use `.lean()` and return plain objects. Use `JSON.parse(JSON.stringify(doc))` when passing to Client Components.

## SEO Best Practices

### Every storefront page MUST implement:
1. **`generateMetadata()`** - Dynamic title, description, og:image from store/product data
2. **Canonical URL** - `<link rel="canonical">` using the store's actual domain
3. **Open Graph tags** - og:title, og:description, og:image, og:url

### Product pages additionally need:
4. **JSON-LD Product structured data** - name, price, availability, rating, reviews
5. **JSON-LD BreadcrumbList** - Home > Category > Product

### Store-level SEO:
6. **Dynamic `sitemap.ts`** - generates sitemap.xml per store based on domain
7. **Dynamic `robots.ts`** - generates robots.txt per store
8. **JSON-LD Organization** - store name, logo, contact from Store document

### SEO helper pattern:
```typescript
// In page files, use the seo helper factory:
import { createStoreMetadata } from '@/shared/lib/seo';

export async function generateMetadata({ params }): Promise<Metadata> {
  const tenant = await getTenant();
  const product = await ProductService.findBySlug(tenant._id, params.slug);
  return createStoreMetadata(tenant, {
    title: product.name,
    description: product.shortDescription,
    image: product.thumbnail,
    path: `/products/${product.slug}`,
  });
}
```

## Environment Variables
```
MONGODB_URI=mongodb://localhost:27017/ecommerce-multitenant
JWT_SECRET=
JWT_EXPIRY=7d

# RustFS (S3-compatible)
RUSTFS_ENDPOINT=http://localhost:9000
RUSTFS_ACCESS_KEY=
RUSTFS_SECRET_KEY=
RUSTFS_BUCKET=ecommerce-uploads

# Stripe (fallback - stores override with own keys)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=

# SSLCommerz
SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWORD=
SSLCOMMERZ_IS_SANDBOX=true

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Local Development
1. Add to `/etc/hosts`: `127.0.0.1 shirts.localhost punjabi.localhost shoes.localhost`
2. Start MongoDB locally
3. Start RustFS locally
4. Run `npx tsx scripts/seed.ts` to create demo stores
5. Run `npm run dev`
6. Visit `http://shirts.localhost:3000` and `http://punjabi.localhost:3000` to see different stores

## Internationalization (i18n)
- Configured via `next-intl`. Locales: `en` (default), `bn`. `localeDetection` is disabled — locale is explicit (cookie / `/api/locale`).
- Translation bundles live in `messages/{locale}.json`.
- Server-side locale resolution: `src/i18n/request.ts`. Routing config: `src/i18n/routing.ts`.
- One-off migration script: `npx tsx scripts/migrate-i18n.ts`.

## UI / UX Design Spec (enforce on every page)

**The goal: every page looks like it came from the same product.** If a pattern isn't covered here, match the closest existing primitive rather than inventing a new look.

### Rule 0 — Use primitives, never inline styling

Import from `@/shared/components/ui`. Never hand-roll buttons, inputs, modals, or error banners with raw Tailwind utility stacks. If a primitive is missing a variant you need, **extend the primitive** — don't work around it.

```tsx
import { Button, Input, Field, Card, Alert, Modal, ConfirmDialog,
         EmptyState, Spinner, PageHeader, SectionHeader, LangTabs,
         Badge, Price } from "@/shared/components/ui";
```

### Design tokens (defined in `globals.css`)

| Token | Value | Use for |
|---|---|---|
| `--color-primary` | tenant brand | storefront CTAs, brand accents, focus rings |
| `--color-secondary` | tenant | secondary storefront accents |
| `--color-accent` | tenant | discount badges, cart badge, alerts |
| `--color-bg` | tenant | page background |
| `--color-text` | tenant | body text |
| `--color-header-bg` / `--color-header-text` | tenant | storefront header |
| `--color-surface` | `#FAFAFA` | subtle panel backgrounds |
| `--color-border-subtle` | `#F3F4F6` | hairline dividers |
| `--color-text-secondary` | `#6B7280` | muted body |
| `--color-text-tertiary` | `#9CA3AF` | placeholders, captions |
| `--border-radius` | `0.5rem` | themed radius |
| `--shadow-{xs,sm,md,lg}` | — | Tailwind `shadow-xs`/`sm`/`md`/`lg` |
| `--ease-out-expo` | — | all meaningful transitions |

**Reference tokens as Tailwind classes (`bg-primary`, `shadow-md`) when possible.** Use inline `style={{ color: "var(--color-primary)" }}` only when a theme-tenant color is needed and Tailwind doesn't resolve it in that context (e.g., arbitrary values with `color-mix`).

### Storefront vs Admin tone

| | Storefront | Admin |
|---|---|---|
| Primary action | `<Button variant="brand">` — uses tenant `--color-primary` | `<Button variant="primary">` — gray-900, brand-neutral |
| Background | `var(--color-bg)` | `bg-gray-50` |
| Density | Airy — `py-8`/`py-10` sections | Dense — `p-4 md:p-8` page frame |
| Fonts | `--font-family` (tenant) or Hind Siliguri for `bn` | Same |
| Hero / decorative animations | Yes — `stagger-children`, `animate-hero-zoom` | No — admin is a tool, not a showcase |

**Admin must not read tenant theme colors** — it's cross-store. Admin uses neutral grays and the `primary` button variant.

### Layout

- **Page container:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`. Do not invent alternate widths.
- **Form width:** `max-w-2xl` for simple forms, `max-w-3xl` for complex (product, store).
- **Section spacing:** `space-y-6` between `<Card>`s; `py-8 md:py-10` between storefront hero sections.
- **Every page starts with `<PageHeader>`** (admin) or a hero section (storefront landing pages).

### Radius rules

- **Small interactive elements** (buttons, inputs, badges, chips): `rounded-lg`
- **Cards / panels:** `rounded-lg`
- **Modals / dropdowns / menus:** `rounded-xl`
- **Pills / tags / count bubbles:** `rounded-full`
- **Product cards, hero images, themed surfaces:** inline `style={{ borderRadius: "var(--border-radius)" }}` (follows tenant theme)

### Typography

- **Page title (`<PageHeader>`):** `text-2xl font-bold tracking-tight`
- **Section title (`<SectionHeader>`):** `text-lg font-semibold`
- **Card title:** `text-base font-semibold`
- **Body:** default (`text-sm` in admin, default in storefront)
- **Muted:** `text-gray-500`; Tertiary: `text-gray-400`
- **Labels:** `text-sm font-medium text-gray-700` (handled by `<Field>`)
- Body gets `letter-spacing: -0.01em` globally — don't override.

### Buttons

| Variant | When |
|---|---|
| `primary` | Default CTA in admin, brand-neutral. Gray-900. |
| `brand` | Storefront CTAs that should adopt tenant color (Add to Cart, Checkout). Uses `var(--color-primary)`. |
| `secondary` | Low-emphasis action alongside a primary (Cancel, Back). |
| `ghost` | Toolbar buttons, in-row actions. |
| `danger` | Destructive confirm button (inside `ConfirmDialog`). |
| `danger-outline` | Destructive trigger button on a form page (Delete Category). |

**Rules:**
- Exactly **one primary/brand button per form or dialog.** Pair with `secondary` (Cancel), never two primaries.
- `loading={true}` shows spinner and disables automatically. Use this, not a separate "Saving…" label.
- Icons: pass as `leftIcon={<Plus size={16} />}` — don't stuff them into children.
- Sizes: `md` (default), `sm` for inline/toolbar, `lg` for prominent storefront CTAs, `icon` for icon-only.

### Forms

- Always wrap inputs in `<Field label="…" hint="…" error="…" required>`. `Field` auto-wires `htmlFor`, `aria-describedby`, and `aria-invalid`.
- Use `<Input>`, `<Textarea>`, `<Select>` — never raw `<input>`/`<textarea>`/`<select>`.
- Error summary at top of form: `<Alert tone="error">`.
- Language-aware forms: use `<LangTabs languages={...} active={...} onChange={...} />`.
- Delete actions: **never** use browser `confirm()`. Use `<ConfirmDialog tone="danger" />`.
- Form actions row: `flex flex-wrap items-start justify-between gap-4` — primary + secondary on the left, destructive (if any) on the right.

### Feedback & async

- **Success / error toasts:** `react-hot-toast` (`toast.success(...)`, `toast.error(...)`). Single `<Toaster position="top-right" />` in root layout — don't add more.
- **Inline errors:** `<Alert tone="error">` at the top of a form or section.
- **Loading states:** `<Spinner>` for small, `<Button loading>` for buttons. For full-page or section loads, return a skeleton grid using the `shimmer` animation — don't just show a spinner in the center.
- **Empty states:** always use `<EmptyState icon={...} title="..." description="..." action={...} />`. Never show a blank area.

### Cards & surfaces

- Use `<Card padding="lg">` for primary content blocks. `<Card padding="md">` for denser lists.
- Never stack `rounded-lg border` divs manually — that's a Card.
- Card title: use `<CardHeader title="..." description="..." action={...} />`.

### Animation rules

- All meaningful transitions use `--ease-out-expo`. Durations: `150ms` (button/input), `200–300ms` (dropdown/drawer), `500ms` (image zoom).
- Enter animations: `animate-fade-in-up`, `animate-scale-in`, `animate-slide-down`, `animate-slide-in-right`. Exit animations only when a component actually unmounts on a delay.
- Lists use `stagger-children` for up to 8 items. Beyond that, drop the stagger.
- **Never animate on every state change.** Hover/focus = `transition-colors`; mount = one-shot animation.

### Accessibility (non-negotiable)

- Focus must be visible. Use `focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]` or the `.focus-ring` utility. **Never `focus:outline-none` without a replacement.** The primitives already do this correctly — just use them.
- Every icon-only button has `aria-label`.
- Modals set `role="dialog" aria-modal="true"`, trap focus, restore body scroll, close on Escape.
- Color is never the only signal (add icon/text to status).
- Minimum touch target: 40×40px (`p-2.5` on icon buttons).
- Form errors: `<Field error="…">` wires `aria-invalid` and `aria-describedby` — use it.

### Internationalization

- **No hardcoded UI strings.** Every user-visible string goes through `useTranslations()` / `getTranslations()` from `next-intl`.
- Localized content fields (product name, category name, etc.) use `LocalizedString` and the `t()` helper from `@/shared/lib/i18n`.
- Currency: use `<Price amount={...} currency={...} locale={...} />` — never hardcode `৳` or `$`.
- Bengali (`bn`) gets `Hind Siliguri` font (handled in root layout). Header nav switches from uppercase-tracked to natural `text-[15px]` for `bn`.
- RTL: not currently supported; avoid left/right-specific classes where `start`/`end` equivalents exist if you can.

### When building a new page

1. Start with `<PageHeader title="..." actions={...} />` (admin) or hero (storefront).
2. Wrap sections in `<Card>`.
3. Forms: `<Field>` + primitive inputs + `<Alert tone="error">` for form-level errors + `<Button variant="primary|brand">` + `<Button variant="secondary">`.
4. Destructive actions: `<Button variant="danger-outline">` trigger + `<ConfirmDialog tone="danger">`.
5. Empty results: `<EmptyState>`.
6. Loading: `<Button loading>` / `<Spinner>` / skeleton with `shimmer`.
7. Success/error: `toast.success()` / `toast.error()`.

**If a design need doesn't fit these rules, extend the primitive or propose a spec change — don't fork the look.**

## Coding Conventions
- Use TypeScript strict mode
- Validate all API inputs with Zod schemas (defined in feature's `schemas.ts`)
- Use Next.js App Router conventions (Server Components by default, `"use client"` only when needed)
- API routes return `NextResponse.json()` with appropriate status codes
- Use `async/await` throughout, no callbacks
- Error responses follow: `{ error: "message" }` format
- Use named exports for components, default exports only for page/layout files
- Use barrel exports (`index.ts`) for shared/ui components
- Import features via `@/features/...`, shared via `@/shared/...`
- Repositories return plain objects (never Mongoose documents to services)
- Services throw typed errors, API routes catch and map to HTTP status codes
