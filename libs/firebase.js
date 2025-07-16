// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getStorage } from "firebase/storage";

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

const firebaseConfig2 = {
  apiKey: "AIzaSyBCnqrnvnJLaKu-5OLII4sXRgxaVbpWmuc",
  authDomain: "oldgram-dd94a.firebaseapp.com",
  databaseURL: "https://oldgram-dd94a-default-rtdb.firebaseio.com",
  projectId: "oldgram-dd94a",
  storageBucket: "oldgram-dd94a.appspot.com",
  messagingSenderId: "388076421720",
  appId: "1:388076421720:web:e535cb0192adbc55c9c02d",
};

// Initialize Firebase
// Default app its todo app
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
// app 2 oldgram storage later for storage for images upload
export const app2 = initializeApp(firebaseConfig2, "oldgram-app");
export const storage = getStorage(app2);
