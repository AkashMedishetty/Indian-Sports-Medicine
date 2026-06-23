# Requirements Document

## Introduction

This document specifies the requirements for a set of fixes and improvements to the ISSH/TASCON 2026 conference website built with Next.js. The changes span five areas: responsive layout fixes for the landing page, replacing the conference-backend-core directory with an updated source, converting the speakers page to a "Coming Soon" placeholder, fixing an incorrect image reference on the venue page, and adding 18% GST to the registration payment calculation with a visible breakdown for users.

## Glossary

- **Landing_Page**: The public-facing home page of the conference website rendered by `app/page.tsx`, composed of HandHeroSection, CTASection, and FooterSection.
- **Hero_Section**: The `HandHeroSection` component that renders Three.js/GSAP particle animations with separate mobile and desktop configurations.
- **Breakpoint**: A viewport width threshold at which the layout switches between configuration sets (e.g., mobile vs. desktop).
- **CTA_Section**: The call-to-action section on the landing page rendered by `CTASection.tsx`.
- **Footer_Section**: The footer section on the landing page rendered by `FooterSection.tsx`.
- **Conference_Backend_Core**: The `conference-backend-core/` directory containing shared backend logic, pages, config, and API routes that the outer project re-exports via wrapper files.
- **Speakers_Page**: The speakers page rendered by `conference-backend-core/app/speakers/page.tsx` and re-exported via `app/speakers/page.tsx`.
- **Venue_Page**: The venue page rendered by `app/venue/page.tsx` displaying conference venue details and Hyderabad attractions.
- **Attractions_List**: The array of attraction objects in the Venue_Page, each with a name, description, image path, and category.
- **Payment_Calculator**: The API route at `app/api/payment/calculate/route.ts` (re-exported from Conference_Backend_Core) that computes registration fees.
- **GST**: Goods and Services Tax, an Indian indirect tax applied at 18% on the base registration price.
- **Conference_Config**: The configuration object exported from `conference-backend-core/config/conference.config.ts` containing all conference settings including pricing tiers.
- **Color_Scheme**: The conference brand colors: primary (#25406b deep blue), accent (#852016 deep red), secondary (#ebc975 gold).

## Requirements

### Requirement 1: Landing Page Responsive Scaling

**User Story:** As a conference attendee using a laptop, I want the landing page to display correctly at all common screen sizes, so that content does not overlap or appear excessively zoomed.

#### Acceptance Criteria

1. WHEN the viewport width is between 768px and 1024px, THE Hero_Section SHALL use a tablet-specific configuration with reduced scale and adjusted positioning so that particle animations and text do not overflow or overlap.
2. WHEN the viewport width is between 768px and 1024px, THE CTA_Section SHALL render text and buttons at sizes proportional to the viewport without overlapping adjacent elements.
3. WHEN the viewport width is between 768px and 1024px, THE Footer_Section SHALL render content at sizes proportional to the viewport without overlapping adjacent elements.
4. WHEN the browser window is resized across breakpoints, THE Hero_Section SHALL recalculate its configuration to match the current viewport width category (mobile, tablet, or desktop).
5. THE Landing_Page SHALL define three breakpoint tiers: mobile (below 768px), tablet (768px to 1024px), and desktop (above 1024px).

### Requirement 2: Backend Core Replacement

**User Story:** As a developer, I want to replace the conference-backend-core directory with the version from the TNSCON2026 repository, so that the project uses the correct shared backend for the ISSH event.

#### Acceptance Criteria

1. WHEN the replacement is complete, THE Conference_Backend_Core directory SHALL contain the files from the TNSCON2026 repository's conference-backend-core directory.
2. WHEN the replacement is complete, THE existing wrapper files in the outer project SHALL continue to re-export from Conference_Backend_Core without import errors.
3. IF the replacement introduces missing exports or changed interfaces, THEN THE wrapper files SHALL be updated to match the new Conference_Backend_Core exports.

### Requirement 3: Speakers Page Coming Soon

**User Story:** As a conference organizer, I want the speakers page to show a "Coming Soon" message instead of placeholder speaker cards, so that visitors are not misled by dummy data.

#### Acceptance Criteria

1. WHEN a user navigates to the speakers page, THE Speakers_Page SHALL display a "Coming Soon" heading and a brief message indicating that speaker details will be announced.
2. THE Speakers_Page SHALL use the Color_Scheme (primary #25406b, accent #852016, secondary #ebc975) consistent with the Venue_Page design style.
3. THE Speakers_Page SHALL include the site Navigation component at the top of the page.
4. THE Speakers_Page SHALL not display any placeholder speaker cards or dummy speaker data.

### Requirement 4: Venue Page Charminar Image Fix

**User Story:** As a conference attendee, I want the Charminar attraction card on the venue page to show an actual Charminar image, so that the attraction is correctly represented.

#### Acceptance Criteria

1. WHEN the Venue_Page renders the Attractions_List, THE Charminar entry SHALL reference an image file that depicts the Charminar monument.
2. THE Charminar image file SHALL be placed in the `public/HYD/` directory with a descriptive filename.
3. THE Birla Mandir entry in the Attractions_List SHALL continue to reference `/HYD/birlamandir.jpg` unchanged.
4. IF the Charminar image file is missing from the `public/HYD/` directory, THEN THE build process SHALL fail with a clear indication that the asset is absent.

### Requirement 5: Registration GST Calculation

**User Story:** As a conference attendee registering for the event, I want to see a clear breakdown of the base price and 18% GST, so that I understand the total amount I am paying.

#### Acceptance Criteria

1. WHEN the Payment_Calculator computes a registration fee, THE Payment_Calculator SHALL apply 18% GST on the base registration amount.
2. WHEN the Payment_Calculator returns the calculation result, THE response SHALL include separate fields for the base amount, GST amount, GST percentage (18), and the GST-inclusive total.
3. WHEN the GST is calculated, THE GST amount SHALL equal the base registration amount multiplied by 0.18, rounded to the nearest whole number.
4. WHEN workshop fees or accompanying person fees are included, THE GST SHALL apply only to the base registration amount, not to workshop or accompanying person fees.
5. WHEN a discount is applied, THE GST SHALL be calculated on the base registration amount before the discount is applied.
6. WHEN the base registration amount is zero (e.g., complimentary or senior citizen exemption), THE GST amount SHALL be zero.
7. THE Conference_Config SHALL include a GST rate field set to 18 that the Payment_Calculator reads at runtime.
