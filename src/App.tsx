import React, { useState, useEffect } from 'react';
import './index.css';

// Types
interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  description: string;
  price: string;
  image: string;
  variantId: number;
}

interface CartItem {
  product: ShopifyProduct;
  quantity: number;
}

// Fetch products from Shopify
async function fetchProducts(): Promise<ShopifyProduct[]> {
  const res = await fetch('/api/products');
  const data = await res.json();
  return data.products;
}

export default function App() {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load products
  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .finally(() => setIsLoading(false));
  }, []);

  // Load cart from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('aya-cart');
    if (saved) {
      try { setCart(JSON.parse(saved)); } catch {}
    }
  }, []);

  // Save cart
  useEffect(() => {
    localStorage.setItem('aya-cart', JSON.stringify(cart));
  }, [cart]);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const addToCart = (product: ShopifyProduct) => {
    setCart(prev => {
      const exists = prev.find(item => item.product.id === product.id);
      if (exists) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const checkout = () => {
    const lineItems = cart.map(item => ({
      variantId: item.product.variantId,
      quantity: item.quantity,
    }));
    
    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lineItems }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        }
      })
      .catch(err => {
        // Fallback: redirect to Shopify cart
        const items = cart.map(item => `id:${item.product.variantId}&quantity:${item.quantity}`).join(',');
        window.location.href = `https://joyeria-el-final-2.myshopify.com/cart/${items}`;
      });
  };

  if (isLoading) {
    return (
      <div className="loader">
        <div className="loader-text">AYA GOLDEN</div>
        <div className="loader-bar"><div className="loader-fill" /></div>
      </div>
    );
  }

  return (
    <div>
      {/* Loading Screen */}
      <div className="loader hidden">
        <div className="loader-text">AYA GOLDEN</div>
      </div>

      {/* Grain Overlay */}
      <div className="grain-overlay" />

      {/* Custom Cursor */}
      <div className="cursor-dot" />
      <div className="cursor-outline" />

      {/* Navigation */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <a href="/" className="nav-logo">AYA GOLDEN</a>
        <ul className="nav-links">
          <a href="#coleccion">Colección</a>
          <a href="#joyeria">Joyería</a>
          <a href="#personalizar" className="nav-cta">Personalizar</a>
        </ul>
        <button className="cart-btn" onClick={() => setCartOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
          </svg>
          {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
        </button>
      </nav>

      {/* Hero */}
      <section className="hero">
        <img
          src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1920&q=85"
          alt="Luxury Jewelry"
          className="hero-image"
        />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="hero-eyebrow">Casa de Joyería Cinematográfica</p>
          <h1 className="hero-title">
            Brillo<br />
            <span className="accent">Eterno</span>
          </h1>
          <p className="hero-subtitle">
            Colección Otoño 2026 — Cada pieza cuenta una historia de lujo y distinción
          </p>
          <div className="hero-buttons">
            <a href="#coleccion" className="btn-primary"><span>Explorar Colección</span></a>
            <a href="#personalizar" className="btn-secondary">Diseño a Medida</a>
          </div>
        </div>
        <div className="scroll-indicator">
          <span style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#999', fontWeight: 300 }}>Descubre</span>
          <div className="scroll-line" />
        </div>
      </section>

      {/* Marquee */}
      <div className="marquee">
        <div className="marquee-track">
          {['ORO 18K', 'BRILLO SUPREMO', 'LUJO URBANO', 'ARTESANÍA', 'EXCLUSIVIDAD', 'ORO 18K', 'BRILLO SUPREMO', 'LUJO URBANO', 'ARTESANÍA', 'EXCLUSIVIDAD'].map((text, i) => (
            <span key={i} className="marquee-item">
              <span className="dot">✦</span> {text}
            </span>
          ))}
        </div>
      </div>

      {/* Products Section */}
      <section id="coleccion" className="section">
        <div className="section-header">
          <p className="section-eyebrow">Colección 2026</p>
          <h2 className="section-title">Nuestras <span className="accent">Piezas</span></h2>
          <p className="section-desc">Cada pieza forjada en los metales más nobles, diseñada para quienes exigen lo mejor.</p>
        </div>
        <div className="products-grid">
          {products.slice(0, 4).map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image-wrap">
                <img src={product.image} alt={product.title} className="product-image" />
                <button className="quick-add" onClick={() => addToCart(product)}>
                  Añadir al Carrito
                </button>
              </div>
              <div className="product-info">
                <h3 className="product-title">{product.title}</h3>
                <p className="product-desc">{product.description}</p>
                <p className="product-price">{product.price} €</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Jewellery Section */}
      <section id="joyeria" className="section section-alt">
        <div className="section-header">
          <p className="section-eyebrow">Artesanía de Lujo</p>
          <h2 className="section-title">Joyería <span className="accent">Fina</span></h2>
        </div>
        <div className="products-grid">
          {products.slice(4, 8).length > 0 ? products.slice(4, 8).map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image-wrap">
                <img src={product.image} alt={product.title} className="product-image" />
                <button className="quick-add" onClick={() => addToCart(product)}>
                  Añadir al Carrito
                </button>
              </div>
              <div className="product-info">
                <h3 className="product-title">{product.title}</h3>
                <p className="product-price">{product.price} €</p>
              </div>
            </div>
          )) : products.slice(0, 4).map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image-wrap">
                <img src={product.image} alt={product.title} className="product-image" />
                <button className="quick-add" onClick={() => addToCart(product)}>
                  Añadir al Carrito
                </button>
              </div>
              <div className="product-info">
                <h3 className="product-title">{product.title}</h3>
                <p className="product-price">{product.price} €</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Custom Section */}
      <section id="personalizar" className="section">
        <div className="custom-section">
          <div className="custom-content">
            <p className="section-eyebrow">Exclusividad</p>
            <h2 className="section-title">Diseño <span className="accent">Personalizado</span></h2>
            <p className="section-desc" style={{ marginBottom: '40px' }}>
              ¿Tienes una visión? Nuestros artesanos la harán realidad. Oro 18k, diamantes certificados,
              y la artesanía más exclusiva de Barcelona.
            </p>
            <a href={`https://wa.me/34630049533?text=Hola%2C%20quiero%20un%20dise%C3%B1o%20personalizado%20de%20joyer%C3%ADa`}
              target="_blank" rel="noopener noreferrer" className="btn-primary">
              <span>Hablar con un Asesor</span>
            </a>
          </div>
          <div className="custom-image">
            <img
              src="https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=600&q=85"
              alt="Custom Jewelry"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-logo">AYA GOLDEN</span>
            <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '12px', maxWidth: '300px' }}>
              Joyería cinematográfica de lujo. Cada pieza es una obra de arte forjada en Barcelona.
            </p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Colección</h4>
              <a href="#coleccion">Anillos</a>
              <a href="#coleccion">Cadenas</a>
              <a href="#coleccion">Personalizadas</a>
            </div>
            <div className="footer-col">
              <h4>Compañía</h4>
              <a href="https://joyeria-el-final-2.myshopify.com" target="_blank" rel="noopener noreferrer">Tienda</a>
              <a href={`https://wa.me/34630049533`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <a href="https://joyeria-el-final-2.myshopify.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer">Privacidad</a>
              <a href="https://joyeria-el-final-2.myshopify.com/policies/terms-of-service" target="_blank" rel="noopener noreferrer">Términos</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 AYA GOLDEN. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* WhatsApp Button */}
      <a
        href={`https://wa.me/34630049533`}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-btn"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>

      {/* Cookie Banner */}
      <div className="cookie-banner" id="cookieBanner">
        <p>Usamos cookies para mejorar tu experiencia. Al continuar, aceptas nuestra política de cookies.</p>
        <button className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.7rem' }}
          onClick={() => document.getElementById('cookieBanner')!.style.display = 'none'}>
          <span>Aceptar</span>
        </button>
      </div>

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="cart-overlay" onClick={() => setCartOpen(false)}>
          <div className="cart-drawer" onClick={e => e.stopPropagation()}>
            <div className="cart-header">
              <h3>Tu Carrito ({cartCount})</h3>
              <button className="cart-close" onClick={() => setCartOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="cart-items">
              {cart.length === 0 ? (
                <p className="cart-empty">Tu carrito está vacío</p>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="cart-item">
                    <img src={item.product.image} alt={item.product.title} className="cart-item-img" />
                    <div className="cart-item-info">
                      <h4>{item.product.title}</h4>
                      <p>{item.product.price} €</p>
                      <div className="cart-qty">
                        <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                      </div>
                    </div>
                    <button className="cart-item-remove" onClick={() => removeFromCart(item.product.id)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total">
                  <span>Total</span>
                  <span>{cartTotal.toFixed(2)} €</span>
                </div>
                <button className="btn-primary checkout-btn" onClick={checkout}>
                  <span>Pagar Ahora</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
