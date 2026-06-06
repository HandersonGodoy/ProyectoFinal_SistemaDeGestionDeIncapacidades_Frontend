const API_INC = CONFIG.INCAPACIDADES_URL + '/api/incapacidades';

async function cargarIncapacidades() {
    const params = new URLSearchParams();
    const empleadoId = document.getElementById('filtroEmpleado')?.value;
    const estado = document.getElementById('filtroEstado')?.value;
    const tipo = document.getElementById('filtroTipo')?.value;
    const fechaInicio = document.getElementById('filtroFechaInicio')?.value;
    const fechaFin = document.getElementById('filtroFechaFin')?.value;

    if (empleadoId) params.append('empleado_id', empleadoId);
    if (estado) params.append('estado', estado);
    if (tipo) params.append('tipo', tipo);
    if (fechaInicio) params.append('fecha_inicio', fechaInicio);
    if (fechaFin) params.append('fecha_fin', fechaFin);

    const url = API_INC + (params.toString() ? '?' + params.toString() : '');
    const result = await apiFetch(url);

    const tbody = document.getElementById('tablaIncapacidades');
    if (!tbody) return;

    if (!result.ok || !result.data.success) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center">Error al cargar incapacidades</td></tr>`;
        return;
    }

    const items = result.data.data;
    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center">No hay incapacidades registradas</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map(i => `
        <tr>
            <td>${i.id}</td>
            <td>${i.empleado_id}</td>
            <td>${formatearFecha(i.fecha_inicio)}</td>
            <td>${formatearFecha(i.fecha_fin)}</td>
            <td>${i.dias_incapacidad}</td>
            <td>${i.tipo.replace(/_/g, ' ')}</td>
            <td><span class="estado estado-${i.estado}">${i.estado.replace(/_/g, ' ')}</span></td>
            <td>${i.entidad_medica}</td>
            <td>
                <a href="ver.html?id=${i.id}" class="btn btn-sm btn-secondary">Ver</a>
                <a href="editar.html?id=${i.id}" class="btn btn-sm btn-primary">Editar</a>
                ${i.estado === 'finalizada' 
                    ? `<button onclick="activarIncapacidad(${i.id})" class="btn btn-sm btn-success">Activar</button>`
                    : `<button onclick="finalizarIncapacidad(${i.id})" class="btn btn-sm btn-warning">Finalizar</button>`
                }
                <button onclick="eliminarIncapacidad(${i.id})" class="btn btn-sm btn-danger">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

async function registrarIncapacidad() {
    const form = document.getElementById('formRegistrarIncapacidad');
    if (!form) return;

    const data = Object.fromEntries(new FormData(form));
    const btn = document.getElementById('btnGuardar');

    const fInicio = new Date(data.fecha_inicio);
    const fFin = new Date(data.fecha_fin);
    if (fFin < fInicio) {
        mostrarMensaje('error', 'La fecha fin no puede ser menor a la fecha inicio');
        return;
    }

    btn.disabled = true;
    const result = await apiFetch(API_INC, {
        method: 'POST',
        body: JSON.stringify(data)
    });
    btn.disabled = false;

    if (result.ok && result.data.success) {
        mostrarMensaje('success', 'Incapacidad registrada exitosamente');
        form.reset();
        setTimeout(() => window.location.href = 'listar.html', 1200);
    } else {
        mostrarMensaje('error', result.data.message || 'Error al registrar incapacidad');
    }
}

async function verIncapacidad() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    const result = await apiFetch(API_INC + '/' + id);
    if (!result.ok || !result.data.success) {
        mostrarMensaje('error', 'Incapacidad no encontrada');
        return;
    }

    const i = result.data.data;
    const campos = ['empleado_id','fecha_inicio','fecha_fin','tipo','diagnostico_general','entidad_medica','observaciones','dias_incapacidad','estado'];
    campos.forEach(c => {
        const el = document.getElementById('inc_' + c);
        if (el) {
            let val = i[c] || '-';
            if (c.includes('fecha')) val = formatearFecha(val);
            if (c === 'tipo' || c === 'estado') val = val.replace(/_/g, ' ');
            el.textContent = val;
        }
    });
}

async function cargarIncapacidadEdicion() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    const result = await apiFetch(API_INC + '/' + id);
    if (!result.ok || !result.data.success) {
        mostrarMensaje('error', 'Incapacidad no encontrada');
        return;
    }

    const i = result.data.data;
    if (i.estado === 'finalizada') {
        mostrarMensaje('error', 'No se puede editar una incapacidad finalizada');
        setTimeout(() => window.location.href = 'listar.html', 1500);
        return;
    }

    const campos = ['fecha_inicio','fecha_fin','observaciones'];
    campos.forEach(c => {
        const el = document.getElementById(c);
        if (el) el.value = i[c] || '';
    });
    document.getElementById('incapacidadId').value = i.id;
}

async function actualizarIncapacidad() {
    const id = document.getElementById('incapacidadId').value;
    const form = document.getElementById('formEditarIncapacidad');
    if (!form) return;

    const data = Object.fromEntries(new FormData(form));
    const btn = document.getElementById('btnActualizar');

    if (data.fecha_inicio && data.fecha_fin) {
        const fInicio = new Date(data.fecha_inicio);
        const fFin = new Date(data.fecha_fin);
        if (fFin < fInicio) {
            mostrarMensaje('error', 'La fecha fin no puede ser menor a la fecha inicio');
            return;
        }
    }

    btn.disabled = true;
    const result = await apiFetch(API_INC + '/' + id, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    btn.disabled = false;

    if (result.ok && result.data.success) {
        mostrarMensaje('success', 'Incapacidad actualizada exitosamente');
        setTimeout(() => window.location.href = 'listar.html', 1200);
    } else {
        mostrarMensaje('error', result.data.message || 'Error al actualizar');
    }
}

async function finalizarIncapacidad(id) {
    if (!confirm('¿Está seguro de finalizar esta incapacidad?')) return;

    const result = await apiFetch(API_INC + '/' + id + '/finalizar', { method: 'PATCH' });

    if (result.ok && result.data.success) {
        mostrarMensaje('success', 'Incapacidad finalizada correctamente');
        cargarIncapacidades();
    } else {
        mostrarMensaje('error', result.data.message || 'Error al finalizar');
    }
}

async function activarIncapacidad(id) {
    if (!confirm('¿Está seguro de reactivar esta incapacidad? Cambiará a estado "registrada".')) return;

    const result = await apiFetch(API_INC + '/' + id + '/estado', {
        method: 'PATCH',
        body: JSON.stringify({ estado: 'registrada' })
    });

    if (result.ok && result.data.success) {
        mostrarMensaje('success', 'Incapacidad reactivada correctamente');
        cargarIncapacidades();
    } else {
        mostrarMensaje('error', result.data.message || 'Error al reactivar');
    }
}

async function eliminarIncapacidad(id) {
    if (!confirm('¿Está seguro de eliminar esta incapacidad?')) return;

    const result = await apiFetch(API_INC + '/' + id, { method: 'DELETE' });

    if (result.ok && result.data.success) {
        mostrarMensaje('success', 'Incapacidad eliminada correctamente');
        cargarIncapacidades();
    } else {
        mostrarMensaje('error', result.data.message || 'Error al eliminar');
    }
}