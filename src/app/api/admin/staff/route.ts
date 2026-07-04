import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/firebase/admin";
import { dbPaths } from "@/firebase/paths";
import { errorResponse, requireAdmin } from "@/services/adminGuard";
import { createStaffSchema } from "@/types/schemas";

/**
 * Create a staff account via the Admin SDK.
 * Fixes the worst legacy admin bug: `createUserWithEmailAndPassword` on the
 * main auth instance silently signed the admin in as the new valet.
 */
export async function POST(request: Request) {
  try {
    await requireAdmin(request);

    const body = await request.json().catch(() => null);
    const parsed = createStaffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid fields" },
        { status: 400 },
      );
    }
    const { name, email, password, empId, phone } = parsed.data;

    let uid: string;
    try {
      const user = await adminAuth().createUser({
        email,
        password,
        displayName: name,
      });
      uid = user.uid;
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: mapCreateError(error),
      });
    }

    await adminDb().ref(dbPaths.staffProfile(uid)).set({
      name,
      email,
      empId,
      phone,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, uid });
  } catch (error) {
    return errorResponse(error);
  }
}

function mapCreateError(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  switch (code) {
    case "auth/email-already-exists":
      return "Email already has an account";
    case "auth/invalid-email":
      return "Invalid email address";
    case "auth/invalid-password":
      return "Password must be at least 6 characters";
    default:
      return "Could not create the account";
  }
}
