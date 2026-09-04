import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch, disableNetwork } from 'firebase/firestore';
import { Product, CartItem, PaymentConfig, CreditClient, CreditPayment, CreditPurchase } from '../types';
import { INITIAL_PRODUCTS, INITIAL_PAYMENT_CONFIG, INITIAL_CREDIT_CLIENTS } from '../data/initialData';
import { db } from '../firebase';
import { 
  getProductsFromIDB, 
  saveProductsToIDB, 
  getCreditClientsFromIDB, 
  saveCreditClientsToIDB, 
  safeLocalStorageSet, 
  safeLocalStorageGet 
} from '../utils/storage';

interface StoreContextType {
  // Cloud Sync & Resilience
  cloudSyncStatus: 'connected' | 'connecting' | 'offline';
  isCloudQuotaExceeded: boolean;
  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  addMultipleProducts: (products: Omit<Product, 'id'>[]) => Promise<number>;
  updateProduct: (id: string, updated: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // BCV & Payments
  paymentConfig: PaymentConfig;
  updatePaymentConfig: (newConfig: Partial<PaymentConfig>) => void;
  bcvRate: number;
  setBcvRate: (rate: number) => void;
  fetchLiveBCVRate: () => Promise<number | null>;
  isFetchingRate: boolean;
  lastRateUpdate: string;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, selectedSize: string, quantity?: number) => void;
  removeFromCart: (productId: string, selectedSize: string) => void;
  updateCartQuantity: (productId: string, selectedSize: string, quantity: number) => void;
  clearCart: () => void;
  cartTotalUSD: number;
  cartTotalBS: number;
  cartItemsCount: number;

  // Favorites
  favorites: string[];
  toggleFavorite: (productId: string) => void;

  // Zoom / Lightbox
  lightboxProduct: Product | null;
  openLightbox: (product: Product) => void;
  closeLightbox: () => void;

  // Modals
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  isSizeGuideOpen: boolean;
  setIsSizeGuideOpen: (open: boolean) => void;
  isCreditPortalOpen: boolean;
  setIsCreditPortalOpen: (open: boolean) => void;

  // Credit & Sales Management
  creditClients: CreditClient[];
  addCreditClient: (client: Omit<CreditClient, 'id' | 'createdAt' | 'purchases' | 'payments' | 'balanceUSD'>) => void;
  addPaymentToClient: (clientId: string, payment: Omit<CreditPayment, 'id' | 'date' | 'rateBCV'>) => void;
  addPurchaseToClient: (clientId: string, purchase: Omit<CreditPurchase, 'id' | 'date'>) => void;
  deleteCreditClient: (clientId: string) => void;
  registerOrderSale: (orderData: {
    clientName: string;
    clientPhone: string;
    clientCedula: string;
    isCredit: boolean;
    initialAbonoUSD: number;
    itemsSummary: string;
    totalUSD: number;
    paymentMethod: string;
    reference: string;
  }) => CreditClient;
  payFullBalance: (clientId: string, method: string, reference: string) => void;
  
  // Unlocked Client Portal & Lookup by Cedula / Name
  unlockedClient: CreditClient | null;
  setUnlockedClient: (client: CreditClient | null) => void;
  lookupClientByCedulaOrPhone: (query: string) => CreditClient | null;
  logoutCreditPortal: () => void;

  // Helpers
  formatUSD: (val: number) => string;
  formatBS: (val: number) => string;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load products
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('mms_products');
      if (!saved) return INITIAL_PRODUCTS;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(p => p && typeof p === 'object').map((p, idx) => {
          const fallback = INITIAL_PRODUCTS[idx % INITIAL_PRODUCTS.length] || INITIAL_PRODUCTS[0];
          return {
            ...fallback,
            ...p,
            productType: p.productType || (p.cut?.toLowerCase().includes('jean') || p.category === 'dama' || p.category === 'caballero' ? 'jean' : 'otro'),
            priceUSD: typeof p.priceUSD === 'number' && !isNaN(p.priceUSD) ? p.priceUSD : (fallback.priceUSD || 25),
            availableSizes: Array.isArray(p.availableSizes) && p.availableSizes.length > 0 ? p.availableSizes : ['28', '30', '32', '34'],
            gallery: Array.isArray(p.gallery) && p.gallery.length > 0 ? p.gallery : [p.image || fallback.image]
          };
        });
      }
      return INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  // Load payment config
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(() => {
    try {
      const saved = localStorage.getItem('mms_payment_config');
      if (!saved) return INITIAL_PAYMENT_CONFIG;
      const parsed = JSON.parse(saved);
      return {
        ...INITIAL_PAYMENT_CONFIG,
        ...parsed,
        adminPin: parsed.adminPin || INITIAL_PAYMENT_CONFIG.adminPin,
        securityQuestion: parsed.securityQuestion || INITIAL_PAYMENT_CONFIG.securityQuestion,
        securityAnswer: parsed.securityAnswer || INITIAL_PAYMENT_CONFIG.securityAnswer,
        bcvRate: typeof parsed.bcvRate === 'number' && parsed.bcvRate > 0 ? parsed.bcvRate : INITIAL_PAYMENT_CONFIG.bcvRate,
        isAutoRate: parsed.isAutoRate !== undefined ? parsed.isAutoRate : true,
        lastRateUpdate: parsed.lastRateUpdate || "En vivo",
        pagoMovil: {
          ...INITIAL_PAYMENT_CONFIG.pagoMovil,
          ...(parsed.pagoMovil || {})
        },
        transferencia: {
          ...INITIAL_PAYMENT_CONFIG.transferencia,
          ...(parsed.transferencia || {})
        },
        efectivo: {
          ...INITIAL_PAYMENT_CONFIG.efectivo,
          ...(parsed.efectivo || {})
        }
      };
    } catch {
      return INITIAL_PAYMENT_CONFIG;
    }
  });

  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [lastRateUpdate, setLastRateUpdate] = useState<string>(paymentConfig.lastRateUpdate || "En vivo");

  // Load credit clients
  const [creditClients, setCreditClients] = useState<CreditClient[]>(() => {
    try {
      const saved = localStorage.getItem('mms_credit_clients');
      if (!saved) return INITIAL_CREDIT_CLIENTS;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(c => c && typeof c === 'object').map(c => ({
          ...c,
          saleType: c.saleType || (c.balanceUSD === 0 ? 'contado' : 'credito'),
          purchases: Array.isArray(c.purchases) ? c.purchases : [],
          payments: Array.isArray(c.payments) ? c.payments : [],
          balanceUSD: typeof c.balanceUSD === 'number' && !isNaN(c.balanceUSD) ? c.balanceUSD : (c.totalPurchasedUSD || 0)
        }));
      }
      return INITIAL_CREDIT_CLIENTS;
    } catch {
      return INITIAL_CREDIT_CLIENTS;
    }
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('mms_cart');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => 
          item && 
          item.product && 
          typeof item.product === 'object' && 
          typeof item.product.priceUSD === 'number'
        );
      }
      return [];
    } catch {
      return [];
    }
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mms_favorites');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [lightboxProduct, setLightboxProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isCreditPortalOpen, setIsCreditPortalOpen] = useState(false);
  const [unlockedClient, setUnlockedClient] = useState<CreditClient | null>(null);

  // Auto-fetch BCV Rate from live official sources
  const fetchLiveBCVRate = useCallback(async (): Promise<number | null> => {
    setIsFetchingRate(true);
    try {
      // Primary source: ve.dolarapi.com
      const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const rate = typeof data.promedio === 'number' ? data.promedio : parseFloat(data.promedio || data.precio || data.valor);
        if (rate && !isNaN(rate) && rate > 0) {
          const nowStr = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
          setPaymentConfig(prev => ({ ...prev, bcvRate: rate, lastRateUpdate: nowStr }));
          setLastRateUpdate(nowStr);
          setIsFetchingRate(false);
          return rate;
        }
      }
    } catch (err) {
      console.log('BCV rate fetch fallback:', err);
    }

    // Secondary fallback source: pydolarve or monedas.deno.dev
    try {
      const res2 = await fetch('https://pydolarve.org/api/v1/dollar?page=bcv', { cache: 'no-store' });
      if (res2.ok) {
        const data2 = await res2.json();
        const rate2 = data2?.monitors?.usd?.price || data2?.price;
        if (rate2 && typeof rate2 === 'number' && rate2 > 0) {
          const nowStr = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
          setPaymentConfig(prev => ({ ...prev, bcvRate: rate2, lastRateUpdate: nowStr }));
          setLastRateUpdate(nowStr);
          setIsFetchingRate(false);
          return rate2;
        }
      }
    } catch {
      // Keep existing rate
    }

    setIsFetchingRate(false);
    return null;
  }, []);

  // Cloud Sync Status & Quota Circuit Breaker
  const [isCloudQuotaExceeded, setIsCloudQuotaExceeded] = useState<boolean>(() => {
    try {
      const paused = sessionStorage.getItem('mms_cloud_quota_paused');
      if (paused) {
        const timestamp = parseInt(paused, 10);
        if (!isNaN(timestamp) && Date.now() - timestamp < 4 * 60 * 60 * 1000) {
          return true;
        }
      }
    } catch {}
    return false;
  });

  const [cloudSyncStatus, setCloudSyncStatus] = useState<'connected' | 'connecting' | 'offline'>(() => 
    isCloudQuotaExceeded ? 'offline' : 'connecting'
  );

  const handleCloudError = useCallback((err: any) => {
    const errMsg = String(err?.message || err);
    const isQuota = 
      err?.code === 'resource-exhausted' ||
      errMsg.includes('Quota exceeded') ||
      errMsg.includes('quota') ||
      errMsg.includes('Write stream exhausted');

    if (isQuota) {
      setIsCloudQuotaExceeded(true);
      setCloudSyncStatus('offline');
      try {
        sessionStorage.setItem('mms_cloud_quota_paused', Date.now().toString());
        disableNetwork(db).catch(() => {});
      } catch {}
      console.warn('⚠️ Modo Local Activo: La cuota gratuita de la nube ha alcanzado su límite diario. Todos los productos y ventas se guardan de forma instantánea y permanente en IndexedDB en tu dispositivo.');
    } else if (err?.code === 'unavailable' || errMsg.includes('could not be completed') || errMsg.includes('Could not reach Cloud Firestore')) {
      // Benign network latency or temporary backend disconnection: operate gracefully in offline mode
      setCloudSyncStatus('offline');
    } else {
      console.warn('Aviso de sincronización en la nube:', errMsg);
    }
  }, []);

  const safeCloudDocSet = useCallback(async (docRef: any, data: any, options?: any) => {
    if (isCloudQuotaExceeded) return;
    try {
      if (options) {
        await setDoc(docRef, data, options);
      } else {
        await setDoc(docRef, data);
      }
    } catch (err: any) {
      handleCloudError(err);
    }
  }, [isCloudQuotaExceeded, handleCloudError]);

  const safeCloudDocDelete = useCallback(async (docRef: any) => {
    if (isCloudQuotaExceeded) return;
    try {
      await deleteDoc(docRef);
    } catch (err: any) {
      handleCloudError(err);
    }
  }, [isCloudQuotaExceeded, handleCloudError]);

  // Hydrate from IndexedDB on startup (resilient offline/quota storage)
  useEffect(() => {
    getProductsFromIDB().then((stored) => {
      if (stored && stored.length > 0) {
        setProducts(stored);
      }
    }).catch(() => {});

    getCreditClientsFromIDB().then((stored) => {
      if (stored && stored.length > 0) {
        setCreditClients(stored);
      }
    }).catch(() => {});
  }, []);

  // Run auto rate check on mount and interval
  useEffect(() => {
    fetchLiveBCVRate();
    const interval = setInterval(() => {
      fetchLiveBCVRate();
    }, 10 * 60 * 1000); // Check every 10 min
    return () => clearInterval(interval);
  }, [fetchLiveBCVRate]);

  // Real-time Cloud Synchronization via Firebase Firestore with Quota Guard
  useEffect(() => {
    if (isCloudQuotaExceeded) {
      setCloudSyncStatus('offline');
      try {
        disableNetwork(db).catch(() => {});
      } catch {}
      return;
    }

    const unsubs: (() => void)[] = [];
    try {
      // 1. Sync Products in real-time
      const unsubProducts = onSnapshot(
        collection(db, 'products'),
        (snapshot) => {
          if (!snapshot.empty) {
            const cloudList: Product[] = [];
            snapshot.forEach((d) => {
              const data = d.data() as Product;
              cloudList.push({
                ...data,
                id: d.id,
                priceUSD: typeof data.priceUSD === 'number' ? data.priceUSD : 25,
                availableSizes: Array.isArray(data.availableSizes) ? data.availableSizes : ['28', '30', '32'],
                gallery: Array.isArray(data.gallery) && data.gallery.length > 0 ? data.gallery : [data.image || '']
              });
            });
            setProducts(cloudList);
            saveProductsToIDB(cloudList).catch(() => {});
            safeLocalStorageSet('mms_products', cloudList);
          }
          setCloudSyncStatus('connected');
        },
        (err) => {
          handleCloudError(err);
        }
      );
      unsubs.push(unsubProducts);

      // 2. Sync Credit Clients in real-time
      const unsubClients = onSnapshot(
        collection(db, 'creditClients'),
        (snapshot) => {
          if (!snapshot.empty) {
            const cloudClients: CreditClient[] = [];
            snapshot.forEach((d) => {
              const data = d.data() as CreditClient;
              cloudClients.push({
                ...data,
                id: d.id,
                purchases: Array.isArray(data.purchases) ? data.purchases : [],
                payments: Array.isArray(data.payments) ? data.payments : [],
                balanceUSD: typeof data.balanceUSD === 'number' ? data.balanceUSD : (data.totalPurchasedUSD || 0)
              });
            });
            setCreditClients(cloudClients);
            saveCreditClientsToIDB(cloudClients).catch(() => {});
            safeLocalStorageSet('mms_credit_clients', cloudClients);
          }
          setCloudSyncStatus('connected');
        },
        (err) => {
          handleCloudError(err);
        }
      );
      unsubs.push(unsubClients);

      // 3. Sync Store Settings & Payment Config in real-time
      const unsubSettings = onSnapshot(
        doc(db, 'storeSettings', 'config'),
        (snap) => {
          if (snap.exists()) {
            const cloudCfg = snap.data() as PaymentConfig;
            setPaymentConfig((prev) => ({ ...prev, ...cloudCfg }));
          }
        },
        (err) => {
          handleCloudError(err);
        }
      );
      unsubs.push(unsubSettings);
    } catch (err) {
      handleCloudError(err);
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [isCloudQuotaExceeded, handleCloudError]);

  // Sync with IndexedDB and safe localStorage cache (QuotaExceededError-proof)
  useEffect(() => {
    saveProductsToIDB(products).catch(() => {});
    safeLocalStorageSet('mms_products', products);
  }, [products]);

  useEffect(() => {
    safeLocalStorageSet('mms_payment_config', paymentConfig);
  }, [paymentConfig]);

  useEffect(() => {
    saveCreditClientsToIDB(creditClients).catch(() => {});
    safeLocalStorageSet('mms_credit_clients', creditClients);
  }, [creditClients]);

  useEffect(() => {
    safeLocalStorageSet('mms_cart', cart);
  }, [cart]);

  useEffect(() => {
    safeLocalStorageSet('mms_favorites', favorites);
  }, [favorites]);

  // Keep unlocked client refreshed when clients update
  useEffect(() => {
    if (unlockedClient) {
      const updated = creditClients.find(c => c.id === unlockedClient.id || (unlockedClient.idCard && c.idCard === unlockedClient.idCard));
      if (updated) {
        setUnlockedClient(updated);
      }
    }
  }, [creditClients, unlockedClient]);

  // BCV Rate Helper
  const bcvRate = paymentConfig.bcvRate || 37.50;
  const setBcvRate = (rate: number) => {
    setPaymentConfig(prev => ({ ...prev, bcvRate: rate, lastRateUpdate: 'Manual' }));
    setLastRateUpdate('Manual');
    safeCloudDocSet(doc(db, 'storeSettings', 'config'), { bcvRate: rate, lastRateUpdate: 'Manual' }, { merge: true });
  };

  const updatePaymentConfig = (newConfig: Partial<PaymentConfig>) => {
    setPaymentConfig(prev => ({ ...prev, ...newConfig }));
    safeCloudDocSet(doc(db, 'storeSettings', 'config'), newConfig, { merge: true });
  };

  // Currency Formatters
  const formatUSD = (val: number) => `$${val.toFixed(2)}`;
  const formatBS = (val: number) => `Bs. ${(val * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Helper: Generador seguro de IDs sin colisión
  const generateUniqueProductId = (existing: Product[], usedInBatch?: Set<string>): string => {
    let id = '';
    let attempts = 0;
    do {
      const num = Math.floor(100000 + Math.random() * 900000);
      id = `MMS-${num}`;
      attempts++;
    } while ((existing.some(p => p.id === id) || (usedInBatch && usedInBatch.has(id))) && attempts < 500);

    if ((usedInBatch && usedInBatch.has(id)) || existing.some(p => p.id === id)) {
      id = `MMS-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    }
    if (usedInBatch) usedInBatch.add(id);
    return id;
  };

  // Product actions
  const addProduct = (productData: Omit<Product, 'id'>) => {
    const newId = generateUniqueProductId(products);
    const newProduct: Product = {
      ...productData,
      id: newId,
      productType: productData.productType || 'otro',
      rating: 5.0,
      reviewsCount: 1,
      inStock: true,
      gallery: productData.gallery && productData.gallery.length > 0 ? productData.gallery : [productData.image]
    };
    setProducts(prev => {
      const next = [newProduct, ...prev];
      saveProductsToIDB(next).catch(() => {});
      safeLocalStorageSet('mms_products', next);
      return next;
    });
    safeCloudDocSet(doc(db, 'products', newId), newProduct);
  };

  const addMultipleProducts = async (productsData: Omit<Product, 'id'>[]): Promise<number> => {
    if (!productsData || productsData.length === 0) return 0;

    const usedIds = new Set<string>();
    const newItems: Product[] = productsData.map((pData) => {
      const newId = generateUniqueProductId(products, usedIds);
      return {
        ...pData,
        id: newId,
        productType: pData.productType || 'otro',
        rating: 5.0,
        reviewsCount: 1,
        inStock: true,
        gallery: pData.gallery && pData.gallery.length > 0 ? pData.gallery : [pData.image]
      };
    });

    // 1. Actualización inmediata del estado en React y guardado en IndexedDB permanente
    setProducts(prev => {
      const next = [...newItems, ...prev];
      saveProductsToIDB(next).catch(() => {});
      safeLocalStorageSet('mms_products', next);
      return next;
    });

    // 2. Guardar en Firestore por lotes sólo si la cuota no está excedida
    if (!isCloudQuotaExceeded) {
      try {
        const chunkSize = 400;
        for (let i = 0; i < newItems.length; i += chunkSize) {
          const chunk = newItems.slice(i, i + chunkSize);
          const batch = writeBatch(db);
          chunk.forEach((item) => {
            const docRef = doc(db, 'products', item.id);
            batch.set(docRef, item);
          });
          await batch.commit();
        }
      } catch (e: any) {
        handleCloudError(e);
      }
    }

    return newItems.length;
  };

  const updateProduct = (id: string, updated: Partial<Product>) => {
    setProducts(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updated } : p);
      saveProductsToIDB(next).catch(() => {});
      safeLocalStorageSet('mms_products', next);
      return next;
    });
    safeCloudDocSet(doc(db, 'products', id), updated, { merge: true });
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => {
      const next = prev.filter(p => p.id !== id);
      saveProductsToIDB(next).catch(() => {});
      safeLocalStorageSet('mms_products', next);
      return next;
    });
    setCart(prev => prev.filter(item => item?.product?.id !== id));
    setFavorites(prev => prev.filter(favId => favId !== id));
    safeCloudDocDelete(doc(db, 'products', id));
  };

  // Cart actions
  const addToCart = (product: Product, selectedSize: string, quantity = 1) => {
    if (!product || !product.id) return;
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item?.product?.id === product.id && item?.selectedSize === selectedSize);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: (updated[existingIndex]?.quantity || 0) + quantity
        };
        return updated;
      }
      return [...prev, { product, selectedSize, quantity }];
    });
  };

  const removeFromCart = (productId: string, selectedSize: string) => {
    setCart(prev => prev.filter(item => !(item?.product?.id === productId && item?.selectedSize === selectedSize)));
  };

  const updateCartQuantity = (productId: string, selectedSize: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedSize);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item?.product?.id === productId && item?.selectedSize === selectedSize) {
        return { ...item, quantity };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const cartTotalUSD = cart.reduce((sum, item) => sum + ((item?.product?.priceUSD || 0) * (item?.quantity || 1)), 0);
  const cartTotalBS = cartTotalUSD * bcvRate;
  const cartItemsCount = cart.reduce((sum, item) => sum + (item?.quantity || 0), 0);

  // Favorites
  const toggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  // Lightbox
  const openLightbox = (product: Product) => setLightboxProduct(product);
  const closeLightbox = () => setLightboxProduct(null);

  // Credit & Sales Management
  const addCreditClient = (clientData: Omit<CreditClient, 'id' | 'createdAt' | 'purchases' | 'payments' | 'balanceUSD'>) => {
    const newId = `cli-${Date.now()}`;
    const newClient: CreditClient = {
      ...clientData,
      id: newId,
      saleType: clientData.saleType || 'credito',
      createdAt: new Date().toISOString().split('T')[0],
      purchases: [
        {
          id: `pur-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          description: "Compra inicial",
          amountUSD: clientData.totalPurchasedUSD
        }
      ],
      payments: [],
      balanceUSD: clientData.totalPurchasedUSD
    };
    setCreditClients(prev => {
      const next = [newClient, ...prev];
      saveCreditClientsToIDB(next).catch(() => {});
      safeLocalStorageSet('mms_credit_clients', next);
      return next;
    });
    safeCloudDocSet(doc(db, 'creditClients', newId), newClient);
  };

  const addPaymentToClient = (clientId: string, paymentData: Omit<CreditPayment, 'id' | 'date' | 'rateBCV'>) => {
    setCreditClients(prev => {
      const next = prev.map(client => {
        if (client.id !== clientId) return client;
        
        const newPayment: CreditPayment = {
          ...paymentData,
          id: `pay-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          rateBCV: bcvRate,
        };

        const updatedPayments = [newPayment, ...client.payments];
        const newBalance = Math.max(0, client.balanceUSD - paymentData.amountUSD);

        const updatedClient: CreditClient = {
          ...client,
          payments: updatedPayments,
          balanceUSD: newBalance,
          saleType: newBalance === 0 ? 'contado' : client.saleType
        };

        safeCloudDocSet(doc(db, 'creditClients', clientId), updatedClient);
        return updatedClient;
      });
      saveCreditClientsToIDB(next).catch(() => {});
      safeLocalStorageSet('mms_credit_clients', next);
      return next;
    });
  };

  const payFullBalance = (clientId: string, method: string, reference: string) => {
    const client = creditClients.find(c => c.id === clientId);
    if (!client || client.balanceUSD <= 0) return;

    addPaymentToClient(clientId, {
      amountUSD: client.balanceUSD,
      amountBS: client.balanceUSD * bcvRate,
      method: method || "Pago Total Completo",
      reference: reference || "Cancelación total de cuenta",
      notes: "Cuenta liquidada al 100%"
    });
  };

  const addPurchaseToClient = (clientId: string, purchaseData: Omit<CreditPurchase, 'id' | 'date'>) => {
    setCreditClients(prev => {
      const next = prev.map(client => {
        if (client.id !== clientId) return client;

        const newPurchase: CreditPurchase = {
          ...purchaseData,
          id: `pur-${Date.now()}`,
          date: new Date().toISOString().split('T')[0]
        };

        const updatedClient: CreditClient = {
          ...client,
          purchases: [newPurchase, ...client.purchases],
          totalPurchasedUSD: client.totalPurchasedUSD + purchaseData.amountUSD,
          balanceUSD: client.balanceUSD + purchaseData.amountUSD,
          saleType: 'credito'
        };

        safeCloudDocSet(doc(db, 'creditClients', clientId), updatedClient);
        return updatedClient;
      });
      saveCreditClientsToIDB(next).catch(() => {});
      safeLocalStorageSet('mms_credit_clients', next);
      return next;
    });
  };

  const deleteCreditClient = (clientId: string) => {
    setCreditClients(prev => {
      const next = prev.filter(c => c.id !== clientId);
      saveCreditClientsToIDB(next).catch(() => {});
      safeLocalStorageSet('mms_credit_clients', next);
      return next;
    });
    safeCloudDocDelete(doc(db, 'creditClients', clientId));
  };

  // Register an order from checkout (whether Contado or Credito)
  const registerOrderSale = (orderData: {
    clientName: string;
    clientPhone: string;
    clientCedula: string;
    isCredit: boolean;
    initialAbonoUSD: number;
    itemsSummary: string;
    totalUSD: number;
    paymentMethod: string;
    reference: string;
  }): CreditClient => {
    const today = new Date().toISOString().split('T')[0];
    const initialAbono = Math.min(orderData.totalUSD, Math.max(0, orderData.initialAbonoUSD || 0));
    const isContado = !orderData.isCredit || initialAbono >= orderData.totalUSD;
    const balance = isContado ? 0 : orderData.totalUSD - initialAbono;

    // Check if client with this cédula or phone already exists
    const cleanCedula = orderData.clientCedula.trim();
    const cleanPhone = orderData.clientPhone.trim();
    const existingIndex = creditClients.findIndex(c => 
      (cleanCedula && c.idCard.toLowerCase() === cleanCedula.toLowerCase()) ||
      (cleanPhone && c.phone === cleanPhone)
    );

    let targetClient: CreditClient;

    if (existingIndex > -1) {
      const existing = creditClients[existingIndex];
      const newPurchase: CreditPurchase = {
        id: `pur-${Date.now()}`,
        date: today,
        description: orderData.itemsSummary.replace(/\n/g, ' • ').slice(0, 150),
        amountUSD: orderData.totalUSD
      };

      const newPayments: CreditPayment[] = [...existing.payments];
      if (initialAbono > 0) {
        newPayments.unshift({
          id: `pay-${Date.now()}`,
          date: today,
          amountUSD: initialAbono,
          amountBS: initialAbono * bcvRate,
          rateBCV: bcvRate,
          method: orderData.paymentMethod,
          reference: orderData.reference || (isContado ? "Pago de Contado 100%" : "Abono Inicial"),
          notes: isContado ? "Pago completo de contado" : `Abono inicial en compra a crédito`
        });
      }

      targetClient = {
        ...existing,
        name: orderData.clientName || existing.name,
        phone: orderData.clientPhone || existing.phone,
        idCard: orderData.clientCedula || existing.idCard,
        saleType: isContado && existing.balanceUSD === 0 ? 'contado' : 'credito',
        totalPurchasedUSD: existing.totalPurchasedUSD + orderData.totalUSD,
        balanceUSD: existing.balanceUSD + balance,
        purchases: [newPurchase, ...existing.purchases],
        payments: newPayments
      };

      setCreditClients(prev => {
        const copy = [...prev];
        copy[existingIndex] = targetClient;
        saveCreditClientsToIDB(copy).catch(() => {});
        safeLocalStorageSet('mms_credit_clients', copy);
        return copy;
      });
    } else {
      const payments: CreditPayment[] = [];
      if (initialAbono > 0) {
        payments.push({
          id: `pay-${Date.now()}`,
          date: today,
          amountUSD: initialAbono,
          amountBS: initialAbono * bcvRate,
          rateBCV: bcvRate,
          method: orderData.paymentMethod,
          reference: orderData.reference || (isContado ? "Pago de Contado 100%" : "Abono Inicial"),
          notes: isContado ? "Pago completo de contado" : `Abono inicial en compra a crédito`
        });
      }

      targetClient = {
        id: `cli-${Date.now()}`,
        name: orderData.clientName || "Cliente",
        phone: orderData.clientPhone || "Sin teléfono",
        idCard: orderData.clientCedula || "V-00000000",
        saleType: isContado ? 'contado' : 'credito',
        totalPurchasedUSD: orderData.totalUSD,
        balanceUSD: balance,
        createdAt: today,
        notes: isContado ? "Venta de Contado" : "Venta a Crédito",
        purchases: [
          {
            id: `pur-${Date.now()}`,
            date: today,
            description: orderData.itemsSummary.replace(/\n/g, ' • ').slice(0, 150),
            amountUSD: orderData.totalUSD
          }
        ],
        payments
      };

      setCreditClients(prev => {
        const next = [targetClient, ...prev];
        saveCreditClientsToIDB(next).catch(() => {});
        safeLocalStorageSet('mms_credit_clients', next);
        return next;
      });
    }

    safeCloudDocSet(doc(db, 'creditClients', targetClient.id), targetClient);
    return targetClient;
  };

  // Lookup client by Cédula, Phone or Name (No secret code needed!)
  const lookupClientByCedulaOrPhone = (query: string): CreditClient | null => {
    const clean = query.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!clean) return null;

    const found = creditClients.find(c => {
      const cId = c.idCard.toLowerCase().replace(/[^a-z0-9]/g, '');
      const cPhone = c.phone.replace(/[^0-9]/g, '');
      const cName = c.name.toLowerCase();
      const cSecret = (c.secretCode || '').toLowerCase();
      return (
        cId.includes(clean) ||
        cPhone.includes(clean) ||
        cName.includes(query.trim().toLowerCase()) ||
        cSecret === query.trim().toLowerCase()
      );
    });

    if (found) {
      setUnlockedClient(found);
      setIsCreditPortalOpen(true);
      return found;
    }
    return null;
  };

  const logoutCreditPortal = () => {
    setUnlockedClient(null);
    setIsCreditPortalOpen(false);
  };

  return (
    <StoreContext.Provider value={{
      cloudSyncStatus,
      isCloudQuotaExceeded,
      products,
      addProduct,
      addMultipleProducts,
      updateProduct,
      deleteProduct,
      paymentConfig,
      updatePaymentConfig,
      bcvRate,
      setBcvRate,
      fetchLiveBCVRate,
      isFetchingRate,
      lastRateUpdate,
      cart,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      cartTotalUSD,
      cartTotalBS,
      cartItemsCount,
      favorites,
      toggleFavorite,
      lightboxProduct,
      openLightbox,
      closeLightbox,
      isCartOpen,
      setIsCartOpen,
      isAdminOpen,
      setIsAdminOpen,
      isSizeGuideOpen,
      setIsSizeGuideOpen,
      isCreditPortalOpen,
      setIsCreditPortalOpen,
      creditClients,
      addCreditClient,
      addPaymentToClient,
      addPurchaseToClient,
      deleteCreditClient,
      registerOrderSale,
      payFullBalance,
      unlockedClient,
      setUnlockedClient,
      lookupClientByCedulaOrPhone,
      logoutCreditPortal,
      formatUSD,
      formatBS,
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};

