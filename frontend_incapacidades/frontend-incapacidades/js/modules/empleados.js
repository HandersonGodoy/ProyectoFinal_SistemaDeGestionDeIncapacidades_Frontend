const API_EMP = CONFIG.EMPLEADOS_URL + '/api/empleados';

const AREAS_PERMITIDAS = [
    'Tecnologia',
    'Gestion Humana',
    'Administracion',
    'Contabilidad',
    'Ventas',
    'Operaciones',
    'Marketing',
    'Legal'
];

const CARGOS_PERMITIDOS = [
    'Analista',
    'Auxiliar',
    'Coordinador',
    'Gerente',
    'Director',
    'Asistente',
    'Especialista',
    'Tecnico',
    'Operario',
    'Pasante'
];

async function cargarEmpleados() {
    const params = new URLSearchParams();
    const documento = document.getElementById('filtroDocumento')?.value.trim();
    const area = document.getElementById('filtroArea')?.value.trim();
    const cargo = document.getElementById('filtroCargo')?.value.trim();

    if (documento) params.append('documento', documento);
    if (area) params.append('area', area);
    if (cargo) params.append('cargo', cargo);

    const url = API_EMP + (params.toString() ? '?' + params.toString() : '');
    const result = await apiFetch(url);

    const tbody = document.getElementById('tablaEmpleados');
    if (!tbody) return;

    if (!result.ok || !result.data.success) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center">Error al cargar empleados</td></tr>`;
        return;
    }

    const empleados = result.data.data;
    if (empleados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center">No hay empleados registrados</td></tr>`;
        return;
    }

    tbody.innerHTML = empleados.map(e => `
        <tr>
            <td>${e.id}</td>
            <td>${e.nombres} ${e.apellidos}</td>
            <td>${e.documento}</td>
            <td>${e.correo}</td>
            <td>${e.telefono}</td>
            <td>${e.cargo}</td>
            <td>${e.area}</td>
            <td><span class="estado estado-${e.estado}">${e.estado}</span></td>
            <td>
                <a href="ver.html?id=${e.id}" class="btn btn-sm btn-secondary">Ver</a>
                <a href="editar.html?id=${e.id}" class="btn btn-sm btn-primary">Editar</a>
                <button onclick="cambiarEstadoEmpleado(${e.id}, '${e.estado === 'activo' ? 'inactivo' : 'activo'}')" class="btn btn-sm btn-warning">
                    ${e.estado === 'activo' ? 'Desactivar' : 'Activar'}
                </button>
                <button onclick="eliminarEmpleado(${e.id})" class="btn btn-sm btn-danger">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

async function cargarEmpleadoSelect(selectId, seleccionado = null) {
    const result = await apiFetch(API_EMP);
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Seleccione...</option>';
    if (result.ok && result.data.success) {
        result.data.data.forEach(e => {
            const option = document.createElement('option');
            option.value = e.id;
            option.textContent = `${e.nombres} ${e.apellidos} - ${e.documento}`;
            if (seleccionado && e.id == seleccionado) option.selected = true;
            select.appendChild(option);
        });
    }
}

async function verEmpleado() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    const result = await apiFetch(API_EMP + '/' + id);
    if (!result.ok || !result.data.success) {
        mostrarMensaje('error', 'Empleado no encontrado');
        return;
    }

    const e = result.data.data;
    const campos = ['nombres','apellidos','documento','correo','telefono','cargo','area','fecha_ingreso','estado','created_at','updated_at'];
    campos.forEach(c => {
        const el = document.getElementById('emp_' + c);
        if (el) el.textContent = e[c] || '-';
    });
}

function llenarSelectsFormulario() {
    const selectArea = document.getElementById('area');
    const selectCargo = document.getElementById('cargo');
    
    if (selectArea) {
        selectArea.innerHTML = '<option value="">Seleccione...</option>';
        AREAS_PERMITIDAS.forEach(a => {
            selectArea.innerHTML += `<option value="${a}">${a}</option>`;
        });
    }
    
    if (selectCargo) {
        selectCargo.innerHTML = '<option value="">Seleccione...</option>';
        CARGOS_PERMITIDOS.forEach(c => {
            selectCargo.innerHTML += `<option value="${c}">${c}</option>`;
        });
    }
}

function soloNumeros(input) {
    input.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
    });
}

async function crearEmpleado() {
    const form = document.getElementById('formCrearEmpleado');
    if (!form) return;

    const data = Object.fromEntries(new FormData(form));
    const btn = document.getElementById('btnGuardar');
    btn.disabled = true;

    const result = await apiFetch(API_EMP, {
        method: 'POST',
        body: JSON.stringify(data)
    });

    btn.disabled = false;

    if (result.ok && result.data.success) {
        mostrarMensaje('success', 'Empleado creado exitosamente');
        form.reset();
        setTimeout(() => window.location.href = 'listar.html', 1200);
    } else {
        mostrarMensaje('error', result.data.message || 'Error al crear empleado');
    }
}

async function cargarEmpleadoEdicion() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    const result = await apiFetch(API_EMP + '/' + id);
    if (!result.ok || !result.data.success) {
        mostrarMensaje('error', 'Empleado no encontrado');
        return;
    }

    const e = result.data.data;
    const campos = ['nombres','apellidos','documento','correo','telefono','cargo','area','fecha_ingreso'];
    campos.forEach(c => {
        const el = document.getElementById(c);
        if (el) el.value = e[c] || '';
    });
    document.getElementById('empleadoId').value = e.id;
}

async function actualizarEmpleado() {
    const id = document.getElementById('empleadoId').value;
    const form = document.getElementById('formEditarEmpleado');
    if (!form) return;

    const data = Object.fromEntries(new FormData(form));
    const btn = document.getElementById('btnActualizar');
    btn.disabled = true;

    const result = await apiFetch(API_EMP + '/' + id, {
        method: 'PUT',
        body: JSON.stringify(data)
    });

    btn.disabled = false;

    if (result.ok && result.data.success) {
        mostrarMensaje('success', 'Empleado actualizado exitosamente');
        setTimeout(() => window.location.href = 'listar.html', 1200);
    } else {
        mostrarMensaje('error', result.data.message || 'Error al actualizar empleado');
    }
}

async function cambiarEstadoEmpleado(id, nuevoEstado) {
    if (!confirm('¿Está seguro de cambiar el estado del empleado a ' + nuevoEstado + '?')) return;

    const result = await apiFetch(API_EMP + '/' + id + '/estado', {
        method: 'PATCH',
        body: JSON.stringify({ estado: nuevoEstado })
    });

    if (result.ok && result.data.success) {
        mostrarMensaje('success', 'Estado actualizado correctamente');
        cargarEmpleados();
    } else {
        mostrarMensaje('error', result.data.message || 'Error al cambiar estado');
    }
}

async function eliminarEmpleado(id) {
    if (!confirm('¿Está seguro de eliminar este empleado? Esta acción no se puede deshacer.')) return;

    const result = await apiFetch(API_EMP + '/' + id, { method: 'DELETE' });

    if (result.ok && result.data.success) {
        mostrarMensaje('success', 'Empleado eliminado correctamente');
        cargarEmpleados();
    } else {
        mostrarMensaje('error', result.data.message || 'Error al eliminar empleado');
    }
}