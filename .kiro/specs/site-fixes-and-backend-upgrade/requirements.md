# Requirements Document

## Introduction

This specification covers five fixes and improvements for the ISSH 2026 conference website: responsive scaling on the landing page, replacing the backend with the updated TNSCON2026 version, converting the speakers page to a "Coming Soon" placeholder, fixing the Charminar image on the venue page, and adding 18% GST on registration base price in the payment flow.

## Glossary

- **Landing_Page**: The public-facing homepage at `app/page.tsx` composed of HandHeroSection, CTASection, and FooterSection
- **Hero_Section**: The Three.js/GSAP particle animation component at `components/homepage/HandHeroSection.tsx` with configuration constants in `components/homepage/hero/constants.ts`
- **Backend_Core**: The `conference-backend-core/` directory containing all backend logic, API routes, models, and page implementations
- **TNSCON2026_Backend**: The reference backend at `TNSCON2026-ref/conference-backend-core/` from the TNSCON2026 repository
- **Conference_Config**: The configuration file at `conference-backend-core/config/conference.config.ts` containing ISSH 2026-specific settings
- **Speakers_Page**: The speakers page at `app/speakers/page.tsx` which re-exports from `conference-backend-core/app/speakers/page.tsx`
- **Venue_Page**: The venue page at `app/venue/page.tsx` displaying conference venue and Hyderabad attractions
- **Payment_Calculator**: The API route at `conference-backend-core/app/api/payment/calculate/route.ts` that computes registration fees
- **Payment_Verifier**: The API route at `conference-backend-core/app/api/payment/verify/route.ts` that verifies and records payments
- **GST**: Goods and Services Tax, an Indian indirect tax applied at 18% on the base registration amount
- **Wrapper_Pages**: Auto-generated pages in `app/` that re-export from `conference-backend-core/app/`
- **Laptop_Breakpoint**: The screen width range of 1024px to 1366px representing smaller laptop displays

## Requirements

### Requirement 1: Landing Page Responsive Scaling for Smaller Laptops

**User Story:** As a conference attendee browsing on a smaller laptop, I want the landing page to display properly without content overlap or excessive zoom, so that I can read and interact with the page comfortably.

#### Acceptance Criteria

1. WHEN the Landing_Page is viewed at a viewport width between 1024px and 1366px, THE Hero_Section SHALL render without content overlap or clipping
2. WHEN the viewport width is between 1024px and 1366px, THE Hero_Section SHALL use a dedicated Laptop_Breakpoint configuration with adjusted scale, particle size, and camera position values distinct from both mobile and desktop configurations
3. WHEN the viewport width is between 1024px and 1366px, THE CTASection SHALL display text and buttons without overflow or truncation
4. WHEN the viewport width is between 1024px and 1366px, THE FooterSection SHALL display all content within the visible area without horizontal scrolling
5. WHEN the viewport width transitions across the 1024px and 1366px boundaries, THE Landing_Page SHALL smoothly adapt layout without visual jumps or content reflow artifacts

### Requirement 2: Backend Replacement with TNSCON2026 Backend

**User Story:** As a developer, I want to replace the current conference-backend-core with the TNSCON2026 version, so that the site gains new pages (manager, sponsor, abstracts/submit-unregistered, register/status), new admin pages (analytics, audit, errors, pending, sponsors), new API routes (register, sponsor, upload), and new library modules while preserving ISSH 2026 conference configuration.

#### Acceptance Criteria

1. THE Backend_Core directory SHALL contain all files and directories from the TNSCON2026_Backend after replacement
2. THE Conference_Config SHALL retain ISSH 2026-specific values (conference name, dates, venue, theme colors, branding) after the backend replacement
3. WHEN the TNSCON2026_Backend introduces new configuration fields (enableAbstractsWithoutRegistration, registrationPrefix, aboutCity), THE Conference_Config SHALL include those fields with appropriate ISSH 2026 values
4. WHEN the backend replacement is complete, THE Wrapper_Pages SHALL be regenerated using the `npm run generate-all` script to reflect new and updated backend pages
5. WHEN the backend replacement is complete, THE project package.json SHALL include new dependencies introduced by the TNSCON2026_Backend (`@vercel/blob`, `jszip`, `@types/uuid`)
6. IF the TNSCON2026_Backend contains TNSCON-specific branding or conference names in non-config files, THEN THE Backend_Core SHALL have those references updated to ISSH 2026

### Requirement 3: Speakers Page Coming Soon Replacement

**User Story:** As a conference organizer, I want the speakers page to show a "Coming Soon" message styled consistently with the ISSH 2026 theme, so that visitors know speaker information will be available later rather than seeing placeholder data.

#### Acceptance Criteria

1. WHEN a user navigates to the speakers page, THE Speakers_Page SHALL display a "Coming Soon" message instead of placeholder speaker cards
2. THE Speakers_Page SHALL use the ISSH 2026 theme colors (#25406b primary, #852016 accent, #ebc975 gold) consistent with the Venue_Page styling
3. THE Speakers_Page SHALL include the conference navigation bar
4. THE Speakers_Page SHALL be responsive across mobile, laptop, and desktop viewports

### Requirement 4: Venue Page Charminar Image Fix

**User Story:** As a conference attendee viewing the venue page, I want the Charminar attraction card to display an image of Charminar (not Birla Mandir), so that the visual content accurately represents each listed attraction.

#### Acceptance Criteria

1. THE Venue_Page SHALL display a distinct image for the Charminar attraction card that is different from the Birla Mandir image
2. WHEN no Charminar photograph is available in `public/HYD/`, THE Venue_Page SHALL use a clearly labeled placeholder image for the Charminar card until a proper photograph is provided
3. THE Venue_Page SHALL continue to display `/HYD/birlamandir.jpg` for the Birla Mandir attraction card only

### Requirement 5: Add 18% GST on Registration Base Price

**User Story:** As a conference registrant, I want to see the 18% GST calculated on my base registration fee displayed as a separate line item, so that I understand the tax component of my total payment.

#### Acceptance Criteria

1. WHEN the Payment_Calculator computes a registration fee, THE Payment_Calculator SHALL calculate GST as exactly 18% of the base registration amount only (excluding workshop fees and accompanying person fees)
2. THE Payment_Calculator SHALL include the GST amount as a separate named field in the calculation response breakdown
3. THE Payment_Calculator SHALL add the GST amount to the subtotal when computing the final total
4. WHEN the base registration amount is zero (e.g., senior citizen exemption), THE Payment_Calculator SHALL calculate GST as zero
5. WHEN the Payment_Verifier processes a payment, THE Payment_Verifier SHALL include the GST amount in the stored payment record
6. WHEN the registration UI displays the payment breakdown, THE registration page SHALL show the GST amount as a separate line item labeled "GST (18%)"
7. FOR ALL valid registration types and base amounts, calculating GST then adding it to the base amount and then extracting 18/118 of the total SHALL yield the original GST amount (round-trip consistency)
