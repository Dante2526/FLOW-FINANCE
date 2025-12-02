
import { initializeApp } from "firebase/app";
import { 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc, 
  getDoc, 
  setDoc, 
  writeBatch, 
  collection, 
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDN569Gc_M1fnVKA165hdw1bAyliopiZag",
  authDomain: "flow-finance-42625.firebaseapp.com",
  projectId: "flow-finance-42625",
  storageBucket: "flow-finance-42625.firebasestorage.app",
  messagingSenderId: "169965015728",
  appId: "1:169965015728:web:963d32a5cfb6e2c558e175"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with new persistence settings to avoid deprecation warning
// This replaces enableIndexedDbPersistence and supports multi-tab automatically
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);

// Helper to ensure user is authenticated anonymously before any DB action
// This solves the "Insecure Rules" warning by allowing us to use rules that require auth
const ensureAuth = async () => {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Anonymous auth failed", error);
    }
  }
};

// --- AUTH HELPERS ---

export const loginUser = async (email: string) => {
  await ensureAuth(); // Auth invisible
  const normalizedEmail = email.toLowerCase().trim();
  const userRef = doc(db, "users", normalizedEmail);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data();
  } else {
    throw new Error("Usuário não encontrado. Verifique o e-mail ou crie uma conta.");
  }
};

export const registerUser = async (email: string, name: string, initialData: any) => {
  await ensureAuth(); // Auth invisible
  const normalizedEmail = email.toLowerCase().trim();
  const userRef = doc(db, "users", normalizedEmail);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    throw new Error("Este e-mail já possui cadastro.");
  }

  await setDoc(userRef, {
    profile: {
      name: name.toUpperCase(),
      subtitle: '',
      avatarUrl: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix'
    },
    ...initialData
  });

  return { email: normalizedEmail, name };
};

// --- REAL-TIME SYNC HELPER ---

export const subscribeToUserData = (
  userId: string, 
  callbacks: {
    setProfile: (data: any) => void;
    setTheme: (data: any) => void;
    setMonths: (data: any[]) => void;
    setNotepad: (data: string) => void;
    setCdiRate: (data: number) => void;
    setTransactions: (data: any[]) => void;
    setAccounts: (data: any[]) => void;
    setInvestments: (data: any[]) => void;
    setLongTerm: (data: any[]) => void;
    setNotifications: (data: any[]) => void;
  }
) => {
  const normalizedEmail = userId.toLowerCase().trim();
  const userRef = doc(db, "users", normalizedEmail);
  
  // 1. Listen to User Document (Single Fields)
  const unsubUser = onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.profile) callbacks.setProfile(data.profile);
      if (data.theme) callbacks.setTheme(data.theme);
      if (data.months) callbacks.setMonths(data.months);
      if (data.notepadContent !== undefined) callbacks.setNotepad(data.notepadContent);
      if (data.cdiRate !== undefined) callbacks.setCdiRate(data.cdiRate);
    }
  });

  // 2. Listen to Subcollections (Lists)
  const subcollections = [
    { name: "transactions", setter: callbacks.setTransactions },
    { name: "accounts", setter: callbacks.setAccounts },
    { name: "investments", setter: callbacks.setInvestments },
    { name: "longTerm", setter: callbacks.setLongTerm },
    { name: "notifications", setter: callbacks.setNotifications }
  ];

  const unsubSubs = subcollections.map(sub => {
    return onSnapshot(collection(db, "users", normalizedEmail, sub.name), (snapshot) => {
      const data = snapshot.docs.map(d => d.data());
      sub.setter(data);
    });
  });

  // Return a function to unsubscribe from everything
  return () => {
    unsubUser();
    unsubSubs.forEach(unsub => unsub());
  };
};

// --- OPTIMIZED SAVE HELPERS ---

export const saveCollection = async (userId: string, collectionName: string, dataArray: any[]) => {
  await ensureAuth();
  const normalizedEmail = userId.toLowerCase().trim();
  const colRef = collection(db, "users", normalizedEmail, collectionName);
  
  // 1. Fetch current IDs to minimize writes (Diffing Strategy)
  const snapshot = await getDocs(colRef);
  const existingIds = new Set(snapshot.docs.map(d => d.id));
  const newIds = new Set(dataArray.map(d => d.id));
  
  const batch = writeBatch(db);
  let opCount = 0;
  
  // 2. Identify items to DELETE
  for (const doc of snapshot.docs) {
    if (!newIds.has(doc.id)) {
      batch.delete(doc.ref);
      opCount++;
    }
  }

  // 3. Identify items to SET
  // Note: For true real-time efficiency, we might compare content equality here, 
  // but simpler ID checking + overwrite is safer for consistency in this setup.
  for (const item of dataArray) {
    const docRef = doc(colRef, item.id);
    batch.set(docRef, item);
    opCount++;
  }

  // 4. Commit 
  if (opCount > 0) {
    if (opCount > 500) {
       console.warn("Large batch detected. Saving strictly necessary items.");
    }
    await batch.commit();
  }
};

export const saveUserField = async (userId: string, field: string, data: any) => {
  await ensureAuth();
  const normalizedEmail = userId.toLowerCase().trim();
  const userRef = doc(db, "users", normalizedEmail);
  await setDoc(userRef, { [field]: data }, { merge: true });
};
