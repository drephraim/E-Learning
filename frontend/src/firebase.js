import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAnXB8xbielP8-dnm4WVt2MdGx0AdYl308",
  authDomain: "elearning-6eeae.firebaseapp.com",
  projectId: "elearning-6eeae",
  storageBucket: "elearning-6eeae.firebasestorage.app",
  messagingSenderId: "1061813226908",
  appId: "1:1061813226908:web:da8bbd731319c3dd958c59",
  measurementId: "G-BVVZHR3RN8"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
