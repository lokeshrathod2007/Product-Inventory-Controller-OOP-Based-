class Product {
  constructor(productId, name, price, stockQuantity) {
    this.productId     = productId;
    this.name          = name;
    this.price         = price;
    this.stockQuantity = stockQuantity;
  }

  // Increase or decrease stock — prevents negative values
  updateStock(quantity) {
    const newStock = this.stockQuantity + quantity;
    if (newStock < 0) {
      return { success: false, message: `Cannot reduce stock below 0. Current stock: ${this.stockQuantity}` };
    }
    this.stockQuantity = newStock;
    return { success: true, message: `Stock updated to ${this.stockQuantity}` };
  }

  // Update product price — must be positive
  updatePrice(newPrice) {
    if (newPrice <= 0) return { success: false, message: "Price must be greater than 0." };
    this.price = parseFloat(newPrice.toFixed(2));
    return { success: true, message: `Price updated to ₹${this.price}` };
  }

  // Returns true if stock is below threshold
  isLowStock(threshold) {
    return this.stockQuantity < threshold;
  }
}


class InventoryManager {
  constructor() {
    this.products = [];
  }

  addProduct(productId, name, price, stockQuantity) {
    if (this.products.find(p => p.productId === productId))
      return { success: false, message: `Product ID "${productId}" already exists.` };
    if (!productId || !name)
      return { success: false, message: "Product ID and Name are required." };
    if (price <= 0 || isNaN(price))
      return { success: false, message: "Price must be a positive number." };
    if (stockQuantity < 0 || isNaN(stockQuantity))
      return { success: false, message: "Stock cannot be negative." };

    const product = new Product(productId, name, price, stockQuantity);
    this.products.push(product);
    return { success: true, message: `✅ Product "${name}" added successfully!` };
  }

  findById(id) {
    return this.products.find(p => p.productId.toLowerCase() === id.toLowerCase());
  }

  findByName(name) {
    return this.products.find(p => p.name.toLowerCase().includes(name.toLowerCase()));
  }

  findProduct(query) {
    return this.findById(query) || this.findByName(query);
  }

  // Bulk price update — formula: newPrice = price + (price * percent / 100)
  bulkPriceUpdate(percent) {
    if (isNaN(percent)) return { success: false, message: "Please enter a valid percentage." };
    if (this.products.length === 0) return { success: false, message: "No products in inventory." };
    this.products.forEach(p => p.updatePrice(p.price + (p.price * percent / 100)));
    const dir = percent >= 0 ? `increased by ${percent}%` : `decreased by ${Math.abs(percent)}%`;
    return { success: true, message: `💰 All prices ${dir} successfully!` };
  }

  // ✅ NEW: Bulk stock update — applies same qty change to ALL products
  bulkStockUpdate(quantity) {
    if (this.products.length === 0) return { success: false, message: "No products in inventory." };
    if (isNaN(quantity)) return { success: false, message: "Please enter a valid quantity." };
    // Safety check — make sure no product goes below 0
    if (this.products.some(p => p.stockQuantity + quantity < 0))
      return { success: false, message: "Some products would go below 0. Use a smaller value." };
    this.products.forEach(p => p.updateStock(quantity));
    const dir = quantity >= 0 ? `increased by ${quantity}` : `decreased by ${Math.abs(quantity)}`;
    return { success: true, message: `📦 All stock ${dir} successfully!` };
  }

  getLowStockProducts(threshold) {
    return this.products.filter(p => p.isLowStock(threshold));
  }

  getAllProducts() { return this.products; }

  searchProducts(query) {
    const q = query.toLowerCase();
    return this.products.filter(p =>
      p.productId.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
    );
  }
}


// ============================================================
//  INIT
// ============================================================
const inventory = new InventoryManager();

function showMessage(id, msg, type = 'success') {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = `msg ${type}`;
  setTimeout(() => { el.textContent = ''; el.className = 'msg'; }, 4000);
}

function handleAddProduct() {
  const id    = document.getElementById('prod-id').value.trim();
  const name  = document.getElementById('prod-name').value.trim();
  const price = parseFloat(document.getElementById('prod-price').value);
  const stock = parseInt(document.getElementById('prod-stock').value);
  const result = inventory.addProduct(id, name, price, stock);
  if (result.success) {
    showMessage('add-msg', result.message, 'success');
    ['prod-id','prod-name','prod-price','prod-stock'].forEach(i => document.getElementById(i).value = '');
    renderTable();
  } else {
    showMessage('add-msg', '❌ ' + result.message, 'error');
  }
}

function handleUpdateStock() {
  const query  = document.getElementById('stock-search').value.trim();
  const change = parseInt(document.getElementById('stock-change').value);
  if (!query) return showMessage('stock-msg', '❌ Enter a Product ID or Name.', 'error');
  if (isNaN(change)) return showMessage('stock-msg', '❌ Enter a valid quantity.', 'error');
  const product = inventory.findProduct(query);
  if (!product) return showMessage('stock-msg', `❌ Product "${query}" not found.`, 'error');
  const result = product.updateStock(change);
  if (result.success) {
    showMessage('stock-msg', `✅ "${product.name}" — ${result.message}`, 'success');
    document.getElementById('stock-search').value = '';
    document.getElementById('stock-change').value = '';
    renderTable();
  } else {
    showMessage('stock-msg', '❌ ' + result.message, 'error');
  }
}

function handleBulkPrice() {
  const percent = parseFloat(document.getElementById('price-percent').value);
  const result  = inventory.bulkPriceUpdate(percent);
  if (result.success) {
    showMessage('price-msg', result.message, 'success');
    document.getElementById('price-percent').value = '';
    renderTable();
  } else {
    showMessage('price-msg', '❌ ' + result.message, 'error');
  }
}

// ✅ NEW: Handler for bulk stock update button
function handleBulkStock() {
  const quantity = parseInt(document.getElementById('bulk-stock-qty').value);
  const result   = inventory.bulkStockUpdate(quantity);
  if (result.success) {
    showMessage('bulk-stock-msg', result.message, 'success');
    document.getElementById('bulk-stock-qty').value = '';
    renderTable();
  } else {
    showMessage('bulk-stock-msg', '❌ ' + result.message, 'error');
  }
}

function handleLowStock() {
  const threshold = parseInt(document.getElementById('threshold').value);
  if (isNaN(threshold) || threshold < 0) return showMessage('lowstock-msg', '❌ Enter a valid threshold.', 'error');
  const lowItems = inventory.getLowStockProducts(threshold);
  const listEl   = document.getElementById('lowstock-list');
  listEl.innerHTML = '';
  if (lowItems.length === 0) {
    showMessage('lowstock-msg', `✅ All products above threshold of ${threshold}. No alerts!`, 'success');
    return;
  }
  showMessage('lowstock-msg', `⚠️ ${lowItems.length} product(s) below threshold of ${threshold}:`, 'error');
  lowItems.forEach(p => {
    const card = document.createElement('div');
    card.className = 'alert-card';
    card.innerHTML = `<strong>⚠️ ${p.name}</strong>ID: ${p.productId} &nbsp;|&nbsp; Stock: ${p.stockQuantity} &nbsp;|&nbsp; Price: ₹${p.price.toFixed(2)}`;
    listEl.appendChild(card);
  });
  renderTable(threshold);
}

function handleSearch() {
  const query = document.getElementById('search-input').value.trim();
  const threshold = parseInt(document.getElementById('threshold').value) || 10;
  const results = query ? inventory.searchProducts(query) : inventory.getAllProducts();
  renderTable(threshold, results);
}

function renderTable(threshold = 10, productsToShow = null) {
  const container = document.getElementById('table-container');
  const products  = productsToShow || inventory.getAllProducts();
  if (products.length === 0) {
    container.innerHTML = '<p class="empty-msg">No products found.</p>';
    return;
  }
  let html = `<table><thead><tr>
    <th>Product ID</th><th>Name</th><th>Price (₹)</th><th>Stock</th><th>Status</th>
  </tr></thead><tbody>`;
  products.forEach(p => {
    const isLow = p.isLowStock(threshold);
    html += `<tr class="${isLow ? 'low-stock' : ''}">
      <td data-label="Product ID">${p.productId}</td>
      <td data-label="Name">${p.name}</td>
      <td data-label="Price">₹${p.price.toFixed(2)}</td>
      <td data-label="Stock">${p.stockQuantity}</td>
      <td data-label="Status"><span class="badge ${isLow ? 'badge-low' : 'badge-ok'}">${isLow ? 'Low Stock' : 'In Stock'}</span></td>
    </tr>`;
  });
  html += `</tbody></table>`;
  container.innerHTML = html;
}

// Sample data preloaded
(function() {
  inventory.addProduct('P001', 'Laptop', 45000, 25);
  inventory.addProduct('P002', 'Wireless Mouse', 850, 8);
  inventory.addProduct('P003', 'USB-C Hub', 1200, 3);
  inventory.addProduct('P004', 'Mechanical Keyboard', 3500, 15);
  inventory.addProduct('P005', 'Webcam HD', 2200, 6);
  renderTable(10);
})();