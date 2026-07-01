import { useEffect, useMemo, useState } from 'react';

type Product = {
  id: string;
  name: string;
  category: string;
  brand?: string;
  price: number;
  stock: number;
  description: string;
};

type CartItem = Product & {
  quantity: number;
};

type ApiProduct = {
  _id: string;
  name: string;
  category?: { name?: string };
  brand?: { name?: string };
  price: number;
  stock: number;
  description?: string;
};

function getBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_BASE_URL;
  const fallbackBaseUrl = `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;

  if (!configuredBaseUrl) {
    return fallbackBaseUrl;
  }

  try {
    const url = new URL(configuredBaseUrl);
    const isLocalApiHost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    const isLocalPageHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocalApiHost && !isLocalPageHost) {
      url.hostname = window.location.hostname;
      return url.toString().replace(/\/$/, '');
    }
  } catch {
    return fallbackBaseUrl;
  }

  return configuredBaseUrl.replace(/\/$/, '');
}

const baseUrl = getBaseUrl();

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'MMK',
  maximumFractionDigits: 0
});

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const cartTotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart]
  );

  const cartCount = useMemo(() => cart.reduce((total, item) => total + item.quantity, 0), [cart]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      try {
        setIsLoading(true);
        setError('');

        const response = await fetch(`${baseUrl}/products/public?limit=24`, {
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error('Products could not be loaded.');
        }

        const result = await response.json();
        const apiProducts = (result.data || []) as ApiProduct[];

        setProducts(
          apiProducts.map((product) => ({
            id: product._id,
            name: product.name,
            category: product.category?.name || 'General',
            brand: product.brand?.name,
            price: product.price,
            stock: product.stock,
            description: product.description || 'Quality product ready for purchase.'
          }))
        );
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setError((fetchError as Error).message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => controller.abort();
  }, []);

  function addToCart(product: Product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, item.stock) } : item
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });
  }

  function removeFromCart(id: string) {
    setCart((current) => current.filter((item) => item.id !== id));
  }

  function updateQuantity(id: string, quantity: number) {
    setCart((current) =>
      current.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) } : item
      )
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Customer Storefront</p>
          <h1>Inventory Shop</h1>
        </div>
        <a className="cart-pill" href="#checkout">
          Cart: {cartCount}
        </a>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Browse, add to cart, checkout</p>
          <h2>Customer-facing shop for your inventory system.</h2>
          <p>
            This project is separated from the admin dashboard so customers can buy products without
            entering the inventory management area.
          </p>
          <a className="primary-link" href="#products">
            View products
          </a>
        </div>
      </section>

      <section id="products" className="section">
        <div className="section-heading">
          <p className="eyebrow">Products</p>
          <h2>Available items</h2>
        </div>

        <div className="product-grid">
          {isLoading && <p className="empty">Loading products...</p>}
          {error && <p className="error-text">{error}</p>}
          {!isLoading && !error && products.length === 0 && <p className="empty">No products available yet.</p>}

          {products.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-media">{product.category}</div>
              <div className="product-body">
                <div>
                  <p className="muted">{product.brand ? `${product.category} / ${product.brand}` : product.category}</p>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                </div>
                <div className="product-meta">
                  <strong>{money.format(product.price)}</strong>
                  <span>{product.stock} in stock</span>
                </div>
                <button type="button" onClick={() => addToCart(product)}>
                  Add to cart
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="checkout" className="section checkout-layout">
        <div>
          <p className="eyebrow">Checkout</p>
          <h2>Your cart</h2>
          {cart.length === 0 ? (
            <p className="empty">No products in cart yet.</p>
          ) : (
            <div className="cart-list">
              {cart.map((item) => (
                <div className="cart-row" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{money.format(item.price)}</span>
                  </div>
                  <input
                    aria-label={`Quantity for ${item.name}`}
                    min="1"
                    max={item.stock}
                    type="number"
                    value={item.quantity}
                    onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                  />
                  <button type="button" className="ghost-button" onClick={() => removeFromCart(item.id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="summary">
          <h3>Order summary</h3>
          <div className="summary-line">
            <span>Items</span>
            <strong>{cartCount}</strong>
          </div>
          <div className="summary-line">
            <span>Total</span>
            <strong>{money.format(cartTotal)}</strong>
          </div>
          <button type="button" disabled={cart.length === 0}>
            Continue to purchase
          </button>
          <p>
            Next step: connect this button to customer order and payment APIs in the server.
          </p>
        </aside>
      </section>
    </main>
  );
}

export default App;
