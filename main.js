// JavaScript principal pour l'application e-commerce

class ECommerceApp {
  constructor() {
    this.products = [];
    this.filteredProducts = [];
    this.currentPage = 1;
    this.productsPerPage = 12;
    this.categories = [];
    this.cart = this.loadCart();
    this.currentView = 'home';
    this.searchQuery = '';
    this.selectedCategory = '';
    this.sortBy = '';
    
    this.init();
  }

  async init() {
    console.log('Initializing E-Commerce App...');
    
    // Load categories and products
    await this.loadCategories();
    await this.loadProducts();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initialize UI
    this.updateCartUI();
    this.renderFeaturedProducts();
    
    console.log('App initialized successfully');
  }

  setupEventListeners() {
    // Search functionality
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.searchProducts();
      }
    });

    // Filters
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
      this.selectedCategory = e.target.value;
      this.filterAndSortProducts();
      this.currentPage = 1;
      this.renderProducts();
      this.renderPagination();
    });

    document.getElementById('sortFilter').addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.filterAndSortProducts();
      this.currentPage = 1;
      this.renderProducts();
      this.renderPagination();
    });
  }

  async loadCategories() {
    try {
      const response = await fetch('https://dummyjson.com/products/categories');
      const data = await response.json();
      this.categories = data;
      this.renderCategoryFilter();
      console.log('Categories loaded:', this.categories.length);
    } catch (error) {
      console.error('Error loading categories:', error);
      this.showNotification('Erreur lors du chargement des catégories', 'error');
    }
  }

  async loadProducts() {
    try {
      this.showLoading(true);
      const response = await fetch('https://dummyjson.com/products?limit=1000');
      const data = await response.json();
      this.products = data.products;
      this.filteredProducts = [...this.products];
      console.log('Products loaded:', this.products.length);
      this.showLoading(false);
    } catch (error) {
      console.error('Error loading products:', error);
      this.showNotification('Erreur lors du chargement des produits', 'error');
      this.showLoading(false);
    }
  }

  renderCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;

    categoryFilter.innerHTML = '<option value="">Toutes les catégories</option>';
    
    this.categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.slug;
      option.textContent = this.capitalizeFirst(category.name);
      categoryFilter.appendChild(option);
    });
  }

  filterAndSortProducts() {
    let filtered = [...this.products];

    // Apply search filter
    if (this.searchQuery) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(product => 
        product.category === this.selectedCategory
      );
    }

    // Apply sorting
    if (this.sortBy) {
      switch (this.sortBy) {
        case 'title':
          filtered.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'price-asc':
          filtered.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          filtered.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          filtered.sort((a, b) => b.rating - a.rating);
          break;
      }
    }

    this.filteredProducts = filtered;
    this.updateResultsCount();
  }

  updateResultsCount() {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
      resultsCount.textContent = `${this.filteredProducts.length} produit(s) trouvé(s)`;
    }
  }

  renderFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;

    // Get first 8 products as featured
    const featuredProducts = this.products.slice(0, 8);
    
    container.innerHTML = featuredProducts.map(product => 
      this.createProductCard(product)
    ).join('');
  }

  renderProducts() {
    const container = document.getElementById('productsGrid');
    if (!container) return;

    const startIndex = (this.currentPage - 1) * this.productsPerPage;
    const endIndex = startIndex + this.productsPerPage;
    const productsToShow = this.filteredProducts.slice(startIndex, endIndex);

    container.innerHTML = productsToShow.map(product => 
      this.createProductCard(product)
    ).join('');

    // Add fade-in animation
    container.classList.add('fade-in');
  }

  createProductCard(product) {
    const stars = this.generateStars(product.rating);
    const discountBadge = product.discountPercentage > 0 ? 
      `<div class="position-absolute top-0 end-0 m-2">
        <span class="badge bg-danger">-${Math.round(product.discountPercentage)}%</span>
      </div>` : '';

    return `
      <div class="col-lg-3 col-md-4 col-sm-6">
        <div class="product-card">
          ${discountBadge}
          <img src="${product.thumbnail}" class="card-img-top" alt="${product.title}" loading="lazy">
          <div class="card-body">
            <h5 class="product-title">${product.title}</h5>
            <div class="product-price">€${product.price.toFixed(2)}</div>
            <div class="product-rating">
              <div class="stars">${stars}</div>
              <small class="rating-text">(${product.rating}/5)</small>
            </div>
            <p class="product-description">${product.description}</p>
            <div class="d-flex gap-2 mt-auto">
              <button class="btn btn-primary flex-fill" onclick="app.addToCart(${product.id})">
                <i class="bi bi-cart-plus me-1"></i>Ajouter
              </button>
              <button class="btn btn-outline-primary" onclick="app.viewProductDetail(${product.id})">
                <i class="bi bi-eye"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderPagination() {
    const container = document.getElementById('pagination');
    if (!container) return;

    const totalPages = Math.ceil(this.filteredProducts.length / this.productsPerPage);
    
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let paginationHTML = '';

    // Previous button
    paginationHTML += `
      <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="app.changePage(${this.currentPage - 1})">
          <i class="bi bi-chevron-left"></i>
        </a>
      </li>
    `;

    // Page numbers
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(totalPages, this.currentPage + 2);

    if (startPage > 1) {
      paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="app.changePage(1)">1</a></li>`;
      if (startPage > 2) {
        paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
        <li class="page-item ${i === this.currentPage ? 'active' : ''}">
          <a class="page-link" href="#" onclick="app.changePage(${i})">${i}</a>
        </li>
      `;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      }
      paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="app.changePage(${totalPages})">${totalPages}</a></li>`;
    }

    // Next button
    paginationHTML += `
      <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="app.changePage(${this.currentPage + 1})">
          <i class="bi bi-chevron-right"></i>
        </a>
      </li>
    `;

    container.innerHTML = paginationHTML;
  }

  changePage(page) {
    const totalPages = Math.ceil(this.filteredProducts.length / this.productsPerPage);
    
    if (page < 1 || page > totalPages) return;
    
    this.currentPage = page;
    this.renderProducts();
    this.renderPagination();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async viewProductDetail(productId) {
    try {
      this.showLoading(true);
      const response = await fetch(`https://dummyjson.com/products/${productId}`);
      const product = await response.json();
      
      this.renderProductDetail(product);
      this.showPage('productDetailPage');
      this.showLoading(false);
    } catch (error) {
      console.error('Error loading product detail:', error);
      this.showNotification('Erreur lors du chargement du produit', 'error');
      this.showLoading(false);
    }
  }

  renderProductDetail(product) {
    const container = document.getElementById('productDetail');
    if (!container) return;

    const stars = this.generateStars(product.rating);
    const images = product.images || [product.thumbnail];

    container.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <div id="productCarousel" class="carousel slide" data-bs-ride="carousel">
            <div class="carousel-inner">
              ${images.map((image, index) => `
                <div class="carousel-item ${index === 0 ? 'active' : ''}">
                  <img src="${image}" class="d-block w-100 product-detail-img" alt="${product.title}">
                </div>
              `).join('')}
            </div>
            ${images.length > 1 ? `
              <button class="carousel-control-prev" type="button" data-bs-target="#productCarousel" data-bs-slide="prev">
                <span class="carousel-control-prev-icon"></span>
              </button>
              <button class="carousel-control-next" type="button" data-bs-target="#productCarousel" data-bs-slide="next">
                <span class="carousel-control-next-icon"></span>
              </button>
            ` : ''}
          </div>
        </div>
        <div class="col-md-6">
          <div class="product-detail-info">
            <h1 class="h2 mb-3">${product.title}</h1>
            <div class="product-detail-price">€${product.price.toFixed(2)}</div>
            <div class="product-detail-rating">
              <div class="stars me-2">${stars}</div>
              <span class="rating-text">(${product.rating}/5 - ${product.reviews?.length || 0} avis)</span>
            </div>
            <p class="product-detail-description">${product.description}</p>
            
            <div class="mb-3">
              <strong>Catégorie:</strong> <span class="badge bg-secondary">${this.capitalizeFirst(product.category)}</span>
            </div>
            
            <div class="mb-3">
              <strong>Marque:</strong> ${product.brand || 'Non spécifiée'}
            </div>
            
            <div class="mb-3">
              <strong>Stock:</strong> 
              <span class="badge ${product.stock > 10 ? 'bg-success' : product.stock > 0 ? 'bg-warning' : 'bg-danger'}">
                ${product.stock > 0 ? `${product.stock} disponible(s)` : 'Rupture de stock'}
              </span>
            </div>
            
            <div class="product-detail-actions">
              <button class="btn btn-primary btn-lg" onclick="app.addToCart(${product.id})" ${product.stock === 0 ? 'disabled' : ''}>
                <i class="bi bi-cart-plus me-2"></i>Ajouter au panier
              </button>
              <button class="btn btn-outline-primary btn-lg" onclick="app.addToWishlist(${product.id})">
                <i class="bi bi-heart me-2"></i>Favoris
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Navigation functions
  navigateToHome() {
    this.showPage('homePage');
    this.currentView = 'home';
  }

  navigateToProducts() {
    this.currentView = 'products';
    this.filterAndSortProducts();
    this.renderProducts();
    this.renderPagination();
    this.showPage('productsPage');
  }

  showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
      page.classList.add('d-none');
    });
    
    // Show requested page
    const page = document.getElementById(pageId);
    if (page) {
      page.classList.remove('d-none');
      page.classList.add('fade-in');
    }
  }

  goBack() {
    if (this.currentView === 'products') {
      this.navigateToProducts();
    } else {
      this.navigateToHome();
    }
  }

  searchProducts() {
    const searchInput = document.getElementById('searchInput');
    this.searchQuery = searchInput.value.trim();
    
    if (this.currentView !== 'products') {
      this.navigateToProducts();
    } else {
      this.filterAndSortProducts();
      this.currentPage = 1;
      this.renderProducts();
      this.renderPagination();
    }
  }

  // Cart functionality
  addToCart(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = this.cart.find(item => item.id === productId);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.cart.push({
        id: product.id,
        title: product.title,
        price: product.price,
        thumbnail: product.thumbnail,
        quantity: 1
      });
    }

    this.saveCart();
    this.updateCartUI();
    this.showNotification(`${product.title} ajouté au panier`, 'success');
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.id !== productId);
    this.saveCart();
    this.updateCartUI();
    this.renderCartItems();
  }

  updateCartQuantity(productId, change) {
    const item = this.cart.find(item => item.id === productId);
    if (!item) return;

    item.quantity += change;
    
    if (item.quantity <= 0) {
      this.removeFromCart(productId);
    } else {
      this.saveCart();
      this.updateCartUI();
      this.renderCartItems();
    }
  }

  updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');
    
    const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (cartCount) cartCount.textContent = totalItems;
    if (cartTotal) cartTotal.textContent = `${totalPrice.toFixed(2)} €`;
  }

  renderCartItems() {
    const container = document.getElementById('cartItems');
    if (!container) return;

    if (this.cart.length === 0) {
      container.innerHTML = `
        <div class="empty-cart">
          <i class="bi bi-cart-x d-block"></i>
          <p>Votre panier est vide</p>
          <button class="btn btn-primary" onclick="app.navigateToProducts(); app.toggleCart();">
            Continuer les achats
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = this.cart.map(item => `
      <div class="cart-item">
        <img src="${item.thumbnail}" alt="${item.title}">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.title}</div>
          <div class="cart-item-price">€${item.price.toFixed(2)}</div>
          <div class="quantity-controls">
            <button class="quantity-btn" onclick="app.updateCartQuantity(${item.id}, -1)">
              <i class="bi bi-dash"></i>
            </button>
            <span class="quantity-display">${item.quantity}</span>
            <button class="quantity-btn" onclick="app.updateCartQuantity(${item.id}, 1)">
              <i class="bi bi-plus"></i>
            </button>
          </div>
        </div>
        <button class="btn btn-sm btn-outline-danger" onclick="app.removeFromCart(${item.id})">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    `).join('');
  }

  toggleCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    
    if (sidebar && overlay) {
      sidebar.classList.toggle('active');
      overlay.classList.toggle('active');
      
      if (sidebar.classList.contains('active')) {
        this.renderCartItems();
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }

  checkout() {
    if (this.cart.length === 0) {
      this.showNotification('Votre panier est vide', 'error');
      return;
    }

    // Simulate checkout process
    const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (confirm(`Confirmer la commande de ${total.toFixed(2)} € ?`)) {
      this.cart = [];
      this.saveCart();
      this.updateCartUI();
      this.toggleCart();
      this.showNotification('Commande confirmée ! Merci pour votre achat.', 'success');
    }
  }

  // Local storage functions
  saveCart() {
    localStorage.setItem('ecommerce_cart', JSON.stringify(this.cart));
  }

  loadCart() {
    try {
      const saved = localStorage.getItem('ecommerce_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading cart:', error);
      return [];
    }
  }

  // Utility functions
  generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + 
           (hasHalfStar ? '☆' : '') + 
           '☆'.repeat(emptyStars);
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
      spinner.classList.toggle('d-none', !show);
    }
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="d-flex align-items-center">
        <i class="bi ${type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-2"></i>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Hide and remove notification
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  addToWishlist(productId) {
    // Placeholder for wishlist functionality
    this.showNotification('Fonctionnalité bientôt disponible', 'success');
  }
}

// Global navigation functions (for onclick handlers)
function navigateToHome() {
  app.navigateToHome();
}

function navigateToProducts() {
  app.navigateToProducts();
}

function toggleCart() {
  app.toggleCart();
}

function searchProducts() {
  app.searchProducts();
}

function goBack() {
  app.goBack();
}

function checkout() {
  app.checkout();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new ECommerceApp();
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && window.app) {
    window.app.updateCartUI();
  }
});
