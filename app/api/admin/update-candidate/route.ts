// app/api/admin/update-candidate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../../lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { id, name, description, image, idToken } = await req.json();
    if (!id || !idToken) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const decoded = await adminAuth.verifyIdToken(idToken);
    const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
    if (!userDoc.exists || !userDoc.data()?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await adminDb.collection("candidates").doc(id).update({
      name: name?.trim(),
      description: description?.trim(),
      image: image?.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}