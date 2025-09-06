// Global variables
let inventory = JSON.parse(localStorage.getItem('jewelryInventory')) || [];
let sales = JSON.parse(localStorage.getItem('jewelrySales')) || [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    updateHomeStats();
    displayInventory();
    displaySales();
});

// Initialize application
function initializeApp() {
    // Set default date for sale form
    document.getElementById('saleDate').value = new Date().toISOString().split('T')[0];
    const saleDateInput = document.getElementById('saleDate');
    if (saleDateInput) saleDateInput.value = new Date().toISOString().split('T')[0];
    
    // Load initial data
    loadInventory();
    loadSales();
    
    // Update all dropdown texts to show current state
    updateAllDropdownTexts();
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            showPage(page);
        });
    });
    
    // Close modals when clicking outside
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            showPage(page);
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (e.target === modal) closeModal(modal.id);
        });
    });
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// Navigation functions
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(pageName).classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
    
    // Update page-specific content
    if (pageName === 'inventory') {
        displayInventory();
    } else if (pageName === 'sales') {
        displaySales();
    } else if (pageName === 'home') {
        updateHomeStats();
    }
}

// Modal functions
function showAddItemModal() {
    document.getElementById('addItemModal').style.display = 'block';
    document.getElementById('addItemForm').reset();
    
    // Reset modal title to "Add New Item"
    const modalTitle = document.querySelector('#addItemModal .modal-header h2');
    modalTitle.textContent = 'Add New Item';
    
    // Reset modal header color to default
    const modalHeader = document.querySelector('#addItemModal .modal-header');
    modalHeader.style.background = 'linear-gradient(135deg, rgb(46, 13, 32) 0%, rgb(60, 20, 40) 50%, rgb(46, 13, 32) 100%)';
    
    // Reset button text
    const submitButton = document.querySelector('#addItemModal .btn-primary');
    submitButton.textContent = 'Add Item';
    
    // Reset form submit handler to add new item
    const form = document.getElementById('addItemForm');
    form.onsubmit = function(e) {
        e.preventDefault();
        addItem(e);
    };
}

function showRecordSaleModal() {
    document.getElementById('recordSaleModal').style.display = 'block';
    document.getElementById('recordSaleForm').reset();
    document.getElementById('saleDate').value = new Date().toISOString().split('T')[0];
    updateSaleItemOptions();
    
    // Reset modal title to "Record Sale"
    const modalTitle = document.querySelector('#recordSaleModal .modal-header h2');
    modalTitle.textContent = 'Record Sale';
    
    // Reset modal header color to default
    const modalHeader = document.querySelector('#recordSaleModal .modal-header');
    modalHeader.style.background = 'linear-gradient(135deg, rgb(46, 13, 32) 0%, rgb(60, 20, 40) 50%, rgb(46, 13, 32) 100%)';
    
    // Reset button text
    const submitButton = document.querySelector('#recordSaleModal .btn-primary');
    submitButton.textContent = 'Record Sale';
    
    // Reset form submit handler to record new sale
    const form = document.getElementById('recordSaleForm');
    form.onsubmit = function(e) {
        e.preventDefault();
        recordSale(e);
    };
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Inventory management
function addItem(event) {
    event.preventDefault();
    const itemType = document.getElementById('itemType').value;
    const itemModel = document.getElementById('itemModel').value;
    const itemWeight = parseFloat(document.getElementById('itemWeight').value);
    const itemUnits = parseInt(document.getElementById('itemUnits').value);
    const itemCostPrice = parseFloat(document.getElementById('itemCostPrice').value);
    const itemDatePurchased = document.getElementById('itemDatePurchased')?.value || new Date().toISOString().split('T')[0];
    // Create new item
    const newItem = {
        id: Date.now(),
        type: itemType,
        model: itemModel,
        weight: itemWeight,
        units: itemUnits,
        costPrice: itemCostPrice,
        datePurchased: itemDatePurchased
    };
    
    // Add to inventory
    inventory.push(newItem);
    saveInventory();
    
    // Close modal and refresh display
    closeModal('addItemModal');
    displayInventory();
    updateHomeStats();
    updateAllDropdownTexts();
    
    showMessage('Item added and saved automatically!', 'success');
}

function displayInventory(providedFilteredInventory = null) {
    const inventoryGrid = document.getElementById('inventoryGrid');
    if (!inventoryGrid) {
        return;
    }
    let filteredInventory = providedFilteredInventory;
    if (!filteredInventory) {
        const selectedCategories = getSelectedValues('inventoryCategoryFilter');
        const selectedCostRanges = getSelectedValues('inventoryCostPriceFilter');
        const dateStart = document.getElementById('inventoryDateStartFilter')?.value;
        const dateEnd = document.getElementById('inventoryDateEndFilter')?.value;
        filteredInventory = [...inventory];
        // Date range filter
        if (dateStart || dateEnd) {
            filteredInventory = filteredInventory.filter(item => {
                const itemDate = item.datePurchased || item.dateAdded;
                if (!itemDate) return true;
                if (dateStart && itemDate < dateStart) return false;
                if (dateEnd && itemDate > dateEnd) return false;
                return true;
            });
        }
        // Category filter
        if (selectedCategories.length > 0) {
            filteredInventory = filteredInventory.filter(item => {
                const itemType = item.type || '';
                return selectedCategories.some(selectedType => itemType === selectedType);
            });
        }
        // Cost price filter
        if (selectedCostRanges.length > 0) {
            filteredInventory = filteredInventory.filter(item => {
                const costPrice = item.costPrice || item.price || 0;
                return selectedCostRanges.some(range => {
                    switch(range) {
                        case '0-50': return costPrice >= 0 && costPrice <= 50;
                        case '50-100': return costPrice > 50 && costPrice <= 100;
                        case '100-200': return costPrice > 100 && costPrice <= 200;
                        case '200-500': return costPrice > 200 && costPrice <= 500;
                        case '500+': return costPrice > 500;
                        default: return true;
                    }
                });
            });
        }
    }
    if (filteredInventory.length === 0) {
        let hasFilters = false;
        try {
            const selectedCategories = getSelectedValues('inventoryCategoryFilter');
            const selectedCostRanges = getSelectedValues('inventoryCostPriceFilter');
            hasFilters = selectedCategories.length > 0 || selectedCostRanges.length > 0;
        } catch (e) {
            hasFilters = false;
        }
        inventoryGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h3>No records found</h3>
                <p>${hasFilters ? 'No records match the selected filters.' : 'Add your first item to get started!'}</p>
            </div>
        `;
        return;
    }
    // Group by type
    const groupedInventory = {};
    filteredInventory.forEach(item => {
        if (!groupedInventory[item.type]) {
            groupedInventory[item.type] = [];
        }
        groupedInventory[item.type].push(item);
    });
    // Display inventory
    let html = '';
    
    // Define the order for categories
    const categoryOrder = ['necklace', 'bracelet', 'ring', 'earring', 'other'];
    
    // Sort categories according to the defined order
    const sortedCategories = Object.keys(groupedInventory).sort((a, b) => {
        const indexA = categoryOrder.indexOf(a);
        const indexB = categoryOrder.indexOf(b);
        
        // If both categories are in the order array, sort by their position
        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        }
        
        // If only one is in the order array, prioritize it
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        
        // If neither is in the order array, sort alphabetically
        return a.localeCompare(b);
    });
    
    sortedCategories.forEach(type => {
        html += `<div class="category-section">`;
        html += `<h2 class="category-title">${type}s</h2>`;
        html += `<div class="category-items">`;
        groupedInventory[type].forEach(item => {
            const costPrice = item.costPrice || item.price || 0;
            const margin = 0; // Selling price removed, margin not shown
            const marginPercent = 0;
            const totalValue = item.units * costPrice;
            html += `
                <div class="inventory-item">
                    <div class="item-type">${item.type}${item.units < 3 ? ' ⚠️' : ''}</div>
                    <h3>${item.model}</h3>
                    <div class="item-details">
                        <div class="item-detail">
                            <span>Weight:</span>
                            <span>${item.weight}g</span>
                        </div>
                        <div class="item-detail">
                            <span>Units in Stock:</span>
                            <span>${item.units}</span>
                        </div>
                        <div class="item-detail">
                            <span>Cost Price:</span>
                            <span>$${item.costPrice.toFixed(2)}</span>
                        </div>
                        <div class="item-detail">
                            <span>Total Value:</span>
                            <span>$${totalValue.toFixed(2)}</span>
                        </div>
                        <div class="item-detail">
                            <span>Date Purchased:</span>
                            <span>${item.datePurchased || item.dateAdded}</span>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-sm btn-primary" onclick="editItem(${item.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteItem(${item.id})">Delete</button>
                    </div>
                </div>
            `;
        });
        html += `</div>`; // Close category-items
        html += `</div>`; // Close category-section
    });
    inventoryGrid.innerHTML = html;
}


function editItem(itemId) {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;
    
    // Show modal first
    document.getElementById('addItemModal').style.display = 'block';
    
    // Reset form
    document.getElementById('addItemForm').reset();
    
    // Pre-fill the form with existing values
    document.getElementById('itemType').value = item.type;
    document.getElementById('itemModel').value = item.model;
    document.getElementById('itemWeight').value = item.weight;
    document.getElementById('itemUnits').value = item.units;
    document.getElementById('itemCostPrice').value = item.costPrice || item.price || 0;
    document.getElementById('itemDatePurchased').value = item.datePurchased || new Date().toISOString().split('T')[0];
    
    // Update modal title to show edit mode
    const modalTitle = document.querySelector('#addItemModal .modal-header h2');
    modalTitle.textContent = 'Edit Item';
    
    // Change modal header color to indicate edit mode
    const modalHeader = document.querySelector('#addItemModal .modal-header');
    modalHeader.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 50%, #28a745 100%)';
    
    // Update button text
    const submitButton = document.querySelector('#addItemModal .btn-primary');
    submitButton.textContent = 'Update Item';
    
    // Update form to handle edit
    const form = document.getElementById('addItemForm');
    form.onsubmit = function(e) {
        e.preventDefault();
        updateItem(itemId);
    };
}

function updateItem(itemId) {
    const itemIndex = inventory.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;
    
    // Update item
    inventory[itemIndex] = {
        ...inventory[itemIndex],
        type: document.getElementById('itemType').value,
        model: document.getElementById('itemModel').value,
        weight: parseFloat(document.getElementById('itemWeight').value),
        units: parseInt(document.getElementById('itemUnits').value),
        costPrice: parseFloat(document.getElementById('itemCostPrice').value),
        datePurchased: document.getElementById('itemDatePurchased').value
    };
    
    saveInventory();
    closeModal('addItemModal');
    displayInventory();
    updateHomeStats();
    
    // Reset modal title back to "Add New Item" for future use
    const modalTitle = document.querySelector('#addItemModal .modal-header h2');
    modalTitle.textContent = 'Add New Item';
    
    // Reset modal header color back to default
    const modalHeader = document.querySelector('#addItemModal .modal-header');
    modalHeader.style.background = 'linear-gradient(135deg, rgb(46, 13, 32) 0%, rgb(60, 20, 40) 50%, rgb(46, 13, 32) 100%)';
    
    // Reset button text
    const submitButton = document.querySelector('#addItemModal .btn-primary');
    submitButton.textContent = 'Add Item';
    
    showMessage('Item updated and saved automatically!', 'success');
}

function deleteItem(itemId) {
    if (confirm('Are you sure you want to delete this item?')) {
        inventory = inventory.filter(item => item.id !== itemId);
        saveInventory();
        displayInventory();
        updateHomeStats();
        showMessage('Item deleted and changes saved automatically!', 'success');
    }
}

// Sales management
function updateSaleItemOptions() {
    const itemType = document.getElementById('saleItemType').value;
    const modelSelect = document.getElementById('saleItemModel');
    
    // Clear existing options
    modelSelect.innerHTML = '<option value="">Select Model</option>';
    
    if (!itemType) return;
    
    // Filter inventory by type and available units
    const availableItems = inventory.filter(item => 
        item.type === itemType && item.units > 0
    );
    
    if (availableItems.length === 0) {
        modelSelect.innerHTML = '<option value="">No items available</option>';
        return;
    }
    
    // Add options
    availableItems.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.model} (${item.units} units, ${item.weight}g)`;
        modelSelect.appendChild(option);
    });
    
    // Add change listener
    modelSelect.onchange = function() {
        updateSaleItemDetails();
    };
}

function updateSaleItemDetails() {
    const itemId = parseInt(document.getElementById('saleItemModel').value);
    const item = inventory.find(i => i.id === itemId);
    
    if (item) {
        // Set weight from inventory
        document.getElementById('saleWeight').value = item.weight;
        
        // Set cost price from inventory (this is the key fix)
        const costPrice = item.costPrice || item.price || 0;
        document.getElementById('saleCostPrice').value = costPrice;
        
        // Clear selling price so user must enter it
        document.getElementById('saleSellingPrice').value = '';
        
        // Set max units available from inventory
        document.getElementById('saleUnits').max = item.units;
        document.getElementById('saleUnits').value = Math.min(1, item.units);
        
        // Clear margin fields until selling price is entered
        document.getElementById('saleMargin').value = '';
        document.getElementById('saleMarginPercent').value = '';
    } else {
        // Clear all fields if no item selected
        document.getElementById('saleWeight').value = '';
        document.getElementById('saleCostPrice').value = '';
        document.getElementById('saleSellingPrice').value = '';
        document.getElementById('saleMargin').value = '';
        document.getElementById('saleMarginPercent').value = '';
        document.getElementById('saleUnits').max = '';
        document.getElementById('saleUnits').value = '';
    }
}

function calculateMargin() {
    const costPrice = parseFloat(document.getElementById('saleCostPrice').value) || 0;
    const sellingPrice = parseFloat(document.getElementById('saleSellingPrice').value) || 0;
    const units = parseInt(document.getElementById('saleUnits').value) || 1;
    
    // Calculate margin per unit
    const marginPerUnit = sellingPrice - costPrice;
    const totalMargin = marginPerUnit * units;
    const marginPercent = sellingPrice > 0 ? (marginPerUnit / sellingPrice) * 100 : 0;
    
    // Update margin fields
    document.getElementById('saleMargin').value = totalMargin.toFixed(2);
    document.getElementById('saleMarginPercent').value = marginPercent.toFixed(1);
}

function recordSale(event) {
    event.preventDefault();
    
    const itemId = parseInt(document.getElementById('saleItemModel').value);
    const unitsSold = parseInt(document.getElementById('saleUnits').value);
    const saleDate = document.getElementById('saleDate').value;
    const costPrice = parseFloat(document.getElementById('saleCostPrice').value);
    const sellingPrice = parseFloat(document.getElementById('saleSellingPrice').value);
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    const item = inventory.find(i => i.id === itemId);
    if (!item) {
        showMessage('Item not found!', 'error');
        return;
    }
    
    if (unitsSold > item.units) {
        showMessage('Not enough units in stock!', 'error');
        return;
    }
    
    // Create sale record
    const sale = {
        id: Date.now(),
        itemId: itemId,
        itemType: item.type,
        itemModel: item.model,
        weight: item.weight,
        unitsSold: unitsSold,
        costPrice: costPrice,
        sellingPrice: sellingPrice,
        totalRevenue: unitsSold * sellingPrice,
        totalCost: unitsSold * costPrice,
        grossMargin: unitsSold * (sellingPrice - costPrice),
        marginPercent: sellingPrice > 0 ? ((sellingPrice - costPrice) / sellingPrice) * 100 : 0,
        paymentMethod: paymentMethod,
        saleDate: saleDate
    };
    
    // Add to sales
    sales.push(sale);
    saveSales();
    
    // Update inventory
    item.units -= unitsSold;
    saveInventory();
    
    // Close modal and refresh displays
    closeModal('recordSaleModal');
    displaySales();
    displayInventory();
    updateHomeStats();
    updateAllDropdownTexts();
    
    showMessage('Sale recorded and saved automatically!', 'success');
}

function displaySales(providedFilteredSales = null) {
    const salesTableBody = document.getElementById('salesTableBody');
    let filteredSales = providedFilteredSales;
    if (!filteredSales) {
        const selectedCategories = getSelectedValues('salesCategoryFilter');
        const selectedPaymentMethods = getSelectedValues('salesPaymentFilter');
        const dateStart = document.getElementById('salesDateStartFilter')?.value;
        const dateEnd = document.getElementById('salesDateEndFilter')?.value;
        filteredSales = [...sales];
        // Date range filter
        if (dateStart || dateEnd) {
            filteredSales = filteredSales.filter(sale => {
                const saleDate = sale.saleDate;
                if (!saleDate) return true;
                if (dateStart && saleDate < dateStart) return false;
                if (dateEnd && saleDate > dateEnd) return false;
                return true;
            });
        }
        // Category filter
        if (selectedCategories.length > 0) {
            filteredSales = filteredSales.filter(sale => {
                const saleType = sale.itemType || '';
                return selectedCategories.some(selectedType => saleType === selectedType);
            });
        }
        // Payment method filter
        if (selectedPaymentMethods.length > 0) {
            filteredSales = filteredSales.filter(sale => selectedPaymentMethods.includes(sale.paymentMethod || 'cash'));
        }
    }
    
    // Sort by date (newest first)
    filteredSales.sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));
    
    if (filteredSales.length === 0) {
        let hasFilters = false;
        // Try to get selected filters safely
        try {
            const selectedCategories = getSelectedValues('salesCategoryFilter');
            const selectedPaymentMethods = getSelectedValues('salesPaymentFilter');
            const dateStart = document.getElementById('salesDateStartFilter')?.value;
            const dateEnd = document.getElementById('salesDateEndFilter')?.value;
            hasFilters = dateStart || dateEnd || selectedCategories.length > 0 || selectedPaymentMethods.length > 0;
        } catch (e) {
            hasFilters = false;
        }
        salesTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>No records found</h3>
                    <p>${hasFilters ? 'No records match the selected filters.' : 'Record your first sale to get started!'}</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Group sales by date
    const salesByDate = {};
    filteredSales.forEach(sale => {
        if (!salesByDate[sale.saleDate]) {
            salesByDate[sale.saleDate] = [];
        }
        salesByDate[sale.saleDate].push(sale);
    });
    
    // Display sales grouped by date
    let html = '';
    let totalUnits = 0;
    let totalRevenue = 0;
    let totalMargin = 0;
    let currentDate = null;
    
    Object.keys(salesByDate).sort().forEach(date => {
        const daySales = salesByDate[date];
        let dayUnits = 0;
        let dayRevenue = 0;
        let dayMargin = 0;
        
        daySales.forEach(sale => {
            dayUnits += sale.unitsSold;
            dayRevenue += (sale.totalRevenue || sale.totalAmount || 0);
            dayMargin += (sale.grossMargin || 0);
            totalUnits += sale.unitsSold;
            totalRevenue += (sale.totalRevenue || sale.totalAmount || 0);
            totalMargin += (sale.grossMargin || 0);
            
            html += `
                <tr>
                    <td>${formatDate(sale.saleDate)}</td>
                    <td><span class="item-type">${sale.itemType}</span></td>
                    <td>${sale.itemModel}</td>
                    <td>${sale.weight}g</td>
                    <td>${sale.unitsSold}</td>
                    <td>$${(sale.costPrice || sale.unitPrice || 0).toFixed(2)}</td>
                    <td>$${(sale.sellingPrice || sale.unitPrice || 0).toFixed(2)}</td>
                    <td><strong>$${(sale.totalRevenue || sale.totalAmount || 0).toFixed(2)}</strong></td>
                    <td>$${(sale.grossMargin || 0).toFixed(2)}</td>
                    <td>${(sale.marginPercent || 0).toFixed(1)}%</td>
                    <td><span class="payment-method">${formatPaymentMethod(sale.paymentMethod || 'cash')}</span></td>
                    <td>
                        <button class="btn btn-secondary btn-sm" onclick="editSale(${sale.id})" title="Edit Sale">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteSale(${sale.id})" title="Delete Sale">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        // Add daily total row if there are multiple sales on the same day
        if (daySales.length > 1) {
            html += `
                <tr class="daily-total-row">
                    <td colspan="4"><strong>Daily Total - ${formatDate(date)}</strong></td>
                    <td><strong>${dayUnits}</strong></td>
                    <td></td>
                    <td></td>
                    <td><strong>$${dayRevenue.toFixed(2)}</strong></td>
                    <td><strong>$${dayMargin.toFixed(2)}</strong></td>
                    <td><strong>${dayRevenue > 0 ? ((dayMargin / dayRevenue) * 100).toFixed(1) : 0}%</strong></td>
                    <td></td>
                    <td></td>
                </tr>
            `;
        }
    });
    
    // Add grand total row
    if (filteredSales.length > 0) {
        html += `
            <tr class="total-row">
                <td colspan="4"><strong>GRAND TOTAL</strong></td>
                <td><strong>${totalUnits}</strong></td>
                <td></td>
                <td></td>
                <td><strong>$${totalRevenue.toFixed(2)}</strong></td>
                <td><strong>$${totalMargin.toFixed(2)}</strong></td>
                <td><strong>${totalRevenue > 0 ? ((totalMargin / totalRevenue) * 100).toFixed(1) : 0}%</strong></td>
                <td></td>
                <td></td>
            </tr>
        `;
    }
    
    salesTableBody.innerHTML = html;
}


function clearInventoryFilters() {
    // Clear all checkboxes in inventory custom dropdowns
    document.querySelectorAll('#inventoryCategoryFilter input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('#inventoryCostPriceFilter input[type="checkbox"]').forEach(cb => cb.checked = false);
    updateDropdownText('inventoryCategoryFilter');
    updateDropdownText('inventoryCostPriceFilter');
    displayInventory();
}

function clearSalesFilters() {
    // Clear date filter
    document.getElementById('salesDateFilter').value = '';
    // Clear all checkboxes in sales custom dropdowns
    document.querySelectorAll('#salesCategoryFilter input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('#salesPaymentFilter input[type="checkbox"]').forEach(cb => cb.checked = false);
    updateDropdownText('salesCategoryFilter');
    updateDropdownText('salesPaymentFilter');
    displaySales();
}

function clearHomeFilters() {
    // Clear all home page filters
    document.getElementById('homeDateFilter').value = '';
    document.querySelectorAll('#homeCategoryFilter input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('#homePaymentFilter input[type="checkbox"]').forEach(cb => cb.checked = false);
    updateDropdownText('homeCategoryFilter');
    updateDropdownText('homePaymentFilter');
    updateHomeStats();
}

function editSale(saleId) {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;
    
    // Find the original item in inventory
    const originalItem = inventory.find(item => item.id === sale.itemId);
    if (!originalItem) {
        showMessage('Original item not found in inventory!', 'error');
        return;
    }
    
    // Show modal first
    document.getElementById('recordSaleModal').style.display = 'block';
    
    // Reset form
    document.getElementById('recordSaleForm').reset();
    
    // Pre-fill the form with existing values
    document.getElementById('saleItemType').value = sale.itemType;
    updateSaleItemOptions();
    
    // Wait for options to load, then set the model
    setTimeout(() => {
        document.getElementById('saleItemModel').value = sale.itemId;
        updateSaleItemDetails();
        
        // Override the auto-filled values with the sale values
        document.getElementById('saleUnits').value = sale.unitsSold;
        document.getElementById('saleCostPrice').value = sale.costPrice || sale.unitPrice || 0;
        document.getElementById('saleSellingPrice').value = sale.sellingPrice || sale.unitPrice || 0;
        document.getElementById('saleDate').value = sale.saleDate;
        document.getElementById('paymentMethod').value = sale.paymentMethod || 'cash';
        calculateMargin();
    }, 100);
    
    // Update modal title to show edit mode
    const modalTitle = document.querySelector('#recordSaleModal .modal-header h2');
    modalTitle.textContent = 'Edit Sale';
    
    // Change modal header color to indicate edit mode
    const modalHeader = document.querySelector('#recordSaleModal .modal-header');
    modalHeader.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 50%, #28a745 100%)';
    
    // Update button text
    const submitButton = document.querySelector('#recordSaleModal .btn-primary');
    submitButton.textContent = 'Update Sale';
    
    // Update form to handle edit
    const form = document.getElementById('recordSaleForm');
    form.onsubmit = function(e) {
        e.preventDefault();
        updateSale(saleId);
    };
}

function updateSale(saleId) {
    const saleIndex = sales.findIndex(s => s.id === saleId);
    if (saleIndex === -1) return;
    
    const originalSale = sales[saleIndex];
    const itemId = parseInt(document.getElementById('saleItemModel').value);
    const unitsSold = parseInt(document.getElementById('saleUnits').value);
    const saleDate = document.getElementById('saleDate').value;
    const costPrice = parseFloat(document.getElementById('saleCostPrice').value);
    const sellingPrice = parseFloat(document.getElementById('saleSellingPrice').value);
    const paymentMethod = document.getElementById('paymentMethod').value;
    
    const item = inventory.find(i => i.id === itemId);
    if (!item) {
        showMessage('Item not found!', 'error');
        return;
    }
    
    // Calculate the difference in units to adjust inventory
    const unitsDifference = unitsSold - originalSale.unitsSold;
    
    if (unitsDifference > 0 && unitsDifference > item.units) {
        showMessage('Not enough units in stock!', 'error');
        return;
    }
    
    // Update the sale
    sales[saleIndex] = {
        ...originalSale,
        itemId: itemId,
        itemType: item.type,
        itemModel: item.model,
        weight: item.weight,
        unitsSold: unitsSold,
        costPrice: costPrice,
        sellingPrice: sellingPrice,
        totalRevenue: unitsSold * sellingPrice,
        totalCost: unitsSold * costPrice,
        grossMargin: unitsSold * (sellingPrice - costPrice),
        marginPercent: sellingPrice > 0 ? ((sellingPrice - costPrice) / sellingPrice) * 100 : 0,
        paymentMethod: paymentMethod,
        saleDate: saleDate
    };
    
    // Adjust inventory
    item.units -= unitsDifference;
    
    saveSales();
    saveInventory();
    closeModal('recordSaleModal');
    displaySales();
    displayInventory();
    updateHomeStats();
    
    // Reset modal title back to "Record Sale" for future use
    const modalTitle = document.querySelector('#recordSaleModal .modal-header h2');
    modalTitle.textContent = 'Record Sale';
    
    // Reset modal header color back to default
    const modalHeader = document.querySelector('#recordSaleModal .modal-header');
    modalHeader.style.background = 'linear-gradient(135deg, rgb(46, 13, 32) 0%, rgb(60, 20, 40) 50%, rgb(46, 13, 32) 100%)';
    
    // Reset button text
    const submitButton = document.querySelector('#recordSaleModal .btn-primary');
    submitButton.textContent = 'Record Sale';
    
    showMessage('Sale updated and saved automatically!', 'success');
}

function deleteSale(saleId) {
    if (confirm('Are you sure you want to delete this sale? This will restore the items to inventory.')) {
        const saleIndex = sales.findIndex(s => s.id === saleId);
        if (saleIndex === -1) return;
        
        const sale = sales[saleIndex];
        const item = inventory.find(i => i.id === sale.itemId);
        
        if (item) {
            // Restore units to inventory
            item.units += sale.unitsSold;
        }
        
        // Remove sale
        sales.splice(saleIndex, 1);
        
        saveSales();
        saveInventory();
        displaySales();
        displayInventory();
        updateHomeStats();
        
        showMessage('Sale deleted and inventory restored automatically!', 'success');
    }
}

// Data persistence
function saveInventory() {
    localStorage.setItem('jewelryInventory', JSON.stringify(inventory));
    showSaveIndicator('Inventory saved automatically');
}

function saveSales() {
    localStorage.setItem('jewelrySales', JSON.stringify(sales));
    showSaveIndicator('Sales saved automatically');
}

function showSaveIndicator(message) {
    // Create a small save indicator
    const indicator = document.createElement('div');
    indicator.className = 'save-indicator';
    indicator.innerHTML = `<i class="fas fa-save"></i> ${message}`;
    indicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.9rem;
        z-index: 10000;
        box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
        border: 1px solid #FFD700;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(indicator);
    
    // Remove after 2 seconds
    setTimeout(() => {
        indicator.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 300);
    }, 2000);
}

function loadInventory() {
    const saved = localStorage.getItem('jewelryInventory');
    if (saved) {
        inventory = JSON.parse(saved);
    }
}

function loadSales() {
    const saved = localStorage.getItem('jewelrySales');
    if (saved) {
        sales = JSON.parse(saved);
    }
}

// Custom dropdown functions
function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    const isActive = dropdown.classList.contains('active');
    
    // Close all other dropdowns
    document.querySelectorAll('.custom-dropdown').forEach(dd => {
        dd.classList.remove('active');
    });
    
    // Toggle current dropdown
    if (!isActive) {
        dropdown.classList.add('active');
    }
    
    // Update selected text
    updateDropdownText(dropdownId);
}

function updateAllDropdownTexts() {
    // Update all dropdown texts
    updateDropdownText('homeCategoryFilter');
    updateDropdownText('homePaymentFilter');
    updateDropdownText('inventoryCategoryFilter');
    updateDropdownText('inventoryCostPriceFilter');
    updateDropdownText('salesCategoryFilter');
    updateDropdownText('salesPaymentFilter');
}

function updateDropdownText(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
    const selectedText = dropdown.querySelector('.selected-text');
    
    const selectedValues = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.nextSibling.textContent.trim());
    
    // Check if there are any values available for this filter
    let hasValues = false;
    
    if (dropdownId.includes('Category')) {
        // Check if there are any categories in the data
        if (dropdownId.includes('inventory')) {
            hasValues = inventory.some(item => item.type);
        } else if (dropdownId.includes('sales')) {
            hasValues = sales.some(sale => sale.itemType);
        } else if (dropdownId.includes('home')) {
            hasValues = inventory.some(item => item.type) || sales.some(sale => sale.itemType);
        }
    } else if (dropdownId.includes('Payment')) {
        // Check if there are any payment methods in sales data
        hasValues = sales.some(sale => sale.paymentMethod);
    } else if (dropdownId.includes('CostPrice')) {
        // Check if there are any items with cost prices
        hasValues = inventory.some(item => item.costPrice || item.price);
    }
    
    if (selectedValues.length === 0) {
        if (!hasValues) {
            selectedText.textContent = 'No values';
        } else if (dropdownId.includes('Category')) {
            selectedText.textContent = 'All Categories';
        } else if (dropdownId.includes('Payment')) {
            selectedText.textContent = 'All Payment Methods';
        } else if (dropdownId.includes('CostPrice')) {
            selectedText.textContent = 'All Price Ranges';
        }
    } else if (selectedValues.length === 1) {
        selectedText.textContent = selectedValues[0];
    } else {
        selectedText.textContent = `${selectedValues.length} selected`;
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.custom-dropdown')) {
        document.querySelectorAll('.custom-dropdown').forEach(dd => {
            dd.classList.remove('active');
        });
    }
});

// Statistics
function updateHomeStats() {
    const selectedCategories = getSelectedValues('homeCategoryFilter');
    const selectedPaymentMethods = getSelectedValues('homePaymentFilter');
    const dateStart = document.getElementById('homeDateStartFilter')?.value;
    const dateEnd = document.getElementById('homeDateEndFilter')?.value;
    let filteredSales = [...sales];
    if (dateStart || dateEnd) {
        filteredSales = filteredSales.filter(sale => {
            const saleDate = sale.saleDate;
            if (!saleDate) return true;
            if (dateStart && saleDate < dateStart) return false;
            if (dateEnd && saleDate > dateEnd) return false;
            return true;
        });
    }
    if (selectedCategories.length > 0) {
        filteredSales = filteredSales.filter(sale => selectedCategories.includes(sale.itemType));
    }
    if (selectedPaymentMethods.length > 0) {
        filteredSales = filteredSales.filter(sale => selectedPaymentMethods.includes(sale.paymentMethod));
    }
    // Calculate stats from filtered data
    let filteredInventory = [...inventory];
    if (selectedCategories.length > 0) {
        filteredInventory = filteredInventory.filter(item => selectedCategories.includes(item.type));
    }
    const totalItems = filteredInventory.reduce((sum, item) => sum + item.units, 0);
    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.unitsSold, 0);
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + (sale.totalRevenue || sale.totalAmount || 0), 0);
    const totalProfit = filteredSales.reduce((sum, sale) => sum + (sale.grossMargin || 0), 0);
    
    document.getElementById('total-items').textContent = totalItems;
    document.getElementById('total-sales').textContent = totalSales;
    document.getElementById('total-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
    document.getElementById('total-profit').textContent = `$${totalProfit.toFixed(2)}`;
}

// Utility functions
function formatDate(dateString) {
    // Parse the date string to avoid timezone issues
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatPaymentMethod(paymentMethod) {
    switch(paymentMethod) {
        case 'cash':
            return 'Cash';
        case 'credit_card':
            return 'Credit Card';
        case 'loan_app':
            return 'Loan/App';
        default:
            return 'Cash';
    }
}

function showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;
    
    // Insert at top of main content
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(messageDiv, mainContent.firstChild);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Sample data for demonstration (remove in production)
function addSampleData() {
    if (inventory.length === 0) {
        const sampleItems = [
            {
                id: 1,
                type: 'necklace',
                model: 'Diamond Pendant Chain',
                weight: 15.5,
                units: 3,
                price: 299.99,
                dateAdded: '2024-01-15'
            },
            {
                id: 2,
                type: 'bracelet',
                model: 'Gold Link Bracelet',
                weight: 8.2,
                units: 5,
                price: 199.99,
                dateAdded: '2024-01-16'
            },
            {
                id: 3,
                type: 'ring',
                model: 'Sapphire Engagement Ring',
                weight: 3.8,
                units: 2,
                price: 899.99,
                dateAdded: '2024-01-17'
            },
            {
                id: 4,
                type: 'earring',
                model: 'Pearl Drop Earrings',
                weight: 4.1,
                units: 4,
                price: 149.99,
                dateAdded: '2024-01-18'
            }
        ];
        
        inventory = sampleItems;
        saveInventory();
        displayInventory();
        updateHomeStats();
    }
}

// Excel Export Functions
function exportInventoryToExcel() {
    if (inventory.length === 0) {
        showMessage('No inventory data to export!', 'error');
        return;
    }

    // Prepare data for Excel
    const excelData = inventory.map(item => ({
        'Item ID': item.id,
        'Type': item.type.charAt(0).toUpperCase() + item.type.slice(1),
        'Model/Description': item.model,
        'Weight (grams)': item.weight,
        'Units in Stock': item.units,
        'Cost Price ($)': item.costPrice || item.price || 0,
        'Selling Price ($)': item.sellingPrice || item.price || 0,
        'Margin ($)': ((item.sellingPrice || item.price || 0) - (item.costPrice || item.price || 0)).toFixed(2),
        'Margin %': item.sellingPrice > 0 ? (((item.sellingPrice - (item.costPrice || item.price || 0)) / item.sellingPrice) * 100).toFixed(1) : 0,
        'Total Value ($)': (item.units * (item.sellingPrice || item.price || 0)).toFixed(2),
        'Date Added': item.dateAdded
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
        { wch: 10 }, // Item ID
        { wch: 15 }, // Type
        { wch: 30 }, // Model/Description
        { wch: 15 }, // Weight
        { wch: 15 }, // Units
        { wch: 15 }, // Cost Price
        { wch: 15 }, // Selling Price
        { wch: 15 }, // Margin
        { wch: 15 }, // Margin %
        { wch: 15 }, // Total Value
        { wch: 15 }  // Date Added
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Inventory');

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `RBS_Jewelers_Inventory_${currentDate}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
    
    showMessage('Inventory exported successfully!', 'success');
}

function exportSalesToExcel() {
    if (sales.length === 0) {
        showMessage('No sales data to export!', 'error');
        return;
    }

    // Prepare data for Excel
    const excelData = sales.map(sale => ({
        'Sale ID': sale.id,
        'Date': sale.saleDate,
        'Item Type': sale.itemType.charAt(0).toUpperCase() + sale.itemType.slice(1),
        'Model/Description': sale.itemModel,
        'Weight (grams)': sale.weight,
        'Units Sold': sale.unitsSold,
        'Cost Price ($)': sale.costPrice || sale.unitPrice || 0,
        'Selling Price ($)': sale.sellingPrice || sale.unitPrice || 0,
        'Total Revenue ($)': (sale.totalRevenue || sale.totalAmount || 0).toFixed(2),
        'Gross Margin ($)': (sale.grossMargin || 0).toFixed(2),
        'Margin %': (sale.marginPercent || 0).toFixed(1),
        'Payment Method': formatPaymentMethod(sale.paymentMethod || 'cash')
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
        { wch: 10 }, // Sale ID
        { wch: 15 }, // Date
        { wch: 15 }, // Item Type
        { wch: 30 }, // Model/Description
        { wch: 15 }, // Weight
        { wch: 15 }, // Units Sold
        { wch: 15 }, // Cost Price
        { wch: 15 }, // Selling Price
        { wch: 15 }, // Total Revenue
        { wch: 15 }, // Gross Margin
        { wch: 15 }, // Margin %
        { wch: 15 }  // Payment Method
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `RBS_Jewelers_Sales_${currentDate}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
    
    showMessage('Sales exported successfully!', 'success');
}

function exportAllDataToExcel() {
    if (inventory.length === 0 && sales.length === 0) {
        showMessage('No data to export!', 'error');
        return;
    }

    const wb = XLSX.utils.book_new();
    const currentDate = new Date().toISOString().split('T')[0];

    // Export Inventory if available
    if (inventory.length > 0) {
        const inventoryData = inventory.map(item => ({
            'Item ID': item.id,
            'Type': item.type.charAt(0).toUpperCase() + item.type.slice(1),
            'Model/Description': item.model,
            'Weight (grams)': item.weight,
            'Units in Stock': item.units,
            'Cost Price ($)': item.costPrice || item.price || 0,
            'Selling Price ($)': item.sellingPrice || item.price || 0,
            'Margin ($)': ((item.sellingPrice || item.price || 0) - (item.costPrice || item.price || 0)).toFixed(2),
            'Margin %': item.sellingPrice > 0 ? (((item.sellingPrice - (item.costPrice || item.price || 0)) / item.sellingPrice) * 100).toFixed(1) : 0,
            'Total Value ($)': (item.units * (item.sellingPrice || item.price || 0)).toFixed(2),
            'Date Added': item.dateAdded
        }));

        const inventoryWs = XLSX.utils.json_to_sheet(inventoryData);
        inventoryWs['!cols'] = [
            { wch: 10 }, { wch: 15 }, { wch: 30 }, { wch: 15 },
            { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
        ];
        XLSX.utils.book_append_sheet(wb, inventoryWs, 'Inventory');
    }

    // Export Sales if available
    if (sales.length > 0) {
        const salesData = sales.map(sale => ({
            'Sale ID': sale.id,
            'Date': sale.saleDate,
            'Item Type': sale.itemType.charAt(0).toUpperCase() + sale.itemType.slice(1),
            'Model/Description': sale.itemModel,
            'Weight (grams)': sale.weight,
            'Units Sold': sale.unitsSold,
            'Cost Price ($)': sale.costPrice || sale.unitPrice || 0,
            'Selling Price ($)': sale.sellingPrice || sale.unitPrice || 0,
            'Total Revenue ($)': (sale.totalRevenue || sale.totalAmount || 0).toFixed(2),
            'Gross Margin ($)': (sale.grossMargin || 0).toFixed(2),
            'Margin %': (sale.marginPercent || 0).toFixed(1),
            'Payment Method': formatPaymentMethod(sale.paymentMethod || 'cash')
        }));

        const salesWs = XLSX.utils.json_to_sheet(salesData);
        salesWs['!cols'] = [
            { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 30 },
            { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
        ];
        XLSX.utils.book_append_sheet(wb, salesWs, 'Sales');
    }

    // Add Summary Sheet
    const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.units * (item.sellingPrice || item.price || 0)), 0);
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.totalRevenue || sale.totalAmount || 0), 0);
    const totalMargin = sales.reduce((sum, sale) => sum + (sale.grossMargin || 0), 0);
    
    const summaryData = [
        { 'Metric': 'Total Inventory Items', 'Value': inventory.length },
        { 'Metric': 'Total Units in Stock', 'Value': inventory.reduce((sum, item) => sum + item.units, 0) },
        { 'Metric': 'Total Inventory Value (Selling Price)', 'Value': `$${totalInventoryValue.toFixed(2)}` },
        { 'Metric': 'Total Sales Transactions', 'Value': sales.length },
        { 'Metric': 'Total Units Sold', 'Value': sales.reduce((sum, sale) => sum + sale.unitsSold, 0) },
        { 'Metric': 'Total Revenue', 'Value': `$${totalRevenue.toFixed(2)}` },
        { 'Metric': 'Total Gross Margin', 'Value': `$${totalMargin.toFixed(2)}` },
        { 'Metric': 'Overall Margin %', 'Value': `${totalRevenue > 0 ? ((totalMargin / totalRevenue) * 100).toFixed(1) : 0}%` },
        { 'Metric': 'Export Date', 'Value': currentDate }
    ];

    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Save file
    const filename = `RBS_Jewelers_Complete_Backup_${currentDate}.xlsx`;
    XLSX.writeFile(wb, filename);
    
    showMessage('Complete backup exported successfully!', 'success');
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function getSelectedValues(dropdownId) {
    return Array.from(document.querySelectorAll(`#${dropdownId} input[type="checkbox"]:checked`))
        .map(cb => cb.value);
}

// Initialize the application

// Uncomment the line below to add sample data for demonstration
// addSampleData();

// Function to add sample data for testing
function addSampleData() {
    const sampleInventory = [
        {
            id: 1,
            type: 'necklace',
            model: 'Gold Chain',
            weight: 15.5,
            units: 5,
            costPrice: 250.00,
            datePurchased: '2024-01-15'
        },
        {
            id: 2,
            type: 'bracelet',
            model: 'Silver Bracelet',
            weight: 8.2,
            units: 3,
            costPrice: 120.00,
            datePurchased: '2024-01-20'
        }
    ];
    
    inventory = sampleInventory;
    localStorage.setItem('jewelryInventory', JSON.stringify(inventory));
    console.log('Sample data added:', inventory);
    displayInventory();
}
