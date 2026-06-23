# Feature Specification: Admin Monitoring Dashboard

**Feature Branch**: `009-admin-dashboard`
**Created**: 2026-06-19
**Status**: Draft
**Input**: User description: "the updated Phase 8 of docs/implementation-plan.md"

## Overview

This feature gives a trusted operator a read-only window into the whole system. An operator (an account on an allow-list) opens a dedicated Admin area and sees two things: system-wide usage statistics, and a list of every brand across every account with enough context to understand activity at a glance.

The phase is deliberately narrow and **read-only**: the operator observes, but cannot change anything. It surfaces only counts and aggregates that already exist in the system — it does **not** introduce cost or token accounting, moderation actions, or per-user drill-downs. Functional empty/zero handling is in scope; visual polish (loading skeletons, refined empty-state art, error styling) is explicitly deferred to the separate UI/UX revamp.

## Clarifications

### Session 2026-06-19

- Q: Should the Admin area allow any actions (delete brand, revoke key, etc.)? → A: No — read-only monitoring only.
- Q: Should statistics include cost or token usage? → A: No — aggregate counts only; the system does not track cost or tokens, and this phase does not add such tracking.
- Q: How is a brand's owning account identified to the operator? → A: By account display name and a stable account identifier; the owner's email/PII is not shown in this phase.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Monitor System Usage at a Glance (Priority: P1)

An operator opens the Admin area and immediately sees the health and scale of the system on one screen: how many accounts and brands exist, how many image generations have been attempted, how those generations broke down by outcome and by provider, how much activity happened recently, how many brands have completed their brand kit, and how many provider keys are active. No manual querying is required.

**Why this priority**: Operational visibility is the core reason an admin area exists. A single accurate overview lets the operator confirm the system is being used and is healthy. Statistics deliver value on their own, even before the brand list exists.

**Independent Test**: With seeded data spanning multiple accounts, brands, providers, and generation outcomes, sign in as an allow-listed operator, open the Admin area, and verify each headline figure and breakdown matches the underlying data (e.g., the per-status counts sum to the total generation count).

**Acceptance Scenarios**:

1. **Given** the system has multiple accounts, brands, and generations across both providers and several outcome states, **When** an operator opens the Admin dashboard, **Then** they see total accounts, total brands, total generations, a breakdown of generations by outcome status, a breakdown by provider, recent-activity counts, completed-brand-kit count, and active-provider-key count.
2. **Given** generations exist in several outcome states, **When** the operator reads the status breakdown, **Then** the displayed per-status counts add up exactly to the displayed total generation count.
3. **Given** the operator owns brands of their own, **When** they view the statistics, **Then** the figures reflect data across **all** accounts, not just the operator's own.
4. **Given** the system has no data yet, **When** the operator opens the dashboard, **Then** every total reads zero without error.

---

### User Story 2 - Browse All Brands Across Accounts (Priority: P2)

An operator reviews a list of every brand in the system, regardless of which account owns it. Each row carries enough context — brand name, owning account, brand-kit completion status, number of generations, whether it has an active provider key, and when it was created — for the operator to spot active, stalled, or misconfigured brands. The list pages cleanly through large numbers of brands.

**Why this priority**: The aggregate stats answer "how much"; the brand list answers "where". It turns a single number into something the operator can reason about (e.g., noticing a brand with many failed generations). It depends on nothing from later stories and is independently demonstrable.

**Independent Test**: Seed more than one page of brands across at least two accounts, with varied kit statuses, key presence, and generation counts; sign in as operator; open the all-brands list; verify every brand appears exactly once across pages with correct per-brand context.

**Acceptance Scenarios**:

1. **Given** brands exist under multiple accounts, **When** the operator opens the all-brands list, **Then** every brand from every account is listable (the list is not scoped to the operator's own brands).
2. **Given** a brand has a known number of generations, a known kit status, and a known key state, **When** it appears in the list, **Then** its generation count, kit status, key presence, owning account, and creation date are shown correctly.
3. **Given** there are more brands than fit on one page, **When** the operator moves through pages, **Then** no brand is omitted and no brand appears on two pages.
4. **Given** a brand has zero generations, **When** it appears in the list, **Then** it is shown with a generation count of zero rather than being hidden.

---

### User Story 3 - Operator-Only Access (Priority: P3)

Only allow-listed operators can reach the Admin area or its data. A regular user is denied access if they attempt to reach it directly, and the entry point to the Admin area is not shown to them at all.

**Why this priority**: The Admin area exposes cross-account data, so access control is a hard requirement. It is listed P3 only because it is a guard wrapping the value-bearing stories rather than a standalone deliverable — but it must hold for those stories to be safe to ship.

**Independent Test**: Sign in as a non-allow-listed account and confirm the Admin entry point is absent from navigation and that directly requesting any admin view or data is refused; then sign in as an allow-listed account and confirm access is granted.

**Acceptance Scenarios**:

1. **Given** a signed-in account that is **not** on the operator allow-list, **When** it attempts to open any Admin view or load Admin data directly, **Then** access is denied.
2. **Given** a non-operator account, **When** it views the application navigation, **Then** the Admin entry point is not shown.
3. **Given** an account that **is** on the operator allow-list, **When** it opens the Admin area, **Then** access is granted and the dashboard loads.
4. **Given** the operator allow-list is empty, **When** any account attempts to open the Admin area, **Then** access is denied for everyone.

---

### Edge Cases

- **Empty system**: With no accounts/brands/generations, all totals read zero and the brand list shows an empty result without error.
- **Brand with no activity**: A brand with zero generations still appears in the list with a zero count.
- **In-flight generations**: Generations that are still pending or processing are counted in the outcome-status breakdown (not dropped).
- **Operator's own brands**: The operator's brands appear in the all-brands list and statistics on the same footing as everyone else's.
- **Missing owner detail**: If an owning account's display detail is unavailable, the brand still lists with its account identifier rather than failing the whole list.
- **Large data volume**: With many brands, pagination keeps the list responsive and complete.

## Requirements *(mandatory)*

### Functional Requirements

**Access control**

- **FR-001**: System MUST restrict all Admin views and Admin data to accounts on the operator allow-list.
- **FR-002**: System MUST deny any non-operator account that attempts to reach an Admin view or load Admin data, returning a clear access-denied outcome.
- **FR-003**: System MUST hide the Admin entry point from accounts that are not operators.
- **FR-004**: System MUST deny Admin access to everyone when the operator allow-list is empty or unset.

**Usage statistics**

- **FR-005**: System MUST present system-wide totals: total accounts, total brands, and total generations.
- **FR-006**: System MUST present a breakdown of generations by outcome status (pending, processing, succeeded, failed).
- **FR-007**: System MUST present a breakdown of generations by provider (OpenAI, Gemini).
- **FR-008**: System MUST present recent-activity counts covering generations in the last 7 days and the last 30 days.
- **FR-009**: System MUST present the number of brands whose brand kit is complete.
- **FR-010**: System MUST present the number of active provider keys.
- **FR-011**: All statistics MUST aggregate data across every account, not only the operator's own.
- **FR-012**: Statistic breakdowns MUST be internally consistent — the per-status counts and the per-provider counts each sum to the total generation count.

**All-brands list**

- **FR-013**: System MUST list all brands across all accounts.
- **FR-014**: For each brand, the list MUST show: brand name, owning account (display name and a stable account identifier), brand-kit completion status, total generation count, whether the brand has an active provider key, and creation date.
- **FR-015**: System MUST paginate the all-brands list such that paging forward and back never omits or duplicates a brand.
- **FR-016**: System MUST present the all-brands list in a consistent, predictable order (newest brands first).

**Read-only guarantee**

- **FR-017**: Admin views MUST be strictly read-only — the operator MUST NOT be able to create, edit, or delete any account, brand, generation, provider key, or brand kit from these views.

### Key Entities *(include if feature involves data)*

- **Operator**: An account permitted to access the Admin area, determined by membership in an allow-list. Not a new stored entity — a role derived from an account's identity.
- **Account**: An owner of brands; identified to the operator by a display name and a stable account identifier (no email/PII in this phase).
- **Brand**: Belongs to one account; carries a brand-kit completion status, a set of generations, and zero or more provider keys.
- **Generation**: Belongs to one brand; has a provider, an outcome status, and timestamps used for recent-activity counts.
- **Provider Key**: Belongs to one brand; may be active or inactive.
- **Brand Kit**: Belongs to one brand; has a completion status.
- **Usage Statistics**: A derived, read-only aggregate view over the above entities — not stored, computed on demand.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An operator can view all system-wide totals and both breakdowns (outcome status and provider) on a single screen without running any manual query.
- **SC-002**: Displayed statistics match the underlying data exactly — every breakdown sums to its corresponding total, verified against seeded data.
- **SC-003**: 100% of brands across all accounts are listable, with no brand omitted and none duplicated while paging through the full list.
- **SC-004**: Non-operator accounts are refused access to every Admin view and data source 100% of the time, and never see the Admin entry point.
- **SC-005**: The Admin dashboard presents current figures within about 3 seconds for the expected data volume.
- **SC-006**: No Admin view exposes any create, edit, or delete capability (verified by inspection of available actions).

## Assumptions

- **Allow-list mechanism exists**: Operator identity is governed by an existing allow-list configuration; this phase consumes it rather than redesigning how operators are granted access.
- **Owner identification without PII**: Brands are attributed to their owning account by display name and account identifier; surfacing owner email or other PII is intentionally out of scope for this phase (revisit if abuse-monitoring needs arise).
- **Recent-activity windows**: "Recent" means the last 7 days and last 30 days, measured from view time.
- **Brands pagination size**: The all-brands list uses a page size consistent with the existing generation history list (24 per page) unless changed during planning.
- **Point-in-time figures**: Statistics reflect the system state at the moment the dashboard is opened; no historical trend charts or time-series storage are introduced.
- **Functional, not visual**: Empty/zero states must behave correctly, but their visual refinement (and loading/error styling) belongs to the later UI/UX revamp, not this phase.

## Dependencies

- Existing accounts, brands, brand kits, provider keys, and generations data — this feature only reads them.
- The existing operator allow-list configuration that determines who is an operator.

## Out of Scope

- Any mutating/admin actions (deleting brands, revoking keys, disabling accounts, moderation).
- Cost, token, or spend accounting, and any schema changes to record them.
- Per-account or per-brand drill-down dashboards beyond the single all-brands list described here.
- Historical trends, time-series charts, or exportable reports.
- Surfacing owner email or other personally identifiable information.
- Visual polish: loading skeletons, refined empty-state illustrations, and error-state styling (moved to the UI/UX revamp, formerly Phase 8 tasks 8.5–8.7).
