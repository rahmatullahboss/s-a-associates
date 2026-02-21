## Vite Conversion Stabilization Plan (`s-a-associates`) + Main System Isolation

### Summary
তুমি যেটা বলেছো, main system untouched রেখে আলাদা Vite React folder চালানো, সেটা workable।  
`/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/s-a-associates` build হচ্ছে, কিন্তু বেশ কিছু flow এখনো partial/placeholder।  
এই plan অনুযায়ী করলে Vite app production-usable হবে এবং main Next app আলাদা থাকবে।

---

### Current Findings (What already works / what is broken)
1. Vite build pass করছে: `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/s-a-associates` (`npm run build` ok)  
2. Auth + dashboard base routes already backend call করছে (`/api/auth/*`, `/api/dashboard`, `/api/dashboard/bookings`)  
3. Critical mismatch:
- Vite lead/booking modal calls:
  - `POST /api/leads`
  - `POST /api/leads/book`
- But deployed backend (`hono-backend...`) এ currently both return `404` (runtime blocker)
4. Several dashboard pages এখনও placeholder:
- `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/s-a-associates/src/pages/dashboard/leads/page.tsx`
- `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/s-a-associates/src/pages/dashboard/bookings/[id]/page.tsx`
- `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/s-a-associates/src/pages/dashboard/documents/page.tsx`
5. Vite codebase-এ Next-only dead server libs আছে:
- `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/s-a-associates/src/lib/auth.ts`
- `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/s-a-associates/src/lib/rate-limit.ts`
- `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/s-a-associates/src/lib/security.ts`
6. Lint error আছে:
- `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/s-a-associates/src/pages/dashboard/settings/page.tsx` (`any`)

---

### Public API / Interface Changes Required
## Backend (`src/api` Hono)
1. Ensure these endpoints are deployed and reachable:
- `POST /api/leads`
- `POST /api/leads/book`
2. Add missing dashboard endpoints used by Vite pages:
- `GET /api/dashboard/leads`
- `GET /api/dashboard/bookings/:id`
- `GET /api/dashboard/documents`
3. Keep cookie-based auth contract:
- `credentials: include` required from frontend
- cookie name `session_token` continues
4. Response contract standardize:
- success: `{ success: true, ... }`
- error: `{ error: 'message' }`

## Frontend (`s-a-associates`)
1. Introduce one API base constant:
- `VITE_API_BASE_URL` (env), fallback to current backend URL
2. Replace all hardcoded `https://hono-backend...` with shared API client helper.

---

### Step-by-Step Checklist (Execution-Ready)

## Phase 0: Isolation & Guardrails
- [ ] Main app (`/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src`) untouched রাখার rule লিখে রাখো।
- [ ] Vite কাজ শুধুই `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/s-a-associates` + `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/api` এ সীমাবদ্ধ করো।
- [ ] Separate deployment targets define করো (frontend Pages, backend Worker)।

## Phase 1: Backend Endpoint Completion
- [ ] `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/api/src/routes/leads.ts` live deploy verify করো (`/api/leads`, `/api/leads/book`)।
- [ ] `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/api/src/routes/dashboard.ts` এ add করো:
  - [ ] `GET /leads` (admin/agent only)
  - [ ] `GET /bookings/:id` (ownership/role check)
  - [ ] `GET /documents` (student own docs, admin grouped docs)
- [ ] সব new dashboard handlers-এ auth middleware + role filter enforce করো।
- [ ] response shape Vite pages এর জন্য stable করো।

## Phase 2: Vite API Client Normalization
- [ ] নতুন file: `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/s-a-associates/src/lib/api.ts`
- [ ] সেখানে:
  - [ ] `const API_BASE = import.meta.env.VITE_API_BASE_URL`
  - [ ] helper `apiFetch(path, init)` with `credentials: 'include'`
- [ ] hardcoded backend URLs replace করো in:
  - `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/s-a-associates/src/components/layout/LeadFormModal.tsx`
  - `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/s-a-associates/src/components/BookConsultationModal.tsx`
  - `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/s-a-associates/src/pages/dashboard/layout.tsx`
  - `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/s-a-associates/src/pages/dashboard/bookings/page.tsx`
  - `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/s-a-associates/src/pages/dashboard/leads/page.tsx`
  - `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/s-a-associates/src/pages/dashboard/documents/page.tsx`
  - `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/s-a-associates/src/actions/profile.ts`
  - `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/s-a-associates/src/actions/settings.ts`

## Phase 3: Placeholder Page Completion
- [ ] `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/s-a-associates/src/pages/dashboard/leads/page.tsx`:
  - [ ] table render করো (name/email/phone/program/budget/date)
  - [ ] loading/error/empty states proper করো
- [ ] `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/s-a-associates/src/pages/dashboard/bookings/[id]/page.tsx`:
  - [ ] full detail view implement করো (status, meet link, timeline)
  - [ ] confirm/cancel/complete actions wire করো
- [ ] `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/s-a-associates/src/pages/dashboard/documents/page.tsx`:
  - [ ] admin grouped review UI real data দিয়ে populate
  - [ ] student view show required docs checklist
- [ ] `Object.keys(data || {})` hack remove করে proper typed state ব্যবহার করো।

## Phase 4: Document Upload Wiring
- [ ] `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/s-a-associates/src/components/dashboard/DocumentUploadModal.tsx`:
  - [ ] real upload endpoint call add (`/api/upload` বা finalized route)
  - [ ] success হলে optimistic update অথবা refetch করো (avoid `window.location.reload()`)
- [ ] backend upload route access + mime checks নিশ্চিত করো।

## Phase 5: Remove Next-Only Dead Server Code from Vite
- [ ] `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/s-a-associates/src/lib/auth.ts` हटাও বা `legacy-server` folder এ move করো।
- [ ] `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/s-a-associates/src/lib/rate-limit.ts` हटাও।
- [ ] `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/s-a-associates/src/lib/security.ts` हटাও।
- [ ] এসব imports কোথাও accidentalভাবে used না থাকে তা `rg` দিয়ে recheck করো।

## Phase 6: MVP Alignment (Simple Product Shape)
- [ ] Sidebar links keep only MVP tabs (already mostly done, verify ছাত্র/admin both)।
- [ ] Booking status strictly keep `pending/confirmed/completed/cancelled` in UI labels/colors।
- [ ] Queue/messages/applications pages: keep redirect/hidden (MVP freeze)।

## Phase 7: QA + Acceptance
- [ ] `npm run lint` zero errors
- [ ] `npm run build` pass
- [ ] End-to-end checks:
  - [ ] Lead submit from homepage
  - [ ] Book consultation from homepage
  - [ ] Student signup/login/logout
  - [ ] Student upload document
  - [ ] Admin view leads/bookings/documents
  - [ ] Booking detail open + status update
- [ ] Cross-origin cookie test:
  - [ ] Login sets cookie
  - [ ] Refresh page keeps session
  - [ ] `/api/auth/me` returns authenticated=true after login

---

### Test Scenarios (Must Pass)
1. Unauthenticated user গেলে `/dashboard/*` থেকে login route-এ redirect।
2. Student user dashboard-এ leads list access না পায়।
3. Lead submit endpoint 200 and DB row created।
4. Book slot duplicate block returns 400 + message।
5. Booking detail route invalid id -> safe not-found UI।
6. Upload unsupported file type -> rejected message।
7. Logout করলে protected routes আবার unauthorized হয়।

---

### Assumptions / Defaults
1. `hono-backend.rahmatullahzisan.workers.dev` will remain backend origin for now.
2. Cookie auth থাকবে (`session_token`, `SameSite=None`, `Secure`) এবং frontend HTTPS-এ চলবে।
3. Main Next app থাকবে reference হিসেবে; Vite app independent delivery target।
4. MVP scope same থাকবে: Lead + Booking + Student Docs + Admin review.
