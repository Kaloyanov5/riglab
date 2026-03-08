// ===== RigLab Components Page (components.html) =====
const API = '/api';

// ---- Utility ----
function toast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

async function apiFetch(path, options = {}) {
    const res = await fetch(API + path, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });
    if (res.status === 204) return null;
    const data = await res.json();
    if (!res.ok) {
        const msg = data.message || (data.errors ? Object.values(data.errors).join(', ') : 'Request failed');
        throw new Error(msg);
    }
    return data;
}

function formatPrice(price) {
    return price != null ? `$${price.toFixed(2)}` : '—';
}

function esc(str) {
    const el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
}

// ---- State ----
let currentType = '';
let currentPage = 0;
let currentSearch = '';
let currentSortBy = 'name';
let currentSortDir = 'asc';
let currentMinPrice = null;
let currentMaxPrice = null;
let currentDetailFilters = {};
let loadedPageComponents = [];
const PAGE_SIZE = 12;

// ---- Load components with pagination ----
async function loadComponents() {
    const list = document.getElementById('components-list');
    list.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading components...</p></div>';

    try {
        const hasDetailFilters = Object.keys(currentDetailFilters).length > 0;
        const fetchSize = hasDetailFilters ? 200 : PAGE_SIZE;

        const params = new URLSearchParams({
            page: hasDetailFilters ? 0 : currentPage,
            size: fetchSize,
            sortBy: currentSortBy,
            sortDir: currentSortDir,
        });
        if (currentType) params.set('type', currentType);
        if (currentSearch) params.set('name', currentSearch);
        if (currentMinPrice != null && currentMinPrice !== '') params.set('minPrice', currentMinPrice);
        if (currentMaxPrice != null && currentMaxPrice !== '') params.set('maxPrice', currentMaxPrice);

        const data = await apiFetch(`/components/paged?${params}`);
        loadedPageComponents = data.content || [];

        const filtered = applyDetailFilters(loadedPageComponents);
        renderComponents(filtered);

        if (hasDetailFilters) {
            document.getElementById('pagination').innerHTML =
                `<span class="page-info">${filtered.length} result(s) found</span>`;
        } else {
            renderPagination(data);
        }
    } catch (err) {
        list.innerHTML = `<div class="empty-state"><p>Error loading components: ${err.message}</p></div>`;
    }
}

/**
 * Client-side filtering by component spec details.
 * Brand: top-level exact match (case-insensitive).
 * Select text fields: exact match (case-insensitive) on details[key].
 * Number fields: component value must be >= filter value (minimum threshold).
 */
function applyDetailFilters(components) {
    const activeFilters = Object.entries(currentDetailFilters).filter(([, v]) => v !== '' && v != null);
    if (activeFilters.length === 0) return components;

    return components.filter(c => {
        return activeFilters.every(([key, filterVal]) => {
            // 'brand' is top-level, not in details
            if (key === 'brand') {
                return c.brand && c.brand.toLowerCase() === String(filterVal).toLowerCase();
            }
            if (!c.details) return false;
            const detailVal = c.details[key];
            if (detailVal == null) return false;

            // Number filter: treat as minimum threshold (>=)
            if (typeof filterVal === 'number') {
                return Number(detailVal) >= filterVal;
            }
            // For numeric string values from select (like VRAM "8"), do >= comparison
            if (!isNaN(filterVal) && !isNaN(detailVal)) {
                return Number(detailVal) >= Number(filterVal);
            }
            // Text select filter: case-insensitive exact match
            return String(detailVal).toLowerCase() === String(filterVal).toLowerCase();
        });
    });
}

function renderComponents(components) {
    const list = document.getElementById('components-list');
    if (!components || components.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">&#128187;</div>
                <p>No components found.</p>
            </div>`;
        return;
    }

    list.innerHTML = components.map(c => `
        <div class="card" onclick="viewComponent(${c.id})" style="cursor:pointer;">
            ${c.imageUrl
                ? `<img class="card-img" src="${esc(c.imageUrl)}" alt="${esc(c.name)}" onerror="this.outerHTML='<div class=\\'card-img-placeholder\\'>&#128187;</div>'">`
                : '<div class="card-img-placeholder">&#128187;</div>'
            }
            <div class="card-body">
                <div class="card-header">
                    <h3>${esc(c.name)}</h3>
                    <span class="card-type" data-type="${c.type}">${c.type}</span>
                </div>
                <div class="card-brand">${esc(c.brand)}</div>
                <div class="card-details">
                    ${renderDetailChips(c)}
                </div>
                <div class="card-footer">
                    <div>
                        <span class="card-price">${formatPrice(c.price)}</span>
                        ${c.powerConsumption ? `<span class="card-power">&nbsp;&bull; ${c.powerConsumption}W</span>` : ''}
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); compareComponent(${c.id})">&#x2696; Compare</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function renderDetailChips(c) {
    if (!c.details) return '';
    return Object.entries(c.details)
        .map(([k, v]) => `<span class="card-detail"><strong>${formatDetailKey(k)}:</strong> ${esc(String(v))}</span>`)
        .join('');
}

function formatDetailKey(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
}

// ---- Pagination ----
function renderPagination(pageData) {
    const container = document.getElementById('pagination');
    // Support both PageImpl format and PagedModel (VIA_DTO) format
    const pg = pageData.page || pageData;
    const totalPages = pg.totalPages;
    const totalElements = pg.totalElements;
    const isFirst = pageData.first !== undefined ? pageData.first : (currentPage === 0);
    const isLast = pageData.last !== undefined ? pageData.last : (currentPage >= totalPages - 1);

    if (totalPages <= 1) { container.innerHTML = ''; return; }

    let html = '';
    html += `<button class="page-btn" ${isFirst ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">&laquo; Prev</button>`;

    const start = Math.max(0, currentPage - 2);
    const end = Math.min(totalPages - 1, currentPage + 2);

    if (start > 0) {
        html += `<button class="page-btn" onclick="goToPage(0)">1</button>`;
        if (start > 1) html += `<span class="page-info">...</span>`;
    }

    for (let i = start; i <= end; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i + 1}</button>`;
    }

    if (end < totalPages - 1) {
        if (end < totalPages - 2) html += `<span class="page-info">...</span>`;
        html += `<button class="page-btn" onclick="goToPage(${totalPages - 1})">${totalPages}</button>`;
    }

    html += `<button class="page-btn" ${isLast ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">Next &raquo;</button>`;
    html += `<span class="page-info">${totalElements} total</span>`;

    container.innerHTML = html;
}

window.goToPage = function(page) {
    currentPage = page;
    loadComponents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ---- Category filter ----
document.querySelectorAll('.filter-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        currentType = btn.dataset.type;
        currentPage = 0;

        const title = document.getElementById('components-title');
        title.textContent = currentType ? currentType + ' Components' : 'All Components';

        // Show/hide detail filters
        if (currentType) {
            showDetailFilters(currentType);
        } else {
            hideDetailFilters();
        }

        loadComponents();
    });
});

// ---- Detail filters (nested level 2) ----
async function showDetailFilters(type) {
    const categories = document.getElementById('filter-categories');
    const details = document.getElementById('filter-details');
    categories.classList.add('hidden');
    details.classList.remove('hidden');

    currentDetailFilters = {};

    const container = document.getElementById('detail-filter-fields');
    const fields = getFilterFieldsForType(type);

    // Fetch dynamic brands for this type
    let brands = [];
    try {
        brands = await apiFetch(`/components/brands?type=${type}`);
    } catch (e) { /* ignore */ }

    container.innerHTML = `<h4>${type} Filters</h4>` +
        fields.map(f => {
            if (f.fieldType === 'select') {
                const options = f.dynamic === 'brand' ? brands : (f.options || []);
                return `
                    <div class="detail-filter-group">
                        <label>${f.label}</label>
                        <select class="input filter-input" data-filter-key="${f.key}">
                            <option value="">All</option>
                            ${options.map(o => `<option value="${esc(o)}">${esc(o)}</option>`).join('')}
                        </select>
                    </div>`;
            } else if (f.fieldType === 'range') {
                return `
                    <div class="detail-filter-group">
                        <label>${f.label}</label>
                        <div class="slider-filter">
                            <input type="range" class="filter-slider" data-filter-key="${f.key}"
                                min="${f.min}" max="${f.max}" step="${f.step}" value="${f.min}"
                                data-unit="${f.unit || ''}">
                            <div class="slider-info">
                                <span class="slider-value" id="slider-val-${f.key}">Any</span>
                                <button type="button" class="slider-reset" data-reset-key="${f.key}" title="Reset">&times;</button>
                            </div>
                        </div>
                    </div>`;
            } else {
                return `
                    <div class="detail-filter-group">
                        <label>${f.label}</label>
                        <input type="number" class="input filter-input" data-filter-key="${f.key}"
                            placeholder="${f.placeholder || ''}" ${f.step ? `step="${f.step}"` : ''}>
                    </div>`;
            }
        }).join('');

    // Attach listeners
    container.querySelectorAll('[data-filter-key]').forEach(el => {
        if (el.type === 'range') {
            const key = el.dataset.filterKey;
            const unit = el.dataset.unit || '';
            const minVal = Number(el.min);
            const valDisplay = document.getElementById(`slider-val-${key}`);

            el.addEventListener('input', () => {
                const val = Number(el.value);
                if (val <= minVal) {
                    valDisplay.textContent = 'Any';
                    delete currentDetailFilters[key];
                } else {
                    valDisplay.textContent = val + unit + '+';
                    currentDetailFilters[key] = val;
                }
            });

            el.addEventListener('change', () => {
                loadComponents();
            });
        } else {
            let timeout;
            const eventName = el.tagName === 'SELECT' ? 'change' : 'input';
            el.addEventListener(eventName, () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    const key = el.dataset.filterKey;
                    const val = el.value.trim();
                    if (val === '') {
                        delete currentDetailFilters[key];
                    } else {
                        currentDetailFilters[key] = el.type === 'number' ? Number(val) : val;
                    }
                    loadComponents();
                }, eventName === 'change' ? 0 : 300);
            });
        }
    });

    // Reset buttons for sliders
    container.querySelectorAll('[data-reset-key]').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.resetKey;
            const slider = container.querySelector(`[data-filter-key="${key}"][type="range"]`);
            if (slider) {
                slider.value = slider.min;
                document.getElementById(`slider-val-${key}`).textContent = 'Any';
                delete currentDetailFilters[key];
                loadComponents();
            }
        });
    });
}

function hideDetailFilters() {
    const categories = document.getElementById('filter-categories');
    const details = document.getElementById('filter-details');
    categories.classList.remove('hidden');
    details.classList.add('hidden');
    currentDetailFilters = {};
}

document.getElementById('btn-filter-back').addEventListener('click', () => {
    hideDetailFilters();
    // Reset to all
    document.querySelectorAll('.filter-cat-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.filter-cat-btn[data-type=""]').classList.add('active');
    currentType = '';
    currentPage = 0;
    document.getElementById('components-title').textContent = 'All Components';
    loadComponents();
});

function getFilterFieldsForType(type) {
    const SOCKETS = ['AM4', 'AM5', 'LGA1200', 'LGA1700', 'LGA1851'];
    const FORM_FACTORS = ['ATX', 'Micro-ATX', 'Mini-ITX', 'E-ATX'];
    const RAM_TYPES = ['DDR4', 'DDR5'];
    const STORAGE_TYPES = ['HDD', 'SSD', 'NVMe'];
    const STORAGE_INTERFACES = ['SATA', 'M.2', 'PCIe'];
    const COOLER_TYPES = ['Air', 'AIO Liquid', 'Custom Loop'];
    const PSU_RATINGS = ['80+ Bronze', '80+ Silver', '80+ Gold', '80+ Platinum', '80+ Titanium'];
    const VRAM_SIZES = ['4', '6', '8', '10', '12', '16', '24'];
    const RAM_CAPACITIES = ['4', '8', '16', '32', '64'];

    switch (type) {
        case 'CPU': return [
            { key: 'brand', label: 'Brand', fieldType: 'select', dynamic: 'brand' },
            { key: 'socket', label: 'Socket', fieldType: 'select', options: SOCKETS },
            { key: 'cores', label: 'Min Cores', fieldType: 'range', min: 2, max: 32, step: 2, unit: '' },
            { key: 'threads', label: 'Min Threads', fieldType: 'range', min: 2, max: 64, step: 2, unit: '' },
        ];
        case 'GPU': return [
            { key: 'brand', label: 'Brand', fieldType: 'select', dynamic: 'brand' },
            { key: 'vram', label: 'VRAM (GB)', fieldType: 'select', options: VRAM_SIZES },
        ];
        case 'MOTHERBOARD': return [
            { key: 'brand', label: 'Brand', fieldType: 'select', dynamic: 'brand' },
            { key: 'socket', label: 'Socket', fieldType: 'select', options: SOCKETS },
            { key: 'formFactor', label: 'Form Factor', fieldType: 'select', options: FORM_FACTORS },
            { key: 'supportedRamType', label: 'RAM Type', fieldType: 'select', options: RAM_TYPES },
        ];
        case 'RAM': return [
            { key: 'brand', label: 'Brand', fieldType: 'select', dynamic: 'brand' },
            { key: 'type', label: 'Type', fieldType: 'select', options: RAM_TYPES },
            { key: 'capacityGb', label: 'Capacity (GB)', fieldType: 'select', options: RAM_CAPACITIES },
            { key: 'speedMhz', label: 'Min Speed', fieldType: 'range', min: 2133, max: 8000, step: 100, unit: ' MHz' },
        ];
        case 'PSU': return [
            { key: 'brand', label: 'Brand', fieldType: 'select', dynamic: 'brand' },
            { key: 'wattage', label: 'Min Wattage', fieldType: 'range', min: 300, max: 1600, step: 50, unit: ' W' },
            { key: 'efficiencyRating', label: 'Efficiency', fieldType: 'select', options: PSU_RATINGS },
        ];
        case 'CASE': return [
            { key: 'brand', label: 'Brand', fieldType: 'select', dynamic: 'brand' },
            { key: 'supportedFormFactor', label: 'Form Factor', fieldType: 'select', options: FORM_FACTORS },
        ];
        case 'STORAGE': return [
            { key: 'brand', label: 'Brand', fieldType: 'select', dynamic: 'brand' },
            { key: 'storageType', label: 'Type', fieldType: 'select', options: STORAGE_TYPES },
            { key: 'interfaceType', label: 'Interface', fieldType: 'select', options: STORAGE_INTERFACES },
            { key: 'capacityGb', label: 'Min Capacity', fieldType: 'range', min: 120, max: 8000, step: 10, unit: ' GB' },
        ];
        case 'COOLER': return [
            { key: 'brand', label: 'Brand', fieldType: 'select', dynamic: 'brand' },
            { key: 'coolerType', label: 'Type', fieldType: 'select', options: COOLER_TYPES },
        ];
        default: return [];
    }
}

// ---- Search ----
let searchTimeout;
document.getElementById('search-name').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentSearch = e.target.value.trim();
        currentPage = 0;
        loadComponents();
    }, 300);
});

// ---- Compare ----
window.compareComponent = function(id) {
    window.location.href = `/pages/compare.html?id=${id}`;
};

// ---- Sort controls ----
function updateSortButtons() {
    document.querySelectorAll('.components-toolbar .sort-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sort === currentSortBy && btn.dataset.dir === currentSortDir);
    });
}

document.querySelectorAll('.components-toolbar .sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        currentSortBy = btn.dataset.sort;
        currentSortDir = btn.dataset.dir;
        currentPage = 0;
        updateSortButtons();
        loadComponents();
    });
});

// ---- Price range filter ----
let priceFilterTimeout;
document.getElementById('price-min').addEventListener('input', (e) => {
    clearTimeout(priceFilterTimeout);
    priceFilterTimeout = setTimeout(() => {
        const val = e.target.value;
        currentMinPrice = val !== '' ? parseFloat(val) : null;
        currentPage = 0;
        loadComponents();
    }, 400);
});

document.getElementById('price-max').addEventListener('input', (e) => {
    clearTimeout(priceFilterTimeout);
    priceFilterTimeout = setTimeout(() => {
        const val = e.target.value;
        currentMaxPrice = val !== '' ? parseFloat(val) : null;
        currentPage = 0;
        loadComponents();
    }, 400);
});

// ---- Init ----
updateSortButtons();
loadComponents();


// ---- Navigate to component detail page ----
window.viewComponent = function(id) {
    window.location.href = `/pages/component.html?id=${id}`;
};







