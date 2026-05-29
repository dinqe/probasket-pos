import React, { useState } from 'react';
import { Search, ShoppingBag, Layers, Eye, Check } from 'lucide-react';
import ProductImage from './ProductImage';

const RegisterView = ({ products, addToCart, categories, onOpenVariantModal }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Combine virtual 'All' with the active categories list
  const allCategories = ['All', ...categories];
  const activeCategory = allCategories.includes(selectedCategory) ? selectedCategory : 'All';

  // Filter products based on search and category (favorites appear in all categories)
  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'All' || product.category === activeCategory || product.isFavorite;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleProductClick = (product) => {
    if (product.stock === 0) return;
    
    if (product.type === 'variable') {
      onOpenVariantModal(product);
    } else {
      addToCart(product, null);
    }
  };

  const handleVariantSelect = (variant) => {
    if (variantModalProduct) {
      addToCart(variantModalProduct, variant);
      setVariantModalProduct(null);
    }
  };

  return (
    <div className="pos-workspace fade-in-view">
      <div className="catalog-panel">
        {/* Catalog actions (Search & Categories) */}
        <div className="catalog-actions">
          <div className="search-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              placeholder="Search drink..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="category-filter-list">
            {allCategories.map(category => (
              <button
                key={category}
                className={`category-tab ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid scrollable container */}
        <div className="products-grid-scroll">
          {filteredProducts.length === 0 ? (
            <div className="cart-empty" style={{ gridColumn: '1 / -1', height: '300px' }}>
              <div className="cart-empty-icon">🔍</div>
              <p>No products match your search</p>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map(product => {
                const isOutOfStock = product.stock === 0;
                const isLowStock = product.stock > 0 && product.stock <= 5;

                return (
                  <div
                    key={product.id}
                    className={`product-card glass-panel ${isOutOfStock ? 'out-of-stock' : ''}`}
                    onClick={() => handleProductClick(product)}
                  >
                    {isOutOfStock && <span className="stock-out">Out of Stock</span>}
                    {isLowStock && <span className="stock-warning">Low Stock ({product.stock})</span>}
                    {product.isFavorite && (
                      <span 
                        style={{ 
                          position: 'absolute', 
                          top: '10px', 
                          left: '10px', 
                          color: 'var(--warning)', 
                          fontSize: '0.9rem',
                          textShadow: '0 0 8px rgba(245, 158, 11, 0.4)',
                          zIndex: 1
                        }}
                        title="Favorite Product"
                      >
                        ⭐
                      </span>
                    )}
                    
                    <ProductImage src={product.image} alt={product.name} className="product-emoji" />
                    
                    <div className="product-info">
                      <span className="product-name">{product.name}</span>
                      
                      <div className="product-price-row">
                        <span className="product-price">${product.price.toFixed(2)}</span>
                        
                        <span className={`product-badge ${product.type === 'variable' ? 'badge-variant' : 'badge-simple'}`}>
                          {product.type === 'variable' ? 'Variants' : 'Simple'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterView;
