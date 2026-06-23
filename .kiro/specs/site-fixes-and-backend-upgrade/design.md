# Design Document: Site Fixes and Backend Upgrade

## Overview

This design addresses five discrete issues in the ISSH 2026 conference website:

1. **Responsive scaling** — Add an intermediate breakpoint (1024px–1366px) for the landing page hero section and supporting components so smaller laptops render correctly.
2. **Backend replacement** — Swap `conference-backend-core/` with the TNSCON2026 version, merge ISSH 2026 config, install new dependencies, and regenerate wrapper pages.
3. **Speakers page** — Replace placeholder speaker cards with a themed "Coming Soon" page.
4. **Charminar image** — Fix the wrong image reference on the venue page's Charminar attraction card.
5. **GST on registration** — Add 18% GST on the base registration amount in the payment calculate route, verify route, stored payment records, and registration UI.

## Architecture

The project follows a Next.js 16 + conference-backend-core pattern:

```
app/                          ← Auto-generated wrapper pages (re-export from backend-core)
conference-backend-core/      ← All backend logic, API routes, models, config
  app/api/payment/calculate/  ← Payment calculation endpoint
  app/api/payment/verify/     ← Payment verification endpoint
  config/conference.config.ts ← Conference-specific configuration
components/homepage/          ← Custom landing page components (Three.js hero, CTA, footer)
public/HYD/                   ← Hyderabad attraction images
TNSCON2026-ref/               ← Reference repo with updated backend
```

Changes are isolated per issue:
- Issue 1 touches only `components/homepage/` (constants + HandHeroSection + CTASection + FooterSection)
- Issue 2 replaces `conference-backend-core/` wholesale, then merges config
- Issue 3 replaces `conference-backend-core/app/speakers/page.tsx`
- Issue 4 modifies `app/venue/page.tsx` and adds an image to `public/HYD/`
- Issue 5 modifies `conference-backend-core/app/api/payment/calculate/route.ts`, `verify/route.ts`, and the registration UI component

## Components and Interfaces

### Issue 1: Responsive Breakpoint System

Current state: `components/homepage/hero/constants.ts` defines two configs — `HERO_CONFIG` (desktop) and `HERO_CONFIG_MOBILE` (mobile, <768px). `HandHeroSection.tsx` uses a binary `isMobile` check at 768px.

Design:
- Add `HERO_CONFIG_LAPTOP` constant in `constants.ts` with intermediate values for scale (~1.5), particleSize, cameraZ, and position tuned for 1024–1366px viewports.
- Add `WELCOME_CONFIG_LAPTOP` and `CHARMINAR_CONFIG_LAPTOP` similarly.
- Add `COMMITTEE_SCALE_LAPTOP` and `COMMITTEE_Y_LAPTOP`.
- Change `HandHeroSection.tsx` to detect three breakpoints: mobile (<768px), laptop (768px–1366px), desktop (>1366px). Use a `getDeviceType()` helper that returns `'mobile' | 'laptop' | 'desktop'`.
- Add a `resize` event listener to update the device type dynamically.
- Review CTASection and FooterSection for any fixed sizing that breaks at 1024–1366px; add Tailwind `lg:` overrides as needed.

```typescript
// New constants in hero/constants.ts
export const HERO_CONFIG_LAPTOP = {
  rotationX: 0.208,
  rotationY: -0.102,
  rotationZ: 0.000,
  positionX: -0.40,
  positionY: 0.00,
  scale: 1.50,
  particleSize: 0.032,
  cameraZ: 18.0,
};
```

### Issue 2: Backend Replacement Strategy

Process:
1. Delete current `conference-backend-core/` contents (except preserve `config/conference.config.ts` as backup)
2. Copy all files from `TNSCON2026-ref/conference-backend-core/` into `conference-backend-core/`
3. Merge conference config: take the TNSCON2026 config structure (new fields like `enableAbstractsWithoutRegistration`, `registrationPrefix`, `aboutCity`) but populate with ISSH 2026 values (name, dates, venue, theme colors, branding)
4. Search for TNSCON-specific branding strings in the copied backend and replace with ISSH 2026 equivalents
5. Install new dependencies: `@vercel/blob`, `jszip`, `@types/uuid`
6. Run `npm run generate-all` to regenerate wrapper pages

### Issue 3: Speakers Coming Soon Page

Replace `conference-backend-core/app/speakers/page.tsx` with a simple "Coming Soon" page:
- Use the Navigation component
- Hero section with gradient background matching venue page style (#25406b → #852016)
- Centered "Coming Soon" heading with #ebc975 accent
- Brief message about speakers being announced soon
- Responsive layout using Tailwind

### Issue 4: Charminar Image Fix

In `app/venue/page.tsx`, the `attractions` array entry for Charminar uses `'/HYD/birlamandir.jpg'`. No Charminar image exists in `public/HYD/`.

Design:
- Add a placeholder SVG or use a generic heritage placeholder image at `public/HYD/Charminar.jpg`
- Update the Charminar entry's `image` field to `'/HYD/Charminar.jpg'`
- Since we can't download external images programmatically, create a simple placeholder image or use a data URI approach with a comment indicating a real photo should replace it

### Issue 5: GST Calculation in Payment Flow

Current flow in `calculate/route.ts`:
```
subtotal = baseAmount + totalWorkshopFees + totalAccompanyingFees
total = subtotal - totalDiscount
```

New flow:
```
gstAmount = Math.round(baseAmount * 0.18)
subtotal = baseAmount + gstAmount + totalWorkshopFees + totalAccompanyingFees
total = subtotal - totalDiscount
```

Changes needed:
- **calculate/route.ts**: Compute `gstAmount = Math.round(baseAmount * 0.18)`, add to subtotal, include in response as `gst` field and in `breakdown.gst`
- **verify/route.ts**: Update `recalculatePaymentBreakdown()` to include GST in the stored breakdown
- **Registration UI**: Display GST as a separate line item "GST (18%)" in the payment summary

The GST calculation function:
```typescript
function calculateGST(baseAmount: number): number {
  return Math.round(baseAmount * 18 / 100);
}
```

Key properties:
- GST is 18% of base registration amount only
- GST is zero when base amount is zero (senior citizen exemption)
- GST is always a non-negative integer (rounded to nearest rupee)

## Data Models

### Payment Calculation Response (Updated)

```typescript
interface PaymentCalculation {
  baseAmount: number;
  registrationFee: number;
  gst: number;                    // NEW: 18% of baseAmount
  workshopFees: number;
  accompanyingPersons: number;
  accompanyingPersonFees: number;
  subtotal: number;               // Now includes GST
  discount: number;
  total: number;
  finalAmount: number;
  currency: string;
  breakdown: {
    registration: number;
    gst: number;                  // NEW
    gstPercentage: number;        // NEW: always 18
    workshops: WorkshopFee[];
    accompanyingPersonFees: number;
    appliedDiscounts: Discount[];
    registrationType: string;
    tier: string;
  };
}
```

### Hero Config Type (New Laptop Variant)

```typescript
interface HeroConfig {
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  positionX: number;
  positionY: number;
  scale: number;
  particleSize: number;
  cameraZ: number;
}
// Three variants: HERO_CONFIG, HERO_CONFIG_LAPTOP, HERO_CONFIG_MOBILE
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Breakpoint detection returns correct device type for viewport width

*For any* viewport width, the device type detection function should return `'mobile'` for widths below 768px, `'laptop'` for widths from 768px to 1366px (inclusive), and `'desktop'` for widths above 1366px. The returned config values for each device type must be distinct from the other two types.

**Validates: Requirements 1.2**

### Property 2: GST calculation and subtotal invariant

*For any* valid base registration amount (non-negative integer), workshop fees total (non-negative integer), and accompanying person fees total (non-negative integer), the payment calculation should produce:
- `gst` equal to `Math.round(baseAmount * 18 / 100)`
- `subtotal` equal to `baseAmount + gst + workshopFees + accompanyingPersonFees`
- The response breakdown must contain a `gst` field with the computed GST value and a `gstPercentage` field equal to 18

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 3: GST round-trip consistency

*For any* valid base registration amount (positive integer), if `gst = Math.round(baseAmount * 18 / 100)` and `totalWithGST = baseAmount + gst`, then `Math.round(totalWithGST * 18 / 118)` should equal `gst` (within a tolerance of 1 due to rounding).

**Validates: Requirements 5.7**

## Error Handling

### Issue 1 (Responsive)
- If `window.innerWidth` is unavailable (SSR), default to desktop config. The component already guards with `mounted` state.

### Issue 2 (Backend Replacement)
- If `npm run generate-all` fails after replacement, the wrapper pages may be stale. The developer should check for missing re-exports and fix manually.
- If the TNSCON2026 backend references models or utilities not present in the current project, those will surface as TypeScript compilation errors to be resolved.

### Issue 4 (Charminar Image)
- If the placeholder image is missing at runtime, Next.js `<Image>` will show a broken image. The `alt` text "Charminar" provides fallback context.

### Issue 5 (GST)
- If `baseAmount` is 0 (senior citizen exemption), GST computes to 0 — no special handling needed beyond the formula.
- If `baseAmount` is negative (should never happen), `Math.max(total, 0)` already guards the final amount.

## Testing Strategy

### Testing Framework
- **Unit/Integration tests**: Vitest (already configured in `vitest.config.ts`)
- **Property-based tests**: fast-check (already a project dependency)
- Minimum 100 iterations per property test

### Property-Based Tests

Property tests target the pure calculation logic extracted from the API routes:

1. **Breakpoint detection** (Property 1): Generate random viewport widths (0–3000), verify `getDeviceType()` returns the correct category and that configs are distinct per category.
   - Tag: **Feature: site-fixes-and-backend-upgrade, Property 1: Breakpoint detection returns correct device type for viewport width**

2. **GST calculation invariant** (Property 2): Generate random `{baseAmount, workshopFees, accompanyingFees}` tuples, run `calculatePaymentWithGST()`, verify the GST formula and subtotal invariant.
   - Tag: **Feature: site-fixes-and-backend-upgrade, Property 2: GST calculation and subtotal invariant**

3. **GST round-trip** (Property 3): Generate random positive base amounts, verify the round-trip extraction property within tolerance.
   - Tag: **Feature: site-fixes-and-backend-upgrade, Property 3: GST round-trip consistency**

### Unit Tests

- Verify Charminar and Birla Mandir have different image paths in the attractions array
- Verify speakers page renders "Coming Soon" text
- Verify conference config retains ISSH 2026 values after merge
- Verify GST is 0 when base amount is 0
- Verify new dependencies are in package.json after backend replacement

### Test File Locations

- `conference-backend-core/app/api/payment/__tests__/calculate-gst.test.ts` — GST property and unit tests
- `components/homepage/hero/__tests__/breakpoints.test.ts` — Breakpoint detection property tests
