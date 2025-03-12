import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration object
const firebaseConfig = {
    apiKey: "AIzaSyDPlU_qYwCTHKib9JBo3y8qplpkIyv-Ib4",
    authDomain: "lessonbooker-8664a.firebaseapp.com",
    projectId: "lessonbooker-8664a",
    storageBucket: "lessonbooker-8664a.firebasestorage.app",
    messagingSenderId: "412093205377",
    appId: "1:412093205377:web:a183bcf08c01f2d5d17680",
    measurementId: "G-Z6E55SR14X"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, analytics }; // Ensure all services are exported
