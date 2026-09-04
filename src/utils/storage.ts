/**
 * IndexedDB & Safe Storage Utility for Mundo Moda Shop
 * 
 * Provides resilient persistence for products with images and credit client records.
 * IndexedDB has virtually unlimited storage (>500MB) compared to localStorage (5MB),
 * completely preventing "QuotaExceededError" when saving dozens of product photos.
 */

import { Product, CreditClient, PaymentConfig } from '../types';
import { DEFAULT_PRODUCT_IMAGE } from '../data/initialData';

const DB_NAME = 'MundoModaDB';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('creditClients')) {
        db.createObjectStore('creditClients', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// ---------------- PRODUCTS IN INDEXEDDB ----------------

export async function getProductsFromIDB(): Promise<Product[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('products', 'readonly');
      const store = tx.objectStore('products');
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as Product[];
        resolve(Array.isArray(results) ? results : []);
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  } catch {
    return [];
  }
}

export async function saveProductsToIDB(products: Product[]): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');

      // Clear old entries and insert current list
      store.clear();
      for (const p of products) {
        store.put(p);
      }

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export async function saveSingleProductToIDB(product: Product): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');
      store.put(product);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

export async function deleteProductFromIDB(id: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('products', 'readwrite');
      const store = tx.objectStore('products');
      store.delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

// ---------------- CREDIT CLIENTS IN INDEXEDDB ----------------

export async function getCreditClientsFromIDB(): Promise<CreditClient[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('creditClients', 'readonly');
      const store = tx.objectStore('creditClients');
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as CreditClient[];
        resolve(Array.isArray(results) ? results : []);
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  } catch {
    return [];
  }
}

export async function saveCreditClientsToIDB(clients: CreditClient[]): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('creditClients', 'readwrite');
      const store = tx.objectStore('creditClients');
      store.clear();
      for (const c of clients) {
        store.put(c);
      }
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

// ---------------- SAFE LOCAL STORAGE (NEVER THROWS QUOTA EXCEEDED) ----------------

export function safeLocalStorageSet(key: string, value: any): boolean {
  try {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, str);
    return true;
  } catch (e: any) {
    // If quota exceeded, try to store a stripped down lightweight version without big images
    if (e && (e.name === 'QuotaExceededError' || e.code === 22 || e.number === -2147024882)) {
      if (key === 'mms_products' && Array.isArray(value)) {
        try {
          // Store products without the heavy base64 strings in localStorage, keeping IDs, names, prices
          const lightweight = value.map((p: any) => ({
            ...p,
            image: p.image && typeof p.image === 'string' && p.image.length > 500 ? DEFAULT_PRODUCT_IMAGE : (p.image && p.image.trim() !== '' ? p.image : DEFAULT_PRODUCT_IMAGE),
            gallery: []
          }));
          localStorage.setItem(key, JSON.stringify(lightweight));
          return true;
        } catch {
          // Even lightweight failed, silently clear this key to unblock other storage
          try { localStorage.removeItem(key); } catch {}
          return false;
        }
      }
    }
    return false;
  }
}

export function safeLocalStorageGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
}
