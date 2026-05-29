import React, { useState } from 'react';
import { Lock, Unlock, ShieldAlert, KeyRound, Database, RefreshCcw, Trash2, Camera, ImagePlus, Upload, X } from 'lucide-react';
import ProductImage from './ProductImage';
import { compressImage } from '../utils/imageCompressor';

const SettingsView = ({ 
  products, 
  updateProductDetails, 
  adminPassword, 
  setAdminPassword, 
  isAdminUnlocked, 
  setIsAdminUnlocked, 
  generateDummySales, 
  resetToDefault,
  addToast,
  categories,
  addCategory,
  removeCategory,
  addProduct,
  removeProduct
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Local Unlock Modal States
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [localPasswordInput, setLocalPasswordInput] = useState('');
  const [localAuthError, setLocalAuthError] = useState(false);

  const handleLocalUnlockSubmit = (e) => {
    e.preventDefault();
    if (localPasswordInput === adminPassword) {
      setIsAdminUnlocked(true);
      setLocalAuthError(false);
      setLocalPasswordInput('');
      setShowUnlockModal(false);
      addToast('Pricing controls unlocked.', 'success');
    } else {
      setLocalAuthError(true);
      addToast('Invalid admin password.', 'error');
    }
  };

  // Add Product Form States
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('');
  const [newProdType, setNewProdType] = useState('simple');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdEmoji, setNewProdEmoji] = useState('🥤');
  const [newProdCustomImage, setNewProdCustomImage] = useState(null);
  const [newProdVariants, setNewProdVariants] = useState('');
  const [newProdIsFavorite, setNewProdIsFavorite] = useState(false);

  // Variant Management States
  const [variantInputs, setVariantInputs] = useState({});

  const handleAddVariant = (productId) => {
    const inputText = variantInputs[productId] || '';
    if (!inputText.trim()) return;

    const product = products.find(p => p.id === productId);
    if (!product) return;

    const currentVariants = product.variants || [];
    const exists = currentVariants.some(v => (v.name || v).toLowerCase() === inputText.trim().toLowerCase());
    if (exists) {
      addToast('Option already exists.', 'error');
      return;
    }

    const updatedVariants = [...currentVariants, { name: inputText.trim(), image: '🥤' }];
    updateProductDetails(productId, { variants: updatedVariants });
    
    setVariantInputs(prev => ({ ...prev, [productId]: '' }));
    addToast(`Option "${inputText.trim()}" added to ${product.name}.`, 'success');
  };

  const handleRemoveVariant = (product, variantToRemoveName) => {
    const updatedVariants = (product.variants || []).filter(v => (v.name || v) !== variantToRemoveName);
    updateProductDetails(product.id, { variants: updatedVariants });
    addToast(`Option "${variantToRemoveName}" removed.`, 'success');
  };

  const handleNewProdImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file);
      setNewProdCustomImage(base64);
      addToast('Product photo uploaded and optimized.', 'success');
    } catch (err) {
      addToast(err.message || 'Error processing image file.', 'error');
    }
  };

  const handleProductImageUpload = async (productId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const base64 = await compressImage(file);
      updateProductDetails(productId, { image: base64 });
      addToast('Product image updated successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Error processing image file.', 'error');
    }
  };

  const handleVariantImageUpload = async (productId, variantName, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const product = products.find(p => p.id === productId);
    if (!product) return;

    try {
      const base64 = await compressImage(file);
      const updatedVariants = (product.variants || []).map(v => {
        const vName = typeof v === 'string' ? v : v.name;
        if (vName === variantName) {
          return { name: variantName, image: base64 };
        }
        return typeof v === 'string' ? { name: v, image: '🥤' } : v;
      });
      updateProductDetails(productId, { variants: updatedVariants });
      addToast(`Updated flavor image for "${variantName}".`, 'success');
    } catch (err) {
      addToast(err.message || 'Error processing image file.', 'error');
    }
  };

  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    if (newCategoryInput.trim()) {
      addCategory(newCategoryInput.trim());
      setNewCategoryInput('');
    }
  };

  const handleAddProductSubmit = (e) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      addToast('Product name is required.', 'error');
      return;
    }

    let parsedVariants = null;
    if (newProdType === 'variable') {
      parsedVariants = newProdVariants
        .split(',')
        .map(v => v.trim())
        .filter(v => v !== '')
        .map(v => ({ name: v, image: '🥤' }));
      if (parsedVariants.length === 0) {
        addToast('Variable products require at least one flavor/option variant.', 'error');
        return;
      }
    }

    addProduct({
      name: newProdName,
      category: newProdCategory || categories[0] || 'Uncategorized',
      type: newProdType,
      price: parseFloat(newProdPrice) || 0,
      stock: parseInt(newProdStock) || 0,
      variants: parsedVariants,
      image: newProdCustomImage || newProdEmoji,
      isFavorite: newProdIsFavorite
    });

    // Reset Form
    setNewProdName('');
    setNewProdPrice('');
    setNewProdStock('');
    setNewProdType('simple');
    setNewProdEmoji('🥤');
    setNewProdCustomImage(null);
    setNewProdVariants('');
    setNewProdIsFavorite(false);
  };

  // Admin password changes
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmNewPw, setConfirmNewPw] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === adminPassword) {
      setIsAdminUnlocked(true);
      setAuthError(false);
      setPasswordInput('');
      addToast('Admin panel unlocked successfully!', 'success');
    } else {
      setAuthError(true);
      addToast('Invalid admin password. Try again.', 'error');
    }
  };

  const handlePasswordChangeSubmit = (e) => {
    e.preventDefault();
    if (currentPw !== adminPassword) {
      addToast('Current password does not match.', 'error');
      return;
    }
    if (newPw.trim() === '') {
      addToast('New password cannot be empty.', 'error');
      return;
    }
    if (newPw !== confirmNewPw) {
      addToast('Passwords do not match.', 'error');
      return;
    }

    setAdminPassword(newPw);
    setCurrentPw('');
    setNewPw('');
    setConfirmNewPw('');
    addToast('Admin password updated successfully!', 'success');
  };

  const handleLock = () => {
    setIsAdminUnlocked(false);
    addToast('Admin panel locked.', 'success');
  };

  const handlePriceChange = (productId, newPrice) => {
    if (newPrice === '') {
      updateProductDetails(productId, { price: '' });
      return;
    }
    const val = parseFloat(newPrice);
    if (!isNaN(val) && val >= 0) {
      updateProductDetails(productId, { price: newPrice });
    }
  };

  const handlePriceBlur = (productId, price) => {
    const val = parseFloat(price);
    if (isNaN(val) || val < 0) {
      updateProductDetails(productId, { price: 0 });
    } else {
      updateProductDetails(productId, { price: val });
    }
  };

  const handleStockChange = (productId, newStock) => {
    if (newStock === '') {
      updateProductDetails(productId, { stock: '' });
      return;
    }
    const val = parseInt(newStock);
    if (!isNaN(val) && val >= 0) {
      updateProductDetails(productId, { stock: newStock });
    }
  };

  const handleStockBlur = (productId, stock) => {
    const val = parseInt(stock);
    if (isNaN(val) || val < 0) {
      updateProductDetails(productId, { stock: 0 });
    } else {
      updateProductDetails(productId, { stock: val });
    }
  };

  return (
    <div className="settings-layout fade-in-view">
      {/* Admin details & Security Settings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Security Lock Card */}
        {!isAdminUnlocked ? (
          <div className="glass-panel settings-panel">
            <h3 className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, paddingBottom: '12px' }}>
              <Lock size={16} className="text-muted" />
              Security Status
            </h3>
            <div className="status-indicator" style={{ borderStyle: 'dashed' }}>
              <div className="status-dot" style={{ background: 'var(--text-muted)', boxShadow: 'none' }}></div>
              <span>Admin session locked. Price adjustments are disabled.</span>
            </div>
            
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem' }}>Enter Admin Password to Edit Prices</label>
                <input
                  type="password"
                  className="settings-input"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  style={{ padding: '10px 14px' }}
                />
              </div>
              {authError && (
                <span className="pin-input-error" style={{ fontSize: '0.75rem', marginTop: '-4px' }}>
                  Incorrect password. Please try again.
                </span>
              )}
              <button type="submit" className="btn btn-primary" style={{ padding: '10px' }}>
                Unlock Price Settings
              </button>
            </form>
          </div>
        ) : (
          <div className="glass-panel settings-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="settings-section-title" style={{ margin: 0, border: 'none', padding: 0 }}>
                Security Status
              </h3>
              <button 
                className="admin-badge unlocked" 
                onClick={handleLock}
                style={{ padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                <Unlock size={12} style={{ marginRight: '6px' }} />
                Lock Panel
              </button>
            </div>
            
            <div className="status-indicator">
              <div className="status-dot"></div>
              <span>Admin session active. Price changes allowed.</span>
            </div>

            {/* Change Admin Password */}
            <form onSubmit={handlePasswordChangeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
              <h4 style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={16} className="text-primary" />
                Update Admin Password
              </h4>

              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  className="settings-input"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  className="settings-input"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  className="settings-input"
                  value={confirmNewPw}
                  onChange={(e) => setConfirmNewPw(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-secondary" style={{ padding: '10px' }}>
                Change Password
              </button>
            </form>
          </div>
        )}

        {/* Category Management Card */}
        <div className="glass-panel settings-panel">
          <h3 className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={16} className="text-primary" style={{ transform: 'rotate(-45deg)' }} />
            Category Management
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Add new categories or delete existing ones. Deleted categories reassign items to "Uncategorized".
          </p>

          <form onSubmit={handleAddCategorySubmit} style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <input
              type="text"
              className="settings-input"
              placeholder="New Category Name..."
              value={newCategoryInput}
              onChange={(e) => setNewCategoryInput(e.target.value)}
              style={{ flexGrow: 1, padding: '8px 12px', fontSize: '0.85rem' }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
              Add
            </button>
          </form>

          <div style={{ 
            maxHeight: '180px', 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px', 
            marginTop: '12px',
            paddingRight: '4px'
          }}>
            {categories.map(category => (
              <div 
                key={category} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--border-color)', 
                  padding: '8px 12px', 
                  borderRadius: '8px',
                  animation: 'slideInCart 0.2s ease-out'
                }}
              >
                <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>{category}</span>
                <button
                  type="button"
                  onClick={() => removeCategory(category)}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: 'rgba(239, 68, 68, 0.7)', 
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    lineHeight: '1',
                    padding: '0 4px',
                    transition: 'color var(--transition-fast)'
                  }}
                  title={`Remove ${category}`}
                  onMouseEnter={(e) => e.target.style.color = 'var(--danger)'}
                  onMouseLeave={(e) => e.target.style.color = 'rgba(239, 68, 68, 0.7)'}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add Product Card */}
        <div className="glass-panel settings-panel">
          <h3 className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={16} className="text-primary" style={{ transform: 'none' }} />
            Add New Product
          </h3>

          <form onSubmit={handleAddProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group">
              <label>Drink Name</label>
              <input
                type="text"
                className="settings-input"
                placeholder="e.g. BCAA Amino Blast"
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                required
                style={{ padding: '10px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="settings-input"
                  placeholder="2.99"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  required
                  style={{ padding: '10px' }}
                />
              </div>
              <div className="form-group">
                <label>Starting Stock</label>
                <input
                  type="number"
                  className="settings-input"
                  placeholder="30"
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(e.target.value)}
                  required
                  style={{ padding: '10px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Category</label>
                <select
                  className="settings-input"
                  value={newProdCategory || (categories[0] || '')}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                  style={{ padding: '10px', cursor: 'pointer' }}
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Product Type</label>
                <select
                  className="settings-input"
                  value={newProdType}
                  onChange={(e) => setNewProdType(e.target.value)}
                  style={{ padding: '10px', cursor: 'pointer' }}
                >
                  <option value="simple">Simple</option>
                  <option value="variable">Variable</option>
                </select>
              </div>
            </div>

            {/* Comma-separated variants if variable product type selected */}
            {newProdType === 'variable' && (
              <div className="form-group" style={{ animation: 'fadeIn 0.2s ease-out' }}>
                <label>Flavors/Variants (comma-separated)</label>
                <input
                  type="text"
                  className="settings-input"
                  placeholder="e.g. Fruit Punch, Watermelon, Berry"
                  value={newProdVariants}
                  onChange={(e) => setNewProdVariants(e.target.value)}
                  required
                  style={{ padding: '10px' }}
                />
              </div>
            )}

            {/* Emoji Selector */}
            <div className="form-group">
              <label>Select Emoji Icon</label>
              <div style={{ 
                display: 'flex', 
                gap: '6px', 
                overflowX: 'auto',
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid var(--border-color)',
                padding: '6px 8px',
                borderRadius: '8px',
                paddingBottom: '8px'
              }}>
                {['🥤', '💧', '🥥', '💥', '🔋', '☕', '🍫', '🥛', '🍍', '🍋', '🍹', '🍺'].map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setNewProdEmoji(emoji);
                      setNewProdCustomImage(null); // Clear custom upload if user picks an emoji
                    }}
                    style={{ 
                      fontSize: '1.2rem', 
                      background: (!newProdCustomImage && newProdEmoji === emoji) ? 'var(--primary-glow)' : 'transparent',
                      border: (!newProdCustomImage && newProdEmoji === emoji) ? '1px solid var(--primary)' : '1px solid transparent',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      width: '32px',
                      height: '32px',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Image Upload Option */}
            <div className="form-group">
              <label>Or Upload Custom Picture</label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'rgba(255, 255, 255, 0.01)',
                border: '1px solid var(--border-color)',
                padding: '10px 14px',
                borderRadius: '8px',
              }}>
                <div style={{ 
                  position: 'relative', 
                  width: '50px', 
                  height: '50px', 
                  borderRadius: '8px', 
                  overflow: 'hidden', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--border-color)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {newProdCustomImage ? (
                    <>
                      <img src={newProdCustomImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        type="button" 
                        onClick={() => setNewProdCustomImage(null)}
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          background: 'rgba(0,0,0,0.6)',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '50%',
                          width: '16px',
                          height: '16px',
                          fontSize: '10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1
                        }}
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <span style={{ fontSize: '1.5rem' }}>{newProdEmoji}</span>
                  )}
                </div>
                <div style={{ flexGrow: 1 }}>
                  <label htmlFor="new-product-file" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-color)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 500,
                    color: 'var(--text)',
                    transition: 'all var(--transition-fast)'
                  }}>
                    <ImagePlus size={14} />
                    Choose Image File
                  </label>
                  <input
                    type="file"
                    id="new-product-file"
                    accept="image/*"
                    onChange={handleNewProdImageUpload}
                    style={{ display: 'none' }}
                  />
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Images are compressed automatically for fast POS display.
                  </div>
                </div>
              </div>
            </div>

            {/* Mark as Favorite Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 0' }}>
              <input
                type="checkbox"
                id="newProdIsFavorite"
                checked={newProdIsFavorite}
                onChange={(e) => setNewProdIsFavorite(e.target.checked)}
                style={{ 
                  width: '16px', 
                  height: '16px', 
                  accentColor: 'var(--primary)',
                  cursor: 'pointer' 
                }}
              />
              <label htmlFor="newProdIsFavorite" style={{ fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}>
                Mark as Favorite (always visible in all categories)
              </label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
              Create Product
            </button>
          </form>
        </div>


      </div>

      {/* Catalog & Pricing Manager */}
      <div className="glass-panel settings-panel" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '8px' }}>
          <h3 className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', margin: 0, paddingBottom: 0 }}>
            <ShieldAlert size={18} className="text-primary" />
            Catalog Pricing & Stock Controller
          </h3>
          <button 
            type="button"
            className={`admin-badge ${isAdminUnlocked ? 'unlocked' : 'locked'}`}
            onClick={() => {
              if (isAdminUnlocked) {
                setIsAdminUnlocked(false);
                addToast('Pricing controls locked.', 'success');
              } else {
                setShowUnlockModal(true);
              }
            }}
            style={{ 
              padding: '6px 12px', 
              fontSize: '0.8rem', 
              cursor: 'pointer', 
              border: '1px solid var(--border-color)', 
              borderRadius: '6px', 
              background: 'rgba(255,255,255,0.03)', 
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 600
            }}
          >
            {isAdminUnlocked ? <Unlock size={12} /> : <Lock size={12} />}
            {isAdminUnlocked ? 'Lock Prices' : 'Unlock Prices'}
          </button>
        </div>
        
        <div className="product-editor-list">
          {products.map(product => (
            <div key={product.id} className="product-editor-row" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', width: '100%' }}>
                <div className="editor-info">
                  <div style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', flexShrink: 0 }} className="editor-image-wrapper" title="Click to change product image">
                    <ProductImage src={product.image} alt={product.name} size="2.2rem" />
                    <label 
                      htmlFor={`replace-img-${product.id}`}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0, 0, 0, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity var(--transition-fast)',
                        cursor: 'pointer'
                      }}
                      className="editor-image-overlay"
                    >
                      <Camera size={14} style={{ color: '#fff' }} />
                    </label>
                    <input
                      type="file"
                      id={`replace-img-${product.id}`}
                      accept="image/*"
                      onChange={(e) => handleProductImageUpload(product.id, e)}
                      style={{ display: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="text"
                        className="editor-name-input"
                        value={product.name}
                        onChange={(e) => updateProductDetails(product.id, { name: e.target.value })}
                        onBlur={() => {
                          if (!product.name.trim()) {
                            updateProductDetails(product.id, { name: 'Unnamed Product' });
                          }
                        }}
                        style={{
                          background: 'transparent',
                          border: '1px solid transparent',
                          color: 'var(--text)',
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          padding: '2px 4px',
                          borderRadius: '4px',
                          outline: 'none',
                          maxWidth: '180px',
                          transition: 'all var(--transition-fast)'
                        }}
                        placeholder="Product Name"
                        title="Click to rename product"
                      />
                      <button
                        type="button"
                        onClick={() => updateProductDetails(product.id, { isFavorite: !product.isFavorite })}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: product.isFavorite ? 'var(--warning)' : 'var(--text-muted)',
                          fontSize: '1.25rem',
                          lineHeight: '1',
                          padding: '2px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'transform var(--transition-fast)'
                        }}
                        title={product.isFavorite ? "Remove from favorites" : "Mark as favorite"}
                      >
                        {product.isFavorite ? '★' : '☆'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Product Type Dropdown Selector */}
                      <select
                        className="settings-input"
                        value={product.type}
                        onChange={(e) => {
                          const newType = e.target.value;
                          const updates = { type: newType };
                          if (newType === 'variable' && (!product.variants || product.variants.length === 0)) {
                            updates.variants = ['Default Flavor'];
                          } else if (newType === 'simple') {
                            updates.variants = null;
                          }
                          updateProductDetails(product.id, updates);
                        }}
                        style={{ 
                          padding: '2px 8px', 
                          fontSize: '0.75rem', 
                          borderRadius: '6px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text)',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="simple">Simple</option>
                        <option value="variable">Variable</option>
                      </select>

                      {/* Product Category Dropdown Selector */}
                      <select
                        className="settings-input"
                        value={product.category}
                        onChange={(e) => updateProductDetails(product.id, { category: e.target.value })}
                        style={{ 
                          padding: '2px 8px', 
                          fontSize: '0.75rem', 
                          borderRadius: '6px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text)',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {categories.map(c => (
                          <option key={c} value={c} style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}>
                            {c}
                          </option>
                        ))}
                        {!categories.includes(product.category) && (
                          <option value={product.category} style={{ background: 'var(--bg-secondary)', color: 'var(--text)' }}>
                            {product.category}
                          </option>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="editor-controls">
                  <div className="editor-control-group">
                    <label>Price</label>
                    <div 
                      className="price-input-wrapper" 
                      style={{ cursor: isAdminUnlocked ? 'text' : 'pointer' }}
                      onClick={() => { if (!isAdminUnlocked) setShowUnlockModal(true); }}
                      title={!isAdminUnlocked ? "Unlock prices to edit" : ""}
                    >
                      <span className="price-input-prefix">$</span>
                      <input
                        type="number"
                        step="0.01"
                        className="price-input"
                        value={product.price}
                        onChange={(e) => handlePriceChange(product.id, e.target.value)}
                        onBlur={(e) => handlePriceBlur(product.id, e.target.value)}
                        readOnly={!isAdminUnlocked}
                        style={{
                          paddingRight: !isAdminUnlocked ? '24px' : '6px',
                          cursor: !isAdminUnlocked ? 'pointer' : 'text'
                        }}
                      />
                      {!isAdminUnlocked && (
                        <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', pointerEvents: 'none' }}>
                          🔒
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="editor-control-group">
                    <label>Stock Level</label>
                    <input
                      type="number"
                      className="stock-input"
                      value={product.stock}
                      onChange={(e) => handleStockChange(product.id, e.target.value)}
                      onBlur={(e) => handleStockBlur(product.id, e.target.value)}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
                        removeProduct(product.id);
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(239, 68, 68, 0.6)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      alignSelf: 'flex-end',
                      height: '32px',
                      width: '32px',
                      borderRadius: '8px',
                      transition: 'all var(--transition-fast)',
                      border: '1px solid transparent'
                    }}
                    title="Delete product"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'var(--danger)';
                      e.currentTarget.style.background = 'var(--danger-glow)';
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(239, 68, 68, 0.6)';
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Bottom Section: Dynamic variants options manager */}
              {product.type === 'variable' && (
                <div style={{ 
                  borderTop: '1px dashed var(--border-color)', 
                  paddingTop: '10px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Drink Flavor Options
                    </span>
                  </div>

                  {/* Flavor Badges List */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {(!product.variants || product.variants.length === 0) ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 500 }}>
                        No options added yet. Click will show empty popup in register.
                      </span>
                    ) : (
                      product.variants.map(variant => {
                        const variantName = typeof variant === 'string' ? variant : variant.name;
                        const variantImage = typeof variant === 'string' ? '🥤' : variant.image;
                        return (
                          <div 
                            key={variantName}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              background: 'rgba(59, 130, 246, 0.08)',
                              border: '1px solid rgba(59, 130, 246, 0.25)',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              color: 'var(--accent-blue)',
                              fontWeight: 500
                            }}
                          >
                            <div 
                              style={{ 
                                position: 'relative', 
                                width: '22px', 
                                height: '22px', 
                                borderRadius: '4px', 
                                overflow: 'hidden', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                flexShrink: 0
                              }} 
                              className="variant-image-wrapper" 
                              title={`Upload photo for ${variantName}`}
                            >
                              <ProductImage src={variantImage} alt={variantName} size="0.95rem" />
                              <label
                                htmlFor={`upload-var-${product.id}-${variantName}`}
                                style={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100%',
                                  background: 'rgba(0, 0, 0, 0.6)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  opacity: 0,
                                  transition: 'opacity var(--transition-fast)',
                                  cursor: 'pointer'
                                }}
                                className="variant-image-overlay"
                              >
                                <Upload size={8} style={{ color: '#fff' }} />
                              </label>
                              <input
                                type="file"
                                id={`upload-var-${product.id}-${variantName}`}
                                accept="image/*"
                                onChange={(e) => handleVariantImageUpload(product.id, variantName, e)}
                                style={{ display: 'none' }}
                              />
                            </div>

                            <span>{variantName}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(product, variantName)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'rgba(239, 68, 68, 0.7)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                lineHeight: '1',
                                padding: '0 2px'
                              }}
                              title={`Remove ${variantName}`}
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add option inline form */}
                  <div style={{ display: 'flex', gap: '8px', maxWidth: '300px', marginTop: '4px' }}>
                    <input
                      type="text"
                      className="settings-input"
                      placeholder="Add option (e.g. Fanta)..."
                      value={variantInputs[product.id] || ''}
                      onChange={(e) => setVariantInputs(prev => ({ ...prev, [product.id]: e.target.value }))}
                      style={{ padding: '6px 10px', fontSize: '0.75rem', flexGrow: 1 }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddVariant(product.id);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="quick-action-btn"
                      onClick={() => handleAddVariant(product.id)}
                      style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
                    >
                      + Option
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Local Unlock Modal */}
      {showUnlockModal && (
        <div className="modal-overlay" onClick={() => { setShowUnlockModal(false); setLocalPasswordInput(''); setLocalAuthError(false); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '360px' }}>
            <div className="modal-header">
              <h4>Unlock Price Editing</h4>
              <button className="modal-close-btn" onClick={() => { setShowUnlockModal(false); setLocalPasswordInput(''); setLocalAuthError(false); }}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.85rem', lineHeight: '1.4' }}>
                Please enter the admin password to unlock price adjustments:
              </p>
              <form onSubmit={handleLocalUnlockSubmit} className="auth-form">
                <input
                  type="password"
                  className="pin-input"
                  placeholder="••••••••"
                  value={localPasswordInput}
                  onChange={(e) => setLocalPasswordInput(e.target.value)}
                  autoFocus
                  style={{ padding: '10px 14px', fontSize: '0.95rem' }}
                />
                {localAuthError && (
                  <span className="pin-input-error" style={{ fontSize: '0.75rem' }}>
                    Invalid password.
                  </span>
                )}
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px' }}>
                  Unlock
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
