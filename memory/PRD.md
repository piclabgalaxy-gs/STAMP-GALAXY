# DocGalaxy E-Stamping Gujarat — PRD

## Original Problem Statement
Build an E-Stamping order management website for Gujarat targeting the keyword 'estamping' (brand: DocGalaxy, host: galaxystamp.docgalaxy.in). Customer login via mobile+name+OTP; separate admin email/password login. Customer estamping form (all optional fields) with searchable Gujarat stamp-duty article dropdown, auto-save drafts, read-only after submit, profile of orders, reviews (1-5 stars + text). Homepage testimonials + Q&A. Admin: orders list with status, autofill bookmarklet generator for shcilestamp.com, payment status management, review moderation. Complete SEO (meta, H1/H2/H3, schema LocalBusiness/Service/Review/FAQ, OG tags, sitemap, robots, canonical).

## Architecture
- **Backend**: FastAPI + MongoDB (motor). JWT Bearer auth (localStorage token). Collections: users, orders, reviews, otps. Startup seeds admin from env. Articles/FAQs served from `backend/seed_data.py`.
- **Frontend**: React (CRA/craco) + Tailwind + Shadcn UI + framer-motion. Routes: `/`, `/login`, `/admin/login`, `/dashboard`, `/estamping[/:id]`, `/admin`. AuthContext (token key `dg_token`).

## User Personas
- **Customer**: Gujarat resident needing an e-stamp certificate; logs in with mobile+OTP, fills estamping form, submits, tracks orders, leaves review.
- **Admin (DocGalaxy staff)**: manages orders, marks payment, generates SHCIL autofill bookmarklet, moderates reviews.

## Core Requirements (static)
- Mock OTP (fixed 123456) customer auth; email/password admin auth.
- Estamping form, all fields optional, auto-save drafts, read-only after submit.
- Reviews with admin approval; testimonials + FAQ on homepage.
- Admin orders table, payment toggle, autofill bookmarklet, review moderation.
- Full on-page SEO for 'estamping' keyword cluster.

## Implemented (2026-06)
- Customer OTP login + admin login (JWT). Admin seeded: ashokashok7751@gmail.com.
- E-Stamping form: 25 optional fields, searchable combobox of 59 Gujarat stamp-duty articles, debounced auto-save, submit→read-only, sticky summary.
- Customer dashboard (drafts + submitted). Reviews submit + moderation.
- Admin dashboard: stats, orders table, payment Paid/Unpaid switch, order detail dialog with draggable SHCIL autofill bookmarklet + copy, review approve/reject.
- Homepage: hero (H1 with 'estamping'), services, how-it-works, testimonials, leave-review, FAQ accordion, JSON-LD schema (LocalBusiness/Service/Review/FAQ), OG/Twitter/canonical meta, robots.txt, sitemap.xml.
- Tested: 14/14 backend, full frontend e2e — 100% pass.

## Backlog / Remaining
- **P1**: Real SMS OTP (Twilio) to replace mock; CSV upload for admin-managed stamp-duty articles.
- **P1**: Exact shcilestamp.com field-ID mapping for precise bookmarklet autofill.
- **P2**: Email/SMS notifications on status change; admin pagination; logo upload + brand colors.
- **P2**: Order PDF / e-stamp certificate export.

## Notes
- MOCKED: Customer OTP verification (fixed 123456, no SMS). Bookmarklet uses best-effort label matching (not exact shcilestamp field IDs).
