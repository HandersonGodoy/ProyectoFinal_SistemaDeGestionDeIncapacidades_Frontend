const API_SEG = CONFIG.SEGUIMIENTO_URL + '/api/seguimientos';

const USUARIOS_PERMITIDOS = [
    'admin',
    'gestionhumana'
];

async function cargarSeguimientos() {
    const params = new URLSearchParams();
    const incapacidadId = document.getElementById('filtroIncapacidad')?.value;
    const estado = document.getElementById('filtroEstado')?.value;
    const fecha = document.getElementById('filtroFecha')?.value;
    const responsable = document.getElementById('filtroResponsable')?.value?.trim();

    if (incapacidadId) params.append('incapacidad_id', incapacidadId);
    if (estado) params.append('estado', estado);
    if (fecha) params.append('fecha', fecha);
    if (responsable) params.append('usuario_responsable', responsable);

    const url = API_SEG + (params.toString() ? '?' + params.toString() : '');
    const result = await apiFetch(url);

    const tbody = document.getElementById('tablaSeguimientos');
    if (!tbody) return;

    if (!result.ok || !result.data.success) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center">Error al cargar seguimientos</td></tr>`;
        return;
    }

    const items = result.data.data;
    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center">No hay seguimientos registrados</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map(s => `
        <tr>
            <td>${s.id}</td>
            <td>${s.incapacidad_id}</td>
            <td>${formatearFecha(s.fecha)}</td>
            <td>${s.comentario}</td>
            <td><span class="estado estado-${s.estado}">${s.estado.replace(/_/g, ' ')}</span></td>
            <td>${s.usuario_responsable}</td>
            <td>
                <a href="ver.html?id=${s.id}" class="btn btn-sm btn-secondary">Ver</a>
                <button onclick="eliminarSeguimiento(${s.id})" class="btn btn-sm btn-danger">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

function llenarSelectUsuarios() {
    const select = document.getElementById('usuario_responsable');
    if (!select) return;
    
    select.innerHTML = '<option value="">Seleccione...</option>';
    USUARIOS_PERMITIDOS.forEach(u => {
        select.innerHTML += `<option value="${u}">${u}</option>`;
    });
}

async function registrarSeguimiento() {
    const form = document.getElementById('formRegistrarSeguimiento');
    if (!form) return;

    const data = Object.fromEntries(new FormData(form));
    const btn = document.getElementById('btnGuardar');

    const fecha = new Date(data.fecha);
    if (isNaN(fecha.getTime())) {
        mostrarMensaje('error', 'Fecha invalida, verificalo por favor');
        return;
    }

    btn.disabled = true;
    const result = await apiFetch(API_SEG, {
        method: 'POST',
        body: JSON.stringify(data)
    });
    btn.disabled = false;

    if (result.ok && result.data.success) {
        mostrarMensaje('success', 'Seguimiento registrado exitosamente, cargado al sistema');
        form.reset();
        setTimeout(() => window.location.href = 'historial.html', 1200);
    } else {
        mostrarMensaje('error', result.data.message || 'Error al registrar seguimiento, verificalo por favor');
    }
}

async function verSeguimiento() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    const result = await apiFetch(API_SEG + '/' + id);
    if (!result.ok || !result.data.success) {
        mostrarMensaje('error', 'Seguimiento no encontrado,, no verificado en el sistema');
        return;
    }

    const s = result.data.data;
    const campos = ['incapacidad_id','fecha','comentario','estado','usuario_responsable','created_at','updated_at'];
    campos.forEach(c => {
        const el = document.getElementById('seg_' + c);
        if (el) {
            let val = s[c] || '-';
            if (c === 'fecha' || c.includes('created') || c.includes('updated')) val = formatearFecha(val);
            if (c === 'estado') val = val.replace(/_/g, ' ');
            el.textContent = val;
        }
    });
}

async function eliminarSeguimiento(id) {
    if (!confirm('¿Está seguro de eliminar este seguimiento?')) return;

    const result = await apiFetch(API_SEG + '/' + id, { method: 'DELETE' });

    if (result.ok && result.data.success) {
        mostrarMensaje('success', 'Seguimiento eliminado correctamente, cargado al sistema');
        cargarSeguimientos();
    } else {
        mostrarMensaje('error', result.data.message || 'Error al eliminar, verificalo por favor');
    }
}