function getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
}

function getHeaders(contentType = true) {
    const headers = {};
    if (contentType) headers['Content-Type'] = 'application/json';
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return headers;
}

async function apiFetch(url, options = {}) {
    const defaultOptions = {
        headers: getHeaders(options.body ? true : false),
        ...options
    };

    try {
        const response = await fetch(url, defaultOptions);
        const data = await response.json().catch(() => ({}));

        if (response.status === 401) {
            localStorage.removeItem(CONFIG.TOKEN_KEY);
            localStorage.removeItem(CONFIG.USER_KEY);
            window.location.href = '/index.html';
            return Promise.reject(new Error('Sesión expirada'));
        }

        return { ok: response.ok, status: response.status, data };
    } catch (error) {
        return { ok: false, status: 0, data: { success: false, message: 'Error de conexión: ' + error.message } };
    }
}

function mostrarMensaje(tipo, mensaje, contenedorId = 'mensaje') {
    const el = document.getElementById(contenedorId);
    if (!el) return;
    el.className = 'alert ' + tipo;
    el.textContent = mensaje;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 5000);
}

function formatearFecha(fechaStr) {
    if (!fechaStr) return '-';
    const f = new Date(fechaStr);
    return f.toLocaleDateString('es-CO');
}