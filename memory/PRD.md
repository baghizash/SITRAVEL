# Si-Travel Riau — Product Requirements Document

## Original Problem
User uploaded a WBS file for "Aplikasi Pemesanan Tiket Travel Riau (Si-Travel Riau)" and requested a phased build starting with the landing page + search, then login, then multi-role dashboards (Admin Aplikasi, Travel, Pengguna, Manager/Kepala). Landing page must include a search feature (origin → destination → date) that lists travel operators.

## User Personas
1. Pengguna (Penumpang) — searches trips, books seat, gets e-ticket
2. Travel (Admin Loket) — manages schedules & bookings for their travel partner
3. Manager/Kepala — supervises multiple loket, sees aggregated reports for their travel
4. Admin Aplikasi — manages travel partners, users, sees platform-wide stats

## Core Requirements (static)
- Landing page with hero + search box (asal, tujuan, tanggal)
- Search results page with schedules from Riau cities
- JWT auth with 4 roles, role-based dashboards
- Booking flow with seat selection
- Riau-Melayu design language (moss green, golden yellow, deep red)

## What's Been Implemented (Feb 2026 — MVP v1)
- Backend (FastAPI + MongoDB): auth (register/login/logout/me, httpOnly cookies), cities/travels/schedules/bookings CRUD, /api/search endpoint, role-based /api/stats, seed data (12 Riau cities, 4 travel partners, ~30 routes × 14 days)
- Frontend (React + Tailwind + shadcn): Landing page, SearchBox component, Search results, Login/Register, Booking flow with seat map, 4 role dashboards (Pengguna, Travel, Manager, Admin), Recharts for Manager reports

## Prioritized Backlog
- P0: e2e testing pass; verify all role dashboards render
- P1: Payment gateway (Midtrans/Xendit) integration
- P1: E-ticket via email/WhatsApp
- P2: Refund & reschedule module
- P2: Offline mode for admin loket
- P2: Thermal printer integration
- P2: Commission scheme per partner + reconciliation reports
- P2: Real-time seat locking via WebSocket
