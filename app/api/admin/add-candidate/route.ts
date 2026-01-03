// app/api/admin/add-candidate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "../../../../lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { name, description, image, idToken } = await req.json();

    // Validate input
    if (!name || !description || !image || !idToken) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify token and check admin
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(idToken);

    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(decoded.uid).get();

    if (!userDoc.exists || !userDoc.data()?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized: Admin only" }, { status: 403 });
    }

    // ADD THE CANDIDATE — This is the key part
    const docRef = await db.collection("candidates").add({
      name: name.trim(),
      description: description.trim(),
      image: image.trim(),
      votes: 0, // Important: must have votes field
    });

    console.log("Candidate added with ID:", docRef.id); // Debug log

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error: any) {
    console.error("Add candidate error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add candidate" },
      { status: 500 }
    );
  }
}