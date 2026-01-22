document.addEventListener('DOMContentLoaded', () => {
    // Definición de constantes del DOM
    const authContainer = document.getElementById('auth-container');
    const mainContainer = document.getElementById('main-container');
    const authStatus = document.getElementById('auth-status');
    const dniInput = document.getElementById('dni-input');
    const searchPatientBtn = document.getElementById('search-patient-btn');
    const patientDetails = document.getElementById('patient-info-display');
    const patientNotFound = document.getElementById('patient-not-found');
    const consultationSection = document.getElementById('consultation-section');

    // Constantes para los campos de paciente
    const pacienteApellido = document.getElementById('paciente-apellido');
    const pacienteNombre = document.getElementById('paciente-nombre');
    const pacienteEdad = document.getElementById('paciente-edad');
    const pacienteSexo = document.getElementById('paciente-sexo');

    // Constantes para el resto del formulario
    const verEstudiosBtn = document.getElementById('ver-estudios-btn');
     // 1. Crear el botón de historial dinámicamente para no tocar el HTML
    const btnHistorial = document.createElement('button');
    btnHistorial.id = 'ver-historial-btn';
    btnHistorial.className = 'w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-all duration-300 hidden flex items-center justify-center';
    btnHistorial.innerHTML = '<i class="fas fa-history mr-2"></i>Ver Historial de Consultas';
    // Lo insertamos justo después del botón de estudios
    verEstudiosBtn.parentNode.insertBefore(btnHistorial, verEstudiosBtn.nextSibling);

    // 2. Modificación de la búsqueda (dentro de tu searchPatientBtn.addEventListener)
    if (searchPatientBtn) {
        searchPatientBtn.addEventListener('click', async () => {
            const dni = dniInput.value.trim();
            if (!dni) return;

            // Ocultamos historial viejo al buscar nuevo
            btnHistorial.classList.add('hidden');

            // ... Tu lógica de fetch('/buscar') actual ...
            // CUANDO EL PACIENTE ES ENCONTRADO (data.pacientePrincipal):
            // Agrega esto:
            btnHistorial.classList.remove('hidden'); 
        });
    }

    // 3. Lógica del botón Historial
    btnHistorial.addEventListener('click', async () => {
        const dni = dniInput.value.trim();
        const originalHtml = btnHistorial.innerHTML;
        
        btnHistorial.disabled = true;
        btnHistorial.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Buscando en Consultas Extramódulos...';

        try {
            const response = await fetch('/obtener-historial-consultas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dni })
            });
            const data = await response.json();

            if (data.success && data.historial.length > 0) {
                abrirModalHistorial(data.historial);
            } else {
                alert('Este paciente no tiene consultas registradas en la base de Extramódulos.');
            }
        } catch (error) {
            console.error(error);
            alert('Error al conectar con la base de datos de consultas.');
        } finally {
            btnHistorial.disabled = false;
            btnHistorial.innerHTML = originalHtml;
        }
    });

    const estudiosContainer = document.getElementById('estudios-container');
    const motivoConsultaInput = document.getElementById('motivo-consulta');
    const diagnosticoInput = document.getElementById('diagnostico');
    const indicacionesInput = document.getElementById('indicaciones');
    const recordatoriosInput = document.getElementById('recordatorios');
    const saveConsultationBtn = document.getElementById('save-consultation-btn');
    
    // Constantes para el modal de estudios
    const estudiosModal = document.getElementById('estudios-modal');
    const closeEstudiosModal = document.getElementById('close-estudios-modal');
    const estudiosModalContent = document.getElementById('estudios-modal-content');
    const modalDniSpan = document.getElementById('modalDNI');
    const modalCloseButtonBottom = document.getElementById('modal-close-button-bottom');

    
    // Variables de estado
    let currentUserEmail = null;
    let currentPatientDNI = null;
    let currentPatientData = null;
    let allFetchedStudies = [];

    function abrirModalHistorial(consultas) {
        const modal = document.getElementById('estudios-modal');
        const content = document.getElementById('estudios-modal-content');
        const title = modal.querySelector('h3');
        
        title.innerHTML = `<i class="fas fa-notes-medical mr-2"></i> Historial de Consultas`;
        
        let html = `<div class="space-y-4 p-2">`;
        consultas.forEach(c => {
            html += `
                <div class="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <div class="bg-blue-50 px-4 py-2 flex justify-between items-center border-b border-blue-100">
                        <span class="font-bold text-blue-800"><i class="far fa-calendar-alt mr-1"></i> ${c.Fecha || 'S/D'}</span>
                        <span class="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">${c.Profesional || 'Profesional'}</span>
                    </div>
                    <div class="p-4 bg-white space-y-2 text-sm">
                        <p><strong>Motivo:</strong> <span class="text-gray-700">${c['motivo de consulta'] || 'N/A'}</span></p>
                        <p><strong>Diagnóstico:</strong> <span class="text-gray-700">${c.diagnostico || 'N/A'}</span></p>
                        ${c.indicaciones ? `<p class="bg-yellow-50 p-2 rounded"><strong>Indicaciones:</strong> ${c.indicaciones}</p>` : ''}
                        ${c.recordatorio ? `<p class="text-gray-500 text-xs mt-1"><strong>Nota:</strong> ${c.recordatorio}</p>` : ''}
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        
        content.innerHTML = html;
        modal.classList.remove('hidden');
    }


    // Función para limpiar la información del paciente
    function clearPatientInfo() {
        if (pacienteApellido) pacienteApellido.value = '';
        if (pacienteNombre) pacienteNombre.value = '';
        if (pacienteEdad) pacienteEdad.value = '';
        if (pacienteSexo) pacienteSexo.value = '';
        if (patientNotFound) patientNotFound.classList.add('hidden');
        if (estudiosContainer) estudiosContainer.innerHTML = '';
        if (verEstudiosBtn) verEstudiosBtn.classList.add('hidden');
        }

    // --- Lógica de Autenticación ---
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/user');
            const data = await response.json();
    
            if (data.isLoggedIn) {
                currentUserEmail = data.user.email;
                if (authContainer) authContainer.classList.add('hidden');
                if (mainContainer) mainContainer.classList.remove('hidden');
                if (authStatus) authStatus.textContent = `Usuario: ${data.user.name}`;
            } else {
                if (mainContainer) mainContainer.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error al verificar autenticación:', error);
        }
    }
    checkAuthStatus();

    // --- Lógica de Búsqueda de Paciente (CORREGIDA) ---
    if (searchPatientBtn) {
        searchPatientBtn.addEventListener('click', async () => {
            const dni = dniInput.value.trim();
            if (!dni) {
                alert('Por favor ingrese un DNI.');
                return;
            }

            // Reset visual
            clearPatientInfo();
            searchPatientBtn.disabled = true;
            searchPatientBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Buscando...';

            try {
                const response = await fetch('/buscar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dni })
                });

                const data = await response.json();

                if (data.pacientePrincipal) {
                    const p = data.pacientePrincipal;
                    
                    // AUTOCOMPLETADO DE CAMPOS
                    if (pacienteApellido) pacienteApellido.value = p.Apellido || '';
                    if (pacienteNombre) pacienteNombre.value = p.Nombre || '';
                    if (pacienteEdad) pacienteEdad.value = p.Edad || '';
                    if (pacienteSexo) pacienteSexo.value = p.Sexo || '';

                    // Actualizar estado global
                    currentPatientDNI = p.DNI || p.Documento || dni;
                    currentPatientData = p;

                    // Mostrar botones de acción
                    if (verEstudiosBtn) verEstudiosBtn.classList.remove('hidden');
                    if (patientNotFound) patientNotFound.classList.add('hidden');
                    
                } else {
                    if (patientNotFound) patientNotFound.classList.remove('hidden');
                    currentPatientDNI = null;
                    currentPatientData = null;
                }
            } catch (error) {
                console.error('Error al buscar paciente:', error);
                alert('Error al conectar con el servidor.');
            } finally {
                searchPatientBtn.disabled = false;
                searchPatientBtn.innerHTML = '<i class="fas fa-search mr-2"></i>Buscar';
            }
        });
    }

    // --- Lógica para "Ver Estudios" y Modales ---
    if (verEstudiosBtn) {
        verEstudiosBtn.addEventListener('click', async () => {
            if (!currentPatientDNI) {
                alert('Primero debe buscar un paciente.');
                return;
            }
            if (estudiosContainer) estudiosContainer.innerHTML = '<p class="text-gray-600 p-4"><i class="fas fa-spinner fa-spin mr-2"></i> Cargando estudios...</p>';

            try {
                const response = await fetch('/obtener-estudios-paciente', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dni: currentPatientDNI })
                });
                const result = await response.json();

                if (result.success && result.estudios && result.estudios.length > 0) {
                    allFetchedStudies = result.estudios;
                    let estudiosHtml = `<div class="overflow-x-auto mt-4"><table class="min-w-full bg-white border">
                        <thead><tr class="bg-gray-50">
                            <th class="py-2 px-4 border-b text-left">Tipo</th>
                            <th class="py-2 px-4 border-b text-left">Fecha</th>
                            <th class="py-2 px-4 border-b text-center">Acción</th>
                        </tr></thead><tbody>`;
                    
                    result.estudios.forEach((estudio, index) => {
                        estudiosHtml += `<tr>
                            <td class="py-2 px-4 border-b">${estudio.TipoEstudio || 'N/A'}</td>
                            <td class="py-2 px-4 border-b">${estudio.Fecha || 'N/A'}</td>
                            <td class="py-2 px-4 border-b text-center">
                                <button type="button" class="view-study-btn bg-purple-100 text-purple-700 hover:bg-purple-200 font-bold py-1 px-3 rounded text-xs" data-index="${index}">
                                    Ver Resultados
                                </button>
                            </td>
                        </tr>`;
                    });
                    estudiosHtml += `</tbody></table></div>`;
                    if (estudiosContainer) estudiosContainer.innerHTML = estudiosHtml;
                } else {
                    if (estudiosContainer) estudiosContainer.innerHTML = `<p class="text-gray-500 italic p-4">No se encontraron estudios previos.</p>`;
                }
            } catch (error) {
                if (estudiosContainer) estudiosContainer.innerHTML = '<p class="text-red-500">Error al cargar estudios.</p>';
            }
        });
    }

    // Delegación de eventos para botones "Ver Resultados" en la tabla
    if (estudiosContainer) {
        estudiosContainer.addEventListener('click', (event) => {
            const viewBtn = event.target.closest('.view-study-btn');
            if (viewBtn) {
                const index = parseInt(viewBtn.dataset.index, 10);
                const study = allFetchedStudies[index];
                if (study) {
                    let modalHtml = `<div class="p-2">
                        <h4 class="font-bold text-lg mb-2 text-purple-700 border-b pb-2">${study.TipoEstudio || 'Detalle del Estudio'}</h4>
                        <p class="text-sm text-gray-600 mb-4">Fecha: ${study.Fecha || 'No disponible'}</p>
                        <table class="min-w-full text-sm">`;
                    
                    const results = study.ResultadosLaboratorio || study.ResultadosEnfermeria || study.ResultadosMamografia || study;
                    for (const [key, value] of Object.entries(results)) {
                        if (['DNI', 'Nombre', 'Apellido', 'Fecha', 'Prestador', 'TipoEstudio', 'LinkPDF'].includes(key)) continue;
                        if (value && value !== 'N/A') {
                            const label = key.replace(/_/g, ' ');
                            modalHtml += `<tr class="border-b"><td class="py-1 font-semibold text-gray-700 capitalize">${label}:</td><td class="py-1 text-gray-900">${value}</td></tr>`;
                        }
                    }
                    modalHtml += `</table>`;
                    if (study.LinkPDF) {
                        modalHtml += `<a href="${study.LinkPDF}" target="_blank" class="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition">Ver PDF Original</a>`;
                    }
                    modalHtml += `</div>`;
                    
                    if (estudiosModalContent) estudiosModalContent.innerHTML = modalHtml;
                    if (modalDniSpan) modalDniSpan.textContent = currentPatientDNI;
                    if (estudiosModal) estudiosModal.classList.remove('hidden');
                }
            }
        });
    }

    // Cerrar Modales
    [closeEstudiosModal, modalCloseButtonBottom].forEach(btn => {
        btn?.addEventListener('click', () => estudiosModal.classList.add('hidden'));
    });

    // --- Lógica para guardar la consulta ---
    if (saveConsultationBtn) {
        saveConsultationBtn.addEventListener('click', async () => {
            const payload = {
                'DNI': dniInput.value.trim(),
                'Apellido': pacienteApellido.value.trim(),
                'Nombre': pacienteNombre.value.trim(),
                'Edad': pacienteEdad.value.trim(),
                'Sexo': pacienteSexo.value.trim(),
                'motivo de consulta': motivoConsultaInput.value.trim(),
                'diagnostico': diagnosticoInput.value.trim(),
                'indicaciones': indicacionesInput.value.trim(),
                'recordatorio': recordatoriosInput.value.trim(),
                'Profesional': currentUserEmail,
                'Fecha': new Date().toLocaleDateString('es-AR')
            };

            if (!payload.DNI || !payload.Apellido || !payload['motivo de consulta']) {
                alert('Complete los campos obligatorios del paciente y el motivo de consulta.');
                return;
            }

            saveConsultationBtn.disabled = true;
            saveConsultationBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Guardando...';

            try {
                const response = await fetch('/guardar-consulta', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const res = await response.json();
                if (res.success) {
                    alert('Consulta guardada correctamente.');
                    window.location.reload(); // Recargar para limpiar todo
                } else {
                    alert('Error: ' + res.message);
                }
            } catch (e) {
                alert('Error de conexión al guardar.');
            } finally {
                saveConsultationBtn.disabled = false;
                saveConsultationBtn.textContent = 'Guardar Consulta';
            }
        });
    }
});