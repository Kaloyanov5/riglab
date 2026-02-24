// ===== API Base =====
const API = '/api';

// ===== Utility =====
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

// ===== Tab Navigation =====
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');

        if (btn.dataset.tab === 'builds') loadBuilds();
        if (btn.dataset.tab === 'components') loadComponents();
    });
});

// ===== Modal Helpers =====
function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
});

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal(overlay.id);
    });
});

// ===================================================================
//  COMPONENTS
// ===================================================================

let allComponents = [];

async function loadComponents() {
    const list = document.getElementById('components-list');
    list.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading components...</p></div>';

    try {
        const type = document.getElementById('filter-type').value;
        const name = document.getElementById('search-name').value.trim();

        let components;
        if (name) {
            components = await apiFetch(`/components/search?name=${encodeURIComponent(name)}`);
            if (type) components = components.filter(c => c.type === type);
        } else if (type) {
            components = await apiFetch(`/components/type/${type}`);
        } else {
            components = await apiFetch('/components');
        }
        allComponents = components;
        renderComponents(components);
    } catch (err) {
        list.innerHTML = `<div class="empty-state"><p>Error loading components: ${err.message}</p></div>`;
    }
}

function renderComponents(components) {
    const list = document.getElementById('components-list');
    if (components.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">&#128187;</div>
                <p>No components found. Add your first component!</p>
            </div>`;
        return;
    }

    list.innerHTML = components.map(c => `
        <div class="card">
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

function esc(str) {
    const el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
}

// ===== Filter / Search =====
document.getElementById('filter-type').addEventListener('change', loadComponents);

let searchTimeout;
document.getElementById('search-name').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(loadComponents, 300);
});

// ===== Component CRUD =====
document.getElementById('btn-add-component').addEventListener('click', () => {
    document.getElementById('component-modal-title').textContent = 'Add Component';
    document.getElementById('component-form').reset();
    document.getElementById('comp-edit-id').value = '';
    document.getElementById('detail-fields').innerHTML = '';
    document.getElementById('comp-submit-btn').textContent = 'Save';
    openModal('component-modal');
});

// Dynamic detail fields based on type selection
document.getElementById('comp-type').addEventListener('change', (e) => {
    renderDetailFields(e.target.value, {});
});

function renderDetailFields(type, data) {
    const container = document.getElementById('detail-fields');
    const fields = getFieldsForType(type);
    if (fields.length === 0) {
        container.innerHTML = '';
        return;
    }
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

async function editComponent(id) {
    try {
        const comp = await apiFetch(`/components/${id}`);
        document.getElementById('component-modal-title').textContent = 'Edit Component';
        document.getElementById('comp-edit-id').value = id;
        document.getElementById('comp-name').value = comp.name;
        document.getElementById('comp-brand').value = comp.brand;
        document.getElementById('comp-type').value = comp.type;
        document.getElementById('comp-price').value = comp.price || '';
        document.getElementById('comp-power').value = comp.powerConsumption || '';
        document.getElementById('comp-submit-btn').textContent = 'Update';

        const mapped = detailsToRequestFields(comp.type, comp.details);
        renderDetailFields(comp.type, mapped);

        openModal('component-modal');
    } catch (err) {
        toast(err.message, 'error');
    }
}

async function deleteComponent(id) {
    if (!confirm('Delete this component?')) return;
    try {
        await apiFetch(`/components/${id}`, { method: 'DELETE' });
        toast('Component deleted');
        loadComponents();
    } catch (err) {
        toast(err.message, 'error');
    }
}

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

// ===================================================================
//  BUILDS
// ===================================================================

async function loadBuilds() {
    const list = document.getElementById('builds-list');
    list.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading builds...</p></div>';

    try {
        const builds = await apiFetch('/builds');
        renderBuilds(builds);
    } catch (err) {
        list.innerHTML = `<div class="empty-state"><p>Error loading builds: ${err.message}</p></div>`;
    }
}

function renderBuilds(builds) {
    const list = document.getElementById('builds-list');
    if (builds.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">&#128296;</div>
                <p>No builds yet. Create your first PC build!</p>
            </div>`;
        return;
    }

    list.innerHTML = builds.map(b => `
        <div class="card build-card" onclick="viewBuild(${b.id})">
            <div class="card-header">
                <h3>${esc(b.name)}</h3>
            </div>
            <div class="build-components">
                ${b.cpu ? `<span class="build-chip">CPU: ${esc(b.cpu.name)}</span>` : ''}
                ${b.gpu ? `<span class="build-chip">GPU: ${esc(b.gpu.name)}</span>` : ''}
                ${b.motherboard ? `<span class="build-chip">MB: ${esc(b.motherboard.name)}</span>` : ''}
                ${b.ramSticks.map(r => `<span class="build-chip">RAM: ${esc(r.name)}</span>`).join('')}
                ${b.psu ? `<span class="build-chip">PSU: ${esc(b.psu.name)}</span>` : ''}
                ${b.pcCase ? `<span class="build-chip">Case: ${esc(b.pcCase.name)}</span>` : ''}
                ${b.storageDevices.map(s => `<span class="build-chip">Storage: ${esc(s.name)}</span>`).join('')}
                ${b.coolers.map(c => `<span class="build-chip">Cooler: ${esc(c.name)}</span>`).join('')}
            </div>
            <div class="build-stats">
                <div class="build-stat">Total: <span style="color: var(--success)">${formatPrice(b.totalPrice)}</span></div>
                <div class="build-stat">Power: <span style="color: var(--warning)">${b.totalPowerConsumption || 0}W</span></div>
            </div>
            <div class="card-footer">
                <div></div>
                <div class="card-actions">
                    <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); editBuild(${b.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteBuild(${b.id})">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Populate build form selects
async function populateBuildSelects() {
    try {
        const components = await apiFetch('/components');
        const byType = {};
        for (const c of components) {
            if (!byType[c.type]) byType[c.type] = [];
            byType[c.type].push(c);
        }

        populateSelect('build-cpu', byType['CPU'] || [], true);
        populateSelect('build-gpu', byType['GPU'] || [], true);
        populateSelect('build-motherboard', byType['MOTHERBOARD'] || [], true);
        populateSelect('build-psu', byType['PSU'] || [], true);
        populateSelect('build-case', byType['CASE'] || [], true);
        populateSelect('build-ram', byType['RAM'] || [], false);
        populateSelect('build-storage', byType['STORAGE'] || [], false);
        populateSelect('build-cooler', byType['COOLER'] || [], false);
    } catch (err) {
        toast('Failed to load components for build form', 'error');
    }
}

function populateSelect(id, items, addEmpty) {
    const sel = document.getElementById(id);
    sel.innerHTML = '';
    if (addEmpty) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = '— Select —';
        sel.appendChild(opt);
    }
    for (const item of items) {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.textContent = `${item.name} (${item.brand}) ${item.price ? '- ' + formatPrice(item.price) : ''}`;
        sel.appendChild(opt);
    }
}

document.getElementById('btn-add-build').addEventListener('click', async () => {
    document.getElementById('build-modal-title').textContent = 'New Build';
    document.getElementById('build-form').reset();
    document.getElementById('build-edit-id').value = '';
    document.getElementById('build-submit-btn').textContent = 'Create Build';
    await populateBuildSelects();
    openModal('build-modal');
});

async function editBuild(id) {
    try {
        const build = await apiFetch(`/builds/${id}`);
        await populateBuildSelects();

        document.getElementById('build-modal-title').textContent = 'Edit Build';
        document.getElementById('build-edit-id').value = id;
        document.getElementById('build-name').value = build.name;
        document.getElementById('build-submit-btn').textContent = 'Update Build';

        if (build.cpu) document.getElementById('build-cpu').value = build.cpu.id;
        if (build.gpu) document.getElementById('build-gpu').value = build.gpu.id;
        if (build.motherboard) document.getElementById('build-motherboard').value = build.motherboard.id;
        if (build.psu) document.getElementById('build-psu').value = build.psu.id;
        if (build.pcCase) document.getElementById('build-case').value = build.pcCase.id;

        setMultiSelectValues('build-ram', build.ramSticks.map(r => r.id));
        setMultiSelectValues('build-storage', build.storageDevices.map(s => s.id));
        setMultiSelectValues('build-cooler', build.coolers.map(c => c.id));

        openModal('build-modal');
    } catch (err) {
        toast(err.message, 'error');
    }
}

function setMultiSelectValues(id, values) {
    const sel = document.getElementById(id);
    const valSet = new Set(values.map(String));
    for (const opt of sel.options) {
        opt.selected = valSet.has(opt.value);
    }
}

function getMultiSelectValues(id) {
    const sel = document.getElementById(id);
    return Array.from(sel.selectedOptions).map(o => parseInt(o.value)).filter(v => !isNaN(v));
}

async function deleteBuild(id) {
    if (!confirm('Delete this build?')) return;
    try {
        await apiFetch(`/builds/${id}`, { method: 'DELETE' });
        toast('Build deleted');
        loadBuilds();
    } catch (err) {
        toast(err.message, 'error');
    }
}

document.getElementById('build-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('build-edit-id').value;

    const body = {
        name: document.getElementById('build-name').value,
        cpuId: parseInt(document.getElementById('build-cpu').value) || null,
        gpuId: parseInt(document.getElementById('build-gpu').value) || null,
        motherboardId: parseInt(document.getElementById('build-motherboard').value) || null,
        ramIds: getMultiSelectValues('build-ram'),
        psuId: parseInt(document.getElementById('build-psu').value) || null,
        caseId: parseInt(document.getElementById('build-case').value) || null,
        storageIds: getMultiSelectValues('build-storage'),
        coolerIds: getMultiSelectValues('build-cooler'),
    };

    try {
        if (editId) {
            await apiFetch(`/builds/${editId}`, { method: 'PUT', body: JSON.stringify(body) });
            toast('Build updated');
        } else {
            await apiFetch('/builds', { method: 'POST', body: JSON.stringify(body) });
            toast('Build created');
        }
        closeModal('build-modal');
        loadBuilds();
    } catch (err) {
        toast(err.message, 'error');
    }
});

// ===== Build Detail View =====
async function viewBuild(id) {
    try {
        const b = await apiFetch(`/builds/${id}`);
        document.getElementById('build-detail-title').textContent = b.name;

        const body = document.getElementById('build-detail-body');
        body.innerHTML = `
            <div class="build-detail-summary">
                <div>
                    <div class="stat-label">Total Price</div>
                    <div class="stat-value price">${formatPrice(b.totalPrice)}</div>
                </div>
                <div>
                    <div class="stat-label">Power Draw</div>
                    <div class="stat-value power">${b.totalPowerConsumption || 0}W</div>
                </div>
            </div>

            ${renderBuildSection('CPU', b.cpu)}
            ${renderBuildSection('GPU', b.gpu)}
            ${renderBuildSection('Motherboard', b.motherboard)}
            ${renderBuildListSection('RAM', b.ramSticks)}
            ${renderBuildSection('PSU', b.psu)}
            ${renderBuildSection('Case', b.pcCase)}
            ${renderBuildListSection('Storage', b.storageDevices)}
            ${renderBuildListSection('Coolers', b.coolers)}
        `;

        openModal('build-detail-modal');
    } catch (err) {
        toast(err.message, 'error');
    }
}

function renderBuildSection(label, comp) {
    if (!comp) return '';
    return `
        <div class="build-detail-section">
            <h4>${label}</h4>
            ${renderBuildComponent(comp)}
        </div>`;
}

function renderBuildListSection(label, list) {
    if (!list || list.length === 0) return '';
    return `
        <div class="build-detail-section">
            <h4>${label}</h4>
            ${list.map(renderBuildComponent).join('')}
        </div>`;
}

function renderBuildComponent(comp) {
    const detailStr = comp.details
        ? Object.entries(comp.details).map(([k, v]) => `${formatDetailKey(k)}: ${v}`).join(' | ')
        : '';
    return `
        <div class="build-detail-component">
            <div class="comp-name">${esc(comp.name)} <small style="color:var(--text-muted)">${esc(comp.brand)}</small></div>
            <div class="comp-meta">
                ${comp.price ? formatPrice(comp.price) : ''}
                ${comp.powerConsumption ? ` &bull; ${comp.powerConsumption}W` : ''}
                ${detailStr ? ` &bull; ${esc(detailStr)}` : ''}
            </div>
        </div>`;
}

// ===== Init =====
loadComponents();
