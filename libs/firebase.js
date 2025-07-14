// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDkF_piyoR1QvA-TaCJYSrEmmoSszAcayk",
  authDomain: "todo-app-e8636.firebaseapp.com",
  projectId: "todo-app-e8636",
  storageBucket: "todo-app-e8636.firebasestorage.app",
  messagingSenderId: "927616063757",
  appId: "1:927616063757:web:d4dc5ceb96671be500b844",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
