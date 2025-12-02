
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

// --- HELPER: SANITIZE & NORMALIZE DATA ---
// Removes undefined values AND sorts keys recursively to ensure consistent JSON strings
const normalizeData = (data: any): any => {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(normalizeData);
  }

  return Object.keys(data)
    .sort()
    .reduce((result: any, key) => {
      const value = data[key];
      // Skip undefined values entirely (Firestore doesn't support them)
      if (value !== undefined) {
        result[key] = normalizeData(value);
      }
      return result;
    }, {});
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

  const triggerInitialLoad = () => {
    if (!initialLoadTriggered) {
      initialLoadTriggered = true;
      callbacks.onInitialLoad();
    }
  };

  const checkAllLoaded = () => {
    const allLoaded = Object.values(loadStatus).every(status => status);
    if (allLoaded) {
       triggerInitialLoad();
    }
  };

  const markLoaded = (key: keyof typeof loadStatus) => {
    if (!loadStatus[key]) {
      loadStatus[key] = true;
      checkAllLoaded();
    }
  };

  // SAFETY TIMEOUT: Force load after 5 seconds if listeners stall
  const safetyTimeout = setTimeout(() => {
    if (!initialLoadTriggered) {
      console.log("Force triggering initial load due to timeout");
      triggerInitialLoad();
    }
  }, 5000);

  // 1. Listen to User Document (Single Fields)
  const unsubUser = onSnapshot(userRef, 
    (docSnap) => {
      // NOTE: We do NOT block hasPendingWrites here. 
      // This ensures that local updates (cached) are reflected immediately in the UI state
      // preventing the "empty database" issue on reload if data hasn't synced yet.
      // App.tsx handles loop prevention via isRemoteChange.

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
        // NOTE: We do NOT block hasPendingWrites here either.
        
        const data = snapshot.docs.map(d => d.data());
        sub.setter(data);
        markLoaded(sub.key as any);
      },
      (error) => {
        console.warn(`Error syncing ${sub.name}:`, error);
        markLoaded(sub.key as any); 
      }
    );
  });

  return () => {
    clearTimeout(safetyTimeout);
    unsubUser();
    unsubSubs.forEach(unsub => unsub());
  };
};

// --- SAVE FUNCTIONS ---

export const saveCollection = async (userId: string, collectionName: string, data: any[]) => {
  if (!userId) return;
  const normalizedEmail = userId.toLowerCase().trim();
  
  try {
    const batch = writeBatch(db);
    const colRef = collection(db, "users", normalizedEmail, collectionName);

    // 1. Get current docs to identify deletions
    const snapshot = await getDocs(colRef);
    const currentIds = new Set(snapshot.docs.map(d => d.id));
    const newIds = new Set(data.map(item => item.id));

    // 2. Delete items that are no longer in the new data
    snapshot.docs.forEach(doc => {
      if (!newIds.has(doc.id)) {
        batch.delete(doc.ref);
      }
    });

    // 3. Set/Update items from the new data
    data.forEach(item => {
      const docRef = doc(colRef, item.id);
      // Clean data before sending
      const cleanItem = normalizeData(item);
      batch.set(docRef, cleanItem);
    });

    await batch.commit();
  } catch (error) {
    console.error(`Error saving collection ${collectionName}:`, error);
  }
};

export const saveUserField = async (userId: string, field: string, data: any) => {
  if (!userId) return;
  const normalizedEmail = userId.toLowerCase().trim();
  const userRef = doc(db, "users", normalizedEmail);

  try {
    const cleanData = normalizeData(data);
    await setDoc(userRef, { [field]: cleanData }, { merge: true });
  } catch (error) {
    console.error(`Error saving field ${field}:`, error);
  }
};
