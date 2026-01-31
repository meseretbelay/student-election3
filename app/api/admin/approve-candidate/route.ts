import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "../../../../lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { candidateId, idToken } = await req.json();
    if (!candidateId || !idToken) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);
    const db = getAdminDb();

    const userDoc = await db.collection("users").doc(decoded.uid).get();
    if (!userDoc.exists || !userDoc.data()?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await db.collection("candidates").doc(candidateId).update({
      status: "approved",
      approvedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
