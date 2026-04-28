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
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(
            data.message || (data.errors ? Object.values(data.errors).join(', ') : 'Request failed')
        );
        err.status = res.status;
        throw err;
    }
    return data;
}

function formatPrice(price) { return price != null ? `$${price.toFixed(2)}` : ''; }

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
// Map<id, { compatible: bool, reasons: string[] }> — populated per-dropdown when opened.
let candidateResults = new Map();

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

function slotToType(slot) {
    if (slot.startsWith('ram')) return 'RAM';
    if (slot.startsWith('storage')) return 'STORAGE';
    const map = { cpu: 'CPU', motherboard: 'MOTHERBOARD', gpu: 'GPU', psu: 'PSU', case: 'CASE', cooler: 'COOLER' };
    return map[slot];
}

function refreshIcons() {
    if (window.RigLab && window.RigLab.icons) window.RigLab.icons();
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

// ---- Live compatibility panel ----
async function refreshCompatibilityPanel() {
    const req = buildCurrentRequest();
    const hasAny = req.cpuId || req.gpuId || req.motherboardId || req.psuId || req.caseId
        || (req.ramIds && req.ramIds.length) || (req.storageIds && req.storageIds.length)
        || (req.coolerIds && req.coolerIds.length);

    const panel = document.getElementById('compat-panel');
    const ok = document.getElementById('compat-ok');
    if (!hasAny) { panel.classList.add('hidden'); ok.classList.add('hidden'); return; }

    try {
        const res = await apiFetch('/builds/check-compatibility', {
            method: 'POST',
            body: JSON.stringify(req),
        });
        if (res.compatible) {
            panel.classList.add('hidden');
            ok.classList.remove('hidden');
        } else {
            ok.classList.add('hidden');
            panel.classList.remove('hidden');
            document.getElementById('compat-count').textContent = `(${res.errors.length})`;
            document.getElementById('compat-list').innerHTML = res.errors
                .map(e => `<li>${esc(e)}</li>`).join('');
        }
        refreshIcons();
    } catch {
        panel.classList.add('hidden');
        ok.classList.add('hidden');
    }
}

// ---- Batch compatibility check for the candidates of one slot ----
async function loadCandidateResults(slotBeingChanged) {
    candidateResults = new Map();
    const candidateType = slotToType(slotBeingChanged);
    const candidates = componentsByType[candidateType] || [];
    if (candidates.length === 0) return;

    const currentReq = buildCurrentRequest();
    try {
        const res = await apiFetch('/builds/check-compatibility/batch', {
            method: 'POST',
            body: JSON.stringify({
                current: currentReq,
                slot: slotBeingChanged,
                candidateIds: candidates.map(c => c.id),
            }),
        });
        // Server returns { id: { compatible, reasons } } — convert numeric keys.
        for (const [k, v] of Object.entries(res)) {
            candidateResults.set(Number(k), v);
        }
    } catch {
        // Swallow — dropdown will just show all as compatible.
    }
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

const dropdownFilters = {};
function getFilter(slot) {
    if (!dropdownFilters[slot]) dropdownFilters[slot] = { sort: 'asc', search: '' };
    return dropdownFilters[slot];
}

function renderDropdownOptions(panel, components, slot) {
    const filter = getFilter(slot);

    let html = `<div class="dropdown-toolbar">
        <div class="dropdown-search-row">
            <input type="text" class="dropdown-search-input" placeholder="Search..." data-slot="${slot}" value="${esc(filter.search)}">
            <div class="dropdown-sort-btns">
                <button class="sort-btn ${filter.sort === 'asc' ? 'active' : ''}" data-sort="asc" data-slot="${slot}" title="Price: Low to High">$ ↑</button>
                <button class="sort-btn ${filter.sort === 'desc' ? 'active' : ''}" data-sort="desc" data-slot="${slot}" title="Price: High to Low">$ ↓</button>
            </div>
        </div>
    </div>`;

    let filtered = [...components];
    if (filter.search) {
        const q = filter.search.toLowerCase();
        filtered = filtered.filter(c =>
            c.name.toLowerCase().includes(q) || getComponentMeta(c).toLowerCase().includes(q)
        );
    }
    filtered.sort((a, b) => {
        const pa = a.price ?? 0, pb = b.price ?? 0;
        return filter.sort === 'asc' ? pa - pb : pb - pa;
    });

    html += '<div class="dropdown-options-list">';
    if (filtered.length === 0) {
        html += '<div class="dropdown-none">No components match filters</div>';
    } else {
        for (const c of filtered) {
            const result = candidateResults.get(c.id);
            const isIncompat = result && !result.compatible;
            const cls = isIncompat ? 'dropdown-option incompatible' : 'dropdown-option';
            const reason = isIncompat && result.reasons.length ? result.reasons[0] : '';
            const imgHtml = c.imageUrl
                ? `<img class="opt-img" src="${esc(c.imageUrl)}" alt="" onerror="this.outerHTML='<div class=\\'opt-img-placeholder\\'>&#128187;</div>'">`
                : '<div class="opt-img-placeholder">&#128187;</div>';

            html += `<div class="${cls}" data-id="${c.id}" data-slot="${slot}" ${reason ? `title="${esc(reason)}"` : ''}>
                ${imgHtml}
                <div class="opt-info">
                    <div class="opt-name">${esc(c.name)}</div>
                    <div class="opt-meta">${esc(getComponentMeta(c))}</div>
                    ${isIncompat ? `<div class="opt-incompat-reason">${esc(reason)}</div>` : ''}
                </div>
                <div class="opt-price">${formatPrice(c.price)}</div>
                ${isIncompat ? '<span class="opt-incompat-badge">Incompatible</span>' : ''}
            </div>`;
        }
    }
    html += '</div>';

    panel.innerHTML = html;

    const searchInput = panel.querySelector('.dropdown-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filter.search = searchInput.value;
            renderDropdownOptions(panel, components, slot);
        });
        setTimeout(() => searchInput.focus(), 50);
    }

    panel.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            filter.sort = btn.dataset.sort;
            renderDropdownOptions(panel, components, slot);
        });
    });

    panel.querySelectorAll('.dropdown-option:not(.incompatible)').forEach(opt => {
        opt.addEventListener('click', () => {
            const compId = parseInt(opt.dataset.id);
            const type = slotToType(slot);
            const comp = (componentsByType[type] || []).find(c => c.id === compId);
            if (comp) selectComponent(slot, comp);
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

        trigger.querySelector('.dropdown-clear').addEventListener('click', (e) => {
            e.stopPropagation();
            clearSelection(slot);
        });
    }
}

function selectComponent(slot, comp) {
    selections[slot] = comp;
    updateTriggerDisplay(slot);
    closeAllDropdowns();

    const priceEl = document.getElementById(`price-${slot}`);
    if (priceEl) priceEl.textContent = comp.price ? formatPrice(comp.price) : '—';

    if (slot === 'motherboard') unlockRam();
    if (slot === 'ram-0' && comp) showExtraRamSlots();

    updateTotals();
    refreshCompatibilityPanel();
}

function clearSelection(slot) {
    selections[slot] = null;
    updateTriggerDisplay(slot);

    const priceEl = document.getElementById(`price-${slot}`);
    if (priceEl) priceEl.textContent = '—';

    if (slot === 'motherboard') lockRam();
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
    refreshCompatibilityPanel();
}

function clearWholeBuild() {
    for (const slot of Object.keys(selections)) {
        selections[slot] = null;
        updateTriggerDisplay(slot);
        const rp = document.getElementById(`price-${slot}`);
        if (rp) rp.textContent = '—';
    }
    lockRam();
    updateTotals();
    refreshCompatibilityPanel();
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
    if (slot.startsWith('ram') && !selections.motherboard) return;

    const components = componentsByType[type] || [];

    // Render with a loading hint, then run batch compat in the background.
    panel.innerHTML = '<div class="dropdown-loading"><div class="spinner"></div> Checking compatibility…</div>';
    panel.classList.remove('hidden');

    await loadCandidateResults(slot);

    renderDropdownOptions(panel, components, slot);

    panel.classList.remove('drop-up');
    const trigger = document.querySelector(`#dropdown-${slot} .dropdown-trigger`);
    if (trigger) {
        const triggerRect = trigger.getBoundingClientRect();
        const spaceBelow = window.innerHeight - triggerRect.bottom;
        const panelHeight = Math.min(panel.scrollHeight, 400);
        if (spaceBelow < panelHeight + 20 && triggerRect.top > panelHeight) {
            panel.classList.add('drop-up');
        }
    }
}

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
    if (!e.target.closest('.custom-dropdown')) closeAllDropdowns();
});

// ---- Save build ----
document.getElementById('btn-save-build').addEventListener('click', async () => {
    const req = buildCurrentRequest();

    if (!req.cpuId || !req.motherboardId || !req.psuId || !req.caseId || !req.ramIds || req.ramIds.length === 0) {
        toast('Please select at least CPU, Motherboard, RAM, PSU, and Case.', 'error');
        return;
    }

    if (!req.ramIds) req.ramIds = [];
    if (!req.storageIds) req.storageIds = [];
    if (!req.coolerIds) req.coolerIds = [];

    // Gate on auth — redirect to login if not signed in.
    const user = window.RigLab && window.RigLab.auth
        ? await window.RigLab.auth.getCurrentUser() : null;
    if (!user) {
        toast('Please sign in to save your build.', 'error');
        const next = encodeURIComponent('/');
        window.location.href = '/pages/login.html?next=' + next;
        return;
    }

    try {
        await apiFetch('/builds', { method: 'POST', body: JSON.stringify(req) });
        toast('Build saved successfully!');
    } catch (err) {
        if (err.status === 401) {
            window.location.href = '/pages/login.html?next=' + encodeURIComponent('/');
        } else {
            toast(err.message, 'error');
        }
    }
});

document.getElementById('btn-clear-build').addEventListener('click', () => {
    if (confirm('Clear all selections?')) clearWholeBuild();
});

(async function init() {
    await loadAllComponents();
})();
