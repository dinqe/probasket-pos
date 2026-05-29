import React from 'react';

export const ProductImage = ({ src, alt, size = '2.2rem', className = '', style: customStyle = {} }) => {
  const isDataUrl = src && (src.startsWith('data:') || src.startsWith('http') || src.startsWith('/') || src.startsWith('blob:'));
  
  const defaultSize = size === '2.2rem' ? '50px' : size === '1.5rem' ? '32px' : size === '0.95rem' ? '18px' : '24px';

  const style = {
    fontSize: size,
    width: defaultSize,
    height: defaultSize,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    objectFit: 'cover',
    background: 'rgba(255,255,255,0.02)',
    flexShrink: 0,
    ...customStyle
  };

  if (isDataUrl) {
    return <img src={src} alt={alt} style={style} className={className} />;
  }
  
  return (
    <span className={className} style={{ fontSize: size, display: 'flex', alignItems: 'center', justifyContent: 'center', width: defaultSize, height: defaultSize }}>
      {src || '🥤'}
    </span>
  );
};

export default ProductImage;
