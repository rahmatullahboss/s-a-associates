import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().max(256, { message: "Email must be at most 256 characters" }).email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }).max(256, { message: "Password must be at most 256 characters" }),
});

export const signupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }).max(256, { message: "Name must be at most 256 characters" }),
  email: z.string().max(256, { message: "Email must be at most 256 characters" }).email({ message: "Invalid email address" }),
  phone: z.string().min(10, { message: "Phone number must be at least 10 characters" }).max(20, { message: "Phone number must be at most 20 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(256, { message: "Password must be at most 256 characters" }),
});

// Google OAuth callback validation - expects code and state query params
export const googleCallbackSchema = z.object({
  code: z.string().min(1, { message: "Authorization code is required" }),
  state: z.string().min(1, { message: "State parameter is required" }),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

// Google OAuth error from consent screen
export const googleErrorSchema = z.object({
  error: z.string(),
  error_description: z.string().optional(),
});

// TypeScript types for Google OAuth responses
export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
  refresh_token?: string;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  verified_email?: boolean;
}
