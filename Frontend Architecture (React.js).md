# HolidayCity - Frontend Architecture Specification (React 19 + Vite)

**Version:** 1.0  
**Status:** Approved  
**Project Name:** HolidayCity  
**Document Type:** Client-Side Application Architecture & Design System  
**Framework:** React 19 + Vite + TypeScript + Tailwind CSS v4  

---

## 1. Frontend Technology Stack

The HolidayCity frontend application is designed to deliver a high-speed, visually stunning, mobile-first experience with instant client-side transitions and optimal search engine indexability.

| Architecture Layer | Core Technology | Version / Tooling | Purpose & Value |
| :--- | :--- | :--- | :--- |
| **Core Framework** | React | `v19` | Modern functional component UI runtime |
| **Build System** | Vite | `v6+` | Lightning-fast HMR and bundle optimization |
| **Type Safety** | TypeScript | `v5+` | Strict static typing and interface contracts |
| **Utility Styling** | Tailwind CSS | `v4` | Design token utility system & zero-runtime CSS |
| **Micro-Animations** | Framer Motion | `v11+` | Hardware-accelerated UI transitions |
| **Client Routing** | React Router | `v7` | Declarative nesting, lazy loading & route guards |
| **Form Engine** | React Hook Form | `v7+` | Uncontrolled, high-performance form state |
| **Validation** | Zod | `v3+` | Dynamic schema validation & TypeScript sync |
| **API Client** | Axios | `v1+` | Promise-based HTTP client with interceptors |
| **Server State** | TanStack Query | `v5` | Async state management, caching, background refetching |
| **UI Global State** | React Context API | Native | Lightweight global theme, search, & modal state |
| **Icon Library** | Lucide React | `v0.400+` | Clean, modern vector icons |
| **Carousels & Sliders** | Swiper.js | `v11+` | Touch-enabled mobile carousels and hero banners |
| **Date Processing** | Day.js | `v1+` | Immutable date calculations |
| **Media Handling** | Cloudinary React | SDK | Automatic WebP/AVIF resizing & blur placeholders |
| **Admin Charts** | Recharts | `v2+` | Responsive SVG chart visualizations for dashboard |
| **Toast Alerts** | React Hot Toast | `v2+` | Accessible notifications for lead submissions |

---

## 2. System Architecture & Flow Pipeline

```
  ┌─────────────────────────────────────────────────────────┐
  │ 1. Browser Viewport                                     │
  └────────────────────────────┬────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │ 2. React 19 App Root (Providers & Error Boundaries)     │
  └────────────────────────────┬────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │ 3. React Router v7 (PublicLayout / MinimalLayout)       │
  └────────────────────────────┬────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │ 4. Page Views (Home, DestinationDetail, PackageDetail)  │
  └────────────────────────────┬────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │ 5. Page Sections (Hero, FeaturedPackages, Itinerary)    │
  └────────────────────────────┬────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │ 6. Reusable Components & Cards (PackageCard, SearchBar) │
  └────────────────────────────┬────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │ 7. Custom React Hooks (usePackages, useDestination)     │
  └────────────────────────────┬────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │ 8. Service Layer (package.service.ts, api.client.ts)    │
  └────────────────────────────┬────────────────────────────┘
                               │
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │ 9. Express RESTful Backend (/api/v1)                    │
  └─────────────────────────────────────────────────────────┘
```

---

## 3. Directory & Folder Blueprint

```
src/
├── assets/                  # Static assets repository
│   ├── images/              # Static placeholders & fallback covers
│   ├── videos/              # Local hero background mp4 loops
│   ├── icons/               # Custom SVGs
│   ├── logos/               # Brand vector logos
│   ├── lottie/              # Micro-animation JSON payloads
│   └── fonts/               # Custom Web Fonts (Inter / Outfit)
├── components/              # Modular UI components
│   ├── common/              # Navbar, Footer, Hero, Breadcrumb, Loaders
│   ├── ui/                  # Button, Badge, Modal, Accordion, Drawer
│   ├── forms/               # LeadForm, SearchForm, ContactForm
│   ├── cards/               # PackageCard, DestinationCard, ReviewCard
│   ├── sections/            # PopularDestinations, WhyChooseUs, FAQSection
│   ├── layout/              # Header, Footer, Sidebar, Container
│   ├── gallery/             # LightboxViewer, MasonryGrid
│   ├── package/             # DayItinerary, HotelCard, PriceSidebar
│   ├── destination/         # WeatherWidget, AttractionsGrid
│   └── blog/                # BlogCard, RelatedArticles
├── pages/                   # Top-level Page Views
│   ├── Home/                # HomePage.tsx
│   ├── About/               # AboutPage.tsx
│   ├── Destinations/        # Listing & Detail pages
│   ├── Packages/            # Catalog & Detail pages
│   ├── Themes/              # Travel themes directory & detail
│   ├── Blogs/               # Blog catalog & article detail
│   ├── Gallery/             # Photo/video media hub
│   ├── Testimonials/        # Customer reviews board
│   ├── Contact/             # Contact page with maps
│   ├── FAQ/                 # FAQ hub
│   ├── Policies/            # Legal terms, privacy, refunds
│   ├── Search/              # Global search results view
│   └── Error/               # 404, 500, Offline pages
├── layouts/                 # Page Layout wrappers
│   ├── PublicLayout.tsx     # Standard Navbar + Footer + Floating CTAs
│   └── MinimalLayout.tsx    # Clean layout for errors & standalone pages
├── routes/                  # Route definitions
│   ├── index.tsx            # React Router v7 Switch
│   └── routeConfig.ts       # Path constants and route metadata
├── hooks/                   # Custom Data & UI React hooks
├── services/                # API service modules
├── api/                     # Axios client setup & interceptors
├── context/                 # React Context API instances
├── types/                   # TypeScript interfaces & types
├── constants/               # Global configuration values & tokens
├── config/                  # Environment & API config
├── lib/                     # Third-party library initializers
├── utils/                   # Pure helper functions
├── data/                    # Mock / fallback static datasets
├── styles/                  # Global CSS & Tailwind imports
├── animations/              # Framer Motion variant definitions
├── providers/               # App Provider stack wrapper
├── App.tsx                  # App root component
└── main.tsx                 # DOM Entry Point
```

---

## 4. Route Taxonomy & Layout Mapping

```
 ┌──────────────────────────────────────────────────────────┐
 │ PublicLayout                                             │
 │ ┌──────────────────────────────────────────────────────┐ │
 │ │ Navbar (Sticky / Glassmorphism)                      │ │
 │ ├──────────────────────────────────────────────────────┤ │
 │ │ [ Outlet View: Page Component Rendered Here ]         │ │
 │ ├──────────────────────────────────────────────────────┤ │
 │ │ Newsletter Section                                   │ │
 │ ├──────────────────────────────────────────────────────┤ │
 │ │ Footer                                               │ │
 │ └──────────────────────────────────────────────────────┘ │
 │ Floating Elements: [ WhatsApp CTA ] [ Phone ] [ ScrollToTop ]│
 └──────────────────────────────────────────────────────────┘
```

### Route Table

| Route Path | Page Component | Layout Wrapper | Lazy Loaded |
| :--- | :--- | :--- | :---: |
| `/` | `HomePage` | `PublicLayout` | No (Core) |
| `/about` | `AboutPage` | `PublicLayout` | Yes |
| `/destinations` | `DestinationsLandingPage` | `PublicLayout` | Yes |
| `/destinations/domestic` | `DomesticDestinationsPage` | `PublicLayout` | Yes |
| `/destinations/international`| `IntlDestinationsPage` | `PublicLayout` | Yes |
| `/destination/:slug` | `DestinationDetailPage` | `PublicLayout` | Yes |
| `/packages` | `PackageCatalogPage` | `PublicLayout` | Yes |
| `/package/:slug` | `PackageDetailPage` | `PublicLayout` | Yes |
| `/themes` | `TravelThemesPage` | `PublicLayout` | Yes |
| `/theme/:slug` | `ThemePackagesPage` | `PublicLayout` | Yes |
| `/blogs` | `BlogCatalogPage` | `PublicLayout` | Yes |
| `/blog/:slug` | `BlogDetailPage` | `PublicLayout` | Yes |
| `/gallery` | `MediaGalleryPage` | `PublicLayout` | Yes |
| `/testimonials` | `TestimonialsPage` | `PublicLayout` | Yes |
| `/contact` | `ContactPage` | `PublicLayout` | Yes |
| `/faq` | `FAQPage` | `PublicLayout` | Yes |
| `/privacy-policy` | `PrivacyPolicyPage` | `PublicLayout` | Yes |
| `/terms` | `TermsPage` | `PublicLayout` | Yes |
| `/cancellation-policy` | `CancellationPolicyPage` | `PublicLayout` | Yes |
| `/payment-policy` | `PaymentPolicyPage` | `PublicLayout` | Yes |
| `/search` | `SearchResultsPage` | `PublicLayout` | Yes |
| `/404` or `*` | `NotFoundPage` | `MinimalLayout` | No |

---

## 5. Component Hierarchy & Composition Pattern

```
                       COMPONENT COMPOSITION
                                 │
                            [ HomePage ]
                                 │
                      [ FeaturedPackagesSection ]
                                 │
                          [ PackageCard ]
                                 │
     ┌──────────────┬────────────┼────────────┬──────────────┐
     ▼              ▼            ▼            ▼              ▼
[OfferBadge]   [StarRating] [PriceTag]   [ButtonCTA]    [InclusionsIcons]
```

### Component Categories

#### 1. Common UI Components
- `Navbar.tsx`, `Footer.tsx`, `HeroBanner.tsx`, `Breadcrumb.tsx`, `Loader.tsx`, `SkeletonLoader.tsx`, `EmptyState.tsx`, `ErrorState.tsx`, `Modal.tsx`, `Pagination.tsx`, `FloatingWhatsApp.tsx`, `ScrollToTop.tsx`.

#### 2. Card Components
- `DestinationCard.tsx`: Cover photo, title, package count badge, hover zoom animation.
- `PackageCard.tsx`: Carousel preview, duration, price, discount badge, inclusions icons, quick quote button.
- `BlogCard.tsx`: Category tag, publication date, title, excerpt, reading time.
- `ReviewCard.tsx`: Star rating, customer avatar, quote excerpt, destination tag.

#### 3. Forms & Interactivity
- `PackageEnquiryForm.tsx`: Multi-step or modal lead submission form with datepicker, pax counter, and Zod validation.
- `GlobalSearchForm.tsx`: Live debounced auto-suggestion query box.

---

## 6. Service & Data Layer Architecture

```typescript
// Example: src/services/package.service.ts
import { apiClient } from '../api/apiClient';
import { IPackage, IPackageFilters, APIResponse } from '../types';

export const packageService = {
  getPackages: async (params?: IPackageFilters): Promise<APIResponse<IPackage[]>> => {
    const response = await apiClient.get('/packages', { params });
    return response.data;
  },

  getPackageBySlug: async (slug: string): Promise<APIResponse<IPackage>> => {
    const response = await apiClient.get(`/packages/${slug}`);
    return response.data;
  }
};
```

### Custom Query Hooks Pipeline (TanStack Query)

```typescript
// Example: src/hooks/usePackages.ts
import { useQuery } from '@tanstack/react-query';
import { packageService } from '../services/package.service';
import { IPackageFilters } from '../types';

export const usePackages = (filters?: IPackageFilters) => {
  return useQuery({
    queryKey: ['packages', filters],
    queryFn: () => packageService.getPackages(filters),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    keepPreviousData: true
  });
};
```

---

## 7. State Management Architecture

```
                             APP STATE MAP
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
SERVER STATE (TanStack Query)                       UI GLOBAL STATE (Context API)
├── Package Listings & Details                       ├── ThemeContext (Dark/Light mode)
├── Destinations & Attractions                       ├── SearchContext (Active search state)
├── Blog Content & FAQs                              ├── UIContext (Active Modals & Drawers)
└── Customer Reviews                                 └── SettingsContext (Global Config)
```

---

## 8. Dynamic SEO Rendering Architecture

Every page embeds a central `<SEO />` component powered by CMS metadata:

```tsx
// src/components/common/SEO.tsx
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  schemaMarkup?: object;
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage,
  schemaMarkup
}) => (
  <Helmet>
    <title>{`${title} | HolidayCity`}</title>
    <meta name="description" content={description} />
    {keywords && <meta name="keywords" content={keywords.join(', ')} />}
    {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
    
    {/* OpenGraph Tags */}
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    {ogImage && <meta property="og:image" content={ogImage} />}
    
    {/* Structured JSON-LD Data */}
    {schemaMarkup && (
      <script type="application/ld+json">
        {JSON.stringify(schemaMarkup)}
      </script>
    )}
  </Helmet>
);
```

---

## 9. Animation Engine & Micro-Interactions (Framer Motion)

Standardized Framer Motion variants applied across components:

```typescript
// src/animations/variants.ts
export const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: { scale: 1.03, y: -6, transition: { duration: 0.25, ease: 'easeInOut' } }
};
```

---

## 10. Performance & Optimization Strategy

1. **Route-Based Code Splitting:** Heavy page views wrapped with `React.lazy()` and `React.Suspense`.
2. **Dynamic Image Optimization:** Cloudinary transformations delivering auto-format (AVIF/WebP) and dynamic responsive widths (`w_auto,f_auto,q_auto`).
3. **Skeleton Loaders:** Instant visual feedback during API fetching to eliminate layout shift (CLS $< 0.1$).
4. **Debounced Search Input:** Search query inputs debounced by **300ms** (`useDebounce`) to prevent API thrashing.
5. **Target Lighthouse Benchmarks:**
   - **Performance:** $\ge 90$
   - **Accessibility:** $\ge 95$
   - **Best Practices:** $\ge 95$
   - **SEO:** $100$

---

## 11. Responsive Breakpoints Matrix (Mobile-First)

Tailwind CSS v4 custom theme breakpoints configured for all device sizes:

| Breakpoint Name | Tailwind Prefix | Min Width | Target Viewport Devices |
| :--- | :--- | :--- | :--- |
| **Mobile** | Default | $< 640\text{px}$ | iPhones, Android Smartphones |
| **Small Tablet** | `sm:` | $640\text{px}$ | Large phones, portrait mini-tablets |
| **Tablet** | `md:` | $768\text{px}$ | iPad Portrait, Android Tablets |
| **Laptop** | `lg:` | $1024\text{px}$ | iPad Landscape, Laptops |
| **Desktop** | `xl:` | $1280\text{px}$ | Standard Desktop Monitors |
| **Large Desktop** | `2xl:` | $\ge 1536\text{px}$ | Ultrawide displays & 4K monitors |

---

## 12. Frontend Development Implementation Roadmap

```
 ┌──────────────────────────────────────────────────────────┐
 │ SPRINT 1: FOUNDATION                                     │
 │ Setup Vite + React 19, Tailwind tokens, Navbar & Footer │
 ├──────────────────────────────────────────────────────────┤
 │ SPRINT 2: CORE PAGES & ROUTING                           │
 │ Implement Router v7, Home, About, Contact & FAQ views   │
 ├──────────────────────────────────────────────────────────┤
 │ SPRINT 3: DESTINATION MODULE                             │
 │ Listing catalog, detail views, search & filter sidebar  │
 ├──────────────────────────────────────────────────────────┤
 │ SPRINT 4: PACKAGE & CRM MODULE                           │
 │ Package cards, day-wise itineraries, lead modals & quote │
 ├──────────────────────────────────────────────────────────┤
 │ SPRINT 5: EDITORIAL & MEDIA                              │
 │ Blog engine, travel themes, media lightbox, reviews     │
 ├──────────────────────────────────────────────────────────┤
 │ SPRINT 6: POLISH & OPTIMIZATION                          │
 │ SEO Helmet tags, Framer Motion, Lighthouse & QA audit   │
 └──────────────────────────────────────────────────────────┘
```

---
*End of Frontend Architecture Specification - HolidayCity v1.0*
