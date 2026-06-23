# Implementation Plan: Site Fixes and Backend Upgrade

## Overview

Five discrete fixes implemented incrementally: responsive breakpoints, backend replacement, speakers coming soon page, Charminar image fix, and GST on registration. Each issue is a top-level task with sub-tasks. TypeScript throughout, tested with Vitest + fast-check.

## Tasks

- [x] 1. Add laptop breakpoint for landing page responsive scaling
  - [x] 1.1 Add laptop config constants to `components/homepage/hero/constants.ts`
    - Add `HERO_CONFIG_LAPTOP`, `WELCOME_CONFIG_LAPTOP`, `CHARMINAR_CONFIG_LAPTOP`, `COMMITTEE_SCALE_LAPTOP`, `COMMITTEE_Y_LAPTOP`
    - Values intermediate between mobile and desktop (scale ~1.5, adjusted positions)
    - _Requirements: 1.2_
  - [x] 1.2 Update `HandHeroSection.tsx` to support three breakpoints
    - Replace binary `isMobile` with `getDeviceType()` returning `'mobile' | 'laptop' | 'desktop'`
    - Mobile: <768px, Laptop: 768px–1366px, Desktop: >1366px
    - Add resize event listener to update device type dynamically
    - Update all config selections (heroConfig, welcomeConfig, charminarConfig, committeeScale, committeeY) to use three-way selection
    - _Requirements: 1.1, 1.2, 1.5_
  - [x] 1.3 Review and adjust CTASection and FooterSection for laptop breakpoint
    - Check `components/homepage/CTASection.tsx` and `components/homepage/FooterSection.tsx` for fixed sizing
    - Add Tailwind `lg:` overrides where content overflows at 1024–1366px
    - _Requirements: 1.3, 1.4_
  - [ ]* 1.4 Write property test for breakpoint detection
    - **Property 1: Breakpoint detection returns correct device type for viewport width**
    - **Validates: Requirements 1.2**

- [x] 2. Replace backend with TNSCON2026 version
  - [x] 2.1 Back up current conference config and replace backend directory
    - Copy `conference-backend-core/config/conference.config.ts` to a temp backup
    - Delete contents of `conference-backend-core/`
    - Copy all files from `TNSCON2026-ref/conference-backend-core/` into `conference-backend-core/`
    - _Requirements: 2.1_
  - [x] 2.2 Merge conference configuration for ISSH 2026
    - Take the TNSCON2026 config structure (new fields: `enableAbstractsWithoutRegistration`, `registrationPrefix`, `aboutCity`)
    - Populate with ISSH 2026 values: conference name, dates (April 25-26, 2026), venue (HICC Novotel), theme colors (#25406b, #852016, #ebc975), branding
    - _Requirements: 2.2, 2.3_
  - [x] 2.3 Replace TNSCON-specific branding references
    - Search for "TNSCON" strings in copied backend files (excluding config) and replace with ISSH 2026 equivalents
    - _Requirements: 2.6_
  - [x] 2.4 Install new dependencies and regenerate wrappers
    - Add `@vercel/blob`, `jszip`, `@types/uuid` to package.json
    - Run `npm run generate-all` to regenerate wrapper pages in `app/`
    - _Requirements: 2.4, 2.5_

- [x] 3. Checkpoint - Verify backend replacement
  - Ensure the project compiles after backend replacement, ask the user if questions arise.

- [x] 4. Replace speakers page with Coming Soon
  - [x] 4.1 Create Coming Soon speakers page
    - Replace `conference-backend-core/app/speakers/page.tsx` with a themed Coming Soon page
    - Use Navigation component, gradient hero (#25406b → #852016), "Coming Soon" heading with #ebc975 accent
    - Responsive layout with Tailwind (mobile, laptop, desktop)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5. Fix Charminar image on venue page
  - [x] 5.1 Add placeholder Charminar image and update venue page
    - Create a placeholder image at `public/HYD/Charminar.jpg` (or SVG placeholder)
    - Update `app/venue/page.tsx` attractions array: change Charminar entry's `image` from `'/HYD/birlamandir.jpg'` to `'/HYD/Charminar.jpg'`
    - Verify Birla Mandir entry still uses `'/HYD/birlamandir.jpg'`
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 6. Add 18% GST on registration base price
  - [x] 6.1 Extract GST calculation as a pure function
    - Create `conference-backend-core/lib/utils/gst.ts` with `calculateGST(baseAmount: number): number` returning `Math.round(baseAmount * 18 / 100)`
    - _Requirements: 5.1_
  - [x] 6.2 Update payment calculate route to include GST
    - Import `calculateGST` in `conference-backend-core/app/api/payment/calculate/route.ts`
    - Compute `gstAmount = calculateGST(baseAmount)` after base amount is determined
    - Update subtotal: `subtotal = baseAmount + gstAmount + totalWorkshopFees + totalAccompanyingFees`
    - Add `gst` and `gstPercentage: 18` to the response `calculationData` and `breakdown`
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  - [x] 6.3 Update payment verify route to include GST in stored records
    - Update `recalculatePaymentBreakdown()` in `conference-backend-core/app/api/payment/verify/route.ts`
    - Include GST in the `amount` and `breakdown` objects stored in the Payment record
    - _Requirements: 5.5_
  - [x] 6.4 Update registration UI to display GST line item
    - Find the registration payment summary component and add a "GST (18%)" line item between base registration fee and subtotal
    - _Requirements: 5.6_
  - [ ]* 6.5 Write property tests for GST calculation
    - **Property 2: GST calculation and subtotal invariant**
    - **Validates: Requirements 5.1, 5.2, 5.3**
  - [ ]* 6.6 Write property test for GST round-trip consistency
    - **Property 3: GST round-trip consistency**
    - **Validates: Requirements 5.7**

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (GST math, breakpoint detection)
- Unit tests validate specific examples and edge cases
