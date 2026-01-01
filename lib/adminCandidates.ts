import {
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    collection,
  } from "firebase/firestore";
  import { db } from "./firebase";
  import { confirmAdminPassword } from "./adminAuth";
  
  /* ADD */
  export async function addCandidateAdmin(
    name: string,
    description: string,
    image: string,
    password: string
  ) {
    await confirmAdminPassword(password);
  
    await addDoc(collection(db, "candidates"), {
      name,
      description,
      image,
      votes: 0,
    });
  }
  
  /* UPDATE */
  export async function updateCandidateAdmin(
    id: string,
    data: { name?: string; description?: string; image?: string },
    password: string
  ) {
    await confirmAdminPassword(password);
    await updateDoc(doc(db, "candidates", id), data);
  }
  
  /* DELETE */
  export async function deleteCandidateAdmin(
    id: string,
    password: string
  ) {
    await confirmAdminPassword(password);
    await deleteDoc(doc(db, "candidates", id));
  }
  