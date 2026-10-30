# Implementation Plan

Next.js 14 App Router, React 18, TypeScript, Tailwind, Lucide and existing fonts. Server root reads existing Clerk auth; one client preview owns local visual state. Scope styling with a CSS module. Add no dependencies.

## Constitution Check
Pass: no changes to tenancy, data, providers, authentication, secrets, deletion or persistence. Generation-specific acceptance gates are not exercised by a static landing page. Existing generation behavior is unchanged.

## Structure
- `frontend/app/page.tsx`: auth-aware navigation, hero, process, capabilities, FAQ, footer.
- `frontend/components/landing/studio-preview.tsx`: two fictional brands and three accurate social presets; native controls; no provider requests.
- `frontend/app/landing.module.css`: warm paper, petrol accents, existing fonts, responsive composition, focus and reduced motion.
- Verification: lint, TypeScript, existing regressions, production build if environment permits; browser desktop/mobile, preview, links, keyboard, overflow; screenshots in ignored `tmp/`.

## Research and Data
The reference `azozgg23/hawiah.ai` returned 404. Preserve Basar's design language with an original editorial composition. No persisted data; local state is brand (morrow/sol) and format (square/story/landscape). No private brand data fetched.

## UI Contract
Root is public; CTA is `/signup` for visitors and `/brands` for signed-in users. Login uses `/login`. Section anchors: `#how-it-works`, `#inside-the-studio`, `#questions`. Preview is illustrative only.
