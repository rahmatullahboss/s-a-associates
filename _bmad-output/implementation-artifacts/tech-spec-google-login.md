---
title: 'Google Login / Social Sign-up'
slug: 'google-login'
created: '2026-03-07T00:00:00.000Z'
status: 'Implementation Complete'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['Hono (Cloudflare Workers)', 'D1 Database', 'Drizzle ORM', 'React', 'Framer Motion', 'Tailwind CSS', 'Zod', 'WebCrypto']
files_to_modify: ['server/db/schema.ts', 'server/routes/auth.ts', 'server/schemas/auth.ts', 'src/pages/student/login/page.tsx', 'src/pages/student/signup/page.tsx', 'server/lib/google.ts']
code_patterns: ['Cookie-based JWT sessions', 'Rate limiting', 'Zod validation', 'HttpOnly secure cookies']
test_patterns: ['Manual testing via browser', 'API endpoint testing']
---

# Tech-Spec: Google Login / Social Sign-up

**Created:** 2026-03-07T00:00:00.000Z

## Overview

### Problem Statement

Users currently can only sign up/login using email and password. We need to add Google OAuth as an alternative authentication method that provides a frictionless signup experience - getting only the same data as email/password (email, name) without asking for any additional information.

### Solution

Implement Google OAuth 2.0 login flow that:
1. Allows users to sign in with their Google account
2. Retrieves basic profile data (email, name, avatar) from Google
3. Automatically creates an account if no existing account is found
4. Links Google account to existing email/password account if user already registered
5. Does NOT ask for any additional data beyond what Google provides

### Scope

**In Scope:**
- Google OAuth 2.0 authentication
- New user account creation from Google login
- Existing account linking via Google
- Session management for Google-authenticated users
- "Sign up with Google" and "Sign in with Google" buttons

**Out of Scope:**
- Other social login providers (Facebook, GitHub, etc.)
- Password recovery for accounts linked to Google
- Email verification bypass (Google already verifies email)
- User profile editing (future feature)

## Context for Development

### Codebase Patterns

- **Backend Framework**: Hono (Cloudflare Workers)
- **Database**: D1 with Drizzle ORM
- **Session Management**: Cookie-based JWT tokens (HttpOnly, secure, sameSite)
- **Password Handling**: WebCrypto for hashing
- **Validation**: Zod schemas
- **Rate Limiting**: Implemented for login/signup endpoints
- **Frontend**: React, Framer Motion, Tailwind CSS

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `server/db/schema.ts` | User table definition - need to add `googleId` field |
| `server/routes/auth.ts` | Auth routes (login, signup, logout, me) - add Google OAuth routes |
| `server/schemas/auth.ts` | Zod validation schemas - add Google OAuth schema |
| `server/middleware/auth.ts` | Auth middleware for protected routes |
| `src/pages/student/login/page.tsx` | Student login UI - add Google button |
| `src/pages/student/signup/page.tsx` | Student signup UI - add Google button |

### Technical Decisions

1. **Google OAuth Library**: Use Google's official OAuth 2.0 with PKCE for security
2. **User Schema**: Add `googleId` (text, nullable, unique) to users table - MUST use `.nullable()` in Drizzle
3. **Account Linking**: If email exists with password, link Google account to same user
4. **Session**: Reuse existing cookie-based JWT session - no changes needed to session management
5. **No Extra Data**: Do not ask any additional fields beyond what Google provides
6. **Frontend**: Add "Sign in with Google" button that uses simple redirect (not popup)
7. **CSRF Protection**: Generate and validate `state` parameter for all OAuth flows
8. **Error Handling**: Return user-friendly errors that can be displayed on login page
9. **Name Fallback**: Handle Google accounts with no display name (use email prefix or empty string)
10. **Token Handling**: Handle token expiry gracefully - users re-authenticate when needed

## Implementation Plan

### Tasks

- [x] Task 1: Add googleId field to users table schema
  - File: `server/db/schema.ts`
  - Action: Add `googleId: text('google_id').unique().nullable()` field to users table
  - Notes: Must be nullable - existing password accounts won't have googleId. Add `.nullable()` to the field definition.

- [x] Task 2: Create database migration for googleId column
  - File: `drizzle.config.ts` or migration files
  - Action: Generate and run Drizzle migration to add googleId column
  - Notes: Use `drizzle-kit` CLI for migration

- [x] Task 3: Add Google OAuth schema validation and types
  - File: `server/schemas/auth.ts`
  - Action: Add `googleCallbackSchema` for validating Google OAuth callback + TypeScript types for Google responses
  - Notes: Schema should handle `code` and `state` from Google OAuth callback. Add types for Google token response and userinfo response.

- [x] Task 4: Create Google OAuth utilities
  - File: `server/lib/google.ts` (NEW FILE)
  - Action: Create helper functions for Google OAuth
  - Implementation Steps:
    1. Add PKCE code verifier/challenge generators
    2. Add token exchange function
    3. Add userinfo fetch function
    4. Add state generator for CSRF
  - Notes: Keep OAuth logic separate from routes for maintainability

- [x] Task 5: Add Google OAuth callback endpoint
  - File: `server/routes/auth.ts`
  - Action: Add `GET /api/auth/google/callback` endpoint (OAuth callbacks are GET requests via browser redirect)
  - Implementation Steps:
    1. Validate required query params: `code`, `state` (for CSRF protection)
    2. Validate `state` matches stored state in cookie/session
    3. Exchange authorization code for tokens with Google OAuth
    4. Get user profile from Google using access token (or ID token)
    5. Check if googleId exists → if yes, login user
    6. If no googleId, check if email exists:
       - If email exists with password → link googleId to existing user → login
       - If email doesn't exist → create new user with googleId → login
    7. Set session cookie using existing `setSession` helper
    8. Handle missing name from Google (use email prefix or empty string)
  - Notes: Must be GET, not POST. Reuse existing session management (setSession helper)

- [x] Task 6: Add Google OAuth initiation endpoint
  - File: `server/routes/auth.ts`
  - Action: Add `GET /api/auth/google` endpoint
  - Implementation Steps:
    1. Generate PKCE code verifier and challenge (for security)
    2. Generate random `state` parameter for CSRF protection
    3. Store code verifier and state in signed httpOnly cookie
    4. Redirect to Google OAuth authorization URL with: client_id, redirect_uri, response_type=code, scope, state, code_challenge, code_challenge_method
  - Notes: Use Google OAuth 2.0 with PKCE for security. State parameter is REQUIRED for CSRF protection.

- [x] Task 7: Add Google button to student login page
  - File: `src/pages/student/login/page.tsx`
  - Action: Add "Sign in with Google" button above the email/password form
  - Implementation Steps:
    1. Add Google SVG icon
    2. Create button styling matching existing design
    3. Button calls `GET /api/auth/google` and follows redirect
  - Notes: Use Google Identity Services SDK or simple redirect

- [x] Task 8: Add Google button to student signup page
  - File: `src/pages/student/signup/page.tsx`
  - Action: Add "Sign up with Google" button above the signup form
  - Implementation Steps:
    1. Add Google SVG icon
    2. Create button styling matching existing design
    3. Button calls `GET /api/auth/google` and follows redirect
  - Notes: Same flow as login - both create account if new, link if exists

- [x] Task 9: Add Google OAuth environment variables
  - File: `wrangler.jsonc` and `.dev.vars.example`
  - Action: Add required environment variables:
    - `GOOGLE_CLIENT_ID`
    - `GOOGLE_CLIENT_SECRET`
    - `GOOGLE_REDIRECT_URI`
  - Notes: Configure in Google Cloud Console

- [x] Task 10: Add token refresh and error handling
  - File: `server/routes/auth.ts`
  - Action: Add token refresh mechanism and error handling
  - Implementation Steps:
    1. Handle expired access tokens - redirect to re-authenticate or show error
    2. Add error handling for: invalid code, denied permission, network errors
    3. Return user-friendly error messages that can be displayed on login page
    4. Add rate limiting on OAuth endpoints to prevent abuse
  - Notes: Google access tokens expire in ~1 hour. Handle gracefully.

- [x] Task 11: Test Google OAuth flow end-to-end
  - File: Manual testing
  - Action: Test complete OAuth flow:
    1. Click "Sign in with Google" → Google consent screen
    2. Approve → Redirect back → Account created/linked → Logged in
    3. Logout → Sign in again → Should recognize Google account
  - Notes: Test both new user and existing user scenarios

### Acceptance Criteria

- [ ] AC1: Given a new user, when they click "Sign in with Google" and complete Google OAuth, then a new account is created with name and email from Google, and user is logged in
- [ ] AC2: Given an existing user with email/password, when they click "Sign in with Google" using the same email, then their Google account is linked to existing account and user is logged in
- [ ] AC3: Given a user who previously signed up with Google, when they click "Sign in with Google" again, then they are logged in without creating a duplicate account
- [ ] AC4: Given a logged-in user, when they check their profile, then they can see their name from Google (not just email)
- [ ] AC5: Given a user during Google OAuth, when they cancel or deny permission, then they are redirected back to login page with error message
- [ ] AC6: Given the system, when Google OAuth fails (invalid credentials, network error), then appropriate error is shown and user can retry
- [ ] AC7: Given a user, when they are logged in via Google, then they can access all authenticated routes (dashboard, profile, etc.)
- [ ] AC8: Given a user logged in via Google, when they logout, then session is cleared and user is redirected to login page
- [ ] AC9: Given a user logging in via Google, when they deny permission or cancel, then they are redirected to login with error "Google sign-in was cancelled"
- [ ] AC10: Given the OAuth state parameter, when a mismatched or missing state is detected, then the request is rejected to prevent CSRF attacks
- [ ] AC11: Given a Google account with no display name, when they sign up, then the system handles it gracefully (uses email prefix or empty string)
- [ ] AC12: Given an expired Google access token, when a user tries to access protected resources, then they are prompted to re-authenticate

## Additional Context

### Dependencies

- **Google Cloud Console**: Need to create OAuth 2.0 credentials (Client ID and Client Secret)
- **Google OAuth Scopes**: `openid`, `email`, `profile`
- **Environment Variables Required**:
  - `GOOGLE_CLIENT_ID` - From Google Cloud Console
  - `GOOGLE_CLIENT_SECRET` - From Google Cloud Console  
  - `GOOGLE_REDIRECT_URI` - Your app's OAuth callback URL

### Testing Strategy

- **Manual Testing**:
  - Test complete OAuth flow with new Google account
  - Test linking existing email/password account with Google
  - Test re-login with Google account
  - Test error handling (denied permissions, network failures)
  - Test CSRF protection (tampered state parameter)
  - Test Google account with no display name
  
- **API Testing**:
  - Test `/api/auth/google` redirects to Google with correct params
  - Test `/api/auth/google/callback` with valid/invalid codes
  - Test `/api/auth/google/callback` with tampered/missing state
  
- **Security Testing**:
  - Verify CSRF protection with invalid state
  - Verify rate limiting on OAuth endpoints
  - Verify code can't be reused (one-time use)

- **Edge Cases**:
  - User with deleted Google account
  - Rate limiting on OAuth endpoints
  - Session expiry handling
  - Google account email change
  - User tries to use Google login but is admin role (should show error)

### Notes

- **Security**: Use PKCE (Proof Key for Code Exchange) + state parameter for OAuth security - prevents authorization code interception attacks and CSRF
- **Session**: Reuse existing cookie-based JWT session - no changes needed to session management
- **Google Avatar**: Optionally store `picture` from Google in studentProfiles - not required for MVP
- **Future Enhancement**: Allow users to link/unlink Google account from profile settings
- **Admin Login**: Current scope is student login only - admin login can be added later if needed. If admin tries Google login, show appropriate error.
- **Password Login**: Users can still login with password after linking Google - linking doesn't disable password login
- **Email Changes**: If user's Google email changes, they will be treated as new user (or can be linked if they contact support)
- **TypeScript**: Add TypeScript interfaces for Google OAuth token response and userinfo response
