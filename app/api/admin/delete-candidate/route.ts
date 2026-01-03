// app/api/admin/delete-candidate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "../../../../lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { id, idToken } = await req.json();

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

    await db.collection("candidates").doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete candidate error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete candidate" },
      { status: 500 }
    );
  }
}