/**
 * Google OAuth 2.0 utilities for authentication.
 * 
 * Implements PKCE (Proof Key for Code Exchange) for secure OAuth flow.
 * References:
 * - https://developers.google.com/identity/protocols/oauth2
 * - https://www.rfc-editor.org/rfc/rfc7636 (PKCE)
 */

import type { GoogleTokenResponse, GoogleUserInfo } from '../schemas/auth.js';

/**
 * Generates a cryptographically secure random string for PKCE.
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncodeBuffer(array);
}

/**
 * Generates PKCE code challenge from verifier using S256 method.
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncodeBuffer(new Uint8Array(digest));
}

/**
 * Generates a random state parameter for CSRF protection.
 */
export function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return base64UrlEncodeBuffer(array);
}

/**
 * Base64URL encode a buffer (no padding).
 */
function base64UrlEncodeBuffer(buffer: Uint8Array): string {
  let binary = '';
  for (const b of buffer) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Exchanges authorization code for tokens with Google.
 */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<GoogleTokenResponse> {
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    code_verifier: codeVerifier,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json() as Promise<GoogleTokenResponse>;
}

/**
 * Fetches user profile from Google using access token.
 */
export async function getGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Userinfo fetch failed: ${error}`);
  }

  return response.json() as Promise<GoogleUserInfo>;
}

/**
 * Builds the Google OAuth authorization URL.
 */
export function buildAuthorizationUrl(
  clientId: string,
  redirectUri: string,
  state: string,
  codeChallenge: string,
  scopes: string[] = ['openid', 'email', 'profile']
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    access_type: 'offline', // Request refresh token
    prompt: 'consent', // Force consent to get refresh token
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Error class for Google OAuth errors.
 */
export class GoogleOAuthError extends Error {
  constructor(
    message: string,
    public code?: string,
    public description?: string
  ) {
    super(message);
    this.name = 'GoogleOAuthError';
  }
}

/**
 * Parses Google OAuth error from callback.
 */
export function parseGoogleError(error: string, errorDescription?: string): GoogleOAuthError {
  const descriptions: Record<string, string> = {
    'access_denied': 'Sign-in was cancelled',
    'invalid_request': 'Invalid request',
    'unauthorized_client': 'Unauthorized client',
    'unsupported_response_type': 'Unsupported response type',
    'invalid_scope': 'Invalid scope',
    'server_error': 'Server error',
    'temporarily_unavailable': 'Service temporarily unavailable',
  };

  return new GoogleOAuthError(
    errorDescription || descriptions[error] || 'OAuth error',
    error,
    errorDescription
  );
}
