---
name: Setor-Get Print Design System
description: Two-ink risograph/print design system for Setor Gmail, adapted from Impeccable reference 3ea433fd2cf4f718
colors:
  paper: "#f4efdc"
  field: "#fbf8ec"
  ink: "#234584"
  deep: "#15213a"
  muted: "#4a5a7a"
  blue: "#315bb3"
  on-blue: "#f4efdc"
  pink: "#e45b81"
  on-pink: "#15213a"
  rose: "#f3d6d7"
  purple: "#65466d"
  line: "#a6afbc"
  ok: "#22663f"
  ok-bg: "#d9e8d2"
  warn: "#7a4f00"
  warn-bg: "#f6e2b0"
  bad: "#a8274d"
  bad-bg: "#f3d6d7"
  info: "#234584"
  info-bg: "#dbe3f2"
  dark-paper: "#131d33"
  dark-field: "#0e1628"
  dark-ink: "#e9e2c8"
  dark-blue: "#9db8f2"
  dark-rose: "#3a2236"
  dark-purple: "#c9a9d0"
typography:
  display:
    fontFamily: '"Barlow Condensed", "Arial Narrow", sans-serif'
    fontSize: "4rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.015em"
  body:
    fontFamily: '"Figtree", system-ui, sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0em"
  reading:
    fontFamily: '"Literata", Georgia, serif'
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "0em"
rounded:
  none: "0px"
  stamp: "2px"
  control: "4px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "40px"
  xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.on-blue}"
    rounded: "{rounded.control}"
    padding: "12px 24px"
  button-line:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
---

# Setor-Get Design System

## Overview

Setor Gmail uses a two-ink print and editorial ledger aesthetic inspired by Impeccable gallery specimen `3ea433fd2cf4f718`. Instead of rounded SaaS cards and decorative icon tiles, structure is established through hairline horizontal/vertical rules (`1px solid var(--ink)` / `var(--line)`), bold uppercase condensed display headings with pink overprint registration, and flat color fields (`--rose`, `--blue`, `--pink`). **Zero icons** (no SVGs, no emojis) are used across the entire UI.

## Colors

- **Paper (`#f4efdc` / Dark: `#131d33`)**: Warm print paper surface.
- **Ink (`#234584` / Dark: `#e9e2c8`)**: Deep cobalt print ink for body copy, rules, and headings.
- **Blue (`#315bb3`) & Pink (`#e45b81`)**: Primary action ink and overprint/highlight ink.
- **Rose (`#f3d6d7` / Dark: `#3a2236`)**: Secondary stage fill for interactive work panels, login frame, and referral bands.
- **Semantic Stamps**: `ok` (`#22663f` on `#d9e8d2`), `pend` (`#7a4f00` on `#f6e2b0`), `bad` (`#a8274d` on `#f3d6d7`), `chk` (`#234584` on `#dbe3f2`).

## Typography

- **Display (`Barlow Condensed`, 800, uppercase)**: Masthead brand, hero statements, section titles, and ledger figures with `tabular-nums`.
- **Body (`Figtree`, 400–700)**: Navigation, labels, forms, and UI controls.
- **Reading (`Literata`, 400–500)**: Slip subcopy, rate statements, and referral codes.

## Layout

- **Landing (`/`)**: Editorial flow with Masthead, Hero + interactive `HeroSlip`, Promise strip, Intro, 4-column status flow + sample ledger, Saldo & Referral split, FAQ Terms (`<details>`), Closing band, and Footer.
- **App Workspace (`/app`)**: Login view and 6-tab workspace (`Beranda`, `Riwayat`, `Stor`, `Checker`, `Saldo`, `Profil`) plus `Referral`, `Leaderboard`, `Syarat & Ketentuan`, and text-only `Chat admin`. On mobile (`<=760px`), tabs dock cleanly to the bottom edge.

## Elevation & Depth

- Flat print layers separated by `1px` rules and background color shifts (`--paper` vs `--rose` vs `--blue`).
- Only floating overlays (`.notif-panel`, `.chat-toggle`, `.chat-panel`) use subtle drop shadows.

## Shapes

- Sharp, print-authentic corners: `4px` on buttons and inputs, `2px` on status stamps, `0px` on structural panels and tables.

## Components

- **HeroSlip**: Interactive format-checking slip on the landing page with live rule feedback.
- **Ledger & Rules**: Hairline-divided lists (`.ledger-list`, `.rules`, `.ledger`) replacing nested cards.
- **Status Stamps (`.tag`)**: Compact, high-contrast rectangular stamps (`Pending`, `Di cek`, `Diterima`, `Ditolak`).

## Do's and Don'ts

### Do
- Keep the interface 100% icon-free (rely on clear Indonesian copy, typography, and hairline rules).
- Use `tabular-nums` on all currency and counter figures.
- Maintain WCAG AA contrast across both light and dark modes.

### Don't
- Do not add SVG icons, icon tiles, or emoji glyphs to buttons, tabs, or headings.
- Do not wrap every section in rounded shadow cards; use hairline dividers and flat `--rose` / `--blue` stages.
