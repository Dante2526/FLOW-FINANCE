
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

// Initialize Firestore with robust persistence settings
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);

const ensureAuth = async () => {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Anonymous auth failed", error);
    }
  }
};

// --- HELPER: SANITIZE DATA ---
// Removes undefined values which Firestore rejects
const sanitizeData = (data: any) => {
  return JSON.parse(JSON.stringify(data));
};

// --- AUTH HELPERS ---

export const loginUser = async (email: string) => {
  await ensureAuth(); 
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
  await ensureAuth(); 
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
    onInitialLoad: () => void;
  }
) => {
  const normalizedEmail = userId.toLowerCase().trim();
  const userRef = doc(db, "users", normalizedEmail);
  
  // Track initialization status
  const loadStatus = {
    user: false,
    transactions: false,
    accounts: false,
    investments: false,
    longTerm: false,
    notifications: false
  };

  let initialLoadTriggered = false;

  const checkAllLoaded = () => {
    if (initialLoadTriggered) return;

    const allLoaded = Object.values(loadStatus).every(status => status);
    if (allLoaded) {
       initialLoadTriggered = true;
       setTimeout(() => {
         callbacks.onInitialLoad();
       }, 50);
    }
  };

  const markLoaded = (key: keyof typeof loadStatus) => {
    if (!loadStatus[key]) {
      loadStatus[key] = true;
      checkAllLoaded();
    }
  };

  // 1. Listen to User Document (Single Fields)
  const unsubUser = onSnapshot(userRef, 
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.profile) callbacks.setProfile(data.profile);
        if (data.theme) callbacks.setTheme(data.theme);
        if (data.months) callbacks.setMonths(data.months);
        if (data.notepadContent !== undefined) callbacks.setNotepad(data.notepadContent);
        if (data.cdiRate !== undefined) callbacks.setCdiRate(data.cdiRate);
      }
      markLoaded('user');
    },
    (error) => {
      console.warn("Error syncing user doc:", error);
      markLoaded('user'); 
    }
  );

  // 2. Listen to Subcollections (Lists)
  const subcollections = [
    { name: "transactions", setter: callbacks.setTransactions, key: 'transactions' },
    { name: "accounts", setter: callbacks.setAccounts, key: 'accounts' },
    { name: "investments", setter: callbacks.setInvestments, key: 'investments' },
    { name: "longTerm", setter: callbacks.setLongTerm, key: 'longTerm' },
    { name: "notifications", setter: callbacks.setNotifications, key: 'notifications' }
  ];

  const unsubSubs = subcollections.map(sub => {
    return onSnapshot(collection(db, "users", normalizedEmail, sub.name), 
      (snapshot) => {
        const data = snapshot.docs.map(d => d.data());
        sub.setter(data);
        // @ts-ignore
        markLoaded(sub.key);
      },
      (error) => {
        // @ts-ignore
        markLoaded(sub.key); 
      }
    );
  });

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
  
  // Read current DB state to prevent redundant writes or infinite loops
  const snapshot = await getDocs(colRef);
  const newIds = new Set(dataArray.map(d => d.id));
  
  const batch = writeBatch(db);
  let opCount = 0;
  
  // 1. Delete items that are no longer in the local state
  for (const doc of snapshot.docs) {
    if (!newIds.has(doc.id)) {
      batch.delete(doc.ref);
      opCount++;
    }
  }

  // 2. Update or Create items
  for (const item of dataArray) {
    const docRef = doc(colRef, item.id);
    const cleanItem = sanitizeData(item); // Strip undefineds

    const existingDoc = snapshot.docs.find(d => d.id === item.id);
    let needsUpdate = true;

    // Deep compare to check if update is actually needed
    if (existingDoc) {
      const existingData = existingDoc.data();
      if (JSON.stringify(existingData) === JSON.stringify(cleanItem)) {
        needsUpdate = false;
      }
    }

    if (needsUpdate) {
      batch.set(docRef, cleanItem);
      opCount++;
    }
  }

  if (opCount > 0) {
    await batch.commit();
  }
};

export const saveUserField = async (userId: string, field: string, data: any) => {
  await ensureAuth();
  const normalizedEmail = userId.toLowerCase().trim();
  const userRef = doc(db, "users", normalizedEmail);
  const cleanData = sanitizeData(data);
  await setDoc(userRef, { [field]: cleanData }, { merge: true });
};
