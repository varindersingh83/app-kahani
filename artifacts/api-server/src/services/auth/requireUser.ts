import type { Request } from "express";

export type AuthenticatedUser = {
  userId: string;
  isDevelopmentBypass: boolean;
};

type ClerkRequest = Request & {
  auth?: {
    userId?: string | null;
  };
};

export function requireUser(req: Request): AuthenticatedUser | null {
  const userId = (req as ClerkRequest).auth?.userId;
  if (userId) {
    return { userId, isDevelopmentBypass: false };
  }

  if (allowsDevelopmentAuthBypass()) {
    return { userId: "local_development_user", isDevelopmentBypass: true };
  }

  return null;
}

function allowsDevelopmentAuthBypass() {
  return (
    process.env.NODE_ENV !== "production" &&
    !process.env.CLERK_PUBLISHABLE_KEY &&
    !process.env.CLERK_SECRET_KEY
  );
}
