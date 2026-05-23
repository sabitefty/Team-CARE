// ═══════════════════════════════════════════════════
//  Team C.A.R.E — Authentication Service
//  File: src/firebase/auth.js
//  Admin-only login system using Firebase Auth
// ═══════════════════════════════════════════════════

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { auth, db } from './config.js';

// ═══════════════════════════════════════
//  LOGIN
// ═══════════════════════════════════════
export async function adminLogin(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);

    // Check if this user is actually an admin
    const adminDoc = await getDoc(doc(db, 'admins', cred.user.uid));
    if (!adminDoc.exists()) {
      await signOut(auth);
      throw new Error('Access denied. Not an admin account.');
    }

    return { success: true, user: cred.user, role: adminDoc.data().role };
  } catch (err) {
    const messages = {
      'auth/user-not-found':  'No account found with this email.',
      'auth/wrong-password':  'Incorrect password.',
      'auth/too-many-requests': 'Too many attempts. Try again later.',
      'auth/network-request-failed': 'Network error. Check your connection.'
    };
    throw new Error(messages[err.code] || err.message);
  }
}

// ═══════════════════════════════════════
//  LOGOUT
// ═══════════════════════════════════════
export async function adminLogout() {
  await signOut(auth);
  window.location.href = '/admin/login.html';
}

// ═══════════════════════════════════════
//  AUTH STATE — Protects admin pages
//  Call at top of every admin page
// ═══════════════════════════════════════
export function requireAuth(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // Not logged in — redirect to login
      window.location.href = '/admin/login.html';
      return;
    }

    // Verify admin role
    const adminDoc = await getDoc(doc(db, 'admins', user.uid));
    if (!adminDoc.exists()) {
      await signOut(auth);
      window.location.href = '/admin/login.html';
      return;
    }

    callback(user, adminDoc.data());
  });
}

// ═══════════════════════════════════════
//  FORGOT PASSWORD
// ═══════════════════════════════════════
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

// ═══════════════════════════════════════
//  CHANGE PASSWORD
// ═══════════════════════════════════════
export async function changePassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}