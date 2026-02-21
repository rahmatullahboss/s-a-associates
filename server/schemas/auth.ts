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
