// ===== RigLab shared auth + nav helpers =====
// Loaded on every page. Renders the user menu in the header and exposes
// window.RigLab.auth.{ getCurrentUser, login, register, logout, requireAuth }.

(function () {
    const API = '/api';

    function authFetch(path, options = {}) {
        return fetch(API + path, {
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
            ...options,
        });
    }

    async function getCurrentUser() {
        try {
            const res = await authFetch('/auth/me');
            if (res.status === 401) return null;
            if (!res.ok) return null;
            return await res.json();
        } catch {
            return null;
        }
    }

    async function login(username, password) {
        const res = await authFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || err.error || 'Invalid username or password');
        }
        return await res.json();
    }

    async function register(username, password) {
        const res = await authFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            const msg = err.message
                || (err.errors ? Object.values(err.errors).join(', ') : null)
                || 'Registration failed';
            throw new Error(msg);
        }
        return await res.json();
    }

    async function logout() {
        await authFetch('/auth/logout', { method: 'POST' });
    }

    function requireAuth(redirectTo) {
        return getCurrentUser().then(u => {
            if (!u) {
                const next = encodeURIComponent(window.location.pathname + window.location.search);
                window.location.href = (redirectTo || '/pages/login.html') + '?next=' + next;
                return null;
            }
            return u;
        });
    }

    function requireAdmin() {
        return getCurrentUser().then(u => {
            if (!u) {
                window.location.href = '/pages/login.html?next=' + encodeURIComponent(window.location.pathname);
                return null;
            }
            if (u.role !== 'ADMIN') {
                window.location.href = '/?denied=admin';
                return null;
            }
            return u;
        });
    }

    function escapeHtml(str) {
        const el = document.createElement('span');
        el.textContent = str;
        return el.innerHTML;
    }

    async function renderUserMenu() {
        // Find the nav element on the current page
        const nav = document.querySelector('header.header .nav');
        if (!nav) return;

        const user = await getCurrentUser();

        // Wrap nav in a flex container alongside the user-menu
        let userMenu = document.querySelector('.user-menu');
        if (!userMenu) {
            userMenu = document.createElement('div');
            userMenu.className = 'user-menu';
            // Place after nav
            nav.parentElement.appendChild(userMenu);
        }

        if (user) {
            const isAdmin = user.role === 'ADMIN';
            userMenu.innerHTML = `
                <a href="/pages/builds.html" class="nav-btn">
                    <i data-lucide="layout-grid"></i><span>My Builds</span>
                </a>
                ${isAdmin ? '<a href="/pages/admin.html" class="nav-btn"><i data-lucide="shield"></i><span>Admin</span></a>' : ''}
                <span class="user-greeting" title="${escapeHtml(user.role)}">
                    <i data-lucide="user-round" class="icon"></i>${escapeHtml(user.username)}
                </span>
                <button class="btn btn-icon btn-icon-danger" id="btn-logout" title="Log out" aria-label="Log out">
                    <i data-lucide="log-out"></i>
                </button>
            `;
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                try { window.lucide.createIcons(); } catch (_) { /* ignore */ }
            }
            const logoutBtn = userMenu.querySelector('#btn-logout');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async () => {
                    await logout();
                    window.location.href = '/';
                });
            }

            // Hide the legacy "Admin" link inside .nav (it's now in the user menu for admins,
            // and shouldn't be visible at all to regular users).
            const adminLink = nav.querySelector('a[href="/pages/admin.html"]');
            if (adminLink) adminLink.style.display = 'none';
        } else {
            userMenu.innerHTML = `
                <a href="/pages/login.html" class="nav-btn">
                    <i data-lucide="log-in"></i><span>Log in</span>
                </a>
                <a href="/pages/login.html?mode=register" class="nav-btn nav-btn-primary">Sign up</a>
            `;
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                try { window.lucide.createIcons(); } catch (_) { /* ignore */ }
            }
            const adminLink = nav.querySelector('a[href="/pages/admin.html"]');
            if (adminLink) adminLink.style.display = 'none';
        }
    }

    // Auto-render on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderUserMenu);
    } else {
        renderUserMenu();
    }

    // Refresh lucide icons safely whenever called.
    function icons() {
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            try { window.lucide.createIcons(); } catch (_) { /* ignore */ }
        }
    }
    // Initial pass after DOM is ready (and after the user menu renders).
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', icons);
    } else {
        icons();
    }

    window.RigLab = window.RigLab || {};
    window.RigLab.auth = {
        getCurrentUser, login, register, logout, requireAuth, requireAdmin, renderUserMenu,
    };
    window.RigLab.icons = icons;
})();
