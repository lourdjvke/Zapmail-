import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, signInWithPopup } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCAt6CEwyRi-PJCXi24e2CVan6jRaBJRoE",
  authDomain: "zapmail-5769c.firebaseapp.com",
  databaseURL: "https://zapmail-5769c-default-rtdb.firebaseio.com",
  projectId: "zapmail-5769c",
  storageBucket: "zapmail-5769c.firebasestorage.app",
  messagingSenderId: "662628583771",
  appId: "1:662628583771:web:0160f074214672ff35f27e",
  measurementId: "G-R4KS3GQCJM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile };
export default app;
