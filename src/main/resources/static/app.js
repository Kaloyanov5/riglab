// ===== RigLab Build Configurator (index.html) =====
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
    return price != null ? `$${price.toFixed(2)}` : '';
}

function esc(str) {
    const el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
}

// ---- State ----
const selections = {
    cpu: null, motherboard: null, gpu: null, psu: null, case: null, cooler: null,
    'ram-0': null, 'ram-1': null, 'ram-2': null, 'ram-3': null,
    'storage-0': null, 'storage-1': null,
};

let componentsByType = {};
let incompatibleIds = new Set();

// ---- Load all components ----
async function loadAllComponents() {
    try {
        const all = await apiFetch('/components');
        componentsByType = {};
        for (const c of all) {
            if (!componentsByType[c.type]) componentsByType[c.type] = [];
            componentsByType[c.type].push(c);
        }
    } catch (err) {
        toast('Failed to load components: ' + err.message, 'error');
    }
}

// ---- Slot to type mapping ----
function slotToType(slot) {
    if (slot.startsWith('ram')) return 'RAM';
    if (slot.startsWith('storage')) return 'STORAGE';
    const map = { cpu: 'CPU', motherboard: 'MOTHERBOARD', gpu: 'GPU', psu: 'PSU', case: 'CASE', cooler: 'COOLER' };
    return map[slot];
}

// ---- Compatibility check ----
async function checkCompatibility() {
    const buildReq = buildCurrentRequest();
    try {
        const result = await apiFetch('/builds/check-compatibility', {
            method: 'POST',
            body: JSON.stringify(buildReq),
        });
        return result;
    } catch {
        return { compatible: true, errors: [] };
    }
}

function buildCurrentRequest() {
    const ramIds = [];
    for (let i = 0; i < 4; i++) {
        if (selections[`ram-${i}`]) ramIds.push(selections[`ram-${i}`].id);
    }
    const storageIds = [];
    for (let i = 0; i < 2; i++) {
        if (selections[`storage-${i}`]) storageIds.push(selections[`storage-${i}`].id);
    }
    const coolerIds = selections.cooler ? [selections.cooler.id] : [];

    return {
        name: document.getElementById('build-name').value || 'My Build',
        cpuId: selections.cpu ? selections.cpu.id : null,
        gpuId: selections.gpu ? selections.gpu.id : null,
        motherboardId: selections.motherboard ? selections.motherboard.id : null,
        ramIds: ramIds.length > 0 ? ramIds : null,
        psuId: selections.psu ? selections.psu.id : null,
        caseId: selections.case ? selections.case.id : null,
        storageIds: storageIds.length > 0 ? storageIds : null,
        coolerIds: coolerIds.length > 0 ? coolerIds : null,
    };
}

// Check which specific component IDs are incompatible with current selections
async function updateIncompatibleComponents(slotBeingChanged, candidateType) {
    incompatibleIds = new Set();
    const candidates = componentsByType[candidateType] || [];
    const currentReq = buildCurrentRequest();

    // For each candidate, simulate adding it and check
    const checks = candidates.map(async (comp) => {
        const testReq = { ...currentReq };

        // Replace the slot being changed with this candidate
        if (slotBeingChanged === 'cpu') testReq.cpuId = comp.id;
        else if (slotBeingChanged === 'gpu') testReq.gpuId = comp.id;
        else if (slotBeingChanged === 'motherboard') testReq.motherboardId = comp.id;
        else if (slotBeingChanged === 'psu') testReq.psuId = comp.id;
        else if (slotBeingChanged === 'case') testReq.caseId = comp.id;
        else if (slotBeingChanged === 'cooler') testReq.coolerIds = [comp.id];
        else if (slotBeingChanged.startsWith('ram')) {
            const idx = parseInt(slotBeingChanged.split('-')[1]);
            const ramIds = [];
            for (let i = 0; i < 4; i++) {
                if (i === idx) ramIds.push(comp.id);
                else if (selections[`ram-${i}`]) ramIds.push(selections[`ram-${i}`].id);
            }
            testReq.ramIds = ramIds.length > 0 ? ramIds : null;
        } else if (slotBeingChanged.startsWith('storage')) {
            const idx = parseInt(slotBeingChanged.split('-')[1]);
            const storageIds = [];
            for (let i = 0; i < 2; i++) {
                if (i === idx) storageIds.push(comp.id);
                else if (selections[`storage-${i}`]) storageIds.push(selections[`storage-${i}`].id);
            }
            testReq.storageIds = storageIds.length > 0 ? storageIds : null;
        }

        // Need at minimum something to check against
        if (!testReq.cpuId && !testReq.motherboardId) return;

        try {
            const result = await apiFetch('/builds/check-compatibility', {
                method: 'POST',
                body: JSON.stringify(testReq),
            });
            if (!result.compatible) {
                incompatibleIds.add(comp.id);
            }
        } catch {
            // ignore
        }
    });

    await Promise.all(checks);
}

// ---- Dropdown rendering ----
function getComponentMeta(comp) {
    if (!comp.details) return comp.brand;
    const parts = [comp.brand];
    const d = comp.details;
    if (d.socket) parts.push(d.socket);
    if (d.cores) parts.push(d.cores + ' cores');
    if (d.vram) parts.push(d.vram + 'GB VRAM');
    if (d.formFactor) parts.push(d.formFactor);
    if (d.supportedRamType) parts.push(d.supportedRamType);
    if (d.capacityGb) parts.push(d.capacityGb + 'GB');
    if (d.type) parts.push(d.type);
    if (d.speedMhz) parts.push(d.speedMhz + 'MHz');
    if (d.wattage) parts.push(d.wattage + 'W');
    if (d.efficiencyRating) parts.push(d.efficiencyRating);
    if (d.storageType) parts.push(d.storageType);
    if (d.interfaceType) parts.push(d.interfaceType);
    if (d.coolerType) parts.push(d.coolerType);
    if (d.supportedFormFactor) parts.push(d.supportedFormFactor);
    if (d.maxGpuLengthMm) parts.push('Max GPU ' + d.maxGpuLengthMm + 'mm');
    return parts.join(' · ');
}

function renderDropdownOptions(panel, components, slot) {
    let html = `<div class="dropdown-search"><input type="text" placeholder="Search..." data-slot="${slot}"></div>`;

    if (components.length === 0) {
        html += '<div class="dropdown-none">No components available</div>';
    } else {
        for (const c of components) {
            const isIncompat = incompatibleIds.has(c.id);
            const cls = isIncompat ? 'dropdown-option incompatible' : 'dropdown-option';
            const imgHtml = c.imageUrl
                ? `<img class="opt-img" src="${esc(c.imageUrl)}" alt="" onerror="this.outerHTML='<div class=\\'opt-img-placeholder\\'>&#128187;</div>'">`
                : '<div class="opt-img-placeholder">&#128187;</div>';

            html += `<div class="${cls}" data-id="${c.id}" data-slot="${slot}" ${isIncompat ? '' : ''}>
                ${imgHtml}
                <div class="opt-info">
                    <div class="opt-name">${esc(c.name)}</div>
                    <div class="opt-meta">${esc(getComponentMeta(c))}</div>
                </div>
                <div class="opt-price">${formatPrice(c.price)}</div>
                ${isIncompat ? '<span class="opt-incompat-badge">Incompatible</span>' : ''}
            </div>`;
        }
    }

    panel.innerHTML = html;

    // Search within dropdown
    const searchInput = panel.querySelector('.dropdown-search input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const q = searchInput.value.toLowerCase();
            panel.querySelectorAll('.dropdown-option').forEach(opt => {
                const name = opt.querySelector('.opt-name').textContent.toLowerCase();
                const meta = opt.querySelector('.opt-meta').textContent.toLowerCase();
                opt.style.display = (name.includes(q) || meta.includes(q)) ? '' : 'none';
            });
        });
        setTimeout(() => searchInput.focus(), 50);
    }

    // Click handlers
    panel.querySelectorAll('.dropdown-option:not(.incompatible)').forEach(opt => {
        opt.addEventListener('click', () => {
            const compId = parseInt(opt.dataset.id);
            const compSlot = opt.dataset.slot;
            const type = slotToType(compSlot);
            const comp = (componentsByType[type] || []).find(c => c.id === compId);
            if (comp) selectComponent(compSlot, comp);
        });
    });
}

function updateTriggerDisplay(slot) {
    const comp = selections[slot];
    const trigger = document.querySelector(`#dropdown-${slot} .dropdown-trigger`);
    if (!trigger) return;

    if (!comp) {
        const type = slotToType(slot);
        const isRam = slot.startsWith('ram');
        const isLocked = isRam && !selections.motherboard;
        let placeholder = `Select ${type}...`;
        if (slot === 'gpu' || slot.startsWith('storage') || slot === 'cooler') placeholder = `Select ${type} (optional)...`;
        if (isLocked && slot === 'ram-0') placeholder = 'Select motherboard first...';
        else if (isRam && slot !== 'ram-0') placeholder = 'Select RAM (optional)...';

        trigger.innerHTML = `<span class="dropdown-placeholder">${placeholder}</span>`;
        trigger.disabled = isLocked;
    } else {
        const imgHtml = comp.imageUrl
            ? `<img class="comp-thumb" src="${esc(comp.imageUrl)}" alt="" onerror="this.outerHTML='<div class=\\'comp-thumb-placeholder\\'>&#128187;</div>'">`
            : '<div class="comp-thumb-placeholder">&#128187;</div>';

        trigger.innerHTML = `
            ${imgHtml}
            <div class="comp-info">
                <div class="comp-title">${esc(comp.name)}</div>
                <div class="comp-sub">${esc(getComponentMeta(comp))}</div>
            </div>
            <button class="dropdown-clear" title="Clear selection">&times;</button>
        `;
        trigger.disabled = false;

        // Clear button
        trigger.querySelector('.dropdown-clear').addEventListener('click', (e) => {
            e.stopPropagation();
            clearSelection(slot);
        });
    }
}

// ---- Selection logic ----
function selectComponent(slot, comp) {
    selections[slot] = comp;
    updateTriggerDisplay(slot);
    closeAllDropdowns();

    // Update price
    const priceEl = document.getElementById(`price-${slot}`);
    if (priceEl) priceEl.textContent = comp.price ? formatPrice(comp.price) : '—';

    // If motherboard selected, unlock RAM
    if (slot === 'motherboard') {
        unlockRam();
    }

    // If first RAM selected, show extra RAM slots
    if (slot === 'ram-0' && comp) {
        showExtraRamSlots();
    }

    updateTotals();
}

function clearSelection(slot) {
    selections[slot] = null;
    updateTriggerDisplay(slot);

    const priceEl = document.getElementById(`price-${slot}`);
    if (priceEl) priceEl.textContent = '—';

    // If motherboard cleared, lock RAM and clear RAM selections
    if (slot === 'motherboard') {
        lockRam();
    }

    // If first RAM cleared, hide extra and clear them
    if (slot === 'ram-0') {
        for (let i = 1; i <= 3; i++) {
            selections[`ram-${i}`] = null;
            updateTriggerDisplay(`ram-${i}`);
            const rp = document.getElementById(`price-ram-${i}`);
            if (rp) rp.textContent = '—';
        }
        hideExtraRamSlots();
    }

    updateTotals();
}

function unlockRam() {
    const lockMsg = document.getElementById('ram-lock-msg');
    if (lockMsg) lockMsg.style.display = 'none';

    const trigger = document.querySelector('#dropdown-ram-0 .dropdown-trigger');
    if (trigger) {
        trigger.disabled = false;
        if (!selections['ram-0']) {
            trigger.innerHTML = '<span class="dropdown-placeholder">Select RAM...</span>';
        }
    }
}

function lockRam() {
    const lockMsg = document.getElementById('ram-lock-msg');
    if (lockMsg) lockMsg.style.display = '';

    for (let i = 0; i < 4; i++) {
        selections[`ram-${i}`] = null;
        updateTriggerDisplay(`ram-${i}`);
        const rp = document.getElementById(`price-ram-${i}`);
        if (rp) rp.textContent = '—';
    }

    const trigger = document.querySelector('#dropdown-ram-0 .dropdown-trigger');
    if (trigger) {
        trigger.disabled = true;
        trigger.innerHTML = '<span class="dropdown-placeholder">Select motherboard first...</span>';
    }

    hideExtraRamSlots();
}

function showExtraRamSlots() {
    document.querySelectorAll('.ram-extra').forEach(el => el.classList.remove('hidden'));
}

function hideExtraRamSlots() {
    document.querySelectorAll('.ram-extra').forEach(el => el.classList.add('hidden'));
}

function updateTotals() {
    let totalPrice = 0;
    let totalPower = 0;

    for (const [, comp] of Object.entries(selections)) {
        if (comp) {
            if (comp.price) totalPrice += comp.price;
            if (comp.powerConsumption) totalPower += comp.powerConsumption;
        }
    }

    document.getElementById('total-price').textContent = `$${totalPrice.toFixed(2)}`;
    document.getElementById('total-power').textContent = `${totalPower}W`;
}

// ---- Dropdown open/close ----
function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-panel').forEach(p => p.classList.add('hidden'));
}

async function openDropdown(slot) {
    closeAllDropdowns();
    const type = slotToType(slot);
    const panel = document.querySelector(`#dropdown-${slot} .dropdown-panel`);
    if (!panel) return;

    // Check if RAM is locked
    if (slot.startsWith('ram') && !selections.motherboard) return;

    const components = componentsByType[type] || [];

    // Run compatibility checks
    await updateIncompatibleComponents(slot, type);

    renderDropdownOptions(panel, components, slot);

    // Determine if dropdown should open upward or downward
    panel.classList.remove('drop-up');
    panel.classList.remove('hidden');

    const trigger = document.querySelector(`#dropdown-${slot} .dropdown-trigger`);
    if (trigger) {
        const triggerRect = trigger.getBoundingClientRect();
        const spaceBelow = window.innerHeight - triggerRect.bottom;
        const panelHeight = Math.min(panel.scrollHeight, 320);
        if (spaceBelow < panelHeight + 20 && triggerRect.top > panelHeight) {
            panel.classList.add('drop-up');
        }
    }
}

// Event: trigger clicks
document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.dropdown-trigger');
    if (trigger && !trigger.disabled) {
        const slot = trigger.dataset.slot;
        const panel = document.querySelector(`#dropdown-${slot} .dropdown-panel`);
        if (panel && !panel.classList.contains('hidden')) {
            closeAllDropdowns();
        } else {
            openDropdown(slot);
        }
        return;
    }

    // Close dropdowns when clicking outside
    if (!e.target.closest('.custom-dropdown')) {
        closeAllDropdowns();
    }
});

// ---- Save build ----
document.getElementById('btn-save-build').addEventListener('click', async () => {
    const req = buildCurrentRequest();

    if (!req.cpuId || !req.motherboardId || !req.psuId || !req.caseId || !req.ramIds || req.ramIds.length === 0) {
        toast('Please select at least CPU, Motherboard, RAM, PSU, and Case.', 'error');
        return;
    }

    // Ensure ramIds/storageIds/coolerIds are arrays
    if (!req.ramIds) req.ramIds = [];
    if (!req.storageIds) req.storageIds = [];
    if (!req.coolerIds) req.coolerIds = [];

    try {
        await apiFetch('/builds', { method: 'POST', body: JSON.stringify(req) });
        toast('Build saved successfully!');
    } catch (err) {
        toast(err.message, 'error');
    }
});

// ---- Init ----
(async function init() {
    await loadAllComponents();
})();
