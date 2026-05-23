// ═══════════════════════════════════════════════════
//  Team C.A.R.E — Firestore Database Service
//  File: src/firebase/db.js
//  All database read/write operations in one place
// ═══════════════════════════════════════════════════

import {
  collection, doc, addDoc, setDoc, getDoc, getDocs,
  updateDoc, deleteDoc, query, where, orderBy, limit,
  onSnapshot, serverTimestamp, increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './config.js';

// ═══════════════════════════════════════
//  SITE SETTINGS
// ═══════════════════════════════════════
export const SiteSettings = {
  async get() {
    const snap = await getDoc(doc(db, 'settings', 'site'));
    return snap.exists() ? snap.data() : {};
  },
  async update(data) {
    await setDoc(doc(db, 'settings', 'site'), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },
  // Live listener — auto-updates website when admin changes settings
  listen(callback) {
    return onSnapshot(doc(db, 'settings', 'site'), snap => {
      if (snap.exists()) callback(snap.data());
    });
  }
};

// ═══════════════════════════════════════
//  HERO SECTION
// ═══════════════════════════════════════
export const HeroContent = {
  async get() {
    const snap = await getDoc(doc(db, 'content', 'hero'));
    return snap.exists() ? snap.data() : null;
  },
  async update(data) {
    await setDoc(doc(db, 'content', 'hero'), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  }
};

// ═══════════════════════════════════════
//  PROJECTS
// ═══════════════════════════════════════
export const Projects = {
  async getAll(publishedOnly = true) {
    let q = collection(db, 'projects');
    if (publishedOnly) {
      q = query(q, where('published', '==', true), orderBy('order', 'asc'));
    } else {
      q = query(q, orderBy('createdAt', 'desc'));
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getById(id) {
    const snap = await getDoc(doc(db, 'projects', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async create(data) {
    return await addDoc(collection(db, 'projects'), {
      ...data,
      published: false,
      views: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  async update(id, data) {
    await updateDoc(doc(db, 'projects', id), { ...data, updatedAt: serverTimestamp() });
  },

  async delete(id) {
    await deleteDoc(doc(db, 'projects', id));
  },

  async incrementViews(id) {
    await updateDoc(doc(db, 'projects', id), { views: increment(1) });
  }
};

// ═══════════════════════════════════════
//  TEAM MEMBERS
// ═══════════════════════════════════════
export const TeamMembers = {
  async getAll(activeOnly = true) {
    let q = query(collection(db, 'team'), orderBy('order', 'asc'));
    if (activeOnly) q = query(collection(db, 'team'), where('active', '==', true), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async create(data) {
    return await addDoc(collection(db, 'team'), {
      ...data, active: true, createdAt: serverTimestamp()
    });
  },

  async update(id, data) {
    await updateDoc(doc(db, 'team', id), { ...data, updatedAt: serverTimestamp() });
  },

  async delete(id) {
    await deleteDoc(doc(db, 'team', id));
  }
};

// ═══════════════════════════════════════
//  ACHIEVEMENTS
// ═══════════════════════════════════════
export const Achievements = {
  async getAll(publishedOnly = true) {
    let q = publishedOnly
      ? query(collection(db, 'achievements'), where('published', '==', true), orderBy('year', 'desc'))
      : query(collection(db, 'achievements'), orderBy('year', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async create(data) {
    return await addDoc(collection(db, 'achievements'), {
      ...data, published: true, createdAt: serverTimestamp()
    });
  },

  async update(id, data) {
    await updateDoc(doc(db, 'achievements', id), { ...data, updatedAt: serverTimestamp() });
  },

  async delete(id) {
    await deleteDoc(doc(db, 'achievements', id));
  }
};

// ═══════════════════════════════════════
//  GALLERY
// ═══════════════════════════════════════
export const Gallery = {
  async getAll(category = null) {
    let q = query(
      collection(db, 'gallery'),
      where('published', '==', true),
      orderBy('createdAt', 'desc')
    );
    if (category) {
      q = query(
        collection(db, 'gallery'),
        where('published', '==', true),
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async create(data) {
    return await addDoc(collection(db, 'gallery'), {
      ...data, published: true, createdAt: serverTimestamp()
    });
  },

  async delete(id) {
    await deleteDoc(doc(db, 'gallery', id));
  }
};

// ═══════════════════════════════════════
//  NEWS / BLOG
// ═══════════════════════════════════════
export const News = {
  async getAll(limit_n = 10) {
    const q = query(
      collection(db, 'news'),
      where('published', '==', true),
      orderBy('publishedAt', 'desc'),
      limit(limit_n)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async getById(id) {
    const snap = await getDoc(doc(db, 'news', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },

  async create(data) {
    return await addDoc(collection(db, 'news'), {
      ...data,
      published: false,
      views: 0,
      createdAt: serverTimestamp(),
      publishedAt: serverTimestamp()
    });
  },

  async update(id, data) {
    await updateDoc(doc(db, 'news', id), { ...data, updatedAt: serverTimestamp() });
  },

  async delete(id) {
    await deleteDoc(doc(db, 'news', id));
  }
};

// ═══════════════════════════════════════
//  CONTACT MESSAGES
// ═══════════════════════════════════════
export const ContactMessages = {
  async send(data) {
    return await addDoc(collection(db, 'contact'), {
      ...data,
      read: false,
      createdAt: serverTimestamp(),
      ip: null  // will be filled by Cloud Function
    });
  },

  async getAll(unreadOnly = false) {
    let q = unreadOnly
      ? query(collection(db, 'contact'), where('read', '==', false), orderBy('createdAt', 'desc'))
      : query(collection(db, 'contact'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async markRead(id) {
    await updateDoc(doc(db, 'contact', id), { read: true, readAt: serverTimestamp() });
  },

  async delete(id) {
    await deleteDoc(doc(db, 'contact', id));
  },

  // Real-time listener for admin dashboard unread count
  listenUnread(callback) {
    const q = query(collection(db, 'contact'), where('read', '==', false));
    return onSnapshot(q, snap => callback(snap.size));
  }
};

// ═══════════════════════════════════════
//  RESEARCH PAPERS
// ═══════════════════════════════════════
export const Research = {
  async getAll() {
    const q = query(
      collection(db, 'research'),
      where('published', '==', true),
      orderBy('year', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async create(data) {
    return await addDoc(collection(db, 'research'), {
      ...data, published: true, downloads: 0, createdAt: serverTimestamp()
    });
  },

  async incrementDownloads(id) {
    await updateDoc(doc(db, 'research', id), { downloads: increment(1) });
  },

  async delete(id) {
    await deleteDoc(doc(db, 'research', id));
  }
};

// ═══════════════════════════════════════
//  ANALYTICS HELPERS
// ═══════════════════════════════════════
export const Analytics = {
  async getSummary() {
    const [projects, team, achievements, messages, news] = await Promise.all([
      getDocs(collection(db, 'projects')),
      getDocs(collection(db, 'team')),
      getDocs(collection(db, 'achievements')),
      getDocs(query(collection(db, 'contact'), where('read', '==', false))),
      getDocs(collection(db, 'news'))
    ]);
    return {
      totalProjects:     projects.size,
      totalTeamMembers:  team.size,
      totalAchievements: achievements.size,
      unreadMessages:    messages.size,
      totalNews:         news.size
    };
  }
};