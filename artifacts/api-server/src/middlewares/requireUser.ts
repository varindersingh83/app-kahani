import { getAuth } from "@clerk/express";
import type { RequestHandler } from "express";

export function authIsEnabled() {
  return (
    Boolean(process.env.CLERK_PUBLISHABLE_KEY) ||
    process.env.NODE_ENV === "production"
  );
}

export const requireUser: RequestHandler = (req, res, next) => {
  if (!authIsEnabled()) {
    next();
    return;
  }

  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ message: "Unauthorized." });
    return;
  }

  next();
};
