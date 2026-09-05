const API_BASE = 'http://localhost:5000';

// App state
let currentUser = null;

// ================= INIT =================
function initApp() {
    // Load user
    const userStr = localStorage.getItem('user');
    if (userStr) {
        currentUser = JSON.parse(userStr);
        updateNavbar();
    }

    // Load City
    const savedCity = localStorage.getItem('userCity') || 'Mumbai';
    const citySelect = document.getElementById('userCity');
    if (citySelect) {
        citySelect.value = savedCity;
    }
}

// ================= UI =================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast') || createToastElement();
    toast.textContent = message;

    if (type === 'error') {
        toast.style.backgroundColor = '#ef4444';
    } else if (type === 'success') {
        toast.style.backgroundColor = '#10b981';
    } else {
        toast.style.backgroundColor = '#1f2937';
    }

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function createToastElement() {
    const toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
    return toast;
}

function updateNavbar() {
    const guestLinks = document.getElementById('guest-links');
    const userLinks = document.getElementById('user-links');
    const userNameSpan = document.getElementById('user-name');

    if (currentUser) {
        if (guestLinks) guestLinks.classList.add('hidden');
        if (userLinks) userLinks.classList.remove('hidden');
        if (userNameSpan) {
            userNameSpan.textContent = currentUser.username;
            userNameSpan.style.cursor = 'pointer';
            userNameSpan.onclick = () => window.location.href = 'profile.html';
        }
    } else {
        if (guestLinks) guestLinks.classList.remove('hidden');
        if (userLinks) userLinks.classList.add('hidden');
    }
}

function logout() {
    localStorage.removeItem('user');
    currentUser = null;
    window.location.href = 'index.html';
}

function logout() {
    localStorage.removeItem('user');
    currentUser = null;
    window.location.href = 'index.html';
}

// ================= LOCATION =================
function changeCity(city) {
    if (city === 'Hyderabad') {
        showToast('Hyderabad: Coming soon to your city!', 'info');
        // We still set it so filtering works if there is some dummy data, 
        // but the message informs the user.
    }
    
    localStorage.setItem('userCity', city);
    showToast(`Location changed to ${city}`, 'success');
    
    // Reload data for the new city
    if (typeof loadProducts === 'function') {
        loadProducts();
    }
}

// ================= API =================
// ================= PRODUCTS =================
async function fetchProducts() {
    try {
        const city = localStorage.getItem('userCity') || 'Mumbai';
        const response = await fetch(`${API_BASE}/products?city=${city}`);
        if (!response.ok) throw new Error('Failed to fetch products');
        return await response.json();
    } catch (error) {
        showToast(error.message, 'error');
        return [];
    }
}

async function showVendorSelection(productId) {
    if (!currentUser) {
        showToast('Please login first', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    const modal = document.getElementById("vendorModal");
    const container = document.getElementById("vendorOptions");
    const nameHeading = document.getElementById("modalProductName");
    const city = localStorage.getItem('userCity') || 'Mumbai';

    modal.style.display = "flex";
    container.innerHTML = "<p>Loading local vendors...</p>";

    try {
        const res = await fetch(`${API_BASE}/products/${productId}/prices?city=${city}`);
        const data = await res.json();
        
        nameHeading.textContent = `Buy ${data.product.name} from:`;
        
        const minPrice = Math.min(...data.vendor_prices.map(v => v.final_price));

        container.innerHTML = "";
        data.vendor_prices.forEach(v => {
            const isCheapest = v.final_price === minPrice;
            const div = document.createElement("div");
            div.className = `vendor-option ${isCheapest ? 'cheapest' : ''}`;
            div.innerHTML = `
                <div style="flex: 1;">
                    <strong>${v.vendor_name}</strong>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">Stock: ${v.stock}</div>
                </div>
                <div style="text-align: right; display: flex; align-items: center; gap: 1rem;">
                    <div class="qty-selector" onclick="event.stopPropagation()">
                        <button onclick="updateModalQty(${v.vendor_product_id}, -1)" class="qty-btn">-</button>
                        <input type="number" id="qty-${v.vendor_product_id}" value="1" min="1" max="${v.stock}" readonly class="qty-input">
                        <button onclick="updateModalQty(${v.vendor_product_id}, 1)" class="qty-btn">+</button>
                    </div>
                    <div style="min-width: 60px;">
                        <div style="font-weight: 700; color: ${isCheapest ? 'var(--secondary)' : 'var(--text-main)'};">₹${v.final_price}</div>
                        ${isCheapest ? '<small style="color: var(--secondary); font-weight: 700;">Cheapest</small>' : ''}
                    </div>
                    <button class="add-btn" onclick="addVendorProductToWishlist(${v.vendor_product_id})">Add</button>
                </div>
            `;
            container.appendChild(div);
        });
    } catch (e) {
        container.innerHTML = "<p>Error loading vendors.</p>";
    }
}

async function addVendorProductToWishlist(vendorProductId) {
    const qtyInput = document.getElementById(`qty-${vendorProductId}`);
    const quantity = qtyInput ? parseInt(qtyInput.value) : 1;

    try {
        const response = await fetch(`${API_BASE}/wishlist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUser.user_id,
                vendor_product_id: vendorProductId,
                quantity: quantity
            })
        });

        const data = await response.json();
        if (response.ok) {
            showToast(data.message, 'success');
            closeVendorModal();
        } else {
            showToast(data.error, 'error');
        }
    } catch {
        showToast('Error adding to wishlist', 'error');
    }
}

function closeVendorModal() {
    document.getElementById("vendorModal").style.display = "none";
}

function updateModalQty(id, delta) {
    const input = document.getElementById(`qty-${id}`);
    if (!input) return;
    let val = parseInt(input.value) + delta;
    const max = parseInt(input.max);
    if (val < 1) val = 1;
    if (val > max) val = max;
    input.value = val;
}

// Globals for Search & Sort
window.allProductsData = [];
window.currentCategory = 'All';

async function loadProducts() {
    window.allProductsData = await fetchProducts();
    renderCategoryTabs();
    filterAndRenderProducts();
}

function setCategory(cat) {
    window.currentCategory = cat;
    renderCategoryTabs(); // re-render to update active styling
    filterAndRenderProducts();
}

function renderCategoryTabs() {
    const tabsContainer = document.getElementById("categoryTabs");
    if (!tabsContainer) return;

    // Build unqiue categories set
    const categories = new Set();
    categories.add('All');
    window.allProductsData.forEach(p => {
        if (p.category) categories.add(p.category);
    });

    tabsContainer.innerHTML = "";
    categories.forEach(cat => {
        const isActive = (cat === window.currentCategory);
        const btn = document.createElement("button");
        btn.textContent = cat;
        btn.onclick = () => setCategory(cat);
        btn.className = `category-pill ${isActive ? 'active' : ''}`;
        tabsContainer.appendChild(btn);
    });
}

function filterAndRenderProducts() {
    const container = document.getElementById("products");
    if (!container) return;
    container.innerHTML = "";

    const searchQuery = (document.getElementById("searchInput")?.value || "").toLowerCase();
    const sortValue = document.getElementById("sortSelect")?.value || "default";

    if (window.allProductsData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📦</div>
                <h3>No Products Available</h3>
                <p>We couldn't find any products in your area right now.</p>
                <button onclick="loadProducts()">🔄 Refresh</button>
            </div>
        `;
        return;
    }

    // Step 1: Group by product_id to find the Cheapest Vendor
    const grouped = {};
    window.allProductsData.forEach(p => {
        if (!grouped[p.product_id]) {
            grouped[p.product_id] = {
                ...p, // copy all properties from the first one we see
                all_vendors: [],
                vendor_map: {}, // tracks unique vendors
                lowest_price: p.price,
                cheapest_vendor: p.vendor_name
            };
        }
        
        // Count only unique vendor names towards the "other vendors available" tag
        if (!grouped[p.product_id].vendor_map[p.vendor_name]) {
            grouped[p.product_id].vendor_map[p.vendor_name] = true;
            grouped[p.product_id].all_vendors.push(p);
        }

        if (p.price < grouped[p.product_id].lowest_price) {
            grouped[p.product_id].lowest_price = p.price;
            grouped[p.product_id].cheapest_vendor = p.vendor_name;
            grouped[p.product_id].price = p.price; // update base price reference
            grouped[p.product_id].vendor_name = p.vendor_name;
            grouped[p.product_id].rating = p.rating; // update to cheapest vendor's rating
            grouped[p.product_id].discount_percentage = p.discount_percentage;
            grouped[p.product_id].final_price = p.final_price;
        }
    });

    let displayProducts = Object.values(grouped);

    // Step 2a: Apply Category Filter
    if (window.currentCategory !== 'All') {
        displayProducts = displayProducts.filter(p => p.category === window.currentCategory);
    }

    // Step 2b: Apply Search Filter
    if (searchQuery) {
        displayProducts = displayProducts.filter(p => p.name.toLowerCase().includes(searchQuery));
    }

    // Step 3: Apply Sorting
    if (sortValue === "price_asc") {
        displayProducts.sort((a, b) => a.lowest_price - b.lowest_price);
    } else if (sortValue === "price_desc") {
        displayProducts.sort((a, b) => b.lowest_price - a.lowest_price);
    } else if (sortValue === "rating_desc") {
        displayProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    if (displayProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <h3>No Results Found</h3>
                <p>Try adjusting your search or filters.</p>
                <button onclick="document.getElementById('searchInput').value=''; filterAndRenderProducts();">Clear Search</button>
            </div>
        `;
        return;
    }

    // Step 4: Render
    displayProducts.forEach(product => {
        let stockClass = "stock-out";
        let stockText = "Out of Stock";
        
        if (product.stock > 10) {
            stockClass = "stock-in";
            stockText = "In Stock";
        } else if (product.stock > 0) {
            stockClass = "stock-low";
            stockText = "Low Stock";
        }
        
        // Rating handling
        const ratingNum = product.rating ? parseFloat(product.rating).toFixed(1) : "New";
        let stars = "No reviews";
        if (product.rating && product.rating > 0) {
            const rounded = Math.round(product.rating);
            stars = "⭐".repeat(rounded) + "☆".repeat(5 - rounded);
        }

        let priceHtml = `<h4>₹${product.lowest_price}</h4>`;
        if (product.discount_percentage > 0) {
            priceHtml = `
            <div class="price-box">
                <span class="original-price">₹${product.price}</span>
                <span class="final-price">₹${product.final_price}</span>
                <span class="discount-badge">${product.discount_percentage}% OFF</span>
            </div>`;
        }

        const vendorCount = product.all_vendors.length;
        const vendorText = vendorCount > 1 
            ? `<span style="font-weight: 600; color: #10b981;">Best Price: ₹${product.lowest_price}</span> by ${product.cheapest_vendor} <br><span style="font-size: 0.8rem;">(${vendorCount - 1} other vendors available)</span>`
            : `Vendor: ${product.vendor_name}`;

        const card = `
            <div class="product-card" style="animation-delay: ${Math.min(displayProducts.indexOf(product) * 0.06, 0.5)}s; padding-top: 1.5rem;">
                <div style="background: var(--gradient-primary); width: 100%; height: 4px; position: absolute; top: 0; left: 0;"></div>
                <h3>${product.name}</h3>

                <p>${product.description || "No description"}</p>

                ${priceHtml}
                
                <p class="best-price-alert">
                    ${vendorText}
                </p>
                
                <p class="${stockClass}" style="margin-bottom: 0.5rem;">${stockText}</p>

                <button onclick="window.location.href='product.html?id=${product.product_id}'">
                    🔍 Compare Prices
                </button>

                <button onclick="showVendorSelection(${product.product_id})">
                    ❤️ Add to Wishlist
                </button>
            </div>
        `;

        container.innerHTML += card;
    });
}

// ================= EXTRA =================
function comparePrices(productName) {
    showToast(`Comparing prices for ${productName}`, 'info');
}

// ================= START =================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Splash Screen Logic
    const splash = document.getElementById('splashScreen');
    if (splash) {
        setTimeout(() => {
            splash.style.opacity = '0';
            splash.style.visibility = 'hidden';
            setTimeout(() => splash.remove(), 500); // Remove from DOM after fade
        }, 1500);
    }

    // 2. Initialize App
    initApp();
    loadProducts(); // 🔥 MOST IMPORTANT
});