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

    // Función para limpiar la información del paciente
    function clearPatientInfo() {
        if (pacienteApellido) pacienteApellido.value = '';
        if (pacienteNombre) pacienteNombre.value = '';
        if (pacienteEdad) pacienteEdad.value = '';
        if (pacienteSexo) pacienteSexo.value = '';
        if (patientDetails) patientDetails.classList.add('hidden');
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
                if (authStatus) authStatus.textContent = `Usuario autenticado: ${data.user.name} ${data.user.email}`;
                console.log('Usuario autenticado:', data.user.name, data.user.email);
            } else {
                if (authContainer) authContainer.classList.remove('hidden');
                if (mainContainer) mainContainer.classList.add('hidden');
                if (authStatus) authStatus.textContent = 'Por favor, inicia sesión con tu cuenta de Google.';
                console.warn('Usuario no autenticado.');
            }
        } catch (error) {
            console.error('Error al verificar autenticación:', error);
            if (authContainer) authContainer.classList.remove('hidden');
            if (mainContainer) mainContainer.classList.add('hidden');
            if (authStatus) authStatus.textContent = 'Error de conexión. Intente de nuevo.';
        }
    }
    checkAuthStatus();

    // --- Lógica de Búsqueda de Paciente ---
    if (searchPatientBtn) {
        searchPatientBtn.addEventListener('click', async () => {
            const dni = dniInput.value.trim();
            if (!dni) {
                alert('Por favor ingrese un DNI.');
                return;
            }
// Limpia y asegura que los campos de paciente estén visibles
            if (patientDetails) patientDetails.classList.remove('hidden');
            clearPatientInfo();

            try {
                const response = await fetch('/buscar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dni })
                });

                if (!response.ok) {
                    console.error(`Error del servidor: ${response.status} ${response.statusText}`);
                    const errorData = await response.json();
                    console.error('Detalles del error:', errorData);
                    alert(`Error al buscar paciente: ${errorData.message || 'Verifique el DNI y la conexión.'}`);
                    return;
                }

                const data = await response.json();

                if (data.error) {
                    if (patientNotFound) patientNotFound.classList.remove('hidden');
                    console.log('Paciente no encontrado:', data.error);
                    currentPatientDNI = null;
                    currentPatientData = null;
                } else if (data.pacientePrincipal) {
                    if (patientNotFound) patientNotFound.classList.add('hidden');
                    currentPatientDNI = data.pacientePrincipal.DNI || data.pacientePrincipal.Documento;
                    currentPatientData = data.pacientePrincipal;
                    if (verEstudiosBtn) verEstudiosBtn.classList.remove('hidden');
                    console.log('Paciente encontrado:', currentPatientData);
                }
            } catch (error) {
                console.error('Error al buscar paciente:', error);
                if (patientNotFound) patientNotFound.classList.remove('hidden');
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
            if (estudiosContainer) estudiosContainer.innerHTML = '<p class="text-gray-600"><i class="fas fa-spinner fa-spin"></i> Cargando estudios...</p>';
            if (verEstudiosBtn) verEstudiosBtn.disabled = true;

            try {
                const response = await fetch('/obtener-estudios-paciente', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dni: currentPatientDNI })
                });
                const result = await response.json();

                if (result.success && result.estudios && result.estudios.length > 0) {
                    allFetchedStudies = result.estudios;
                    let estudiosHtml = `<h4 class="text-lg font-semibold text-gray-700 mb-4">Estudios Encontrados</h4>`;
                    estudiosHtml += `<table class="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th class="py-2 px-4 text-left">Tipo</th>
                                <th class="py-2 px-4 text-left">Fecha</th>
                                <th class="py-2 px-4 text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">`;
                    result.estudios.forEach((estudio, index) => {
                        estudiosHtml += `<tr>
                            <td class="py-2 px-4">${estudio.TipoEstudio || 'N/A'}</td>
                            <td class="py-2 px-4">${estudio.Fecha || 'N/A'}</td>
                            <td class="py-2 px-4 text-center">
                                <button type="button" class="view-study-btn bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm" data-index="${index}">
                                    Ver Resultados
                                </button>
                            </td>
                        </tr>`;
                    });
                    estudiosHtml += `</tbody></table>`;
                    if (estudiosContainer) estudiosContainer.innerHTML = estudiosHtml;
                    
                } else {
                    if (estudiosContainer) estudiosContainer.innerHTML = `<p class="text-gray-600">No se encontraron estudios para este paciente.</p>`;
                }
            } catch (error) {
                console.error('Error al buscar estudios:', error);
                if (estudiosContainer) estudiosContainer.innerHTML = '<p class="text-red-500">Error al cargar estudios.</p>';
            } finally {
                if (verEstudiosBtn) verEstudiosBtn.disabled = false;
            }
        });
    }

    // Lógica para mostrar los resultados de un estudio en el modal
    if (estudiosContainer) {
        estudiosContainer.addEventListener('click', (event) => {
            const viewBtn = event.target.closest('.view-study-btn');
            if (viewBtn) {
                const index = parseInt(viewBtn.dataset.index, 10);
                if (!isNaN(index) && allFetchedStudies[index]) {
                    const study = allFetchedStudies[index];
                    let modalHtml = `<h3 class="text-xl font-semibold mb-4">${study.TipoEstudio || 'Estudio'} - ${study.Fecha || 'N/A'}</h3>`;
                    modalHtml += `<table class="min-w-full bg-white border border-gray-300">
                        <thead><tr class="bg-gray-100"><th class="py-2 px-4 border-b">Campo</th><th class="py-2 px-4 border-b">Valor</th></tr></thead><tbody>`;
                    
                    const resultsObject = study.ResultadosLaboratorio || study.ResultadosEnfermeria || study.ResultadosMamografia || study;

                    for (const key in resultsObject) {
                        if (['DNI', 'Nombre', 'Apellido', 'Fecha', 'Prestador', 'TipoEstudio', 'LinkPDF', 'Fecha_cierre_Enf', 'Agudeza_Visual_PDF', 'Espirometria_PDF'].includes(key)) continue;
                        const value = resultsObject[key];
                        if (value && String(value).trim() !== '' && String(value).trim().toLowerCase() !== 'n/a') {
                            const formattedKey = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
                            modalHtml += `<tr>
                                <td class="py-2 px-4 border-b text-gray-700">${formattedKey}</td>
                                <td class="py-2 px-4 border-b text-gray-900 font-medium">${value}</td>
                            </tr>`;
                        }
                    }
                    modalHtml += `</tbody></table>`;

                    if (study.LinkPDF && study.LinkPDF.trim() !== '') {
                        modalHtml += `<a href="${study.LinkPDF}" target="_blank" class="block mt-4 text-blue-500 hover:underline">Ver PDF <i class="fas fa-external-link-alt ml-1"></i></a>`;
                    }

                    if (estudiosModalContent) estudiosModalContent.innerHTML = modalHtml;

                        estudiosModalContent.style.maxHeight = '60vh';
                        estudiosModalContent.style.overflowY = 'auto';
                        
                    if (estudiosModal) estudiosModal.classList.remove('hidden');
                    if (modalDniSpan && currentPatientDNI) modalDniSpan.textContent = currentPatientDNI;
                }
            }
        });
    }

    if (closeEstudiosModal) {
        closeEstudiosModal.addEventListener('click', () => {
            if (estudiosModal) estudiosModal.classList.add('hidden');
        });
    }
    
    if (modalCloseButtonBottom) {
        modalCloseButtonBottom.addEventListener('click', () => {
            if (estudiosModal) estudiosModal.classList.add('hidden');
        });
    }

    if (estudiosModal) {
        estudiosModal.addEventListener('click', (e) => {
            if (e.target === estudiosModal) {
                estudiosModal.classList.add('hidden');
            }
        });
    }

    // --- Lógica para guardar la consulta ---
    if (saveConsultationBtn) {
        saveConsultationBtn.addEventListener('click', async () => {
            const dni = dniInput.value.trim();
            const apellido = pacienteApellido.value.trim();
            const nombre = pacienteNombre.value.trim();
            const edad = pacienteEdad.value.trim();
            const sexo = pacienteSexo.value.trim();
            const motivoConsulta = motivoConsultaInput.value.trim();
            const diagnostico = diagnosticoInput.value.trim();
            const indicaciones = indicacionesInput.value.trim();
            const recordatorios = recordatoriosInput.value.trim();

            if (!dni || !apellido || !nombre || !edad || !sexo || !motivoConsulta || !diagnostico) {
                alert('Por favor, complete todos los campos obligatorios: DNI, Apellido, Nombre, Edad, Sexo, Motivo y Diagnóstico.');
                return;
            }

            if (!currentUserEmail) {
                alert('La sesión del profesional ha expirado. Por favor, recargue la página.');
                return;
            }

            if (saveConsultationBtn) {
                saveConsultationBtn.disabled = true;
                saveConsultationBtn.textContent = 'Guardando...';
            }

            const consultationData = {
                'DNI': dni,
                'Apellido': apellido,
                'Nombre': nombre,
                'Edad': edad,
                'Sexo': sexo,
                'motivo de consulta': motivoConsulta,
                'diagnostico': diagnostico,
                'indicaciones': indicaciones,
                'recordatorio': recordatorios,
                'Profesional': currentUserEmail,
                'Fecha': new Date().toLocaleDateString('es-AR'),
            };

            try {
                const response = await fetch('/guardar-consulta', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(consultationData)
                });

                const result = await response.json();
                if (result.success) {
                    alert('Consulta guardada exitosamente.');
                    dniInput.value = '';
                    pacienteApellido.value = '';
                    pacienteNombre.value = '';
                    pacienteEdad.value = '';
                    pacienteSexo.value = '';
                    motivoConsultaInput.value = '';
                    diagnosticoInput.value = '';
                    indicacionesInput.value = '';
                    recordatoriosInput.value = '';
                    currentPatientData = null;
                } else {
                    alert('Error al guardar la consulta: ' + result.message);
                }
            } catch (error) {
                console.error('Error al guardar la consulta:', error);
                alert('Ocurrió un error al conectar con el servidor.');
            } finally {
                if (saveConsultationBtn) {
                    saveConsultationBtn.disabled = false;
                    saveConsultationBtn.textContent = 'Guardar Consulta';
                }
            }
        });
    }
});