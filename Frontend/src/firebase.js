// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAq3GNWDt_J65ZxK1-Wf07zJg2_Lveu3_4",
    authDomain: "corewealth-b328f.firebaseapp.com",
    projectId: "corewealth-b328f",
    storageBucket: "corewealth-b328f.firebasestorage.app",
    messagingSenderId: "890168165196",
    appId: "1:890168165196:web:5a2c2e13346767be1905e9",
    measurementId: "G-S2G69FKRLE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const logInWithGoogle = () => {
  return signInWithPopup(auth, provider);
};

export const logOut = () => {
  return signOut(auth);
};