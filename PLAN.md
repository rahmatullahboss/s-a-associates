## S&A MVP Simplification Plan (Low Budget + Fast Delivery)

### Summary
এই plan-এর লক্ষ্য: system-টা ৩টা core flow-এ নামিয়ে আনা, complexity কমানো, এবং ১–২ দিনে stable delivery-ready করা।

Core flow থাকবে:
1. Homepage Lead Capture
2. Free Counseling Booking (simple status flow + meet link)
3. Student Login + Required Document Upload

---

### Current Repo Findings (Ground Truth)
- Booking logic already centralized in `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/app/actions.ts` এবং status এখন simple whitelist use করছে।
- Booking list/detail UI তে পুরনো complex statuses-এর UI traces আছে (`assigned`, `reschedule_requested`, etc.) in:
  - `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/app/dashboard/bookings/page.tsx`
  - `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/app/dashboard/queue/page.tsx`
- Queue route live আছে (`/dashboard/queue`) যা MVP-র জন্য optional/disable করা উচিত।
- Documents flow আছে এবং required doc types already match করছে:
  - `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/app/dashboard/documents/page.tsx`
  - `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/components/dashboard/DocumentUploadModal.tsx`
- Messages/Applications pages already redirected to dashboard (good for MVP hide):
  - `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/app/dashboard/messages/page.tsx`
  - `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/app/dashboard/applications/page.tsx`

---

### Scope Freeze (Decision Complete)
### In Scope
- Lead form submit + admin leads view
- Booking create/confirm/complete/cancel
- Default Meet link fallback from settings
- Student doc upload (pdf/image) + admin review
- Dashboard sidebar trimmed to only MVP tabs

### Out of Scope
- Messaging module
- Applications module
- Complex booking state machine (reschedule/no_show/cancel_requested)
- Agent assignment heavy workflow
- Calendar API auto-generated Meet link

---

### Public API / Interface / Type Changes
1. Booking status contract freeze
- Allowed statuses: `pending | confirmed | completed | cancelled`
- File: `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/app/actions.ts`
- File: `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/app/api/dashboard/bookings/route.ts`
- File: `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/app/dashboard/bookings/page.tsx`
- File: `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/app/dashboard/bookings/[id]/page.tsx`

2. Sidebar navigation contract freeze
- Admin/agent links: `Dashboard`, `Leads`, `Bookings`, `Documents`, `Settings`
- Student links: `Dashboard`, `My Bookings`, `Documents`, `Profile`
- File: `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/components/dashboard/Sidebar.tsx`

3. Document upload contract freeze
- Allowed file mime/extensions: PDF + image only
- Allowed doc type enum: `SSC Result | HSC Result | Transcript | BSc Result`
- File: `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/actions/upload.ts`
- File: `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/components/dashboard/DocumentUploadModal.tsx`

---

### Step-by-Step Implementation Checklist

## Phase 1: MVP Lock (No New Feature)
- [ ] `PLAN.md`-এ “MVP Freeze” section add করে in/out scope লিখে lock করা।
- [ ] পুরনো feature request গ্রহণ না করার জন্য release note draft করা (internal)।
- [ ] `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/app/actions.ts` এ status enum confirm করা: `pending/confirmed/completed/cancelled` only।
- [ ] `VALID_STATUS_TRANSITIONS` এ final matrix freeze করা।
- [ ] সব booking update path-এ `booking_events` insert হচ্ছে কিনা recheck করা।

## Phase 2: Booking UI Simplify
- [ ] `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/app/dashboard/bookings/page.tsx` থেকে non-MVP status chips/counters remove করা।
- [ ] status cards simplify করা: `Total`, `Pending`, `Confirmed`, `Completed`, `Cancelled`।
- [ ] `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/app/dashboard/bookings/[id]/page.tsx` এ action dropdown-এ only valid next actions রাখা।
- [ ] assign-specific UI (যদি MVP তে না লাগে) hide করা।
- [ ] `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/app/dashboard/queue/page.tsx` route disable/redirect `/dashboard/bookings` করা।

## Phase 3: Lead + Booking Intake Integrity
- [ ] `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/actions/leads.ts` input schema freeze করা।
- [ ] Lead submit rate limit `lead_submit: 6/60s` নিশ্চিত করা।
- [ ] Lead থেকে booking auto-create logic MVP-compatible কিনা verify করা (`status=pending`)।
- [ ] `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/components/layout/LeadFormModal.tsx` fields final করা: name/email/phone/program/budget (+optional country)।
- [ ] `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/components/BookConsultationModal.tsx` success copy update করা (queue শব্দ বাদ দিয়ে clear “booking submitted”)।

## Phase 4: Meet Link Strategy (Fast)
- [ ] `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/app/actions.ts` confirm path-এ `settings.defaultMeetLink` fallback test করা।
- [ ] `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/actions/settings.ts` এবং `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/components/dashboard/SettingsForm.tsx` এ `defaultMeetLink` editable রাখা।
- [ ] Booking confirm screen-এ “manual link optional” hint রাখা।
- [ ] Student-facing booking detail-এ meet link visible করা।

## Phase 5: Documents Flow Hardening
- [ ] `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/actions/upload.ts` এ server-side mime whitelist enforce করা।
- [ ] max size validation clear error message সহ return করা।
- [ ] upload action-এ ownership/auth check ensure করা (`getSession` + user role path)।
- [ ] `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/components/dashboard/DocumentUploadModal.tsx` accept types align করা।
- [ ] `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/app/dashboard/documents/page.tsx` checklist status UX final করা (missing vs uploaded)।

## Phase 6: Dashboard Simplification
- [ ] `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/components/dashboard/Sidebar.tsx` links strictly MVP-only করা।
- [ ] `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/app/dashboard/messages/page.tsx` redirect behaviour keep করা।
- [ ] `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/app/dashboard/applications/page.tsx` redirect behaviour keep করা।
- [ ] `/Users/rahmatullahzisan/Desktop/Dev/tawakkul-clone/src/app/dashboard/layout.tsx` role guards verify করা।
- [ ] student role থেকে admin-only menu leak হচ্ছে কিনা visual verify করা।

## Phase 7: Security/Compliance Pass
- [ ] সব server action এ order verify করা: same-origin -> rate limit -> auth/role -> zod -> DB operation।
- [ ] booking actions-এ ownership/permission DB-level check আছে কিনা ensure করা।
- [ ] error responses user-safe কিনা যাচাই করা (no stack leak)।
- [ ] সব dashboard/api page-এ edge runtime আছে কিনা scan করা।
- [ ] cross-role data leak regression check করা।

## Phase 8: QA + Handover
- [ ] `npm run build` clean pass করা।
- [ ] `npx wrangler pages dev` দিয়ে manual smoke test করা।
- [ ] Student flow end-to-end test record করা।
- [ ] Admin flow end-to-end test record করা।
- [ ] client demo checklist তৈরি করে final walkthrough করা।

---

### QA Test Cases (Acceptance Criteria)

## Lead Flow
- [ ] Valid lead submit হলে DB-তে row create হয়।
- [ ] Invalid email দিলে Zod validation error আসে।
- [ ] Rate limit exceed করলে safe error আসে।
- [ ] Admin leads page-এ new lead visible হয়।

## Booking Flow
- [ ] Homepage থেকে booking create হলে `pending` status হয়।
- [ ] একই slot এ duplicate pending block হয়।
- [ ] Admin confirm করলে status `confirmed` হয়।
- [ ] confirm সময় meet link empty হলে `defaultMeetLink` বসে।
- [ ] confirmed -> completed works।
- [ ] pending/confirmed -> cancelled works।
- [ ] invalid transition reject হয়।
- [ ] প্রতিটি status change-এ `booking_events` row create হয়।

## Document Flow
- [ ] Student login ছাড়া upload blocked।
- [ ] PDF upload success।
- [ ] JPG/PNG upload success (compression path সহ)।
- [ ] Unsupported mime reject হয়।
- [ ] > max size reject হয়।
- [ ] Admin verify/reject করলে status update হয়।

## Role & Access
- [ ] Student অন্য student booking/doc দেখতে পারে না।
- [ ] Student শুধু নিজের bookings/docs দেখে।
- [ ] Admin/agent bookings list দেখতে পারে।
- [ ] Hidden modules (messages/applications) থেকে actionable UI expose হয় না।

---

### Rollout Plan
1. Internal branch QA complete
2. Staging deploy on Cloudflare Pages
3. Client demo with 3 flows only
4. Content/settings update session
5. Production deploy
6. 24-hour observation window for booking/doc upload errors

---

### Assumptions & Defaults
- Default timezone booking-এ `Asia/Dhaka` থাকবে।
- Google Meet link auto-generation করা হবে না; settings fallback/manual override থাকবে।
- Queue module MVP-তে disabled থাকবে।
- Existing DB schema major migration ছাড়া MVP complete করা হবে।
- Agent role backward-compat হিসেবে admin-capable ধরা হবে (current authorization অনুযায়ী)।
