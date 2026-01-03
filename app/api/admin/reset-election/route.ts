// app/api/admin/reset-election/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "../../../../lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);

    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(decoded.uid).get();

    if (!userDoc.exists || !userDoc.data()?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized: Admin only" }, { status: 403 });
    }

    const batch = db.batch();

    // Reset all candidates votes to 0
    const candidatesSnap = await db.collection("candidates").get();
    candidatesSnap.docs.forEach((doc) => {
      batch.update(doc.ref, { votes: 0 });
    });

    // Reset all non-admin users hasVoted to false
    const usersSnap = await db.collection("users").get();
    usersSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (!data.isAdmin) {
        batch.update(doc.ref, { hasVoted: false });
      }
    });

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Reset election error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset election" },
      { status: 500 }
    );
  }
}