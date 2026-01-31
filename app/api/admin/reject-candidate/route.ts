// app/api/admin/reject-candidate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "../../../../lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { candidateId, idToken } = await req.json();

    if (!candidateId || !idToken) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);

    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(decoded.uid).get();

    if (!userDoc.exists || !userDoc.data()?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized: Admin only" }, { status: 403 });
    }

    // Reject the candidate
    await db.collection("candidates").doc(candidateId).update({
      status: "rejected",
      rejectedAt: new Date(),
      // Optional: add rejection reason field if you want to collect it later
    });

    return NextResponse.json({ success: true, message: "Candidate rejected" });
  } catch (error: any) {
    console.error("Reject candidate error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reject candidate" },
      { status: 500 }
    );
  }
}