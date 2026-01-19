import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "../../../../lib/firebaseAdmin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

const db = getAdminDb();
const auth = getAdminAuth();

export async function POST(req: Request) {
  try {
    const { startDate, endDate, idToken } = await req.json();

    if (!startDate || !endDate || !idToken) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const decoded = await auth.verifyIdToken(idToken);

    const userSnap = await db.collection("users").doc(decoded.uid).get();
    if (!userSnap.exists || userSnap.data()?.isAdmin !== true) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    await db.collection("settings").doc("election").set(
      {
        startDate: Timestamp.fromDate(start),
        endDate: Timestamp.fromDate(end),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Update election error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
