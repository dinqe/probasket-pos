import React, { useState, useEffect } from 'react';
import { initialProducts } from './data/initialProducts';
import RegisterView from './components/RegisterView';
import CartSidebar from './components/CartSidebar';
import DashboardView from './components/DashboardView';
import SettingsView from './components/SettingsView';
import ProductImage from './components/ProductImage';
import { supabase, isSupabaseConfigured } from './utils/supabaseClient';
import { T } from './utils/translations';
import { 
  Dumbbell, 
  Layers, 
  BarChart3, 
  Settings, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertCircle,
  X,
  Check,
  Sun,
  Moon,
  ShoppingBag
} from 'lucide-react';

const mapProductFromDB = (p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  type: p.type,
  price: parseFloat(p.price),
  stock: parseInt(p.stock, 10),
  variants: p.variants,
  image: p.image,
  isFavorite: p.is_favorite
});

const mapProductToDB = (p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  type: p.type,
  price: p.price,
  stock: p.stock,
  variants: p.variants,
  image: p.image,
  is_favorite: p.isFavorite
});

function App() {
  // --- Persistent States (sync with LocalStorage) ---
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('gym_pos_products');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Migrate old product variants strings to objects
          return parsed.map(product => {
            if (product.type === 'variable' && Array.isArray(product.variants)) {
              const migratedVariants = product.variants.map(v => {
                if (typeof v === 'string') {
                  return { name: v, image: '🥤' };
                }
                return v;
              });
              return { ...product, variants: migratedVariants };
            }
            return product;
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
    // Migrate initialProducts as well, just in case
    return initialProducts.map(p => {
      if (p.type === 'variable' && Array.isArray(p.variants)) {
        return {
          ...p,
          variants: p.variants.map(v => typeof v === 'string' ? { name: v, image: '🥤' } : v)
        };
      }
      return p;
    });
  });

  const [salesHistory, setSalesHistory] = useState(() => {
    const saved = localStorage.getItem('gym_pos_sales');
    return saved ? JSON.parse(saved) : [];
  });

  const [adminPassword, setAdminPassword] = useState(() => {
    const saved = localStorage.getItem('gym_pos_admin_password');
    return saved ? JSON.parse(saved) : 'gym123';
  });

  const [workerPasscode, setWorkerPasscode] = useState(() => {
    const saved = localStorage.getItem('gym_pos_worker_passcode');
    return saved ? JSON.parse(saved) : '1234';
  });

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('gym_pos_categories');
    return saved ? JSON.parse(saved) : ['Hydration', 'Protein', 'Energy', 'Snacks'];
  });

  // --- Session & UI States ---
  const [isSessionUnlocked, setIsSessionUnlocked] = useState(() => {
    return localStorage.getItem('probasket_session_unlocked') === 'true';
  });
  const [appPasswordInput, setAppPasswordInput] = useState('');
  const [appAuthError, setAppAuthError] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState('register'); // register, dashboard, settings
  const [cart, setCart] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [successCheckout, setSuccessCheckout] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  
  // Theme & Mobile Cart States
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('gym_pos_theme');
    return saved || 'dark';
  });
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Syncing / Loading State
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);

  // Language State (Albanian by default)
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('gym_pos_lang') || 'sq';
  });

  useEffect(() => {
    localStorage.setItem('gym_pos_lang', lang);
  }, [lang]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gym_pos_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };
  
  // Quick auth popup action callback
  const [authPopupCallback, setAuthPopupCallback] = useState(null);
  const [authPopupPassword, setAuthPopupPassword] = useState('');
  const [authPopupError, setAuthPopupError] = useState(false);
  
  // Variant selection modal product state
  const [variantModalProduct, setVariantModalProduct] = useState(null);

  // --- Supabase Cloud Data Initialization & Seeding ---
  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const initSupabase = async () => {
      try {
        setIsLoading(true);

        // 1. Fetch categories
        let { data: catData, error: catError } = await supabase
          .from('categories')
          .select('*');
        if (catError) throw catError;

        let loadedCategories = [];
        if (!catData || catData.length === 0) {
          // Seed categories
          const defaultCats = ['Hydration', 'Protein', 'Energy', 'Snacks'];
          const inserts = defaultCats.map(name => ({ name }));
          const { data: seededCats, error: seedError } = await supabase
            .from('categories')
            .insert(inserts)
            .select();
          if (seedError) throw seedError;
          loadedCategories = seededCats.map(c => c.name);
        } else {
          loadedCategories = catData.map(c => c.name);
        }
        setCategories(loadedCategories);

        // 2. Fetch products
        let { data: prodData, error: prodError } = await supabase
          .from('products')
          .select('*');
        if (prodError) throw prodError;

        let loadedProducts = [];
        if (!prodData || prodData.length === 0) {
          // Seed products
          const inserts = initialProducts.map(p => mapProductToDB(p));
          const { data: seededProds, error: seedError } = await supabase
            .from('products')
            .insert(inserts)
            .select();
          if (seedError) throw seedError;
          loadedProducts = seededProds.map(p => mapProductFromDB(p));
        } else {
          loadedProducts = prodData.map(p => mapProductFromDB(p));
        }
        setProducts(loadedProducts);

        // 3. Fetch sales
        let { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select('*')
          .order('timestamp', { ascending: false });
        if (salesError) throw salesError;

        if (salesData) {
          setSalesHistory(salesData.map(s => ({
            id: s.id,
            timestamp: s.timestamp,
            items: s.items,
            subtotal: parseFloat(s.subtotal),
            tax: parseFloat(s.tax),
            total: parseFloat(s.total),
            quantity: parseInt(s.quantity, 10)
          })));
        }

        // 4. Fetch settings
        let { data: settingsData, error: settingsError } = await supabase
          .from('settings')
          .select('*')
          .eq('key', 'admin_password')
          .single();
        
        if (settingsError && settingsError.code !== 'PGRST116') {
          throw settingsError;
        }

        if (settingsData) {
          setAdminPassword(settingsData.value);
        } else {
          const { error: seedError } = await supabase
            .from('settings')
            .insert([{ key: 'admin_password', value: 'gym123' }]);
          if (seedError) throw seedError;
          setAdminPassword('gym123');
        }

        let { data: workerData, error: workerError } = await supabase
          .from('settings')
          .select('*')
          .eq('key', 'worker_passcode')
          .single();
        
        if (workerError && workerError.code !== 'PGRST116') {
          throw workerError;
        }

        if (workerData) {
          setWorkerPasscode(workerData.value);
        } else {
          const { error: seedError } = await supabase
            .from('settings')
            .insert([{ key: 'worker_passcode', value: '1234' }]);
          if (seedError) throw seedError;
          setWorkerPasscode('1234');
        }

      } catch (err) {
        console.error("Error loading data from Supabase:", err);
        addToast("Error connecting to database. Running in offline/cached mode.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    initSupabase();
  }, []);

  // Sync state modifications to LocalStorage
  useEffect(() => {
    localStorage.setItem('gym_pos_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('gym_pos_sales', JSON.stringify(salesHistory));
  }, [salesHistory]);

  useEffect(() => {
    localStorage.setItem('gym_pos_admin_password', JSON.stringify(adminPassword));
  }, [adminPassword]);

  useEffect(() => {
    localStorage.setItem('gym_pos_worker_passcode', JSON.stringify(workerPasscode));
  }, [workerPasscode]);

  useEffect(() => {
    localStorage.setItem('gym_pos_categories', JSON.stringify(categories));
  }, [categories]);

  // Live POS clock updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Toast Alerts Helpers ---
  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // --- Cart Modification Logic ---
  const addToCart = (product, variant) => {
    // Check total stock left
    const inCartQty = cart
      .filter((item) => item.product.id === product.id && item.variant === variant)
      .reduce((acc, item) => acc + item.quantity, 0);

    if (product.stock <= inCartQty) {
      addToast(`Cannot add more. Stock limit reached for ${product.name}.`, 'error');
      return;
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.product.id === product.id && item.variant === variant
      );

      if (existingIndex > -1) {
        // Increment quantity
        const updated = [...prevCart];
        updated[existingIndex].quantity += 1;
        return updated;
      } else {
        // Add new item
        return [...prevCart, { product, variant, quantity: 1 }];
      }
    });

    const displayName = variant ? `${product.name} (${variant})` : product.name;
    addToast(`${displayName} added to cart.`, 'success');
  };

  const updateQty = (productId, variant, delta) => {
    setCart((prevCart) => {
      const index = prevCart.findIndex(
        (item) => item.product.id === productId && item.variant === variant
      );

      if (index === -1) return prevCart;

      const updated = [...prevCart];
      const newQty = updated[index].quantity + delta;

      if (newQty <= 0) {
        // Remove item
        updated.splice(index, 1);
        addToast('Item removed from cart.', 'success');
      } else {
        // Verify stock limit on increment
        const product = updated[index].product;
        if (delta > 0 && product.stock < newQty) {
          addToast(`Cannot add. Only ${product.stock} units left in stock.`, 'error');
          return prevCart;
        }
        updated[index].quantity = newQty;
      }
      return updated;
    });
  };

  const removeFromCart = (productId, variant) => {
    setCart((prevCart) => 
      prevCart.filter((item) => !(item.product.id === productId && item.variant === variant))
    );
    addToast('Item removed from cart.', 'success');
  };

  const emptyCart = () => {
    setCart([]);
    addToast('Cart cleared.', 'success');
  };

  // --- POS Transaction Processing (Checkout) ---
  const handleCheckout = async (total, subtotal, tax, quantity) => {
    // 1. Stock check validation
    for (const item of cart) {
      const latestProduct = products.find((p) => p.id === item.product.id);
      if (!latestProduct || latestProduct.stock < item.quantity) {
        addToast(`Transaction failed. Stock mismatch for ${item.product.name}.`, 'error');
        return;
      }
    }

    // 2. Log sales history transaction
    const newTransaction = {
      id: `TX-${Date.now()}`,
      timestamp: new Date().toISOString(),
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        variant: item.variant,
        price: item.product.price,
        qty: item.quantity
      })),
      subtotal,
      tax,
      total,
      quantity
    };

    if (isSupabaseConfigured) {
      try {
        // Insert sale
        const { error: saleError } = await supabase
          .from('sales')
          .insert([newTransaction]);
        if (saleError) throw saleError;

        // Deduct quantities in Supabase
        for (const p of products) {
          const cartItemsForProduct = cart.filter((item) => item.product.id === p.id);
          if (cartItemsForProduct.length > 0) {
            const qtyToDeduct = cartItemsForProduct.reduce((acc, item) => acc + item.quantity, 0);
            const newStock = Math.max(0, p.stock - qtyToDeduct);
            const { error: stockError } = await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', p.id);
            if (stockError) throw stockError;
          }
        }
      } catch (err) {
        console.error("Failed to process transaction in Supabase:", err);
        addToast("Database transaction failed. Sale not recorded in cloud.", "error");
        return;
      }
    }

    // Deduct quantities from local catalog stock
    setProducts((prevProducts) => {
      return prevProducts.map((p) => {
        const cartItemsForProduct = cart.filter((item) => item.product.id === p.id);
        const qtyToDeduct = cartItemsForProduct.reduce((acc, item) => acc + item.quantity, 0);
        return {
          ...p,
          stock: Math.max(0, p.stock - qtyToDeduct)
        };
      });
    });

    setSalesHistory((prev) => [newTransaction, ...prev]);

    // Show success screen overlay
    setSuccessCheckout(true);
    setTimeout(() => {
      setSuccessCheckout(false);
      setCart([]);
    }, 1800);
  };

  // --- Admin Catalog Updates ---
  const updateProductDetails = async (productId, updates) => {
    // updates can contain fields like name, price, stock, isFavorite, categories, variants, image.
    const dbUpdates = {};
    if ('name' in updates) dbUpdates.name = updates.name;
    if ('category' in updates) dbUpdates.category = updates.category;
    if ('type' in updates) dbUpdates.type = updates.type;
    if ('price' in updates) dbUpdates.price = parseFloat(updates.price) || 0;
    if ('stock' in updates) dbUpdates.stock = parseInt(updates.stock, 10) || 0;
    if ('variants' in updates) dbUpdates.variants = updates.variants;
    if ('image' in updates) dbUpdates.image = updates.image;
    if ('isFavorite' in updates) dbUpdates.is_favorite = updates.isFavorite;

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('products').update(dbUpdates).eq('id', productId);
        if (error) throw error;
      } catch (err) {
        console.error("Failed to update product in Supabase:", err);
        addToast("Error syncing product to cloud.", "error");
        return;
      }
    }

    setProducts((prev) => 
      prev.map((p) => (p.id === productId ? { ...p, ...updates } : p))
    );
  };

  const restockProduct = async (productId, amount) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const updatedStock = product.stock + amount;

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('products').update({ stock: updatedStock }).eq('id', productId);
        if (error) throw error;
      } catch (err) {
        console.error("Failed to restock product in Supabase:", err);
        addToast("Error syncing stock to cloud.", "error");
        return;
      }
    }

    setProducts((prev) => 
      prev.map((p) => {
        if (p.id === productId) {
          addToast(`Restocked ${p.name}. New Stock: ${updatedStock}`, 'success');
          return { ...p, stock: updatedStock };
        }
        return p;
      })
    );
  };

  const addCategory = async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      addToast(`Category "${trimmed}" already exists.`, 'error');
      return;
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('categories').insert([{ name: trimmed }]);
        if (error) throw error;
      } catch (err) {
        console.error("Failed to add category to Supabase:", err);
        addToast("Error syncing category to cloud.", "error");
        return;
      }
    }

    setCategories((prev) => [...prev, trimmed]);
    addToast(`Category "${trimmed}" created.`, 'success');
  };

  const removeCategory = async (name) => {
    if (categories.length <= 1) {
      addToast('Must keep at least one category.', 'error');
      return;
    }

    if (isSupabaseConfigured) {
      try {
        // Delete category
        const { error: catErr } = await supabase.from('categories').delete().eq('name', name);
        if (catErr) throw catErr;

        // Check if "Uncategorized" exists, if not, create it in Supabase
        const hasUncategorized = categories.includes('Uncategorized') || name === 'Uncategorized';
        const affectedProducts = products.filter(p => p.category === name);
        if (affectedProducts.length > 0 && !hasUncategorized) {
          const { error: insertErr } = await supabase.from('categories').insert([{ name: 'Uncategorized' }]);
          if (insertErr) {
            console.warn("Uncategorized insert warning:", insertErr);
          }
        }

        // Update affected products
        if (affectedProducts.length > 0) {
          const { error: prodErr } = await supabase.from('products').update({ category: 'Uncategorized' }).eq('category', name);
          if (prodErr) throw prodErr;
        }
      } catch (err) {
        console.error("Failed to remove category from Supabase:", err);
        addToast("Error syncing category removal to cloud.", "error");
        return;
      }
    }

    let affectedCount = 0;
    setProducts((prevProducts) => {
      return prevProducts.map((p) => {
        if (p.category === name) {
          affectedCount++;
          return { ...p, category: 'Uncategorized' };
        }
        return p;
      });
    });

    setCategories((prev) => {
      const hasUncategorized = prev.includes('Uncategorized') || name === 'Uncategorized';
      if (affectedCount > 0 && !hasUncategorized) {
        return [...prev.filter((c) => c !== name), 'Uncategorized'];
      }
      return prev.filter((c) => c !== name);
    });

    addToast(`Category "${name}" removed. ${affectedCount} products moved to "Uncategorized".`, 'success');
  };

  const addProduct = async (productData) => {
    const { name, category, type, price, stock, variants, image, isFavorite } = productData;
    
    if (!name.trim()) {
      addToast('Product name cannot be empty.', 'error');
      return;
    }

    const newProduct = {
      id: `product-${Date.now()}`,
      name: name.trim(),
      category: category || categories[0] || 'Uncategorized',
      type,
      price: parseFloat(price) || 0,
      stock: parseInt(stock) || 0,
      variants: type === 'variable' ? variants : null,
      image: image.trim() || '🥤',
      isFavorite: !!isFavorite
    };

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('products').insert([mapProductToDB(newProduct)]);
        if (error) throw error;
      } catch (err) {
        console.error("Failed to add product to Supabase:", err);
        addToast("Error syncing new product to cloud.", "error");
        return;
      }
    }

    setProducts(prev => [...prev, newProduct]);
    addToast(`Product "${newProduct.name}" added to catalog.`, 'success');
  };

  const removeProduct = async (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if (error) throw error;
      } catch (err) {
        console.error("Failed to remove product from Supabase:", err);
        addToast("Error syncing product removal to cloud.", "error");
        return;
      }
    }

    setProducts(prev => prev.filter(p => p.id !== productId));
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
    
    addToast(`Product "${product.name}" removed from catalog.`, 'success');
  };

  // --- Inline Auth popup handling (for quick actions) ---
  const promptAdminLogin = (onSuccessAction) => {
    setAuthPopupCallback(() => onSuccessAction);
    setAuthPopupPassword('');
    setAuthPopupError(false);
  };

  const handleAuthPopupSubmit = (e) => {
    e.preventDefault();
    if (authPopupPassword === adminPassword) {
      setIsAdminUnlocked(true);
      setAuthPopupError(false);
      setAuthPopupPassword('');
      if (authPopupCallback) {
        authPopupCallback();
      }
      setAuthPopupCallback(null);
      addToast('Authorized successfully!', 'success');
    } else {
      setAuthPopupError(true);
      addToast('Invalid admin password.', 'error');
    }
  };

  const handleAppUnlock = (e) => {
    e.preventDefault();
    if (appPasswordInput === workerPasscode || appPasswordInput === adminPassword) {
      setIsSessionUnlocked(true);
      setAppAuthError(false);
      setAppPasswordInput('');
      localStorage.setItem('probasket_session_unlocked', 'true');
      addToast(lang === 'sq' ? 'Mirë se vini në ProBasket POS!' : 'Welcome to ProBasket POS!', 'success');
    } else {
      setAppAuthError(true);
      addToast(T[lang].invalidAdminPassword, 'error');
    }
  };

  const handleLockApp = () => {
    setIsSessionUnlocked(false);
    localStorage.removeItem('probasket_session_unlocked');
    setIsAdminUnlocked(false);
    addToast(lang === 'sq' ? 'Kasa u bllokua.' : 'POS locked.', 'success');
  };

  const handleLock = () => {
    setIsAdminUnlocked(false);
    addToast(T[lang].adminPanelLocked, 'success');
  };

  // --- Developer/Demo Helpers ---
  const generateDummySales = async () => {
    const dummySales = [];
    const now = new Date();
    
    // Generate sales over the last 30 days
    for (let i = 0; i < 45; i++) {
      // Pick random date in last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const saleDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      // Set random hours to make timestamps realistic
      saleDate.setHours(
        8 + Math.floor(Math.random() * 12), // 8 AM to 8 PM
        Math.floor(Math.random() * 60)
      );

      // Select random products
      const itemsInCart = [];
      const numItems = 1 + Math.floor(Math.random() * 3); // 1 to 3 items
      let totalQty = 0;
      let subtotal = 0;

      for (let j = 0; j < numItems; j++) {
        const randProduct = products[Math.floor(Math.random() * products.length)];
        const isDuplicate = itemsInCart.some(item => item.productId === randProduct.id);
        
        if (!isDuplicate) {
          const qty = 1 + Math.floor(Math.random() * 2); // qty 1 or 2
          const variant = randProduct.type === 'variable' 
            ? randProduct.variants[Math.floor(Math.random() * randProduct.variants.length)] 
            : null;

          const variantName = variant ? (variant.name || variant) : null;

          itemsInCart.push({
            productId: randProduct.id,
            productName: randProduct.name,
            variant: variantName,
            price: randProduct.price,
            qty
          });

          totalQty += qty;
          subtotal += randProduct.price * qty;
        }
      }

      const tax = subtotal * 0.085;
      const total = subtotal + tax;

      dummySales.push({
        id: `TX-MOCK-${saleDate.getTime()}-${i}`,
        timestamp: saleDate.toISOString(),
        items: itemsInCart,
        subtotal,
        tax,
        total,
        quantity: totalQty
      });
    }

    if (isSupabaseConfigured) {
      try {
        setIsLoading(true);
        // Bulk insert to Supabase sales
        const { error } = await supabase.from('sales').insert(dummySales);
        if (error) throw error;
      } catch (err) {
        console.error("Failed to insert dummy sales into Supabase:", err);
        addToast("Error syncing mock transactions to database.", "error");
        return;
      } finally {
        setIsLoading(false);
      }
    }

    // Sort chronologically in salesHistory state
    setSalesHistory((prev) => [...dummySales, ...prev].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp)));
    addToast('Successfully injected 45 mock transactions!', 'success');
  };

  const resetToDefault = async () => {
    if (isSupabaseConfigured) {
      try {
        setIsLoading(true);
        // Clear all tables
        const { error: delSales } = await supabase.from('sales').delete().neq('id', '');
        const { error: delProducts } = await supabase.from('products').delete().neq('id', '');
        const { error: delCategories } = await supabase.from('categories').delete().neq('name', '');
        const { error: delSettings } = await supabase.from('settings').delete().neq('key', '');

        if (delSales || delProducts || delCategories || delSettings) {
          throw new Error("Failed to clear one or more tables during reset.");
        }

        // Re-seed categories
        const defaultCats = ['Hydration', 'Protein', 'Energy', 'Snacks'];
        const catInserts = defaultCats.map(name => ({ name }));
        const { data: seededCats, error: catErr } = await supabase
          .from('categories')
          .insert(catInserts)
          .select();
        if (catErr) throw catErr;

        // Re-seed products
        const prodInserts = initialProducts.map(p => mapProductToDB(p));
        const { data: seededProds, error: prodErr } = await supabase
          .from('products')
          .insert(prodInserts)
          .select();
        if (prodErr) throw prodErr;

        // Re-seed settings
        const { error: settingsErr } = await supabase
          .from('settings')
          .insert([
            { key: 'admin_password', value: 'gym123' },
            { key: 'worker_passcode', value: '1234' }
          ]);
        if (settingsErr) throw settingsErr;

        setCategories(seededCats.map(c => c.name));
        setProducts(seededProds.map(p => mapProductFromDB(p)));
        setSalesHistory([]);
        setAdminPassword('gym123');
        setWorkerPasscode('1234');
      } catch (err) {
        console.error("Failed to reset Supabase to default:", err);
        addToast("Error resetting database in the cloud.", "error");
        return;
      } finally {
        setIsLoading(false);
      }
    } else {
      setProducts(initialProducts);
      setSalesHistory([]);
      setCategories(['Hydration', 'Protein', 'Energy', 'Snacks']);
      setAdminPassword('gym123');
      setWorkerPasscode('1234');
    }

    setIsAdminUnlocked(false);
    setCart([]);
    addToast('Application data reset to defaults.', 'success');
  };

  const updateAdminPassword = async (newPassword) => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('settings')
          .upsert({ key: 'admin_password', value: newPassword });
        if (error) throw error;
      } catch (err) {
        console.error("Failed to update password in Supabase:", err);
        addToast("Error syncing password to cloud.", "error");
        return;
      }
    }
    setAdminPassword(newPassword);
  };

  const updateWorkerPasscode = async (newPasscode) => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('settings')
          .upsert({ key: 'worker_passcode', value: newPasscode });
        if (error) throw error;
      } catch (err) {
        console.error("Failed to update worker passcode in Supabase:", err);
        addToast("Error syncing passcode to cloud.", "error");
        return;
      }
    }
    setWorkerPasscode(newPasscode);
  };

  const voidTransaction = async (transactionId) => {
    const transaction = salesHistory.find((t) => t.id === transactionId);
    if (!transaction) return;

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('sales').delete().eq('id', transactionId);
        if (error) throw error;

        // Restore stock levels for products that still exist
        for (const item of transaction.items) {
          const product = products.find((p) => p.id === item.productId);
          if (product) {
            const newStock = product.stock + item.qty;
            const { error: stockErr } = await supabase.from('products').update({ stock: newStock }).eq('id', product.id);
            if (stockErr) throw stockErr;
          }
        }
      } catch (err) {
        console.error("Failed to void transaction in Supabase:", err);
        addToast("Error syncing voided transaction to cloud.", "error");
        return;
      }
    }

    // Update local products stock if they exist
    setProducts((prevProducts) => {
      return prevProducts.map((p) => {
        const itemInTransaction = transaction.items.find((item) => item.productId === p.id);
        if (itemInTransaction) {
          return { ...p, stock: p.stock + itemInTransaction.qty };
        }
        return p;
      });
    });

    // Remove from local sales history
    setSalesHistory((prev) => prev.filter((t) => t.id !== transactionId));
    addToast(`Transaction ${transactionId} voided.`, 'success');
  };

  if (isLoading) {
    return (
      <div className="loading-sync-container" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text)',
        fontFamily: 'var(--font-sans)',
        gap: '20px'
      }}>
        <div className="loading-sync-spinner" style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: '4px solid var(--border-color)',
          borderTopColor: 'var(--primary)',
          animation: 'spin 1s linear infinite'
        }}></div>
        <h3 style={{ margin: 0, fontWeight: 600 }}>{T[lang].loadingSyncTitle}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>{T[lang].loadingSyncSubtitle}</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isSessionUnlocked) {
    return (
      <div 
        className="app-container" 
        style={{ 
          justifyContent: 'center', 
          alignItems: 'center',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Language & Theme switches on Login Page */}
        <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '12px', alignItems: 'center', zIndex: 10 }}>
          <button 
            className="header-theme-toggle"
            onClick={() => setLang(l => l === 'sq' ? 'en' : 'sq')}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-color)',
              padding: '0 12px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              color: 'var(--text)',
              fontWeight: 600,
              transition: 'all var(--transition-fast)'
            }}
            title={lang === 'sq' ? 'Switch to English' : 'Kalo në Shqip'}
          >
            {lang === 'sq' ? 'SQ' : 'EN'}
          </button>
          <button
            className="header-theme-toggle"
            onClick={toggleTheme}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid var(--border-color)',
              background: 'rgba(255, 255, 255, 0.04)',
              color: 'var(--text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--transition-fast)'
            }}
            title={theme === 'dark' ? T[lang].switchThemeLight : T[lang].switchThemeDark}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <div className="glass-panel fade-in-view" style={{ width: '90%', maxWidth: '400px', padding: '32px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.jpg" alt="ProBasket Logo" style={{ width: '70px', height: '70px', borderRadius: '16px', objectFit: 'contain', background: '#fff', padding: '4px', border: '1px solid var(--border-color)' }} />
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.5px' }}>ProBasket POS</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>{T[lang].enterAppPasscode}</p>
            </div>
          </div>

          <form onSubmit={handleAppUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>{T[lang].appPasscodeLabel}</label>
              <input
                type="password"
                className="settings-input"
                placeholder={T[lang].pinPlaceholder}
                value={appPasswordInput}
                onChange={(e) => {
                  setAppPasswordInput(e.target.value);
                  setAppAuthError(false);
                }}
                required
                style={{ padding: '12px', fontSize: '1.1rem', letterSpacing: appPasswordInput ? '4px' : 'normal', textAlign: 'center', width: '100%', outline: 'none' }}
                autoFocus
              />
              {appAuthError && (
                <span className="pin-input-error" style={{ fontSize: '0.8rem', marginTop: '6px', display: 'block', color: 'var(--danger)', fontWeight: 500 }}>
                  {T[lang].invalidAdminPassword}
                </span>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '12px', fontSize: '0.95rem', display: 'flex', gap: '8px', justifyContent: 'center', width: '100%' }}>
              <Unlock size={16} />
              {T[lang].unlockApp}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* 1. Left Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-container" style={{ gap: '12px', alignItems: 'center' }}>
          <img src="/logo.jpg" alt="ProBasket Logo" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'contain', background: '#fff', padding: '2px', border: '1px solid var(--border-color)' }} />
          <div className="logo-text">
            <h1>ProBasket</h1>
            <span>Gym Drink POS</span>
          </div>
        </div>

        <ul className="nav-links">
          <li>
            <button 
              className={`nav-btn ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              <Layers size={18} />
              {T[lang].posRegister}
            </button>
          </li>
          <li>
            <button 
              className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <BarChart3 size={18} />
              {T[lang].dashboard}
            </button>
          </li>
          <li>
            <button 
              className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={18} />
              {T[lang].adminControls}
            </button>
          </li>
        </ul>

        <div className="sidebar-footer">
          {isAdminUnlocked ? (
            <div className="admin-badge unlocked" onClick={handleLock}>
              <Unlock size={14} style={{ marginRight: '6px' }} />
              {T[lang].adminModeActive}
            </div>
          ) : (
            <div 
              className="admin-badge locked" 
              onClick={() => {
                setActiveTab('settings');
                addToast(T[lang].pleaseEnterPassword, 'error');
              }}
            >
              <Lock size={14} style={{ marginRight: '6px' }} />
              {T[lang].workerMode}
            </div>
          )}
        </div>
      </aside>

      {/* 2. Main Work Panel Area */}
      <main className="main-content">
        <header className="header">
          <div className="header-title">
            <h2>
              {activeTab === 'register' && T[lang].drinkRegister}
              {activeTab === 'dashboard' && T[lang].dashboard}
              {activeTab === 'settings' && T[lang].systemConfigurations}
            </h2>
          </div>
          <div className="header-meta" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Language Switcher Toggle */}
            <button 
              className="header-theme-toggle"
              onClick={() => setLang(l => l === 'sq' ? 'en' : 'sq')}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                color: 'var(--text)',
                borderRadius: '18px',
                padding: '0 12px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
              title={lang === 'sq' ? 'Switch to English' : 'Kalo në Shqip'}
            >
              {lang === 'sq' ? 'SQ' : 'EN'}
            </button>

            {/* Theme Toggle */}
            <button 
              className="header-theme-toggle"
              onClick={toggleTheme}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                color: 'var(--text)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
              title={theme === 'dark' ? T[lang].switchThemeLight : T[lang].switchThemeDark}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Lock POS Application */}
            <button 
              className="header-theme-toggle"
              onClick={handleLockApp}
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: 'var(--danger)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
              title={T[lang].lockApp}
            >
              <Lock size={16} />
            </button>
            <span className="live-clock">{currentTime}</span>
          </div>
        </header>

        {/* Dynamic viewport screens */}
        <section className="view-viewport">
          {activeTab === 'register' && (
            <div className="pos-viewport-layout">
              <RegisterView 
                products={products} 
                addToCart={addToCart} 
                categories={categories}
                onOpenVariantModal={setVariantModalProduct}
                lang={lang}
              />
              <CartSidebar 
                cart={cart}
                updateQty={updateQty}
                removeFromCart={removeFromCart}
                emptyCart={emptyCart}
                onCheckout={handleCheckout}
                isMobileCartOpen={isMobileCartOpen}
                onCloseMobileCart={() => setIsMobileCartOpen(false)}
                lang={lang}
              />
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DashboardView 
              products={products}
              salesHistory={salesHistory}
              restockProduct={restockProduct}
              isAdminUnlocked={isAdminUnlocked}
              promptAdminLogin={promptAdminLogin}
              voidTransaction={voidTransaction}
              lang={lang}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView 
              products={products}
              updateProductDetails={updateProductDetails}
              adminPassword={adminPassword}
              setAdminPassword={updateAdminPassword}
              workerPasscode={workerPasscode}
              setWorkerPasscode={updateWorkerPasscode}
              isAdminUnlocked={isAdminUnlocked}
              setIsAdminUnlocked={setIsAdminUnlocked}
              generateDummySales={generateDummySales}
              resetToDefault={resetToDefault}
              addToast={addToast}
              categories={categories}
              addCategory={addCategory}
              removeCategory={removeCategory}
              addProduct={addProduct}
              removeProduct={removeProduct}
              lang={lang}
            />
          )}
        </section>

        {/* Global checkout success animation overlay */}
        {successCheckout && (
          <div className="success-overlay">
            <div className="success-circle">
              <CheckCircle2 size={44} strokeWidth={2.5} />
            </div>
            <div className="success-text">
              <h4>{T[lang].paymentSuccessful}</h4>
              <p>{T[lang].transactionProcessed}</p>
            </div>
          </div>
        )}
      </main>

      {/* 3. Toast Notifications Overlay */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span className={`toast-icon ${toast.type}`}>
              {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            </span>
            <span className="toast-message">{toast.message}</span>
            <button 
              onClick={() => removeToast(toast.id)} 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: 'auto' }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* 4. Global Inline Admin Prompt Modal (For quick restocks) */}
      {authPopupCallback && (
        <div className="modal-overlay" onClick={() => setAuthPopupCallback(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '360px' }}>
            <div className="modal-header">
              <h4>{T[lang].authorizeAction}</h4>
              <button className="modal-close-btn" onClick={() => setAuthPopupCallback(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.85rem', lineHeight: '1.4' }}>
                {T[lang].restockAuthNotice}
              </p>
              <form onSubmit={handleAuthPopupSubmit} className="auth-form">
                <input
                  type="password"
                  className="pin-input"
                  placeholder={T[lang].pinPlaceholder}
                  value={authPopupPassword}
                  onChange={(e) => setAuthPopupPassword(e.target.value)}
                  autoFocus
                  style={{ padding: '10px 14px', fontSize: '0.95rem' }}
                />
                {authPopupError && (
                  <span className="pin-input-error" style={{ fontSize: '0.75rem' }}>
                    {T[lang].invalidAdminPassword}
                  </span>
                )}
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px' }}>
                  {T[lang].authorize}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 5. Global Variant Selector Modal */}
      {variantModalProduct && (
        <div className="modal-overlay" onClick={() => setVariantModalProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>{T[lang].selectFlavor}</h4>
              <button className="modal-close-btn" onClick={() => setVariantModalProduct(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>
                {T[lang].choosingOptionFor} <strong>{variantModalProduct.name}</strong> - ${variantModalProduct.price.toFixed(2)}
              </p>
              <div className="variant-grid">
                {(variantModalProduct.variants || []).map((variant) => (
                  <button
                    key={variant.name || variant}
                    className="variant-option-btn"
                    onClick={() => {
                      addToCart(variantModalProduct, variant.name || variant);
                      setVariantModalProduct(null);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                  >
                    <ProductImage src={variant.image || '🥤'} alt={variant.name || variant} size="1.5rem" />
                    <span style={{ flexGrow: 1 }}>{variant.name || variant}</span>
                    <Check className="variant-arrow" size={16} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Floating Mobile Cart Trigger Button (Only in Register tab and on mobile views) */}
      {activeTab === 'register' && cart.length > 0 && (
        <button 
          className="mobile-cart-toggle-btn"
          onClick={() => setIsMobileCartOpen(true)}
          style={{
            position: 'fixed',
            bottom: '80px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--primary)',
            color: 'var(--text-dark)',
            border: 'none',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 999
          }}
        >
          <ShoppingBag size={24} style={{ color: '#09090b' }} />
          <span 
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: 'var(--danger)',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--bg-primary)'
            }}
          >
            {cart.reduce((acc, item) => acc + item.quantity, 0)}
          </span>
        </button>
      )}
    </div>
  );
}

export default App;
