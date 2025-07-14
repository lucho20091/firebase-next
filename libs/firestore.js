import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";

export const addTodo = async (userId, todoData) => {
  try {
    const docRef = await addDoc(collection(db, "todos"), {
      ...todoData,
      userId,
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    throw error;
  }
};

export const getTodos = async (userId) => {
  try {
    const q = query(
      collection(db, "todos"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    throw error;
  }
};
