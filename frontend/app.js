// Change the second URL to your deployed backend URL (e.g. Render) once it is live!
const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ? "http://localhost:8080/api"
  : "https://food-delivery-web-app-lhb3.onrender.com/api";

// Application State
let state = {
  currentUser: JSON.parse(localStorage.getItem("food_user")) || null,
  cart: JSON.parse(localStorage.getItem("food_cart")) || [],
  menu: [],
  currentCategory: "All",
  currentDiet: "all", // all, veg, nonveg
  searchQuery: "",
  sortMode: "default",
  activeView: "menu",
  activeOrder: JSON.parse(localStorage.getItem("active_order")) || null,
  trackingTimer: null
};

// Application Initialize
window.addEventListener("DOMContentLoaded", () => {
  initTheme();
  updateUserUI();
  fetchMenu();
  updateCartBadge();
  
  // Set default form values in checkout if logged in
  if (state.currentUser) {
    document.getElementById("checkout-name").value = state.currentUser.name;
  }

  // If there's an active order, resume tracking it
  if (state.activeOrder) {
    startOrderTracking(state.activeOrder.id);
  }
});

// Theme Logic
function initTheme() {
  const isDark = localStorage.getItem("theme") !== "light";
  document.getElementById("theme-switch").checked = !isDark;
  if (!isDark) {
    document.body.classList.add("light-theme");
  }
}

function toggleTheme() {
  const switchEl = document.getElementById("theme-switch");
  if (switchEl.checked) {
    document.body.classList.add("light-theme");
    localStorage.setItem("theme", "light");
  } else {
    document.body.classList.remove("light-theme");
    localStorage.setItem("theme", "dark");
  }
}

// REST API Service Functions
async function fetchMenu() {
  try {
    const res = await fetch(`${API_BASE}/foods`);
    if (!res.ok) throw new Error("Failed to load food menu");
    state.menu = await res.json();
    renderMenu();
  } catch (err) {
    console.error(err);
    document.getElementById("food-grid").innerHTML = `
      <div style="text-align: center; grid-column: 1/-1; padding: 3rem;">
        <span style="font-size: 2.5rem;">⚠️</span>
        <h3 style="margin-top: 1rem; color: var(--danger);">Failed to connect to backend server</h3>
        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">
          Make sure your Spring Boot backend application is running at port 8080.
        </p>
        <button class="btn btn-secondary" onclick="fetchMenu()" style="margin-top: 1.5rem;">🔄 Try Reconnecting</button>
      </div>
    `;
  }
}

// Navigation & Router
function showView(viewName) {
  state.activeView = viewName;
  
  // Update view classes
  document.querySelectorAll(".view-section").forEach(sec => {
    sec.classList.remove("active");
  });
  
  const targetSec = document.getElementById(`${viewName}-view`);
  if (targetSec) targetSec.classList.add("active");
  
  // Close cart drawer if switching to other views
  toggleCartDrawer(false);
  
  // Render specific view data
  if (viewName === "history") {
    fetchOrderHistory();
  } else if (viewName === "admin") {
    fetchAdminOrders();
  } else if (viewName === "checkout") {
    renderCheckoutSummary();
  }
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// User UI Updates
function updateUserUI() {
  const userUI = document.getElementById("user-ui");
  const adminToggleContainer = document.getElementById("admin-toggle-container");
  
  if (state.currentUser) {
    const isAdmin = state.currentUser.role === "ADMIN";
    
    // User Chip
    userUI.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div class="user-chip" style="cursor: pointer;" onclick="showView('history')" title="View Order History">
          <div class="avatar">${state.currentUser.name.charAt(0).toUpperCase()}</div>
          <span>${state.currentUser.name}</span>
        </div>
        <button class="btn btn-secondary" onclick="handleLogout()" style="padding: 0.5rem 1rem;">Sign Out</button>
      </div>
    `;
    
    // Show admin options if applicable
    if (isAdmin) {
      adminToggleContainer.style.display = "flex";
      document.getElementById("admin-switch").checked = (state.activeView === "admin");
    } else {
      adminToggleContainer.style.display = "none";
      if (state.activeView === "admin") showView("menu");
    }
  } else {
    // Unauthenticated UI
    userUI.innerHTML = `<button class="btn btn-secondary" onclick="openModal('login')">Log In</button>`;
    adminToggleContainer.style.display = "none";
    if (state.activeView === "admin" || state.activeView === "history" || state.activeView === "checkout") {
      showView("menu");
    }
  }
}

// Admin toggle switch action
function toggleAdminMode() {
  const switchEl = document.getElementById("admin-switch");
  if (switchEl.checked) {
    showView("admin");
  } else {
    showView("menu");
  }
}

// Modals Controls
function openModal(type) {
  document.getElementById(`${type}-modal-overlay`).classList.add("active");
}

function closeModal(type) {
  document.getElementById(`${type}-modal-overlay`).classList.remove("active");
}

function openAltModal(closeType, openType) {
  closeModal(closeType);
  setTimeout(() => openModal(openType), 200);
}

// Register handler
async function handleRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("register-name").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;
  const isAdmin = document.getElementById("register-is-admin").checked;
  const role = isAdmin ? "ADMIN" : "CUSTOMER";
  
  try {
    const res = await fetch(`${API_BASE}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role })
    });
    
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText);
    }
    
    const user = await res.json();
    alert("Account created successfully! Please sign in.");
    closeModal("register");
    openModal("login");
  } catch (err) {
    alert(`Registration Failed: ${err.message}`);
  }
}

// Login handler
async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  
  try {
    const res = await fetch(`${API_BASE}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText);
    }
    
    const user = await res.json();
    state.currentUser = user;
    localStorage.setItem("food_user", JSON.stringify(user));
    
    // Autofill checkout details
    document.getElementById("checkout-name").value = user.name;
    
    updateUserUI();
    closeModal("login");
    
    // Refresh history / views if open
    if (state.activeView === "history") {
      fetchOrderHistory();
    }
    alert(`Welcome back, ${user.name}!`);
  } catch (err) {
    alert(`Login Failed: ${err.message}`);
  }
}

// Logout handler
function handleLogout() {
  state.currentUser = null;
  localStorage.removeItem("food_user");
  
  // Clear tracking of active order locally
  stopOrderTracking();
  state.activeOrder = null;
  localStorage.removeItem("active_order");
  
  updateUserUI();
  showView("menu");
  alert("Logged out successfully.");
}

// Menu Filtering, Searching & Sorting
function selectCategory(category) {
  state.currentCategory = category;
  
  // Update UI chips
  document.querySelectorAll(".category-chip").forEach(chip => {
    chip.classList.remove("active");
    if (chip.getAttribute("data-category") === category) {
      chip.classList.add("active");
    }
  });
  renderMenu();
}

function selectDiet(diet) {
  state.currentDiet = diet;
  
  // Update filter buttons
  document.getElementById("filter-all").classList.remove("active");
  document.getElementById("filter-veg").classList.remove("active");
  document.getElementById("filter-nonveg").classList.remove("active");
  
  document.getElementById(`filter-${diet}`).classList.add("active");
  renderMenu();
}

function handleSearch() {
  state.searchQuery = document.getElementById("search-input").value.toLowerCase().trim();
  renderMenu();
}

function handleSort() {
  state.sortMode = document.getElementById("sort-select").value;
  renderMenu();
}

// Render Menu Cards
function renderMenu() {
  const grid = document.getElementById("food-grid");
  
  // 1. Filter
  let filtered = state.menu.filter(item => {
    // Category check
    const matchesCategory = (state.currentCategory === "All" || item.category === state.currentCategory);
    
    // Diet check
    let matchesDiet = true;
    if (state.currentDiet === "veg") matchesDiet = item.isVeg;
    else if (state.currentDiet === "nonveg") matchesDiet = !item.isVeg;
    
    // Search query check
    const matchesSearch = item.name.toLowerCase().includes(state.searchQuery) ||
                          item.description.toLowerCase().includes(state.searchQuery);
                          
    return matchesCategory && matchesDiet && matchesSearch;
  });
  
  // 2. Sort
  if (state.sortMode === "price-low") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (state.sortMode === "price-high") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (state.sortMode === "name-asc") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  // 3. Render
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="text-align: center; grid-column: 1/-1; padding: 4rem; color: var(--text-secondary);">
        <span style="font-size: 2.5rem;">🥗</span>
        <h3 style="margin-top: 1rem;">No matching food items found</h3>
        <p style="font-size: 0.9rem; margin-top: 0.25rem;">Try modifying your search queries or category filters.</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = filtered.map(item => `
    <div class="food-card">
      <div class="food-card-img-container">
        <img src="${item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'}" alt="${item.name}">
        <span class="food-badge ${item.isVeg ? 'veg' : 'non-veg'}">
          ${item.isVeg ? 'Veg' : 'Non-Veg'}
        </span>
      </div>
      <div class="food-card-body">
        <h3 class="food-card-title">${item.name}</h3>
        <p class="food-card-desc">${item.description || 'No description available for this delicious recipe.'}</p>
        <div class="food-card-footer">
          <span class="food-price">$${item.price.toFixed(2)}</span>
          <button class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="addToCart(${item.id})">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

// Cart Drawer Operations
function toggleCartDrawer(open) {
  const drawer = document.getElementById("cart-drawer");
  const overlay = document.getElementById("cart-drawer-overlay");
  
  if (open) {
    drawer.classList.add("active");
    overlay.classList.add("active");
    renderCart();
  } else {
    drawer.classList.remove("active");
    overlay.classList.remove("active");
  }
}

function addToCart(foodId) {
  const food = state.menu.find(f => f.id === foodId);
  if (!food) return;
  
  const existing = state.cart.find(item => item.id === foodId);
  if (existing) {
    existing.quantity++;
  } else {
    state.cart.push({
      id: food.id,
      name: food.name,
      price: food.price,
      imageUrl: food.imageUrl,
      quantity: 1
    });
  }
  
  saveCart();
  updateCartBadge();
  
  // Show micro feedback on cart button
  const cartBtn = document.getElementById("cart-btn");
  cartBtn.style.transform = "scale(1.2)";
  setTimeout(() => cartBtn.style.transform = "none", 150);
}

function updateCartQty(foodId, change) {
  const index = state.cart.findIndex(item => item.id === foodId);
  if (index === -1) return;
  
  state.cart[index].quantity += change;
  if (state.cart[index].quantity <= 0) {
    state.cart.splice(index, 1);
  }
  
  saveCart();
  updateCartBadge();
  renderCart();
  
  // If checkout view is active, update checkout summary too
  if (state.activeView === "checkout") {
    renderCheckoutSummary();
  }
}

function saveCart() {
  localStorage.setItem("food_cart", JSON.stringify(state.cart));
}

function updateCartBadge() {
  const badge = document.getElementById("cart-badge");
  const count = state.cart.reduce((total, item) => total + item.quantity, 0);
  
  if (count > 0) {
    badge.innerText = count;
    badge.style.display = "flex";
  } else {
    badge.style.display = "none";
  }
}

function renderCart() {
  const container = document.getElementById("cart-items-container");
  const subtotalEl = document.getElementById("cart-subtotal");
  
  if (state.cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-state">
        <span>🍔</span>
        <h4>Your cart is empty</h4>
        <p style="font-size: 0.85rem; margin-top: 0.25rem;">Add tasty items from the menu to fill it up.</p>
      </div>
    `;
    subtotalEl.innerText = "$0.00";
    return;
  }
  
  let subtotal = 0;
  container.innerHTML = state.cart.map(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    return `
      <div class="cart-item">
        <img src="${item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'}" class="cart-item-img" alt="${item.name}">
        <div class="cart-item-info">
          <h4 class="cart-item-title">${item.name}</h4>
          <span class="cart-item-price">$${item.price.toFixed(2)}</span>
        </div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="updateCartQty(${item.id}, -1)">-</button>
          <span style="font-size: 0.9rem; font-weight: 700; width: 15px; text-align: center;">${item.quantity}</span>
          <button class="qty-btn" onclick="updateCartQty(${item.id}, 1)">+</button>
        </div>
      </div>
    `;
  }).join("");
  
  subtotalEl.innerText = `$${subtotal.toFixed(2)}`;
}

// Checkout Summary Render
function renderCheckoutSummary() {
  const listEl = document.getElementById("checkout-summary-list");
  const subtotalEl = document.getElementById("checkout-subtotal");
  const taxEl = document.getElementById("checkout-tax");
  const grandEl = document.getElementById("checkout-grand-total");
  
  if (state.cart.length === 0) {
    listEl.innerHTML = `<div style="color: var(--text-muted);">No items in cart</div>`;
    subtotalEl.innerText = "$0.00";
    taxEl.innerText = "$0.00";
    grandEl.innerText = "$0.00";
    return;
  }
  
  let subtotal = 0;
  listEl.innerHTML = state.cart.map(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    return `
      <div class="checkout-summary-item" style="border-bottom: 1px solid var(--border); padding-bottom: 0.4rem; margin-bottom: 0.4rem;">
        <span style="font-size: 0.9rem; font-weight: 500;">
          ${item.name} <span style="color: var(--primary); font-weight: 700;">x${item.quantity}</span>
        </span>
        <span style="font-weight: 600;">$${itemTotal.toFixed(2)}</span>
      </div>
    `;
  }).join("");
  
  const tax = subtotal * 0.05; // 5% GST
  const grandTotal = subtotal + tax;
  
  subtotalEl.innerText = `$${subtotal.toFixed(2)}`;
  taxEl.innerText = `$${tax.toFixed(2)}`;
  grandEl.innerText = `$${grandTotal.toFixed(2)}`;
}

function handleCheckoutBtn() {
  if (state.cart.length === 0) {
    alert("Your cart is empty! Add items before checking out.");
    return;
  }
  
  if (!state.currentUser) {
    alert("Please log in to proceed with checkout.");
    openModal("login");
    return;
  }
  
  showView("checkout");
}

// Checkout Submit (Place Order)
async function handlePlaceOrder(e) {
  e.preventDefault();
  
  if (state.cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }
  
  const name = document.getElementById("checkout-name").value;
  const phone = document.getElementById("checkout-phone").value;
  const address = document.getElementById("checkout-address").value;
  
  // Calculate total amount
  let subtotal = state.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const totalAmount = subtotal * 1.05; // subtotal + 5% tax
  
  // Build Order Items
  const items = state.cart.map(item => ({
    foodId: item.id,
    foodName: item.name,
    quantity: item.quantity,
    price: item.price
  }));
  
  const orderData = {
    userId: state.currentUser.id,
    userName: name,
    deliveryAddress: address,
    phone: phone,
    totalAmount: totalAmount,
    items: items
  };
  
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData)
    });
    
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText);
    }
    
    const placedOrder = await res.json();
    alert("🎉 Order placed successfully! Tracking your delivery now.");
    
    // Clear cart
    state.cart = [];
    saveCart();
    updateCartBadge();
    
    // Open tracking view for this order
    startOrderTracking(placedOrder.id);
  } catch (err) {
    alert(`Failed to place order: ${err.message}`);
  }
}

// Order Tracking System
function startOrderTracking(orderId) {
  stopOrderTracking(); // Clear existing trackers
  
  // Set view to tracking
  showView("tracking");
  
  // Immediately poll status and keep polling every 5 seconds
  pollOrderStatus(orderId);
  state.trackingTimer = setInterval(() => pollOrderStatus(orderId), 5000);
}

function stopOrderTracking() {
  if (state.trackingTimer) {
    clearInterval(state.trackingTimer);
    state.trackingTimer = null;
  }
}

async function pollOrderStatus(orderId) {
  try {
    // We can fetch from history or a general fetch. Since user order can be fetched, we can read the history card or create an admin status look.
    // For simplicity, let's fetch the list of user orders and find the matching one, or create a quick custom get order endpoint. Since we didn't write an explicit "GET /orders/{id}" on backend controller, we can use "GET /orders/user/{userId}" to look it up!
    // That's smart and prevents adding more API routes.
    const res = await fetch(`${API_BASE}/orders/user/${state.currentUser.id}`);
    if (!res.ok) throw new Error("Failed to pull status updates");
    
    const orders = await res.json();
    const active = orders.find(o => o.id === orderId);
    
    if (active) {
      state.activeOrder = active;
      localStorage.setItem("active_order", JSON.stringify(active));
      updateTrackingUI(active);
      
      // If delivered, stop polling
      if (active.status === "DELIVERED") {
        stopOrderTracking();
        localStorage.removeItem("active_order");
        state.activeOrder = null;
      }
    }
  } catch (err) {
    console.error("Tracking update failed: ", err);
  }
}

function updateTrackingUI(order) {
  document.getElementById("track-id").innerText = order.id;
  
  const time = new Date(order.orderTime);
  document.getElementById("track-time").innerText = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Status mapping
  const steps = ["PENDING", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];
  const currentStepIdx = steps.indexOf(order.status);
  
  // CSS targets
  const stepEls = {
    "PENDING": document.getElementById("step-pending"),
    "PREPARING": document.getElementById("step-preparing"),
    "OUT_FOR_DELIVERY": document.getElementById("step-delivery"),
    "DELIVERED": document.getElementById("step-delivered")
  };
  
  // Loop through timeline steps
  steps.forEach((step, idx) => {
    const el = stepEls[step];
    if (!el) return;
    
    el.classList.remove("active", "completed");
    
    if (idx < currentStepIdx) {
      el.classList.add("completed");
    } else if (idx === currentStepIdx) {
      el.classList.add("active");
    }
  });
}

// User Order History Render
async function fetchOrderHistory() {
  const container = document.getElementById("order-history-list");
  
  if (!state.currentUser) {
    container.innerHTML = `<div style="text-align: center; padding: 2rem;">Please sign in to view your orders.</div>`;
    return;
  }
  
  try {
    const res = await fetch(`${API_BASE}/orders/user/${state.currentUser.id}`);
    if (!res.ok) throw new Error("Failed to load history");
    
    const orders = await res.json();
    
    if (orders.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
          <span>🍱</span>
          <h4 style="margin-top: 1rem;">No orders placed yet</h4>
          <p style="font-size: 0.85rem; margin-top: 0.25rem;">Your culinary adventures will appear here once you order!</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = orders.map(order => {
      const date = new Date(order.orderTime).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
      const itemsDesc = order.items.map(it => `${it.foodName} (x${it.quantity})`).join(", ");
      
      let statusClass = "status-pending";
      if (order.status === "PREPARING") statusClass = "status-preparing";
      else if (order.status === "OUT_FOR_DELIVERY") statusClass = "status-delivery";
      else if (order.status === "DELIVERED") statusClass = "status-delivered";
      
      const isTracking = (order.status !== "DELIVERED");
      const trackBtn = isTracking ? `
        <button class="btn btn-primary" style="padding: 0.4rem 1rem; font-size: 0.8rem;" onclick="startOrderTracking(${order.id})">
          📍 Track Order
        </button>
      ` : "";
      
      return `
        <div class="order-history-card">
          <div class="order-history-header">
            <div>
              <span class="order-history-id">Order #${order.id}</span>
              <div class="order-history-date">${date}</div>
            </div>
            <span class="order-history-status-badge ${statusClass}">${order.status.replace(/_/g, " ")}</span>
          </div>
          <div class="order-history-details">
            <div class="order-history-items">
              <strong style="color: var(--text-primary);">Items:</strong> ${itemsDesc}
              <div style="font-size: 0.8rem; margin-top: 0.4rem; color: var(--text-muted);">
                📍 Deliver to: ${order.deliveryAddress}
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem;">
              <span class="order-history-price">$${order.totalAmount.toFixed(2)}</span>
              ${trackBtn}
            </div>
          </div>
        </div>
      `;
    }).join("");
    
  } catch (err) {
    container.innerHTML = `<div style="color: var(--danger); text-align: center; padding: 2rem;">Error: ${err.message}</div>`;
  }
}

// Admin Panel REST and DOM Functions
async function fetchAdminOrders() {
  const tbody = document.getElementById("admin-orders-list");
  
  try {
    const res = await fetch(`${API_BASE}/orders`);
    if (!res.ok) throw new Error("Failed to load admin orders");
    
    const orders = await res.json();
    
    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No orders found.</td></tr>`;
      return;
    }
    
    tbody.innerHTML = orders.map(order => {
      const itemsList = order.items.map(it => `${it.foodName} (x${it.quantity})`).join("<br>");
      
      const statuses = ["PENDING", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];
      const selectOptions = statuses.map(st => `
        <option value="${st}" ${order.status === st ? 'selected' : ''}>${st.replace(/_/g, ' ')}</option>
      `).join("");
      
      return `
        <tr>
          <td style="font-weight: 700;">#${order.id}</td>
          <td>
            <strong>${order.userName}</strong><br>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${order.phone}</span>
          </td>
          <td style="font-size: 0.85rem;">${itemsList}</td>
          <td style="font-weight: 700; color: var(--primary);">$${order.totalAmount.toFixed(2)}</td>
          <td style="font-size: 0.8rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${order.deliveryAddress}">
            ${order.deliveryAddress}
          </td>
          <td>
            <select class="admin-select" onchange="handleAdminStatusChange(${order.id}, this.value)">
              ${selectOptions}
            </select>
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    console.error(err);
  }
}

async function handleAdminStatusChange(orderId, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStatus)
    });
    
    if (!res.ok) throw new Error("Failed to update status");
    
    alert(`Order #${orderId} status advanced to ${newStatus}`);
    fetchAdminOrders();
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}

async function handleAdminAddFood(e) {
  e.preventDefault();
  
  const name = document.getElementById("food-name").value;
  const category = document.getElementById("food-category").value;
  const price = parseFloat(document.getElementById("food-price").value);
  const imageUrl = document.getElementById("food-image").value;
  const isVeg = document.getElementById("food-is-veg").checked;
  const description = document.getElementById("food-desc").value;
  
  const foodData = { name, category, price, imageUrl, isVeg, description };
  
  try {
    const res = await fetch(`${API_BASE}/foods`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(foodData)
    });
    
    if (!res.ok) throw new Error("Failed to add food item");
    
    alert(`🎉 Successfully added "${name}" to the menu!`);
    
    // Reset form
    document.getElementById("admin-add-food-form").reset();
    
    // Refresh local menu list
    fetchMenu();
  } catch (err) {
    alert(`Error: ${err.message}`);
  }
}