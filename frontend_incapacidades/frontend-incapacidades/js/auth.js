async function login() {
    const usuario = document.getElementById('usuario').value.trim();
    const contrasena = document.getElementById('contrasena').value;
    const btn = document.getElementById('btnLogin');

    if (!usuario || !contrasena) {
        mostrarMensaje('error', 'Ingrese por favor su usuario y contraseña');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Ingresando...';

    const result = await apiFetch(CONFIG.AUTH_URL + '/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ usuario, contrasena })
    });

    btn.disabled = false;
    btn.textContent = 'Iniciar Sesion';

    if (result.ok && result.data.success) {
        localStorage.setItem(CONFIG.TOKEN_KEY, result.data.token);
        localStorage.setItem(CONFIG.USER_KEY, JSON.stringify(result.data.usuario));
        window.location.href = 'dashboard.html';
    } else {
        mostrarMensaje('error', result.data.message || 'Credenciales incorrectas, por favor verificalo');
    }
}

async function logout() {
    await apiFetch(CONFIG.AUTH_URL + '/api/auth/logout', { method: 'POST' });
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_KEY);
    window.location.href = 'index.html';
}

function getUser() {
    try { return JSON.parse(localStorage.getItem(CONFIG.USER_KEY)); }
    catch (e) { return null; }
}

function requireAuth() {
    if (!getToken()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

function renderUserInfo() {
    const user = getUser();
    const el = document.getElementById('userInfo');
    if (el && user) {
        el.innerHTML = `<strong>${user.nombre}</strong><span style="color:#94a3b8">${user.rol}</span>`;
    }
}

if (document.getElementById('formLogin')) {
    document.getElementById('formLogin').addEventListener('submit', (e) => {
        e.preventDefault();
        login();
    });
}