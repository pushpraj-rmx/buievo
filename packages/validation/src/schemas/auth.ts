// Authentication and authorization validation schemas

import { z } from "zod";
import { 
  emailSchema, 
  passwordSchema, 
  nameSchema, 
  uuidSchema,
  dateSchema 
} from "./base";

// User role schemas
export const userRoleSchema = z.enum(["agent", "admin", "super_admin"]);
export const permissionSchema = z.string().min(1).max(100);

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
  twoFactorCode: z.string().length(6).optional(),
});

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Password confirmation is required"),
  role: userRoleSchema.default("agent"),
  acceptTerms: z.boolean().refine((val) => val === true, "You must accept the terms and conditions"),
  acceptPrivacy: z.boolean().refine((val) => val === true, "You must accept the privacy policy"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Password confirmation is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, "Password confirmation is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export const requestEmailVerificationSchema = z.object({
  email: emailSchema,
});

// JWT token schemas
export const jwtTokenSchema = z.object({
  accessToken: z.string().min(1, "Access token is required"),
  refreshToken: z.string().min(1, "Refresh token is required"),
  expiresIn: z.number().positive(),
  tokenType: z.literal("Bearer"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const revokeTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
  reason: z.string().max(200).optional(),
});

// User profile schemas
export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  timezone: z.string().max(50).optional(),
  language: z.string().length(2).optional(),
  dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]).optional(),
  timeFormat: z.enum(["12h", "24h"]).optional(),
});

export const userProfileSchema = z.object({
  id: uuidSchema,
  name: nameSchema,
  email: emailSchema,
  role: userRoleSchema,
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  timezone: z.string().max(50).optional(),
  language: z.string().length(2).optional(),
  dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]).optional(),
  timeFormat: z.enum(["12h", "24h"]).optional(),
  isEmailVerified: z.boolean(),
  isActive: z.boolean(),
  lastLoginAt: dateSchema.optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

// Permission and role schemas
export const createRoleSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  permissions: z.array(permissionSchema).min(1, "At least one permission is required"),
  isDefault: z.boolean().default(false),
});

export const updateRoleSchema = createRoleSchema.partial();

export const assignRoleSchema = z.object({
  userId: uuidSchema,
  roleId: uuidSchema,
});

export const revokeRoleSchema = z.object({
  userId: uuidSchema,
  roleId: uuidSchema,
});

export const createPermissionSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  resource: z.string().min(1).max(50),
  action: z.string().min(1).max(50),
  conditions: z.record(z.any()).optional(),
});

export const updatePermissionSchema = createPermissionSchema.partial();

// Session schemas
export const sessionSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  userAgent: z.string().max(500),
  ip: z.string().ip(),
  expiresAt: dateSchema,
  isActive: z.boolean(),
  lastActivityAt: dateSchema,
  createdAt: dateSchema,
});

export const createSessionSchema = z.object({
  userId: uuidSchema,
  userAgent: z.string().max(500),
  ip: z.string().ip(),
  expiresIn: z.number().positive().default(24 * 60 * 60), // 24 hours in seconds
});

export const updateSessionSchema = z.object({
  isActive: z.boolean().optional(),
  expiresIn: z.number().positive().optional(),
});

// Two-factor authentication schemas
export const enableTwoFactorSchema = z.object({
  method: z.enum(["totp", "sms", "email"]),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  email: emailSchema.optional(),
}).refine((data) => {
  if (data.method === "sms" && !data.phone) {
    return false;
  }
  if (data.method === "email" && !data.email) {
    return false;
  }
  return true;
}, {
  message: "Phone number is required for SMS 2FA, email is required for email 2FA",
});

export const verifyTwoFactorSchema = z.object({
  code: z.string().length(6, "2FA code must be 6 digits"),
  method: z.enum(["totp", "sms", "email"]),
});

export const disableTwoFactorSchema = z.object({
  code: z.string().length(6, "2FA code must be 6 digits"),
  method: z.enum(["totp", "sms", "email"]),
});

// OAuth schemas
export const oauthProviderSchema = z.enum(["google", "github", "facebook", "linkedin", "twitter"]);

export const oauthLoginSchema = z.object({
  provider: oauthProviderSchema,
  code: z.string().min(1, "Authorization code is required"),
  redirectUri: z.string().url(),
  state: z.string().optional(),
});

export const oauthCallbackSchema = z.object({
  provider: oauthProviderSchema,
  code: z.string().min(1, "Authorization code is required"),
  state: z.string().optional(),
});

// API key schemas
export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  permissions: z.array(permissionSchema).min(1, "At least one permission is required"),
  expiresAt: dateSchema.optional(),
  ipWhitelist: z.array(z.string().ip()).optional(),
});

export const updateApiKeySchema = createApiKeySchema.partial();

export const apiKeySchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  key: z.string().min(1),
  permissions: z.array(permissionSchema),
  expiresAt: dateSchema.optional(),
  ipWhitelist: z.array(z.string().ip()).optional(),
  lastUsedAt: dateSchema.optional(),
  isActive: z.boolean(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

// Export types
export type UserRole = z.infer<typeof userRoleSchema>;
export type Permission = z.infer<typeof permissionSchema>;
export type Login = z.infer<typeof loginSchema>;
export type Register = z.infer<typeof registerSchema>;
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type VerifyEmail = z.infer<typeof verifyEmailSchema>;
export type RequestEmailVerification = z.infer<typeof requestEmailVerificationSchema>;
export type JwtToken = z.infer<typeof jwtTokenSchema>;
export type RefreshToken = z.infer<typeof refreshTokenSchema>;
export type RevokeToken = z.infer<typeof revokeTokenSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type CreateRole = z.infer<typeof createRoleSchema>;
export type UpdateRole = z.infer<typeof updateRoleSchema>;
export type AssignRole = z.infer<typeof assignRoleSchema>;
export type RevokeRole = z.infer<typeof revokeRoleSchema>;
export type CreatePermission = z.infer<typeof createPermissionSchema>;
export type UpdatePermission = z.infer<typeof updatePermissionSchema>;
export type Session = z.infer<typeof sessionSchema>;
export type CreateSession = z.infer<typeof createSessionSchema>;
export type UpdateSession = z.infer<typeof updateSessionSchema>;
export type EnableTwoFactor = z.infer<typeof enableTwoFactorSchema>;
export type VerifyTwoFactor = z.infer<typeof verifyTwoFactorSchema>;
export type DisableTwoFactor = z.infer<typeof disableTwoFactorSchema>;
export type OAuthProvider = z.infer<typeof oauthProviderSchema>;
export type OAuthLogin = z.infer<typeof oauthLoginSchema>;
export type OAuthCallback = z.infer<typeof oauthCallbackSchema>;
export type CreateApiKey = z.infer<typeof createApiKeySchema>;
export type UpdateApiKey = z.infer<typeof updateApiKeySchema>;
export type ApiKey = z.infer<typeof apiKeySchema>;
