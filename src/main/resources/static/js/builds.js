// ===== RigLab Saved Builds (builds.html) =====
const API = '/api';

function toast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

function esc(str) {
    const el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
}

function fmtPrice(p) { return p != null ? `$${p.toFixed(2)}` : '—'; }

async function apiFetch(path, options = {}) {
    const res = await fetch(API + path, {
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options,
    });
    if (res.status === 204) return null;
    if (res.status === 401) {
        window.location.href = '/pages/login.html?next=/pages/builds.html';
        return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = data.message || (data.errors ? Object.values(data.errors).join(', ') : 'Request failed');
        throw new Error(msg);
    }
    return data;
}

function renderSlot(label, comp) {
    if (!comp) return `<div class="build-slot empty"><span class="slot-label">${label}</span><span class="slot-empty">—</span></div>`;
    return `
        <div class="build-slot">
            <span class="slot-label">${label}</span>
            <span class="slot-comp">
                <strong>${esc(comp.name)}</strong>
                <span class="slot-meta">${esc(comp.brand || '')}</span>
                <span class="slot-price">${fmtPrice(comp.price)}</span>
            </span>
        </div>
    `;
}

function renderBuild(b) {
    const ramSummary = (b.ramSticks || []).length
        ? b.ramSticks.map(r => esc(r.name)).join(', ')
        : '—';
    const storageSummary = (b.storageDevices || []).length
        ? b.storageDevices.map(s => esc(s.name)).join(', ')
        : '—';

    return `
        <div class="build-card" data-id="${b.id}">
            <div class="build-card-header">
                <div>
                    <h3>${esc(b.name)}</h3>
                    <div class="build-meta">
                        <span class="build-price">${fmtPrice(b.totalPrice)}</span>
                        ${b.totalPowerConsumption != null ? `<span class="build-power">${b.totalPowerConsumption}W</span>` : ''}
                    </div>
                </div>
                <button class="btn btn-danger btn-sm" data-action="delete" data-id="${b.id}">Delete</button>
            </div>
            <div class="build-slots">
                ${renderSlot('CPU', b.cpu)}
                ${renderSlot('Motherboard', b.motherboard)}
                ${renderSlot('GPU', b.gpu)}
                ${renderSlot('PSU', b.psu)}
                ${renderSlot('Case', b.pcCase)}
                ${b.coolers && b.coolers.length ? renderSlot('Cooler', b.coolers[0]) : renderSlot('Cooler', null)}
            </div>
            <div class="build-summary">
                <div><strong>RAM:</strong> ${ramSummary}</div>
                <div><strong>Storage:</strong> ${storageSummary}</div>
            </div>
        </div>
    `;
}

async function loadBuilds() {
    const user = await RigLab.auth.requireAuth();
    if (!user) return;

    const loading = document.getElementById('builds-loading');
    const empty = document.getElementById('builds-empty');
    const list = document.getElementById('builds-list');

    try {
        const builds = await apiFetch('/builds/me');
        loading.classList.add('hidden');
        if (!builds || builds.length === 0) {
            empty.classList.remove('hidden');
            return;
        }
        list.innerHTML = builds.map(renderBuild).join('');
        list.classList.remove('hidden');
        if (window.RigLab && window.RigLab.icons) window.RigLab.icons();

        list.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Delete this build?')) return;
                try {
                    await apiFetch(`/builds/${btn.dataset.id}`, { method: 'DELETE' });
                    toast('Build deleted');
                    loadBuilds();
                } catch (err) {
                    toast(err.message, 'error');
                }
            });
        });
    } catch (err) {
        loading.classList.add('hidden');
        toast('Failed to load builds: ' + err.message, 'error');
    }
}

loadBuilds();
