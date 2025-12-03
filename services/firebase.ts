
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

export const saveCollection = async (userId: string, collectionName: string, dataArray: any[]) => {
  await ensureAuth();
  const normalizedEmail = userId.toLowerCase().trim();
  
  // OPTIMIZATION: Save as a single document containing the array.
  // This significantly reduces Write operations (1 write vs N items) and Reads (no diffing needed).
  // Fixes "Quota Exceeded" errors on free tier.
  try {
    const docRef = doc(db, "users", normalizedEmail, "app_data", collectionName);
    await setDoc(docRef, { items: dataArray });
  } catch (error: any) {
    console.error("Error saving collection:", error);
    if (error.code === 'resource-exhausted') {
       console.warn("Firestore Quota Exceeded. Data may not be saved.");
    }
  }
};

export const saveUserField = async (userId: string, field: string, data: any) => {
  await ensureAuth();
  const normalizedEmail = userId.toLowerCase().trim();
  const userRef = doc(db, "users", normalizedEmail);
  await setDoc(userRef, { [field]: data }, { merge: true });
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
      let error = null;

      // 1. Try new format: users/{email}/app_data/{colName}
      try {
        const docRef = doc(db, "users", normalizedEmail, "app_data", colName);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          return docSnap.data().items || [];
        }
      } catch (err: any) {
        console.warn(`Error loading new format for ${colName}`, err);
        error = err;
      }

      // 2. Fallback: Legacy Subcollection users/{email}/{colName}
      // This ensures existing users don't lose data.
      // On the next save, it will be written to the new format.
      try {
        const colRef = collection(db, "users", normalizedEmail, colName);
        const snap = await getDocs(colRef);
        if (!snap.empty) {
          return snap.docs.map(d => d.data());
        }
      } catch (err: any) {
        console.warn(`Error loading legacy format for ${colName}`, err);
        error = err || error;
      }

      // If we had an error (like Quota Exceeded) and didn't find data, throw
      // to avoid overwriting existing cloud data with an empty array.
      if (error) {
        throw error;
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
    throw error;
  }
};
