// ===== RigLab Compare Page (compare.html) =====
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

// Friendly spec labels
const specLabels = {
    socket: 'Socket', cores: 'Cores', threads: 'Threads',
    baseClock: 'Base Clock', boostClock: 'Boost Clock',
    vram: 'VRAM', lengthMm: 'Card Length',
    recommendedPsu: 'Recommended PSU', performanceScore: 'Performance Score',
    chipset: 'Chipset', formFactor: 'Form Factor',
    supportedRamType: 'Supported RAM', ramSlots: 'RAM Slots',
    m2Slots: 'M.2 Slots', sataConnectors: 'SATA Connectors',
    capacityGb: 'Capacity', type: 'Type', speedMhz: 'Speed',
    wattage: 'Wattage', efficiencyRating: 'Efficiency Rating',
    supportedFormFactor: 'Supported Form Factors', maxGpuLengthMm: 'Max GPU Length',
    storageType: 'Storage Type', interfaceType: 'Interface',
    readSpeedMbps: 'Read Speed', writeSpeedMbps: 'Write Speed',
    coolerType: 'Cooler Type', fanSizeMm: 'Fan Size',
    maxTdp: 'Max TDP', supportedSockets: 'Supported Sockets',
    noiseLevel: 'Noise Level',
};

const specUnits = {
    baseClock: ' GHz', boostClock: ' GHz', vram: ' GB',
    lengthMm: ' mm', recommendedPsu: ' W', capacityGb: ' GB',
    speedMhz: ' MHz', wattage: ' W', maxGpuLengthMm: ' mm',
    readSpeedMbps: ' MB/s', writeSpeedMbps: ' MB/s',
    fanSizeMm: ' mm', maxTdp: ' W', noiseLevel: ' dB',
};

// Numeric spec keys for comparison highlighting
const numericSpecs = new Set([
    'cores', 'threads', 'baseClock', 'boostClock', 'vram', 'lengthMm',
    'recommendedPsu', 'performanceScore', 'ramSlots', 'm2Slots', 'sataConnectors',
    'capacityGb', 'speedMhz', 'wattage', 'maxGpuLengthMm',
    'readSpeedMbps', 'writeSpeedMbps', 'fanSizeMm', 'maxTdp',
]);

// Lower is better for these
const lowerIsBetter = new Set(['noiseLevel', 'recommendedPsu']);

// ---- State ----
let componentA = null;
let componentB = null;
let sameTypeComponents = [];

// ---- Get component ID from URL ----
function getComponentId() {
    return new URLSearchParams(window.location.search).get('id');
}

// ---- Load ----
async function init() {
    const id = getComponentId();
    if (!id) {
        showError('No component ID specified.');
        return;
    }

    try {
        componentA = await apiFetch(`/components/${id}`);
        renderCardA(componentA);

        // Fetch all components of same type for the selector
        const allSameType = await apiFetch(`/components/type/${componentA.type}`);
        sameTypeComponents = allSameType.filter(c => c.id !== componentA.id);
        populateSelector(sameTypeComponents);

        document.getElementById('compare-loading').classList.add('hidden');
        document.getElementById('compare-content').classList.remove('hidden');
    } catch (err) {
        showError(err.message);
    }
}

function showError(msg) {
    document.getElementById('compare-loading').classList.add('hidden');
    document.getElementById('compare-content').classList.add('hidden');
    const errEl = document.getElementById('compare-error');
    errEl.classList.remove('hidden');
    document.getElementById('compare-error-msg').textContent = msg;
}

// ---- Render Component A ----
function renderCardA(c) {
    document.title = `RigLab - Compare ${c.name}`;

    const img = document.getElementById('compare-img-a');
    const placeholder = document.getElementById('compare-img-placeholder-a');
    if (c.imageUrl) {
        img.src = c.imageUrl;
        img.alt = c.name;
        img.classList.remove('hidden');
        placeholder.classList.add('hidden');
        img.onerror = () => { img.classList.add('hidden'); placeholder.classList.remove('hidden'); };
    } else {
        img.classList.add('hidden');
        placeholder.classList.remove('hidden');
    }

    const typeEl = document.getElementById('compare-type-a');
    typeEl.textContent = c.type;
    typeEl.dataset.type = c.type;
    document.getElementById('compare-name-a').textContent = c.name;
    document.getElementById('compare-brand-a').textContent = c.brand;
    document.getElementById('compare-price-a').textContent = formatPrice(c.price);
}

// ---- Populate selector ----
function populateSelector(components) {
    const select = document.getElementById('compare-select-b');
    select.innerHTML = '<option value="">-- Choose a component --</option>';
    components.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.brand} ${c.name} — ${formatPrice(c.price)}`;
        select.appendChild(opt);
    });
}

// ---- Handle B selection ----
document.getElementById('compare-select-b').addEventListener('change', async (e) => {
    const id = e.target.value;
    if (!id) {
        componentB = null;
        document.getElementById('compare-b-info').classList.add('hidden');
        document.getElementById('compare-img-b').classList.add('hidden');
        document.getElementById('compare-img-placeholder-b').classList.remove('hidden');
        document.getElementById('compare-specs-section').classList.add('hidden');
        return;
    }

    try {
        componentB = await apiFetch(`/components/${id}`);
        renderCardB(componentB);
        renderSpecsComparison();
    } catch (err) {
        toast(err.message, 'error');
    }
});

// ---- Render Component B ----
function renderCardB(c) {
    const img = document.getElementById('compare-img-b');
    const placeholder = document.getElementById('compare-img-placeholder-b');
    if (c.imageUrl) {
        img.src = c.imageUrl;
        img.alt = c.name;
        img.classList.remove('hidden');
        placeholder.classList.add('hidden');
        img.onerror = () => { img.classList.add('hidden'); placeholder.classList.remove('hidden'); };
    } else {
        img.classList.add('hidden');
        placeholder.classList.remove('hidden');
    }

    const info = document.getElementById('compare-b-info');
    info.classList.remove('hidden');

    const typeEl = document.getElementById('compare-type-b');
    typeEl.textContent = c.type;
    typeEl.dataset.type = c.type;
    document.getElementById('compare-name-b').textContent = c.name;
    document.getElementById('compare-brand-b').textContent = c.brand;
    document.getElementById('compare-price-b').textContent = formatPrice(c.price);
}

// ---- Render specs comparison table ----
function renderSpecsComparison() {
    if (!componentA || !componentB) return;

    const section = document.getElementById('compare-specs-section');
    section.classList.remove('hidden');

    document.getElementById('compare-th-a').textContent = componentA.name;
    document.getElementById('compare-th-b').textContent = componentB.name;

    const detailsA = componentA.details || {};
    const detailsB = componentB.details || {};

    // Collect all spec keys
    const allKeys = new Set([...Object.keys(detailsA), ...Object.keys(detailsB)]);

    // Add power consumption as a spec row
    const hasPowerA = componentA.powerConsumption != null && componentA.powerConsumption > 0;
    const hasPowerB = componentB.powerConsumption != null && componentB.powerConsumption > 0;

    let rows = '';

    // Price row
    rows += buildCompareRow('Price', formatPrice(componentA.price), formatPrice(componentB.price), 'price');

    // Power/TDP row
    if (hasPowerA || hasPowerB) {
        const valA = hasPowerA ? componentA.powerConsumption + ' W' : '—';
        const valB = hasPowerB ? componentB.powerConsumption + ' W' : '—';
        const numA = hasPowerA ? componentA.powerConsumption : null;
        const numB = hasPowerB ? componentB.powerConsumption : null;
        rows += buildNumericCompareRow('TDP / Power', valA, valB, numA, numB, true);
    }

    // Detail spec rows
    allKeys.forEach(key => {
        const label = specLabels[key] || formatDetailKey(key);
        const unit = specUnits[key] || '';
        const rawA = detailsA[key];
        const rawB = detailsB[key];
        const valA = rawA != null ? String(rawA) + unit : '—';
        const valB = rawB != null ? String(rawB) + unit : '—';

        if (numericSpecs.has(key) || lowerIsBetter.has(key)) {
            const numA = rawA != null ? Number(rawA) : null;
            const numB = rawB != null ? Number(rawB) : null;
            rows += buildNumericCompareRow(label, valA, valB, numA, numB, lowerIsBetter.has(key));
        } else {
            rows += buildCompareRow(label, valA, valB);
        }
    });

    document.getElementById('compare-specs-tbody').innerHTML = rows;
}

function buildCompareRow(label, valA, valB, extraClass) {
    const match = valA === valB && valA !== '—';
    return `<tr>
        <td class="spec-label">${esc(label)}</td>
        <td class="spec-value ${extraClass || ''}">${valA}</td>
        <td class="spec-value ${extraClass || ''}">${valB}</td>
    </tr>`;
}

function buildNumericCompareRow(label, displayA, displayB, numA, numB, lowerBetter) {
    let classA = '';
    let classB = '';

    if (numA != null && numB != null && numA !== numB) {
        if (lowerBetter) {
            classA = numA < numB ? 'spec-winner' : 'spec-loser';
            classB = numB < numA ? 'spec-winner' : 'spec-loser';
        } else {
            classA = numA > numB ? 'spec-winner' : 'spec-loser';
            classB = numB > numA ? 'spec-winner' : 'spec-loser';
        }
    }

    return `<tr>
        <td class="spec-label">${esc(label)}</td>
        <td class="spec-value ${classA}">${displayA}</td>
        <td class="spec-value ${classB}">${displayB}</td>
    </tr>`;
}

// ---- Init ----
init();

