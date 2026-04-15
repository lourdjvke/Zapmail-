import { useState, useEffect } from 'react';
import { ref, onValue, set, push, remove, update } from 'firebase/database';
import { db, auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

let globalUser: User | null = auth.currentUser;
let globalLoading = !auth.currentUser;
const listeners = new Set<(data: { user: User | null, loading: boolean }) => void>();

onAuthStateChanged(auth, (user) => {
  globalUser = user;
  globalLoading = false;
  listeners.forEach(l => l({ user, loading: false }));
});

export function useAuth() {
  const [state, setState] = useState({ user: globalUser, loading: globalLoading });

  useEffect(() => {
    const listener = (data: { user: User | null, loading: boolean }) => setState(data);
    listeners.add(listener);
    // Sync in case it changed between initialization and effect
    if (state.user !== globalUser || state.loading !== globalLoading) {
      setState({ user: globalUser, loading: globalLoading });
    }
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return state;
}

export function useFirebaseData<T>(path: string, initialValue: T) {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setData(initialValue);
      setLoading(false);
      return;
    }

    const fullPath = `users/${user.uid}/${path}`;
    const dataRef = ref(db, fullPath);

    const unsubscribe = onValue(dataRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        // If it's an object (like a list of items), convert to array if needed
        if (typeof val === 'object' && !Array.isArray(val)) {
          const array = Object.entries(val).map(([id, item]) => ({
            ...(item as any),
            id
          }));
          setData(array as any);
        } else {
          setData(val);
        }
      } else {
        setData(initialValue);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, path]);

  const saveData = async (newData: T) => {
    if (!user) return;
    const fullPath = `users/${user.uid}/${path}`;
    await set(ref(db, fullPath), newData);
  };

  const addItem = async (item: any) => {
    if (!user) return;
    const fullPath = `users/${user.uid}/${path}`;
    const newListRef = push(ref(db, fullPath));
    await set(newListRef, { ...item, id: newListRef.key });
  };

  const removeItem = async (id: string) => {
    if (!user) return;
    const fullPath = `users/${user.uid}/${path}/${id}`;
    await remove(ref(db, fullPath));
  };

  const updateItem = async (id: string, updates: any) => {
    if (!user) return;
    const fullPath = `users/${user.uid}/${path}/${id}`;
    await update(ref(db, fullPath), updates);
  };

  return { data, saveData, addItem, removeItem, updateItem, loading };
}

export function useAllUsersTemplates() {
  const [data, setData] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = ref(db, 'users');

    const unsubscribe = onValue(usersRef, (snapshot) => {
      const usersData = snapshot.val();
      const allTemplates: EmailTemplate[] = [];

      if (usersData) {
        Object.entries(usersData).forEach(([uid, userData]: [string, any]) => {
          if (userData.templates) {
            Object.entries(userData.templates).forEach(([templateId, template]: [string, any]) => {
              allTemplates.push({
                ...template,
                id: templateId,
                uid: uid, // Track who owns it
                author: template.author || userData.profile?.displayName || userData.profile?.email || "Anonymous"
              });
            });
          }
        });
      }
      setData(allTemplates);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { data, loading };
}

export function useGlobalFirebaseData<T>(path: string, initialValue: T) {
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dataRef = ref(db, path);

    const unsubscribe = onValue(dataRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        if (typeof val === 'object' && !Array.isArray(val)) {
          const array = Object.entries(val).map(([id, item]) => ({
            ...(item as any),
            id
          }));
          setData(array as any);
        } else {
          setData(val);
        }
      } else {
        setData(initialValue);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [path]);

  const addItem = async (item: any) => {
    const dataRef = ref(db, path);
    const newItemRef = push(dataRef);
    await set(newItemRef, { ...item, id: newItemRef.key });
  };

  const removeItem = async (id: string) => {
    const dataRef = ref(db, `${path}/${id}`);
    await remove(dataRef);
  };

  const updateItem = async (id: string, updates: any) => {
    const dataRef = ref(db, `${path}/${id}`);
    await update(dataRef, updates);
  };

  return { data, addItem, removeItem, updateItem, loading };
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      window.dispatchEvent(new Event('local-storage'));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        console.error(error);
      }
    };
    window.addEventListener('local-storage', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('local-storage', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue] as const;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  created: string;
}

export interface BroadcastList {
  id: string;
  name: string;
  emails: string[];
  rtdbConfig?: {
    url: string;
    folder: string;
    subfolders: string[];
    explore: boolean;
    fieldName: string;
    nameFieldName?: string;
  };
}

export interface EmailTemplate {
  id: string;
  name: string;
  html: string;
  created: string;
  favorite?: boolean;
  uid?: string;
  author?: string;
}

export interface Draft {
  id: string;
  subject: string;
  content: string;
  htmlContent: string;
  composeType: 'plain' | 'custom';
  updatedAt: string;
}

export interface TrackingEvent {
  at: number;
  reader: string;
  ua: string;
}

export interface EmailJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'done' | 'scheduled' | 'cancelled';
  total: number;
  sent: number;
  failed: number;
  subject: string;
  lastUpdated: number;
  scheduledFor?: number;
  recurrence?: string;
  opens?: number;
  tracking?: Record<string, TrackingEvent>;
  isHtml?: boolean;
}
