// Import Firebase (using CDN via ES modules in the HTML, or just global variable if using non-module script)
// Since we are using basic EJS, we'll use the compat scripts in the layout or dynamic import here.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCTLVqkYL0Nh0aV1g5CFrreIS5meyu82O8",
    authDomain: "campussolutions-f794a.firebaseapp.com",
    projectId: "campussolutions-f794a",
    storageBucket: "campussolutions-f794a.firebasestorage.app",
    messagingSenderId: "41164488531",
    appId: "1:41164488531:web:d9fbe03f69660ade552ba6",
    measurementId: "G-13W0XX9LVP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Login Elements
const loginForm = document.getElementById('loginForm');
const googleBtn = document.getElementById('googleLoginBtn');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.email.value;
        const password = loginForm.password.value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("Logged in:", userCredential.user);
            // Get Token and send to backend
            const token = await userCredential.user.getIdToken();
            handleServerSession(token);
        } catch (error) {
            console.error("Login Error:", error);
            alert("Login Failed: " + error.message);
        }
    });
}

if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            console.log("Google User:", result.user);
            const token = await result.user.getIdToken();
            handleServerSession(token);
        } catch (error) {
            console.error("Google Login Error:", error);
            alert("Google Login Failed: " + error.message);
        }
    });
}

async function handleServerSession(token) {
    // Send token to server to set a session cookie or verify
    // For now, since we might miss backend verify, we just redirect
    // In a real app, POST to /auth/login with token

    document.cookie = `authToken=${token}; path=/`; // Simple cookie set
    window.location.href = "/student/dashboard";
}
