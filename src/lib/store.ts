import { useState, useEffect } from 'react';
import { ref, onValue, set, push, remove, update } from 'firebase/database';
import { db, auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(!auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, loading };
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
}

export interface EmailTemplate {
  id: string;
  name: string;
  html: string;
  created: string;
}

export interface EmailJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'done';
  total: number;
  sent: number;
  failed: number;
  subject: string;
  lastUpdated: number;
}
