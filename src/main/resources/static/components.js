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
const PAGE_SIZE = 12;

// ---- Modal helpers ----
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
});
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlay.id); });
});

// ---- Load components with pagination ----
async function loadComponents() {
    const list = document.getElementById('components-list');
    list.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading components...</p></div>';

    try {
        const params = new URLSearchParams({
            page: currentPage,
            size: PAGE_SIZE,
            sortBy: 'name',
            sortDir: 'asc',
        });
        if (currentType) params.set('type', currentType);
        if (currentSearch) params.set('name', currentSearch);

        const data = await apiFetch(`/components/paged?${params}`);
        renderComponents(data.content);
        renderPagination(data);
    } catch (err) {
        list.innerHTML = `<div class="empty-state"><p>Error loading components: ${err.message}</p></div>`;
    }
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
        <div class="card">
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
                        <button class="btn btn-secondary btn-sm" onclick="editComponent(${c.id})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteComponent(${c.id})">Delete</button>
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
function showDetailFilters(type) {
    const categories = document.getElementById('filter-categories');
    const details = document.getElementById('filter-details');
    categories.classList.add('hidden');
    details.classList.remove('hidden');

    const container = document.getElementById('detail-filter-fields');
    const fields = getFilterFieldsForType(type);

    container.innerHTML = `<h4>${type} Filters</h4>` +
        fields.map(f => `
            <div class="detail-filter-group">
                <label>${f.label}</label>
                <input type="${f.inputType}" class="input filter-input" data-filter-key="${f.key}"
                    placeholder="${f.placeholder || ''}" ${f.step ? `step="${f.step}"` : ''}>
            </div>
        `).join('');

    // Note: detail-level filtering is client-side on the current page
    // For a production app you'd add server-side query params
}

function hideDetailFilters() {
    const categories = document.getElementById('filter-categories');
    const details = document.getElementById('filter-details');
    categories.classList.remove('hidden');
    details.classList.add('hidden');
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
    switch (type) {
        case 'CPU': return [
            { key: 'socket', label: 'Socket', inputType: 'text', placeholder: 'e.g. AM5' },
            { key: 'brand', label: 'Brand', inputType: 'text', placeholder: 'e.g. AMD' },
            { key: 'cores', label: 'Min Cores', inputType: 'number', placeholder: 'e.g. 8' },
            { key: 'threads', label: 'Min Threads', inputType: 'number', placeholder: 'e.g. 16' },
        ];
        case 'GPU': return [
            { key: 'brand', label: 'Brand', inputType: 'text', placeholder: 'e.g. NVIDIA' },
            { key: 'vram', label: 'Min VRAM (GB)', inputType: 'number', placeholder: 'e.g. 8' },
        ];
        case 'MOTHERBOARD': return [
            { key: 'socket', label: 'Socket', inputType: 'text', placeholder: 'e.g. AM5' },
            { key: 'formFactor', label: 'Form Factor', inputType: 'text', placeholder: 'e.g. ATX' },
            { key: 'supportedRamType', label: 'RAM Type', inputType: 'text', placeholder: 'e.g. DDR5' },
        ];
        case 'RAM': return [
            { key: 'type', label: 'Type', inputType: 'text', placeholder: 'e.g. DDR5' },
            { key: 'capacityGb', label: 'Min Capacity (GB)', inputType: 'number', placeholder: 'e.g. 16' },
            { key: 'speedMhz', label: 'Min Speed (MHz)', inputType: 'number', placeholder: 'e.g. 3200' },
        ];
        case 'PSU': return [
            { key: 'brand', label: 'Brand', inputType: 'text', placeholder: 'e.g. Corsair' },
            { key: 'wattage', label: 'Min Wattage', inputType: 'number', placeholder: 'e.g. 650' },
        ];
        case 'CASE': return [
            { key: 'brand', label: 'Brand', inputType: 'text', placeholder: 'e.g. NZXT' },
            { key: 'supportedFormFactor', label: 'Form Factor Support', inputType: 'text', placeholder: 'e.g. ATX' },
        ];
        case 'STORAGE': return [
            { key: 'storageType', label: 'Type', inputType: 'text', placeholder: 'e.g. NVMe' },
            { key: 'interfaceType', label: 'Interface', inputType: 'text', placeholder: 'e.g. M.2' },
            { key: 'capacityGb', label: 'Min Capacity (GB)', inputType: 'number', placeholder: 'e.g. 500' },
        ];
        case 'COOLER': return [
            { key: 'coolerType', label: 'Type', inputType: 'text', placeholder: 'e.g. AIO Liquid' },
            { key: 'brand', label: 'Brand', inputType: 'text', placeholder: 'e.g. NZXT' },
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

// ---- Component CRUD ----
document.getElementById('btn-add-component').addEventListener('click', () => {
    document.getElementById('component-modal-title').textContent = 'Add Component';
    document.getElementById('component-form').reset();
    document.getElementById('comp-edit-id').value = '';
    document.getElementById('detail-fields').innerHTML = '';
    document.getElementById('comp-submit-btn').textContent = 'Save';
    openModal('component-modal');
});

// Dynamic detail fields
document.getElementById('comp-type').addEventListener('change', (e) => {
    renderDetailFields(e.target.value, {});
});

function renderDetailFields(type, data) {
    const container = document.getElementById('detail-fields');
    const fields = getFieldsForType(type);
    if (fields.length === 0) { container.innerHTML = ''; return; }
    container.innerHTML = `<h4>${type} Details</h4>` +
        fields.map(f => `
            <div class="form-group">
                <label for="detail-${f.key}">${f.label}</label>
                <input type="${f.inputType}" id="detail-${f.key}" class="input"
                    ${f.step ? `step="${f.step}"` : ''} ${f.min != null ? `min="${f.min}"` : ''}
                    value="${data[f.key] != null ? data[f.key] : ''}">
            </div>
        `).join('');
}

function getFieldsForType(type) {
    switch (type) {
        case 'CPU': return [
            { key: 'cpuSocket', label: 'Socket', inputType: 'text' },
            { key: 'cpuCores', label: 'Cores', inputType: 'number', min: 1 },
            { key: 'cpuThreads', label: 'Threads', inputType: 'number', min: 1 },
            { key: 'cpuBaseClock', label: 'Base Clock (GHz)', inputType: 'number', step: '0.01', min: 0 },
            { key: 'cpuBoostClock', label: 'Boost Clock (GHz)', inputType: 'number', step: '0.01', min: 0 },
        ];
        case 'GPU': return [
            { key: 'gpuVram', label: 'VRAM (GB)', inputType: 'number', min: 1 },
            { key: 'gpuLengthMm', label: 'Length (mm)', inputType: 'number', min: 1 },
            { key: 'gpuRecommendedPsu', label: 'Recommended PSU (W)', inputType: 'number', min: 1 },
            { key: 'gpuPerformanceScore', label: 'Performance Score', inputType: 'number', min: 0 },
        ];
        case 'MOTHERBOARD': return [
            { key: 'mbSocket', label: 'CPU Socket', inputType: 'text' },
            { key: 'mbChipset', label: 'Chipset', inputType: 'text' },
            { key: 'mbFormFactor', label: 'Form Factor', inputType: 'text' },
            { key: 'mbSupportedRamType', label: 'Supported RAM Type', inputType: 'text' },
            { key: 'mbRamSlots', label: 'RAM Slots', inputType: 'number', min: 1 },
            { key: 'mbM2Slots', label: 'M.2 Slots', inputType: 'number', min: 0 },
            { key: 'mbSataConnectors', label: 'SATA Connectors', inputType: 'number', min: 0 },
        ];
        case 'RAM': return [
            { key: 'ramCapacityGb', label: 'Capacity (GB)', inputType: 'number', min: 1 },
            { key: 'ramType', label: 'Type (DDR4/DDR5)', inputType: 'text' },
            { key: 'ramSpeedMhz', label: 'Speed (MHz)', inputType: 'number', min: 1 },
        ];
        case 'PSU': return [
            { key: 'psuWattage', label: 'Wattage (W)', inputType: 'number', min: 1 },
            { key: 'psuEfficiencyRating', label: 'Efficiency Rating', inputType: 'text' },
        ];
        case 'CASE': return [
            { key: 'caseSupportedFormFactor', label: 'Supported Form Factors', inputType: 'text' },
            { key: 'caseMaxGpuLengthMm', label: 'Max GPU Length (mm)', inputType: 'number', min: 1 },
        ];
        case 'STORAGE': return [
            { key: 'storageCapacityGb', label: 'Capacity (GB)', inputType: 'number', min: 1 },
            { key: 'storageType', label: 'Type (HDD/SSD/NVMe)', inputType: 'text' },
            { key: 'storageInterfaceType', label: 'Interface (SATA/M.2)', inputType: 'text' },
            { key: 'storageReadSpeedMbps', label: 'Read Speed (MB/s)', inputType: 'number', min: 0 },
            { key: 'storageWriteSpeedMbps', label: 'Write Speed (MB/s)', inputType: 'number', min: 0 },
        ];
        case 'COOLER': return [
            { key: 'coolerType', label: 'Cooler Type', inputType: 'text' },
            { key: 'coolerFanSizeMm', label: 'Fan Size (mm)', inputType: 'number', min: 1 },
            { key: 'coolerMaxTdp', label: 'Max TDP (W)', inputType: 'number', min: 1 },
            { key: 'coolerSupportedSockets', label: 'Supported Sockets', inputType: 'text' },
            { key: 'coolerNoiseLevel', label: 'Noise Level (dB)', inputType: 'number', min: 0 },
        ];
        default: return [];
    }
}

// Map from API response detail keys to request body keys
function detailsToRequestFields(type, details) {
    if (!details) return {};
    const map = {
        CPU: { socket: 'cpuSocket', cores: 'cpuCores', threads: 'cpuThreads', baseClock: 'cpuBaseClock', boostClock: 'cpuBoostClock' },
        GPU: { vram: 'gpuVram', lengthMm: 'gpuLengthMm', recommendedPsu: 'gpuRecommendedPsu', performanceScore: 'gpuPerformanceScore' },
        MOTHERBOARD: { socket: 'mbSocket', chipset: 'mbChipset', formFactor: 'mbFormFactor', supportedRamType: 'mbSupportedRamType', ramSlots: 'mbRamSlots', m2Slots: 'mbM2Slots', sataConnectors: 'mbSataConnectors' },
        RAM: { capacityGb: 'ramCapacityGb', type: 'ramType', speedMhz: 'ramSpeedMhz' },
        PSU: { wattage: 'psuWattage', efficiencyRating: 'psuEfficiencyRating' },
        CASE: { supportedFormFactor: 'caseSupportedFormFactor', maxGpuLengthMm: 'caseMaxGpuLengthMm' },
        STORAGE: { capacityGb: 'storageCapacityGb', storageType: 'storageType', interfaceType: 'storageInterfaceType', readSpeedMbps: 'storageReadSpeedMbps', writeSpeedMbps: 'storageWriteSpeedMbps' },
        COOLER: { coolerType: 'coolerType', fanSizeMm: 'coolerFanSizeMm', maxTdp: 'coolerMaxTdp', supportedSockets: 'coolerSupportedSockets', noiseLevel: 'coolerNoiseLevel' },
    };
    const result = {};
    const mapping = map[type] || {};
    for (const [apiKey, reqKey] of Object.entries(mapping)) {
        if (details[apiKey] != null) result[reqKey] = details[apiKey];
    }
    return result;
}

window.editComponent = async function(id) {
    try {
        const comp = await apiFetch(`/components/${id}`);
        document.getElementById('component-modal-title').textContent = 'Edit Component';
        document.getElementById('comp-edit-id').value = id;
        document.getElementById('comp-name').value = comp.name;
        document.getElementById('comp-brand').value = comp.brand;
        document.getElementById('comp-type').value = comp.type;
        document.getElementById('comp-price').value = comp.price || '';
        document.getElementById('comp-power').value = comp.powerConsumption || '';
        document.getElementById('comp-image').value = comp.imageUrl || '';
        document.getElementById('comp-submit-btn').textContent = 'Update';

        const mapped = detailsToRequestFields(comp.type, comp.details);
        renderDetailFields(comp.type, mapped);

        openModal('component-modal');
    } catch (err) {
        toast(err.message, 'error');
    }
};

window.deleteComponent = async function(id) {
    if (!confirm('Delete this component?')) return;
    try {
        await apiFetch(`/components/${id}`, { method: 'DELETE' });
        toast('Component deleted');
        loadComponents();
    } catch (err) {
        toast(err.message, 'error');
    }
};

document.getElementById('component-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('comp-edit-id').value;
    const type = document.getElementById('comp-type').value;

    const body = {
        name: document.getElementById('comp-name').value,
        brand: document.getElementById('comp-brand').value,
        type: type,
        price: parseFloat(document.getElementById('comp-price').value) || null,
        powerConsumption: parseInt(document.getElementById('comp-power').value) || null,
        imageUrl: document.getElementById('comp-image').value || null,
    };

    // Collect detail fields
    const fields = getFieldsForType(type);
    for (const f of fields) {
        const el = document.getElementById(`detail-${f.key}`);
        if (el && el.value !== '') {
            body[f.key] = f.inputType === 'number' ? (f.step ? parseFloat(el.value) : parseInt(el.value)) : el.value;
        }
    }

    try {
        if (editId) {
            await apiFetch(`/components/${editId}`, { method: 'PUT', body: JSON.stringify(body) });
            toast('Component updated');
        } else {
            await apiFetch('/components', { method: 'POST', body: JSON.stringify(body) });
            toast('Component created');
        }
        closeModal('component-modal');
        loadComponents();
    } catch (err) {
        toast(err.message, 'error');
    }
});

// ---- Init ----
loadComponents();



