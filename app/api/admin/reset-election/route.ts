// app/api/admin/reset-election/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../../lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken) return NextResponse.json({ error: "Missing token" }, { status: 400 });

    const decoded = await adminAuth.verifyIdToken(idToken);
    const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
    if (!userDoc.exists || !userDoc.data()?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const batch = adminDb.batch();
    const candidates = await adminDb.collection("candidates").get();
    candidates.docs.forEach((d) => batch.update(d.ref, { votes: 0 }));

    const users = await adminDb.collection("users").get();
    users.docs.forEach((d) => {
      if (!d.data()?.isAdmin) batch.update(d.ref, { hasVoted: false });
    });

    await batch.commit();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}