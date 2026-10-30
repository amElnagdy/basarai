# Landing Page Verification

Completed locally on 2026-10-30. Open http://localhost:3000/.

- ESLint: passed, no warnings/errors.
- TypeScript: `tsc --noEmit` passed.
- Contribution isolation: full frontend ESLint and TypeScript passed again against an exported Git index containing only this feature on the upstream base, without the local login/setup changes or environment files.
- No new unit tests added for this visual change. Authentication and local-setup fixes are outside this feature.
- Root unauthenticated HTTP check: 200; signup and login links present.
- Signed-in browser: workspace CTA navigated to Brands, showing the existing brand. Back navigation restored the landing page.
- Both example brands × square/story/landscape: all six combinations updated headings and dimension labels correctly.
- Keyboard Space switched brand; Enter opened FAQ. Focus outline visible.
- Full-page visual inspection at normal desktop width and requested 390px mobile width. Additional overflow checks at requested 320px and 1440px passed. Browser scrollbar consumes 15px, so measured content widths were 305px and 1425px respectively.
- Preview caption identifies it as illustrative, and no provider or database requests were added.
- `git diff --check` passed. A production build was not rerun; the running development server compiled and rendered the new page.
- Screenshots: ignored `tmp/landing-desktop.png` and `tmp/landing-mobile.png`. Temporary viewport override reset before handoff.

The contribution commit includes only the three landing-page source files and this feature's specification/verification documents. Local authentication, API setup, environment and database changes are excluded.

Final visual refinement increased supporting typography, removed artwork/headline overlap, stacked mobile process steps, and retained the signed-out mobile login link. Both brands, all formats, FAQ controls and overflow at 320/390/1440 widths were checked after refinement. Final screenshots are `tmp/landing-astra-desktop.png`, `tmp/landing-astra-mobile.png` and `tmp/landing-astra-hero.png` (local artifacts, not tracked).
