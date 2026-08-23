# Basar — Design Brief (one-pager)

**Purpose:** design direction for the UI/UX pass. Direction, not a spec.
**Status:** confirmed. **Date:** 2026-08-23.

---

## What Basar actually is

Not "an AI image generator" — raw Gemini/ChatGPT already do that.
**Basar is a brand studio.** The reason to log in is that it *remembers your brand*
(kit, colors, logo, tone) and hands back platform-ready assets. Design's whole
job: make you feel like you walked into **your own studio**, not a generic tool.

## The one feeling

**Cool, quiet gallery.** Chrome is cool-slate so the user's colors and generated
images are the only things that sing. Premium through restraint, not decoration.
Explicitly *not* Linear-cool chrome — humanist type, petrol accent — but the
*surfaces* stay a cool gallery wall.

## The signature idea — *the app wears the brand*

A tool *about* brand identity should *demonstrate* it.

- **Chrome stays neutral** (cool off-white `#F8FAFC` / near-black `#0B1220`) — a
  gallery wall, on purpose, so the user's colors and images are the only things
  that sing.
- **Each brand's workspace re-skins** in *that brand's* accent (color #1 from the kit).
  Switch brand → the room changes color. It's the product's thesis, made visible.
- **How:** one CSS var scoped to `/[brandId]` via `BrandWorkspace`.
- **Guardrail:** accent only — focus rings, selected states, the active-brand
  dot, small fills, the kit progress bar. **Never** big surfaces or text
  with the raw hex. For the rare filled brand button, flip text by luminance
  (`>0.5 ? ink : white`).

## Identity (confirmed)

**Cool + petrol.** Design review moved off the earlier warm-cream canvas
(`#FAFAF8`). Shipped defaults: **cool / compact / balanced**.

- Canvas `#F8FAFC`, paper `#FFFFFF`, ink `#0F172A`
- Basar's own accent: petrol `#1E6E82`
- Display: Instrument Serif. UI: Hanken Grotesk. Mono: Geist Mono.

Landing + login have no user brand yet → that's where Basar shows its *own*
personality (dark petrol wash, serif hero). Inside a brand workspace the accent
yields to `--brand`.

## Five principles

1. **The output is the hero.** Biggest, brightest thing on screen. Controls stay quiet.
2. **Show the shape before you fill it.** Presets are aspect-ratio *frames*, not a dropdown.
3. **Generation is a moment, not a spinner.** Empty frame → shimmer → reveal → download.
4. **Setup is onboarding, not settings.** Kit = an interview. "No key yet" = a nudge, not an error.
5. **Neutral inside, bold outside.** Workspace = quiet gallery. Auth screens wear petrol.

## The shell

Left sidebar, 248px. Brand switcher pinned at top (each brand = a colored dot),
then Generate / History / Brand Kit / Keys / Settings. Footer: Admin (operators),
You, Log out.

## Name hook

بَصَر *baṣar* = **sight / vision / insight**. Wordmark is "Basar" in Instrument
Serif, optionally beside بَصَر. No mark ships yet.

The implementation source of truth is `design_handoff_basar_studio/README.md`.
