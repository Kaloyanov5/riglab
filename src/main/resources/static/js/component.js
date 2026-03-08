// ===== RigLab Component Detail Page (component.html) =====
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

function formatDetailKey(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
}

// Friendly spec labels per component type
const specLabels = {
    // CPU
    socket: 'Socket',
    cores: 'Cores',
    threads: 'Threads',
    baseClock: 'Base Clock',
    boostClock: 'Boost Clock',
    // GPU
    vram: 'VRAM',
    lengthMm: 'Card Length',
    recommendedPsu: 'Recommended PSU',
    performanceScore: 'Performance Score',
    // Motherboard
    chipset: 'Chipset',
    formFactor: 'Form Factor',
    supportedRamType: 'Supported RAM',
    ramSlots: 'RAM Slots',
    m2Slots: 'M.2 Slots',
    sataConnectors: 'SATA Connectors',
    // RAM
    capacityGb: 'Capacity',
    type: 'Type',
    speedMhz: 'Speed',
    // PSU
    wattage: 'Wattage',
    efficiencyRating: 'Efficiency Rating',
    // Case
    supportedFormFactor: 'Supported Form Factors',
    maxGpuLengthMm: 'Max GPU Length',
    // Storage
    storageType: 'Storage Type',
    interfaceType: 'Interface',
    readSpeedMbps: 'Read Speed',
    writeSpeedMbps: 'Write Speed',
    // Cooler
    coolerType: 'Cooler Type',
    fanSizeMm: 'Fan Size',
    maxTdp: 'Max TDP',
    supportedSockets: 'Supported Sockets',
    noiseLevel: 'Noise Level',
};

// Units for spec values
const specUnits = {
    baseClock: ' GHz',
    boostClock: ' GHz',
    vram: ' GB',
    lengthMm: ' mm',
    recommendedPsu: ' W',
    capacityGb: ' GB',
    speedMhz: ' MHz',
    wattage: ' W',
    maxGpuLengthMm: ' mm',
    readSpeedMbps: ' MB/s',
    writeSpeedMbps: ' MB/s',
    fanSizeMm: ' mm',
    maxTdp: ' W',
    noiseLevel: ' dB',
};

// ---- Get component ID from URL ----
function getComponentId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// ---- Load and render ----
async function loadComponent() {
    const id = getComponentId();
    if (!id) {
        showError('No component ID specified.');
        return;
    }

    try {
        const comp = await apiFetch(`/components/${id}`);
        renderProduct(comp);
    } catch (err) {
        showError(err.message);
    }
}

function showError(msg) {
    document.getElementById('product-loading').classList.add('hidden');
    document.getElementById('product-content').classList.add('hidden');
    const errEl = document.getElementById('product-error');
    errEl.classList.remove('hidden');
    document.getElementById('product-error-msg').textContent = msg;
}

function renderProduct(c) {
    document.getElementById('product-loading').classList.add('hidden');
    document.getElementById('product-content').classList.remove('hidden');

    // Title
    document.title = `RigLab - ${c.name}`;

    // Image
    const img = document.getElementById('product-img');
    const placeholder = document.getElementById('product-img-placeholder');
    if (c.imageUrl) {
        img.src = c.imageUrl;
        img.alt = c.name;
        img.classList.remove('hidden');
        placeholder.classList.add('hidden');
        img.onerror = () => {
            img.classList.add('hidden');
            placeholder.classList.remove('hidden');
        };
    } else {
        img.classList.add('hidden');
        placeholder.classList.remove('hidden');
    }

    // Info
    const typeEl = document.getElementById('product-type');
    typeEl.textContent = c.type;
    typeEl.dataset.type = c.type;

    document.getElementById('product-name').textContent = c.name;
    document.getElementById('product-brand').textContent = c.brand;
    document.getElementById('product-price').textContent = formatPrice(c.price);

    // Specs table (include power/TDP if present)
    const hasDetails = c.details && Object.keys(c.details).length > 0;
    const hasPower = c.powerConsumption != null && c.powerConsumption > 0;

    if (hasDetails || hasPower) {
        const section = document.getElementById('product-specs-section');
        section.classList.remove('hidden');

        const tbody = document.getElementById('specs-tbody');
        let rows = '';

        if (hasPower) {
            rows += `<tr>
                <td class="spec-label">TDP / Power Consumption</td>
                <td class="spec-value">${c.powerConsumption} W</td>
            </tr>`;
        }

        if (hasDetails) {
            rows += Object.entries(c.details).map(([key, val]) => {
                const label = specLabels[key] || formatDetailKey(key);
                const unit = specUnits[key] || '';
                return `<tr>
                    <td class="spec-label">${esc(label)}</td>
                    <td class="spec-value">${esc(String(val))}${unit}</td>
                </tr>`;
            }).join('');
        }

        tbody.innerHTML = rows;
    }

    // Compare action
    document.getElementById('btn-product-compare').addEventListener('click', () => {
        window.location.href = `/pages/compare.html?id=${c.id}`;
    });
}

// ---- Init ----
loadComponent();


