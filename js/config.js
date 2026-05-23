import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getFirestore,
  enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDS_LLjY3aXile5vPydgJ5LqkDOH63XiT8",
  authDomain: "team-care-192f1.firebaseapp.com",
  projectId: "team-care-192f1",
  storageBucket: "team-care-192f1.appspot.com",
  messagingSenderId: "405402547156",
  appId: "1:405402547156:web:4de405d65e22d56d015c41",
  measurementId: "G-Y4603P2G0X"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

enableIndexedDbPersistence(db).catch(err => {
  console.warn(err);
});

export { app, db, storage, auth, analytics };