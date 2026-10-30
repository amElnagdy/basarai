# Feature Specification: Basar Landing Page

**Branch**: `010-landing-page` · **Created**: 2026-10-30 · **Status**: Ready

Input: Implement upstream issue #18, improving the landing page and usability.

## User Scenarios & Testing

### US1 — Understand and enter (P1)
A visitor understands brand identities, social image generation and the requirement to supply a provider key, then signs up or logs in. Acceptance: root renders the landing page; main CTA leads to signup for visitors and Brands for signed-in users. Existing protected routes stay protected.

### US2 — Explore a brand preview (P2)
A visitor changes two fictional brand directions and three social formats. Acceptance: label, palette and aspect ratio update for all six combinations without navigation or provider calls. The preview is explicitly illustrative.

### US3 — Phone and keyboard access (P1)
A visitor reads and uses the page at 390px and 1440px, traversing controls with Tab. Acceptance: no overflow at 320px or above, accessible names, visible focus, no essential motion, all content except preview interactivity works without JavaScript.

## Requirements
- FR-001: Explain brand identity, generation, history/download and provider-key prerequisites truthfully.
- FR-002: Provide signup, login and signed-in workspace navigation.
- FR-003: Provide an explicitly illustrative brand/format preview.
- FR-004: Responsive layout, semantic sections, keyboard controls, readable contrast and reduced-motion support.
- FR-005: Reuse Basar design language and dependencies; no backend or database changes.
- FR-006: No invented testimonials, usage counts, generated-result claims, free-usage claims or brochure features.

## Edge Cases and Assumptions
No keys collected; preview works independently of image services. Root becomes public for both signed-in and signed-out users, with auth-aware CTAs. Reference repository returned 404, so follow existing Instrument Serif/Hanken Grotesk and petrol identity. Retain English to match the app. Use original HTML/CSS/vector artwork and no external image assets.

## Success Criteria
All primary links work; six preview combinations update; no overflow at mobile and desktop widths; available checks pass and desktop/mobile screenshots show final layout.
