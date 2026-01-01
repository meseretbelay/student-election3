// app/api/admin/add-candidate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "../../../../lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { name, description, image, idToken } = await req.json();
    if (!name || !description || !image || !idToken) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const decoded = await adminAuth.verifyIdToken(idToken);
    const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
    if (!userDoc.exists || !userDoc.data()?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await adminDb.collection("candidates").add({
      name: name.trim(),
      description: description.trim(),
      image: image.trim(),
      votes: 0,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}