import React from 'react';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard } from 'lucide-react';
import { T } from '../utils/translations';

const CartSidebar = ({ 
  cart, 
  updateQty, 
  removeFromCart, 
  emptyCart, 
  onCheckout, 
  isMobileCartOpen = false, 
  onCloseMobileCart,
  lang = 'en'
}) => {
  // Financial Math
  const TAX_RATE = 0.0; // No tax

  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  
  const subtotal = cart.reduce((acc, item) => {
    return acc + (item.product.price * item.quantity);
  }, 0);

  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const handleCheckoutClick = () => {
    if (cart.length === 0) return;
    onCheckout(total, subtotal, tax, totalItemsCount);
    if (onCloseMobileCart) onCloseMobileCart(); // auto-close cart on checkout
  };

  return (
    <div className={`cart-sidebar glass-panel ${isMobileCartOpen ? 'mobile-open' : ''}`}>
      <div className="cart-header">
        <h3>
          <ShoppingCart size={18} />
          {T[lang].currentCart}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="cart-count">
            {totalItemsCount} {totalItemsCount === 1 ? (lang === 'sq' ? 'artikull' : 'item') : (lang === 'sq' ? 'artikuj' : 'items')}
          </span>
          {onCloseMobileCart && (
            <button 
              className="cart-close-btn"
              onClick={onCloseMobileCart}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '0.8rem',
                lineHeight: 1
              }}
              title="Close Cart"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="cart-items">
        {cart.length === 0 ? (
          <div className="cart-empty">
            <span className="cart-empty-icon">🛒</span>
            <p>{T[lang].cartIsEmpty}</p>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {T[lang].clickProductsToAdd}
            </span>
          </div>
        ) : (
          cart.map((item) => {
            const itemKey = item.variant 
              ? `${item.product.id}-${item.variant}`
              : item.product.id;
            
            return (
              <div key={itemKey} className="cart-item">
                <div className="cart-item-details">
                  <div className="cart-item-name">{item.product.name}</div>
                  {item.variant && (
                    <span className="cart-item-variant">{item.variant}</span>
                  )}
                  <div className="cart-item-price">
                    ${item.product.price.toFixed(2)} × {item.quantity} = ${(item.product.price * item.quantity).toFixed(2)}
                  </div>
                </div>

                <div className="cart-item-actions">
                  <button 
                    className="cart-action-btn"
                    onClick={() => updateQty(item.product.id, item.variant, -1)}
                    title="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="cart-item-qty">{item.quantity}</span>
                  <button 
                    className="cart-action-btn"
                    onClick={() => updateQty(item.product.id, item.variant, 1)}
                    disabled={item.quantity >= item.product.stock}
                    title={item.quantity >= item.product.stock ? "Out of stock" : "Increase quantity"}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button 
                  className="cart-item-remove"
                  onClick={() => removeFromCart(item.product.id, item.variant)}
                  title="Remove item"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="cart-summary">
        <div className="summary-row">
          <span>{T[lang].subtotal}</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        <div className="summary-row total">
          <span>{T[lang].total}</span>
          <span className="total-amount">${total.toFixed(2)}</span>
        </div>

        <div className="cart-buttons">
          <button 
            className="btn btn-secondary" 
            onClick={emptyCart}
            disabled={cart.length === 0}
          >
            {T[lang].clear}
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleCheckoutClick}
            disabled={cart.length === 0}
          >
            <CreditCard size={16} />
            {T[lang].pay}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartSidebar;
