// app/api/admin/update-candidate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "../../../../lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { id, name, description, image, idToken } = await req.json();

    if (!id || !idToken) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);

    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(decoded.uid).get();

    if (!userDoc.exists || !userDoc.data()?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized: Admin only" }, { status: 403 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (image !== undefined) updateData.image = image.trim();

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 });
    }

    await db.collection("candidates").doc(id).update(updateData);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update candidate error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update candidate" },
      { status: 500 }
    );
  }
}