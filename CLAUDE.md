# Multi-Tenant E-Commerce Platform

## Project Overview
A single Next.js application serving multiple e-commerce websites dynamically based on domain name. Each domain gets its own theme, branding, product catalog, and storefront - managed from one admin dashboard and one MongoDB database.

## Tech Stack
- **Framework:** Next.js 15 (App Router, TypeScript strict mode)
- **Database:** MongoDB with Mongoose ODM
- **Styling:** Tailwind CSS v4 + CSS custom properties for dynamic theming
- **Auth:** JWT via `jose` (Edge-compatible) + `bcryptjs` for password hashing
- **Payment:** Stripe + SSLCommerz (per-store configuration)
- **File Storage:** RustFS (S3-compatible, accessed via @aws-sdk/client-s3)
- **Validation:** Zod for all API input validation
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
├── scripts/
│   └── seed.ts                               # Seed demo stores, products, admin user
│
├── src/
│   ├── app/                                  # ONLY routing + page shells. Minimal logic.
│   │   ├── layout.tsx                        # Root layout - reads tenant, injects CSS theme vars
│   │   ├── globals.css
│   │   ├── sitemap.ts                        # Dynamic sitemap per store
│   │   ├── robots.ts                         # Dynamic robots.txt per store
│   │   │
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
│   │   │       ├── layout.tsx                # Admin sidebar layout
│   │   │       ├── page.tsx                  # Dashboard stats
│   │   │       ├── login/
│   │   │       │   └── page.tsx
│   │   │       └── stores/
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
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   ├── register/route.ts
│   │       │   ├── admin-login/route.ts
│   │       │   └── me/route.ts
│   │       ├── stores/
│   │       │   ├── route.ts                  # GET all, POST new
│   │       │   ├── resolve/route.ts          # GET resolve domain → store
│   │       │   └── [storeId]/route.ts        # GET, PUT, DELETE
│   │       ├── products/
│   │       │   ├── route.ts                  # GET (by store), POST
│   │       │   └── [productId]/route.ts      # GET, PUT, DELETE
│   │       ├── categories/
│   │       │   ├── route.ts
│   │       │   └── [categoryId]/route.ts
│   │       ├── cart/
│   │       │   ├── route.ts
│   │       │   └── [itemId]/route.ts
│   │       ├── orders/
│   │       │   ├── route.ts
│   │       │   └── [orderId]/route.ts
│   │       ├── reviews/
│   │       │   └── route.ts
│   │       ├── payment/
│   │       │   ├── create-intent/route.ts
│   │       │   └── webhook/route.ts
│   │       └── upload/
│   │           └── route.ts
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
│   │   │   ├── model.ts                      # User + AdminUser Mongoose schemas
│   │   │   ├── repository.ts                 # findByEmail, createUser, etc.
│   │   │   ├── service.ts                    # login, register, verifyToken, hashPassword
│   │   │   ├── schemas.ts                    # loginSchema, registerSchema
│   │   │   ├── types.ts
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
│   │   └── payment/
│   │       ├── service.ts                    # createPaymentSession, handleWebhook
│   │       ├── stripe.ts                     # Stripe-specific logic
│   │       ├── sslcommerz.ts                 # SSLCommerz-specific logic
│   │       ├── schemas.ts
│   │       └── types.ts
│   │
│   ├── shared/                               # Cross-cutting concerns
│   │   ├── components/
│   │   │   ├── ui/                           # Reusable primitives
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Table.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Spinner.tsx
│   │   │   │   └── index.ts                  # Barrel export
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
│   │   │   ├── storage.ts                    # RustFS upload/delete helpers
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

### 8. Dual authentication system
- **Customers:** per-store accounts, JWT in `customer-token` cookie
- **Admins:** global accounts, JWT in `admin-token` cookie

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
