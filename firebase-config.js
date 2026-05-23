// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDS_LLjY3aXile5vPydgJ5LqkDOH63XiT8",
  authDomain: "team-care-192f1.firebaseapp.com",
  projectId: "team-care-192f1",
  storageBucket: "team-care-192f1.firebasestorage.app",
  messagingSenderId: "405402547156",
  appId: "1:405402547156:web:4de405d65e22d56d015c41",
  measurementId: "G-Y4603P2G0X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
firebase.initializeApp(firebaseConfig);