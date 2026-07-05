import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

type Product = {
  id: string;
  name: string;
  category: string;
  brand: string;
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

type CheckoutForm = {
  name: string;
  phone: string;
  address: string;
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

const emptyCheckoutForm: CheckoutForm = {
  name: '',
  phone: '',
  address: ''
};

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkout, setCheckout] = useState<CheckoutForm>(emptyCheckoutForm);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [brandFilter, setBrandFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [orderMessage, setOrderMessage] = useState('');

  const loadProducts = useCallback(async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(`${baseUrl}/products/public?limit=60`, {
        signal
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
          brand: product.brand?.name || 'Unbranded',
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
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    loadProducts(controller.signal);

    return () => controller.abort();
  }, [loadProducts]);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(products.map((product) => product.category))).sort()],
    [products]
  );

  const brands = useMemo(
    () => ['All', ...Array.from(new Set(products.map((product) => product.brand))).sort()],
    [products]
  );

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
        const matchesBrand = brandFilter === 'All' || product.brand === brandFilter;

        return matchesCategory && matchesBrand;
      }),
    [brandFilter, categoryFilter, products]
  );

  const cartTotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart]
  );

  const cartCount = useMemo(() => cart.reduce((total, item) => total + item.quantity, 0), [cart]);

  function getCartQuantity(id: string) {
    return cart.find((item) => item.id === id)?.quantity || 0;
  }

  function addToCart(product: Product) {
    setOrderMessage('');
    setError('');
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
    const nextQuantity = Number.isFinite(quantity) ? quantity : 1;

    setCart((current) =>
      current.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, Math.min(nextQuantity, item.stock)) } : item
      )
    );
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setOrderMessage('');

    const customerName = checkout.name.trim();
    const phone = checkout.phone.trim();
    const address = checkout.address.trim();

    if (!customerName || !phone || !address) {
      setError('Please enter name, phone, and address.');
      return;
    }

    if (cart.length === 0) {
      setError('Please add at least one product to the cart.');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`${baseUrl}/customer-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerName,
          phone,
          address,
          items: cart.map((item) => ({
            product: item.id,
            quantity: item.quantity
          }))
        })
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || 'Order could not be submitted.');
      }

      setOrderMessage('Order submitted. We will contact you to confirm the purchase.');
      setCart([]);
      setCheckout(emptyCheckoutForm);
      await loadProducts();
    } catch (submitError) {
      setError((submitError as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Inventory Shop</p>
          <h1>Products ready to order</h1>
        </div>
        <nav className="top-actions" aria-label="Store navigation">
          <a href="#products">Products</a>
          <a className="cart-pill" href="#checkout">
            Cart {cartCount}
          </a>
        </nav>
      </header>

      <section className="store-layout">
        <section id="products" className="catalog">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Catalog</p>
              <h2>Choose products</h2>
            </div>
            <span>{filteredProducts.length} item(s)</span>
          </div>

          <div className="filter-bar" aria-label="Product filters">
            <label>
              Category
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Brand
              <select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)}>
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="product-grid">
            {isLoading && <p className="empty">Loading products...</p>}
            {!isLoading && !error && filteredProducts.length === 0 && <p className="empty">No products found.</p>}

            {filteredProducts.map((product) => {
              const quantityInCart = getCartQuantity(product.id);
              const availableStock = product.stock - quantityInCart;

              return (
                <article className="product-card" key={product.id}>
                  <div className="product-media">
                    <span>{product.category}</span>
                  </div>
                  <div className="product-body">
                    <div className="product-tags">
                      <span>Category: {product.category}</span>
                      <span>Brand: {product.brand}</span>
                    </div>
                    <div>
                      <h3>{product.name}</h3>
                      <p>{product.description}</p>
                    </div>
                    <div className="product-meta">
                      <strong>{money.format(product.price)}</strong>
                      <span>{availableStock} available</span>
                    </div>
                    <button type="button" disabled={availableStock <= 0} onClick={() => addToCart(product)}>
                      {availableStock <= 0 ? 'Added max quantity' : 'Add to cart'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside id="checkout" className="checkout-panel">
          <div>
            <p className="eyebrow">Checkout</p>
            <h2>Your order</h2>
          </div>

          {cart.length === 0 ? (
            <p className="empty">No products in cart yet.</p>
          ) : (
            <div className="cart-list">
              {cart.map((item) => (
                <div className="cart-row" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      {money.format(item.price)} x {item.quantity}
                    </span>
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

          <div className="summary-line">
            <span>Items</span>
            <strong>{cartCount}</strong>
          </div>
          <div className="summary-line total">
            <span>Total</span>
            <strong>{money.format(cartTotal)}</strong>
          </div>

          <form className="checkout-form" onSubmit={submitOrder}>
            <label>
              Name
              <input
                value={checkout.name}
                onChange={(event) => setCheckout((current) => ({ ...current, name: event.target.value }))}
                placeholder="Customer name"
              />
            </label>
            <label>
              Phone
              <input
                value={checkout.phone}
                onChange={(event) => setCheckout((current) => ({ ...current, phone: event.target.value }))}
                placeholder="Phone number"
              />
            </label>
            <label>
              Address
              <textarea
                value={checkout.address}
                onChange={(event) => setCheckout((current) => ({ ...current, address: event.target.value }))}
                placeholder="Delivery address"
                rows={3}
              />
            </label>
            {error && <p className="error-text">{error}</p>}
            {orderMessage && <p className="success-text">{orderMessage}</p>}
            <button type="submit" disabled={cart.length === 0 || isSubmitting}>
              {isSubmitting ? 'Submitting order...' : 'Continue to purchase'}
            </button>
          </form>
        </aside>
      </section>
    </main>
  );
}

export default App;
