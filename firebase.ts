import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBxNk75MIGKq_wtA9l0_egUbOUnz-NtlEg",
    authDomain: "cotejodegallos.firebaseapp.com",
    projectId: "cotejodegallos",
    storageBucket: "cotejodegallos.firebasestorage.app",
    messagingSenderId: "638808911236",
    appId: "1:638808911236:web:739b8bcf6781fc1a6e01d1",
    measurementId: "G-674VGCPKJJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };
