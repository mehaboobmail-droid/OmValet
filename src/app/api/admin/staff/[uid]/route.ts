import { NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, adminDb } from "@/firebase/admin";
import { dbPaths } from "@/firebase/paths";
import { errorResponse, HttpError, requireAdmin } from "@/services/adminGuard";
import type { Car } from "@/types/domain";
import { MIN_PASSWORD_LENGTH } from "@/constants";

type RouteContext = { params: Promise<{ uid: string }> };

const updateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  empId: z.string().trim().max(20).default(""),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[^\d]/g, "").slice(-10))
    .default(""),
  notes: z.string().trim().max(120).default(""),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
    .optional()
    .or(z.literal("")),
});

/**
 * Update a staff profile. Also:
 *  - actually changes the password when provided (the legacy field was a no-op)
 *  - propagates the new name onto active cars (legacy code crashed here)
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin(request);
    const { uid } = await context.params;

    const body = await request.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid fields" },
        { status: 400 },
      );
    }
    const { name, empId, phone, notes, password } = parsed.data;
    const db = adminDb();

    await db.ref(dbPaths.staffProfile(uid)).update({ name, empId, phone, notes });

    if (password) {
      await adminAuth().updateUser(uid, { password });
    }

    // Keep active car cards showing the current name.
    const carsSnap = await db.ref(dbPaths.cars).get();
    const cars = (carsSnap.val() as Record<string, Car> | null) ?? {};
    const updates: Record<string, string> = {};
    for (const [carId, car] of Object.entries(cars)) {
      if (car.valetUid === uid) updates[`${dbPaths.car(carId)}/valetName`] = name;
    }
    if (Object.keys(updates).length > 0) {
      await db.ref().update(updates);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * Delete a staff account — Auth user AND profile. Legacy only removed the
 * profile, leaving a ghost login that could still access the portal.
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const caller = await requireAdmin(request);
    const { uid } = await context.params;

    if (uid === caller.uid) {
      throw new HttpError(400, "You cannot delete your own account");
    }

    try {
      await adminAuth().deleteUser(uid);
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code: unknown }).code)
          : "";
      if (code !== "auth/user-not-found") throw error;
    }

    await adminDb().ref(dbPaths.staffProfile(uid)).remove();

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
