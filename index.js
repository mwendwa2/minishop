let products = [];
let logs = [[]];
let currentLogIndex = 0;
let totalSales = 0;
let totalProfit = 0;
let editIndex = -1;
let editProductId = -1;
let salesChart, profitChart;

document.addEventListener('DOMContentLoaded', () => {
    showSection('sales-tracker');
    fetchProductsFromServer();
    fetchSalesFromServer();
});

function showSection(section) {
    const sections = document.querySelectorAll('.content');
    sections.forEach(sec => sec.style.display = 'none');
    document.getElementById(section).style.display = 'block';
    if (section === 'analytics-dashboard') {
        renderCharts();
    }
}

function showNotification(type, text) {
    new Noty({
        type,
        text: `<i class="check icon"></i> ${text}`,
        layout: "bottomRight",
        timeout: 2000,
        progressBar: true,
        closeWith: ["click"],
        theme: "metroui",
    }).show();
}

function addSale() {
    const productSelect = document.getElementById('product');
    const quantityInput = document.getElementById('quantity');
    const selectedProductId = productSelect.value;
    const quantitySold = parseInt(quantityInput.value);
    const product = products.find(p => p.id == selectedProductId);

    if (!product || isNaN(quantitySold) || quantitySold <= 0) {
        alert("Please fill out all fields with valid values.");
        return;
    }

    if (quantitySold > product.quantity) {
        alert("Insufficient quantity for the selected product.");
        return;
    }

    const sale = {
        product: product.name,
        quantity: quantitySold,
        price: product.sellingPrice,
        total: product.sellingPrice * quantitySold,
        profit: (product.sellingPrice - product.buyingPrice) * quantitySold
    };

    if (editIndex >= 0) {
        const oldSale = logs[currentLogIndex][editIndex];
        totalSales -= oldSale.total;
        totalProfit -= oldSale.profit;

        // Return old sale quantity to the product inventory
        const oldProduct = products.find(p => p.name === oldSale.product);
        if (oldProduct) {
            oldProduct.quantity += oldSale.quantity;
        }

        logs[currentLogIndex][editIndex] = sale;
        editIndex = -1;
    } else {
        logs[currentLogIndex].push(sale);
    }

    // Subtract the new sale quantity from the product inventory
    product.quantity -= quantitySold;

    totalSales += sale.total;
    totalProfit += sale.profit;

    if (product.quantity === 0) {
        showNotification('warning', `Product ${product.name} is out of stock!`);
    }

    updateLog();
    updateTotals();
    quantityInput.value = '';
    renderCharts();
}

function editSale(index) {
    const sale = logs[currentLogIndex][index];
    const productSelect = document.getElementById('product');
    const quantityInput = document.getElementById('quantity');

    const product = products.find(p => p.name === sale.product);
    if (product) {
        productSelect.value = product.id;
        quantityInput.value = sale.quantity;
    }

    // Return the old sale quantity to the product inventory
    const oldProduct = products.find(p => p.name === sale.product);
    if (oldProduct) {
        oldProduct.quantity += sale.quantity;
    }

    editIndex = index;
}

function deleteSale(index) {
    const sale = logs[currentLogIndex].splice(index, 1)[0];
    totalSales -= sale.total;
    totalProfit -= sale.profit;

    // Return the old sale quantity to the product inventory
    const product = products.find(p => p.name === sale.product);
    if (product) {
        product.quantity += sale.quantity;
    }

    showNotification('error', 'Sale was successfully deleted');
    updateLog();
    updateTotals();
    renderCharts();
}


function addProduct() {
    const nameInput = document.getElementById('sidebar-product');
    const buyingPriceInput = document.getElementById('buying-price');
    const sellingPriceInput = document.getElementById('selling-price');
    const initialQuantityInput = document.getElementById('initial-quantity');

    const name = nameInput.value;
    const buyingPrice = parseFloat(buyingPriceInput.value);
    const sellingPrice = parseFloat(sellingPriceInput.value);
    const initialQuantity = parseInt(initialQuantityInput.value);

    if (!name || isNaN(buyingPrice) || isNaN(sellingPrice) || isNaN(initialQuantity)) {
        alert("Please fill out all fields with valid values.");
        return;
    }

    const existingProduct = products.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (existingProduct) {
        alert("Product with the same name already exists. Please choose a different name.");
        return;
    }

    const product = {
        id: products.length,
        name,
        buyingPrice,
        sellingPrice,
        quantity: initialQuantity
    };

    products.push(product);
    nameInput.value = '';
    buyingPriceInput.value = '';
    sellingPriceInput.value = '';
    initialQuantityInput.value = '';
    showNotification('success', 'Product was successfully added');
    updateProductList();
    updateProductDropdown();
}

function editProduct(productId) {
    const product = products.find(p => p.id == productId);
    if (!product) {
        alert("Product not found.");
        return;
    }

    document.getElementById('sidebar-product').value = product.name;
    document.getElementById('buying-price').value = product.buyingPrice;
    document.getElementById('selling-price').value = product.sellingPrice;
    document.getElementById('initial-quantity').value = product.quantity;

    editProductId = productId;
    document.getElementById('add-product-btn').style.display = 'none';
    document.getElementById('update-product-btn').style.display = 'block';
    document.getElementById('cancel-edit-btn').style.display = 'block';
}

function updateProduct() {
    const nameInput = document.getElementById('sidebar-product');
    const buyingPriceInput = document.getElementById('buying-price');
    const sellingPriceInput = document.getElementById('selling-price');
    const initialQuantityInput = document.getElementById('initial-quantity');

    const name = nameInput.value;
    const buyingPrice = parseFloat(buyingPriceInput.value);
    const sellingPrice = parseFloat(sellingPriceInput.value);
    const initialQuantity = parseInt(initialQuantityInput.value);

    if (!name || isNaN(buyingPrice) || isNaN(sellingPrice) || isNaN(initialQuantity)) {
        alert("Please fill out all fields with valid values.");
        return;
    }

    const product = products.find(p => p.id == editProductId);
    if (!product) {
        alert("Product not found.");
        return;
    }

    product.name = name;
    product.buyingPrice = buyingPrice;
    product.sellingPrice = sellingPrice;
    product.quantity = initialQuantity;

    nameInput.value = '';
    buyingPriceInput.value = '';
    sellingPriceInput.value = '';
    initialQuantityInput.value = '';

    editProductId = -1;
    document.getElementById('add-product-btn').style.display = 'block';
    document.getElementById('update-product-btn').style.display = 'none';
    document.getElementById('cancel-edit-btn').style.display = 'none';

    showNotification('success', 'Product was successfully updated');
    updateProductList();
    updateProductDropdown();
    updateLog();
    renderCharts();
}

function cancelEdit() {
    document.getElementById('sidebar-product').value = '';
    document.getElementById('buying-price').value = '';
    document.getElementById('selling-price').value = '';
    document.getElementById('initial-quantity').value = '';

    editProductId = -1;
    document.getElementById('add-product-btn').style.display = 'block';
    document.getElementById('update-product-btn').style.display = 'none';
    document.getElementById('cancel-edit-btn').style.display = 'none';
}

function deleteProduct(productId) {
    const index = products.findIndex(p => p.id == productId);
    if (index === -1) {
        alert("Product not found.");
        return;
    }

    const confirmDelete = confirm("Are you sure you want to delete this product?");
    if (confirmDelete) {
        products.splice(index, 1);
        showNotification('error', 'Product was successfully deleted');
        updateProductList();
        updateProductDropdown();
        updateLog();
        renderCharts();
    }
}

function updateProductList() {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';
    products.forEach((product) => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${product.name} - Buying Price: ${product.buyingPrice} KSH, Selling Price: ${product.sellingPrice} KSH, Quantity: ${product.quantity}
            <div class="actions">
                <button class="edit" onclick="editProduct(${product.id})">Edit</button>
                <button class="delete" onclick="deleteProduct(${product.id})">Delete</button>
            </div>
        `;
        productList.appendChild(li);
    });
}

function updateProductDropdown() {
    const productDropdown = document.getElementById('product');
    productDropdown.innerHTML = '';
    products.sort((a, b) => a.name.localeCompare(b.name));
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        productDropdown.appendChild(option);
    });
}

function updateLog() {
    const logList = document.getElementById('log');
    logList.innerHTML = '';
    logs[currentLogIndex].forEach((sale, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${sale.product} - Quantity: ${sale.quantity}, Total: ${sale.total} KSH, Profit: ${sale.profit} KSH
            <div class="actions">
                <button class="edit" onclick="editSale(${index})">Edit</button>
                <button class="delete" onclick="deleteSale(${index})">Delete</button>
            </div>
        `;
        logList.appendChild(li);
    });
}

function updateTotals() {
    document.getElementById('total-sales').textContent = totalSales;
    document.getElementById('total-profit').textContent = totalProfit;
}

function createNewLog() {
    logs.push([]);
    currentLogIndex = logs.length - 1;
    updateLogSelector();
    updateLog();
    renderCharts();
}

function switchLog() {
    currentLogIndex = document.getElementById('log-selector').value;
    updateLog();
    renderCharts();
}

function updateLogSelector() {
    const logSelector = document.getElementById('log-selector');
    logSelector.innerHTML = '';
    logs.forEach((log, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `Log ${index + 1}`;
        logSelector.appendChild(option);
    });
    logSelector.value = currentLogIndex;
}

function searchProducts() {
    const searchTerm = document.getElementById('product-search').value.toLowerCase();
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';
    products.filter(product => product.name.toLowerCase().includes(searchTerm))
        .forEach((product) => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${product.name} - Buying Price: ${product.buyingPrice} KSH, Selling Price: ${product.sellingPrice} KSH, Quantity: ${product.quantity}
                <div class="actions">
                    <button class="edit" onclick="editProduct(${product.id})">Edit</button>
                    <button class="delete" onclick="deleteProduct(${product.id})">Delete</button>
                </div>
            `;
            productList.appendChild(li);
        });
}

function renderCharts() {
    const salesData = logs[currentLogIndex].map(sale => sale.total);
    const profitData = logs[currentLogIndex].map(sale => sale.profit);
    const labels = logs[currentLogIndex].map(sale => sale.product); // Use product names as labels

    if (salesChart) {
        salesChart.destroy();
    }
    const salesCtx = document.getElementById('sales-chart').getContext('2d');
    salesChart = new Chart(salesCtx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Sales',
                data: salesData,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: false
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Products' // Update x-axis label
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Amount in KSH'
                    }
                }
            }
        }
    });

    if (profitChart) {
        profitChart.destroy();
    }
    const profitCtx = document.getElementById('profit-chart').getContext('2d');
    profitChart = new Chart(profitCtx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Profit',
                data: profitData,
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1,
                fill: false
            }]
        },
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Products' // Update x-axis label
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Amount in KSH'
                    }
                }
            }
        }
    });
}


async function fetchSalesFromServer() {
    try {
        const response = await fetch('http://localhost:3000/sales');
        if (!response.ok) {
            throw new Error('Failed to fetch sales');
        }
        const salesFromServer = await response.json();
        logs = salesFromServer;
        updateLog();
    } catch (error) {
        console.error('Error fetching sales:', error);
    }
}

async function fetchProductsFromServer() {
    try {
        const response = await fetch('http://localhost:3000/products');
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        products = await response.json();
        updateProductList();
        updateProductDropdown();
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}