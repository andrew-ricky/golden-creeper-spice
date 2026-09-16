document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  updateAuthNav(); // Check and display authentication state on load
  
  // Fetch products if container exists
  if (document.getElementById('all-products')) {
    fetchProducts(false);
  }
  
  // Render cart items if on cart page
  if (document.getElementById('cart-items')) {
    renderCart();
  }
});

// Fetch products from Supabase database
async function fetchProducts(isFeatured = false) {
  const container = isFeatured ? document.getElementById('featured-products') : document.getElementById('all-products');
  if (!container) return;

  try {
    const { data, error } = await supabaseClient.from('products').select('*');
    if (error) throw error;

    container.innerHTML = '';

    if (!data || data.length === 0) {
      container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--gray);">No products found.</p>`;
      return;
    }

    const list = isFeatured ? data.slice(0, 4) : data;

    list.forEach(p => {
      const imageHTML = p.image_url 
        ? `<img src="${p.image_url}" alt="${p.name}">` 
        : `<div class="product-img-placeholder" style="height:200px; background:#e2e8f0; display:flex; align-items:center; justify-content:center; color:#64748b;">Image Pending</div>`;

      const safeName = p.name ? p.name.replace(/'/g, "\\'") : 'Product';
      const priceVal = p.price ? parseFloat(p.price) : 0;

      container.innerHTML += `
        <div class="product-card">
          ${imageHTML}
          <div class="product-info" style="padding: 1.2rem;">
            <h3>${p.name}</h3>
            <p class="price" style="font-size: 1.2rem; font-weight: 700; color: var(--primary); margin: 0.4rem 0;">$${priceVal.toFixed(2)}</p>
            <p style="font-size: 0.85rem; margin-bottom: 1rem; color:#555;">${p.description || ''}</p>
            <button class="btn" style="width: 100%;" onclick="addToCart(${p.id}, '${safeName}', ${priceVal})">Add to Cart</button>
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red;">Failed to load products.</p>`;
  }
}

// Add item to local storage cart
function addToCart(id, name, price) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  let item = cart.find(x => x.id === id);
  
  if (item) {
    item.qty += 1;
  } else {
    cart.push({ id, name, price, qty: 1 });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

// Update shopping cart badge count
function updateCartCount() {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  let totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  
  const badge = document.getElementById('cart-count');
  if (badge) {
    badge.innerText = totalCount;
    badge.setAttribute('data-count', totalCount);
    
    if (totalCount > 0) {
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }
}

// Render cart items table
function renderCart() {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const tbody = document.getElementById('cart-items');
  const totalElem = document.getElementById('cart-total');
  if (!tbody) return;

  tbody.innerHTML = '';
  let grandTotal = 0;

  if (cart.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem;">Your cart is currently empty.</td></tr>`;
    if (totalElem) totalElem.innerText = "0.00";
    return;
  }

  cart.forEach((item, index) => {
    let itemTotal = item.price * item.qty;
    grandTotal += itemTotal;
    tbody.innerHTML += `
      <tr>
        <td>${item.name}</td>
        <td>$${parseFloat(item.price).toFixed(2)}</td>
        <td><input type="number" value="${item.qty}" min="1" style="width:60px;" onchange="updateQty(${index}, this.value)"></td>
        <td>$${itemTotal.toFixed(2)}</td>
        <td><button style="background:#dc2626; color:white; border:none; padding:0.4rem 0.8rem; border-radius:4px; cursor:pointer;" onclick="removeFromCart(${index})">Remove</button></td>
      </tr>
    `;
  });

  if (totalElem) totalElem.innerText = grandTotal.toFixed(2);
}

// Update quantity of cart item
function updateQty(index, qty) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const parsedQty = parseInt(qty);
  
  if (parsedQty <= 0 || isNaN(parsedQty)) {
    removeFromCart(index);
    return;
  }
  
  cart[index].qty = parsedQty;
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
  updateCartCount();
}

// Remove item from cart
function removeFromCart(index) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
  updateCartCount();
}

// Update Auth UI in Navigation Bar
async function updateAuthNav() {
  const authContainer = document.getElementById('auth-menu-item');
  if (!authContainer) return;

  const { data: { session } } = await supabaseClient.auth.getSession();

  if (session && session.user) {
    const user = session.user;
    
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const userName = profile ? profile.full_name : 'User';
    const initial = userName.charAt(0).toUpperCase();

    authContainer.innerHTML = `
      <div style="display: inline-flex; align-items: center; gap: 0.6rem; background: rgba(255,255,255,0.12); padding: 0.25rem 0.8rem; border-radius: 30px; vertical-align: middle;">
        <div style="width: 28px; height: 28px; background: var(--accent); color: var(--dark); font-weight: 700; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;">
          ${initial}
        </div>
        <span style="color: white; font-weight: 600; font-size: 0.85rem;">Welcome, ${userName}</span>
        <button onclick="logoutUser()" style="background: #dc2626; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.7rem; cursor: pointer; margin-left: 0.3rem;">Logout</button>
      </div>
    `;
  } else {
    authContainer.innerHTML = `
      <a href="login.html" class="btn" style="padding: 0.35rem 0.9rem; font-size: 0.85rem; background: var(--accent); color: var(--dark); border-radius: 6px; font-weight: 600; text-decoration: none;">Login</a>
    `;
  }
}

// Handle user logout
async function logoutUser() {
  await supabaseClient.auth.signOut();
  localStorage.removeItem('cart');
  window.location.href = 'index.html';
}

// Proceed to checkout with login verification
async function proceedToCheckout() {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  if (cart.length === 0) {
    if (typeof showPopup === 'function') {
      showPopup("Cart Empty", "Your cart is empty. Add some products before checking out.");
    } else {
      alert("Your cart is empty. Add some products before checking out.");
    }
    return;
  }

  const { data: { session } } = await supabaseClient.auth.getSession();

  if (session && session.user) {
    window.location.href = 'checkout.html';
  } else {
    localStorage.setItem('redirectAfterLogin', 'checkout.html');
    if (typeof showPopup === 'function') {
      showPopup("Authentication Required", "Please login first to proceed with checkout.", () => {
        window.location.href = 'login.html';
      });
    } else {
      window.location.href = 'login.html';
    }
  }
}