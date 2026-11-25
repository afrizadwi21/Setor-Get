---
name: Setor-Get Design System
description: Normative tokens and design guidelines for Setor-Get micro-tasking interface
colors:
  primary: "#0f6b57"
  primary-hover: "#0b5242"
  primary-ink: "#ffffff"
  background: "#f3f6f4"
  card: "#ffffff"
  ink: "#14231f"
  mute: "#5d706a"
  line: "#dbe4e0"
  gold: "#b7791f"
  ok: "#1b7f4b"
  ok-bg: "#e2f4ea"
  warn: "#a15c07"
  warn-bg: "#fdf0d8"
  bad: "#b42318"
  bad-bg: "#fde7e4"
  info: "#1d5fa8"
  info-bg: "#e2edf9"
  dark-background: "#0e1a17"
  dark-card: "#162621"
  dark-ink: "#e6f0ec"
  dark-mute: "#93a8a1"
  dark-line: "#27403a"
  dark-primary: "#3fbf9f"
  dark-primary-ink: "#06211a"
typography:
  display:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    fontSize: "2.5rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  heading:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  body:
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0em"
  mono:
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "18px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-ink}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 18px"
  card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.lg}"
    padding: "16px"
---

# Setor-Get Design System

## Overview

Setor-Get is a high-utility, financial-microtasking web platform where trust, speed, and numerical clarity are paramount. The visual language rejects gratuitous AI decoration, neon glows, and ungrounded glassmorphism in favor of a calm, botanical emerald palette (`#0f6b57`) paired with clean surface elevations, tactile touch targets, and high-contrast status feedback.

## Colors

The palette is rooted in fiscal reassurance and calm efficiency:

- **Primary (`#0f6b57`)**: Pine/emerald green used for core actions, the main hero balance card, and focused states.
- **Background (`#f3f6f4` / Dark: `#0e1a17`)**: Soft, desaturated mineral canvas that prevents eye fatigue during intensive task sessions.
- **Card Surface (`#ffffff` / Dark: `#162621`)**: Pure white cards bounded by a subtle border (`#dbe4e0` / Dark: `#27403a`).
- **Typography Ink (`#14231f` / Dark: `#e6f0ec`)**: Deep evergreen charcoal, guaranteeing WCAG AAA contrast for body copy.
- **Muted Text (`#5d706a` / Dark: `#93a8a1`)**: Clear secondary tone for metadata, timestamps, and input labels.
- **Semantic Badges**:
  - `ok`: Forest green `#1b7f4b` on soft mint `#e2f4ea` (Diterima / Lolos).
  - `warn`: Amber ochre `#a15c07` on sand `#fdf0d8` (Pending).
  - `bad`: Brick crimson `#b42318` on soft blush `#fde7e4` (Ditolak / Invalid).
  - `info`: Slate navy `#1d5fa8` on ice blue `#e2edf9` (Di cek / System notes).
  - `gold`: Warm gold `#b7791f` for chat trigger and referral incentives.

## Typography

System-native sans fonts maximize load performance and render legibly on lower-end Android and mobile displays.

- **Display Numbers (`2.5rem` / `40px`, Weight `800`, tracking `-0.025em`)**: Reserved exclusively for the central balance figure (`Rp25.000`) and key metric counters.
- **Headings (`1.25rem` / `20px`, Weight `700`, tracking `-0.015em`)**: Clean section titles without excessive uppercase transformation.
- **Body (`0.9375rem` / `15px`, Line-height `1.5`)**: Readable prose and form inputs.
- **Monospace**: Clean monospace for referral codes, bank/e-wallet numbers, and email format rules.

## Layout

- **Container Constraint**: Fixed max-width of `760px` centered with auto margins, ideal for single-column mobile viewports and comfortable centered desktop presentation.
- **Bottom Navigation**: Floating dock navigation anchored at the bottom with safe-area inset accommodation (`env(safe-area-inset-bottom, 0px)`), with max-width `520px` to prevent stretching on desktop.
- **Grid Systems**:
  - Metric counters: 4-column grid on desktop (`repeat(4, 1fr)`), automatically folding to 2 columns on mobile screens (`repeat(2, 1fr)`).
  - Action buttons: Flex wrap with unified `8px` spacing gap.

## Elevation & Depth

- Elevation is achieved primarily through thin, crisp structural borders (`1px solid var(--line)`), avoiding heavy synthetic drop shadows.
- Dynamic floating components (dock navigation, modal notifications, chat pane) utilize soft diffused shadows:
  - Floating Dock: `0 8px 24px rgba(0, 0, 0, 0.12)`
  - Dropdown Notification: `0 12px 30px rgba(0, 0, 0, 0.16)`
  - Chat Window: `0 14px 34px rgba(0, 0, 0, 0.24)`

## Shapes

- **Surface Cards**: `16px` border-radius (`rounded-2xl`) with internal padding of `16px`.
- **Buttons & Form Fields**: `12px` border-radius (`rounded-xl`) with `10px 16px` touch padding.
- **Badges & Pills**: Full capsule border-radius (`9999px`) with `2px 10px` compact padding.
- **Progress Bars**: Encapsulated bar (`8px` height, `9999px` radius) with smooth width transitions.

## Components

### 1. Hero Balance Card (`.bal`)
The single boldest visual anchor in the app. Deep pine green background with pure white typography, containing current balance, unit rate statement, and instant action buttons (Tarik saldo, Riwayat).

### 2. Status Metric Tile
Individual compact cards showcasing a bold stat value above a semantic status pill.

### 3. Submission Form
Clean vertical flow with immediate validation checklists:
- Prefix and domain check
- Minimum password length check
- Duplicate submission check
Clear visual color cues (green checkmark / red alert) updating on every keystroke.

### 4. Interactive Bottom Dock
A unified pill-dock with icon and label pairs for Beranda, Riwayat, Stor, Checker, Saldo, and Profil, with clear active tab highlighting.

## Do's and Don'ts

### Do
- Keep numbers crisp, prominent, and formatted with Indonesian currency standards (`Rp2.500`, `Rp25.000`).
- Use genuine status pills with paired background and text hues for immediate scanability.
- Maintain a single visual container width (`760px`) to preserve task focus.
- Ensure all interactive elements have visible `:focus-visible` outlines in primary green.

### Don't
- Do not introduce purple-to-blue gradient cards or neon borders.
- Do not nest cards within cards more than one level deep.
- Do not let modal or chat dialogs obscure primary navigation without an explicit dismiss button.
- Do not use arbitrary custom padding when standard spacing tokens (`8px`, `12px`, `16px`, `24px`) suffice.
