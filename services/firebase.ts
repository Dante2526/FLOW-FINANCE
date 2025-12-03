
import { initializeApp } from "firebase/app";
import { 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs
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

// Initialize Firestore with persistence settings
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);

// Helper to ensure user is authenticated anonymously before any DB action
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

// --- OPTIMIZED SYNC HELPERS ---

// OPTIMIZATION: Save as a single document containing the array.
// Returns TRUE if success, FALSE if failed (e.g. Quota Exceeded)
export const saveCollection = async (userId: string, collectionName: string, dataArray: any[]): Promise<boolean> => {
  await ensureAuth();
  const normalizedEmail = userId.toLowerCase().trim();
  
  try {
    // Saves to users/{email}/app_data/{collectionName} -> { items: [...] }
    const docRef = doc(db, "users", normalizedEmail, "app_data", collectionName);
    await setDoc(docRef, { items: dataArray, lastUpdated: Date.now() });
    return true;
  } catch (error: any) {
    console.error(`Error saving ${collectionName}:`, error);
    // Silent fail on quota exceeded to allow local storage to take over in App.tsx
    if (error.code === 'resource-exhausted') {
       console.warn("Firestore Quota Exceeded. Marked for sync later.");
    }
    return false;
  }
};

export const saveUserField = async (userId: string, field: string, data: any): Promise<boolean> => {
  await ensureAuth();
  const normalizedEmail = userId.toLowerCase().trim();
  try {
    const userRef = doc(db, "users", normalizedEmail);
    await setDoc(userRef, { [field]: data }, { merge: true });
    return true;
  } catch (error: any) {
    console.error(`Error saving field ${field}:`, error);
    return false;
  }
};

export const loadUserData = async (userId: string) => {
  await ensureAuth();
  const normalizedEmail = userId.toLowerCase().trim();
  const userRef = doc(db, "users", normalizedEmail);
  
  try {
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return null;

    const userData = userSnap.data();

    // Helper to load from optimized single-doc format, falling back to legacy subcollection
    const loadSub = async (colName: string) => {
      // 1. Try new format: users/{email}/app_data/{colName}
      try {
        const docRef = doc(db, "users", normalizedEmail, "app_data", colName);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          return docSnap.data().items || [];
        }
      } catch (err: any) {
        // If quota exceeded, stop trying to read legacy to save reads
        if (err.code === 'resource-exhausted') throw err;
      }

      // 2. Fallback: Legacy Subcollection users/{email}/{colName}
      try {
        const colRef = collection(db, "users", normalizedEmail, colName);
        const snap = await getDocs(colRef);
        if (!snap.empty) {
          console.log(`Migrating legacy data for ${colName}...`);
          return snap.docs.map(d => d.data());
        }
      } catch (err: any) {
        if (err.code === 'resource-exhausted') throw err;
      }

      return [];
    };

    const [transactions, accounts, investments, longTerm, notifications] = await Promise.all([
      loadSub("transactions"),
      loadSub("accounts"),
      loadSub("investments"),
      loadSub("longTerm"),
      loadSub("notifications")
    ]);

    return {
      ...userData,
      transactions,
      accounts,
      investments,
      longTerm,
      notifications
    };
  } catch (error) {
    console.error("Error loading user data:", error);
    throw error; // Propagate to App.tsx to trigger LocalStorage fallback
  }
};
