import "server-only";
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/firebase/admin";
import { dbPaths } from "@/firebase/paths";

/** Typed error carrying an HTTP status for API routes. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Verify the caller is a signed-in admin (`admins/{uid} === true`).
 * Requires FIREBASE_SERVICE_ACCOUNT — privileged staff operations have no
 * safe fallback without it.
 */
export async function requireAdmin(request: Request): Promise<{ uid: string }> {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new HttpError(503, "Server credentials not configured");
  }

  const bearer = request.headers.get("authorization") ?? "";
  const token = bearer.startsWith("Bearer ") ? bearer.slice(7) : "";
  if (!token) throw new HttpError(401, "Unauthorized");

  let uid: string;
  try {
    uid = (await adminAuth().verifyIdToken(token)).uid;
  } catch {
    throw new HttpError(401, "Unauthorized");
  }

  const adminFlag = await adminDb().ref(dbPaths.admin(uid)).get();
  if (adminFlag.val() !== true) {
    throw new HttpError(403, "Admin access required");
  }

  return { uid };
}

/** Convert a thrown error into the standard JSON error response. */
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status },
    );
  }
  console.error("admin API failed:", error);
  return NextResponse.json(
    { success: false, error: "Something went wrong" },
    { status: 500 },
  );
}
