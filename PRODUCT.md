# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Indonesian digital micro-taskers, students, gig workers, and affiliate networkers who create and verify formatted Gmail accounts in exchange for cash rewards. They primarily access the platform via mobile web (smartphones) as well as desktop browsers, requiring lightweight, high-performance, and responsive design with minimal data consumption and instant feedback.

## Product Purpose

Setor-Get provides a transparent, reliable, and automated platform for users to deposit ("setor") newly created Gmail accounts adhering to strict validation criteria (`get...` prefix, min 8 character password, `@gmail.com` suffix) for an agreed compensation rate (Rp2.500 per accepted account). It minimizes deposit friction, ensures fair queue-based verification, protects against fraudulent submissions, and allows frictionless withdrawals to popular Indonesian digital wallets (DANA, OVO, GoPay) and local bank accounts once the minimum threshold (Rp25.000) is reached.

## Positioning

Unlike opaque or manual spreadsheet-based account acquisition channels, Setor-Get delivers instant client-side pre-validation, real-time background verification tracking, an upfront daily quota tracker (20 accounts/day), transparent referral gamification (20 invites = Rp15.000 bonus), and an in-app support channel with prompt automated responses.

## Operating Context

- **Usage Scenes:** Mobile-first, fast single or batch submissions while multi-tasking between browser windows.
- **Workflow:** Quick authentication -> Check Terms & Conditions -> Submit single account or test batch with Email Checker -> Monitor submission progress (Pending -> Di Cek -> Diterima) -> Withdraw balance to e-wallet once reaching Rp25.000 -> Share referral link to earn milestone rewards.
- **Tone & Mood:** Trustworthy, crisp, functional, financial-grade clarity, Indonesian phrasing with native fintech nuances (e.g., "Tarik saldo", "Diterima", "Pending").

## Capabilities and Constraints

- **Fixed Pricing Structure:** Flat reward of Rp2.500 per accepted Gmail account.
- **Submission Rules:**
  - Mandatory prefix: `get` (e.g. `getbudi21@gmail.com`).
  - Mandatory domain: `@gmail.com`.
  - Password minimum: 8 characters.
  - Uniqueness: Duplicate accounts across all users are rejected.
  - Daily limit: 20 submissions per user per 24 hours.
  - Agreement check: User must explicitly accept Terms & Conditions prior to initial deposit.
- **Withdrawal Rules:**
  - Minimum payout: Rp25.000.
  - Supported destinations: DANA, OVO, GoPay, and Indonesian Bank accounts.
- **Referral Program:**
  - Referral milestone: 20 successful friends (who submit at least one accepted Gmail) unlocks a Rp15.000 bonus.
- **Technical Stack:**
  - Frontend: Next.js (App Router), React 19, TypeScript, Tailwind CSS v4.
  - Backend: Golang Fiber v2, PostgreSQL 16 (GORM), JWT Authentication.

## Brand Commitments

- **Name:** Setor-Get (Setor Gmail).
- **Core Visual Motif:** Emerald/pine green deep financial palette (`#0f6b57`), warm off-white surface, distinct status badges, and dignified typography that conveys legitimacy over flashy speculative crypto aesthetics.
- **Voice:** Direct, honest, encouraging, concise, and respectful Indonesian language.

## Evidence on Hand

- Complete prototype layout and interactions in `frontend/gmail-stor.html`.
- Production-ready REST API implemented and validated in `backend/` with endpoints for auth, dashboard summary, submissions, checker, withdrawals, referrals, leaderboard, and live chat support.

## Product Principles

1. **Clarity Over Clutter:** Present balance, rates, and limits immediately without burying critical operational facts.
2. **Instant Status Feedback:** Every submission and action must reflect explicit state indicators (Pending, Di cek, Diterima, Ditolak).
3. **Respect Mobile Realities:** Design for quick thumb actions, high touch-target affordance, low network overhead, and zero horizontal overflow.
4. **Trust and Anti-Greed:** Avoid deceptive badges or artificial scarcity; display real countdowns, real transaction histories, and documented terms.

## Accessibility & Inclusion

- Adhere to WCAG 2.1 AA standards for color contrast, especially for currency amounts and status pills.
- Visible high-contrast focus rings for keyboard navigation.
- Semantic HTML tags (`<main>`, `<nav>`, `<section>`, `<header>`, `<button>`).
