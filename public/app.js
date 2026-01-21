function resetProfile() {
    document.getElementById('user-name').textContent = 'Nombre Apellido';
    document.getElementById('welcome-message').innerHTML =
        '¡Hola! Este programa es para ayudarte y acompañarte en el cuidado de tu salud.';
    document.getElementById('risk-assessment').classList.add('hidden');
    document.getElementById('cancer-prevention').classList.add('hidden');
    document.getElementById('infectious-diseases').classList.add('hidden');
    document.getElementById('healthy-habits').classList.add('hidden');
    document.getElementById('dental-health').classList.add('hidden');
    document.getElementById('mental-health').classList.add('hidden');
    document.getElementById('renal-health').classList.add('hidden');
    document.getElementById('epoc-section').classList.add('hidden');
    document.getElementById('aneurisma-section').classList.add('hidden');
    document.getElementById('osteoporosis-section').classList.add('hidden');
    document.getElementById('aspirina-section').classList.add('hidden');
    document.getElementById('visual-health').classList.add('hidden');
}

const PENDING_KEYWORDS_FOR_VISUALS = ['no se realiza', 'no registrado'];
const NOT_APPLICABLE_KEYWORDS = ['no aplica']; // Nueva lista para "No aplica"

// Variable global para almacenar la URL base
let apiBaseUrl = '';

// Función para obtener la configuración del servidor
async function fetchApiConfig() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        apiBaseUrl = config.apiBaseUrl;
        console.log(`URL base de la API establecida: ${apiBaseUrl}`);
    } catch (error) {
        console.error('Error al obtener la configuración de la API:', error);
        // Fallback en caso de error
        apiBaseUrl = 'http://localhost:3000';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // --- SOLUCIÓN MÍNIMA: Eliminar iframes de Firebase ---
    const removeFirebaseOverlay = () => {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            if (iframe.src && (iframe.src.includes('firebase') || iframe.src.includes('google'))) {
                console.log('Eliminando iframe de Firebase:', iframe.src);
                iframe.remove();
            }
        });
    };
    
    // Ejecutar inmediatamente y cada 500ms por si vuelve a aparecer
    removeFirebaseOverlay();
    setInterval(removeFirebaseOverlay, 500);
    
    // Definición de todas las constantes al inicio
    const consultarBtn = document.getElementById('consultar');
    const dniInput = document.getElementById('dni');
    const practicaSelect = document.getElementById('practica');
    const loadingDiv = document.getElementById('loading');
    const resultDiv = document.getElementById('result');
    const riskAssessmentDiv = document.getElementById('risk-assessment');
    const afiliadoDetailsDiv = document.getElementById('afiliado-details');
    const cancerPreventionDiv = document.getElementById('cancer-prevention');
    const infectiousDiseasesDiv = document.getElementById('infectious-diseases');
    const healthyHabitsDiv = document.getElementById('healthy-habits');
    const dentalHealthDiv = document.getElementById('dental-health');
    const mentalHealthDiv = document.getElementById('mental-health');
    const renalHealthDiv = document.getElementById('renal-health');
    const visualHealthDiv = document.getElementById('visual-health');
    const epocSectionDiv = document.getElementById('epoc-section');
    const aneurismaSectionDiv = document.getElementById('aneurisma-section');
    const osteoporosisSectionDiv = document.getElementById('osteoporosis-section');
    const aspirinaSectionDiv = document.getElementById('aspirina-section');
    const estudiosComplementariosSeccion = document.getElementById('estudios-complementarios-seccion');
    const verEstudiosBtn = document.getElementById('ver-estudios-btn');
    const resultadosEstudiosPacienteDiv = document.getElementById('resultados-estudios-paciente');

    const labResultsModal = document.getElementById('lab-results-modal');
    const labResultsModalContent = document.getElementById('lab-results-modal-content');
    const closeLabResultsModal = document.getElementById('close-lab-results-modal');
    const generarInformeBtn = document.getElementById('generar-informe-btn');

    const enfermeriaResultsModal = document.getElementById('enfermeria-results-modal');
    const enfermeriaResultsModalContent = document.getElementById('enfermeria-results-modal-content');
    const closeEnfermeriaResultsModal = document.getElementById('close-enfermeria-results-modal');

     // --- VERIFICACIÓN CRÍTICA: AÑADE ESTO JUSTO DESPUÉS DE DEFINIR LAS CONSTANTES ---
    if (!enfermeriaResultsModal) {
        console.error('ERROR: Modal de enfermería no encontrado en el DOM');
        // Puedes deshabilitar funcionalidades relacionadas si quieres
    }
    if (!enfermeriaResultsModalContent) {
        console.error('ERROR: Contenido del modal de enfermería no encontrado');
    }
    if (!closeEnfermeriaResultsModal) {
        console.error('ERROR: Botón cerrar modal de enfermería no encontrado');
    }
     // --- Definir la URL de la API dinámicamente ---
    let apiBaseUrl = window.location.origin; // Usa el origen actual (incluye el protocolo y el dominio)

    // Variables globales para almacenar datos
    let currentPatientData = null; 
    let currentRedFlags = new Set();
    let currentPatientDNI = null;
    let allFetchedStudies = [];

    // --- CÓDIGO CLAVE CORREGIDO: DELEGACIÓN DE EVENTOS ---
    // Este bloque se ejecuta una sola vez al cargar la página.
    // Escucha clics en el contenedor principal y delega la acción al botón correcto.
    resultadosEstudiosPacienteDiv.addEventListener('click', (event) => {
        console.log('DEBUG: Click detectado en:', event.target);
        const labBtn = event.target.closest('.ver-lab-results-btn');
        const enfermeriaBtn = event.target.closest('.ver-enfermeria-results-btn');
        console.log('DEBUG: labBtn encontrado:', labBtn);
        console.log('DEBUG: enfermeriaBtn encontrado:', enfermeriaBtn);

        if (labBtn) {
            console.log('DEBUG: Click en botón Laboratorio, índice:', labBtn.dataset.index);
            const index = parseInt(labBtn.dataset.index, 10);
            if (!isNaN(index) && allFetchedStudies[index]) {
                const labStudy = allFetchedStudies[index];
                if (labStudy.ResultadosLaboratorio) {
                    openLabResultsModal(labStudy.ResultadosLaboratorio);
                } else {
                    console.error('ERROR: El estudio de laboratorio no tiene la propiedad "ResultadosLaboratorio".');
                }
            } else {
                console.error('ERROR: No se pudo obtener un índice válido para el estudio de laboratorio clicado.');
            }
        } else if (enfermeriaBtn) {
            console.log('DEBUG: Click en botón Enfermería, índice:', enfermeriaBtn.dataset.index);
            const index = parseInt(enfermeriaBtn.dataset.index, 10);
            if (!isNaN(index) && allFetchedStudies[index]) {
                const enfermeriaStudy = allFetchedStudies[index];
                if (enfermeriaStudy.ResultadosEnfermeria) {
                    openEnfermeriaResultsModal(enfermeriaStudy.ResultadosEnfermeria);
                    console.log('DEBUG: Abriendo modal de Enfermería con datos:', enfermeriaStudy.ResultadosEnfermeria);
                } else {
                    console.error('ERROR: El estudio de enfermería no tiene la propiedad "ResultadosEnfermeria".');
                }
            } else {
                console.error('ERROR: No se pudo obtener un índice válido para el estudio de enfermería clicado.');
            }
        }
    });

    if (!estudiosComplementariosSeccion || !verEstudiosBtn || !resultadosEstudiosPacienteDiv) {
        console.warn('Algunos elementos DOM para estudios complementarios no se encontraron. Asegúrate de que index.html los tenga.');
    }

    if (consultarBtn && dniInput && practicaSelect) {
        consultarBtn.addEventListener('click', consultarDNI);
        dniInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') consultarDNI();
        });
        practicaSelect.addEventListener('change', function() {
            const dni = dniInput.value.trim();
            if (dni) consultarDNI();
        });

        if (generarInformeBtn) {
            generarInformeBtn.addEventListener('click', () => {
                console.log('DEBUG: Botón Generar Informe clicado.');
                if (currentPatientData) {
                    console.log('DEBUG: currentPatientData NO es nulo.', currentPatientData);
                    console.log('DEBUG: currentRedFlags antes de pasar:', [...currentRedFlags]);
                    openSeguimientoForm(currentPatientData, [...currentRedFlags]);
                } else {
                    console.log('DEBUG: currentPatientData ES nulo. Alerta mostrada.');
                    alert('Por favor, busca un paciente primero para generar un informe de seguimiento.');
                }
            });
        }
    }

    // --- Función para cerrar el modal de laboratorio ---
    if (closeLabResultsModal) {
        closeLabResultsModal.addEventListener('click', () => {
            labResultsModal.classList.add('hidden');
        });
    }
    if (labResultsModal) {
        labResultsModal.addEventListener('click', (e) => {
            if (e.target === labResultsModal) {
                labResultsModal.classList.add('hidden');
            }
        });
    }

    // --- Función para cerrar el modal de enfermería ---
    if (closeEnfermeriaResultsModal) {
        closeEnfermeriaResultsModal.addEventListener('click', () => {
            enfermeriaResultsModal.classList.add('hidden');
        });
    }
    if (enfermeriaResultsModal) {
        enfermeriaResultsModal.addEventListener('click', (e) => {
            if (e.target === enfermeriaResultsModal) {
                enfermeriaResultsModal.classList.add('hidden');
            }
        });
    }

    function openSeguimientoForm(patientData, redFlags) {
        sessionStorage.setItem('currentPatientForSeguimiento', JSON.stringify(patientData));
        sessionStorage.setItem('redFlagsForSeguimiento', JSON.stringify(redFlags));
        window.open('/seguimiento-formulario.html', '_blank');
    }

    // --- Función consultarDNI ---
    async function consultarDNI() {
        const dni = dniInput.value.trim();
        if (!dni) {
            alert('Por favor ingrese un DNI');
            return;
        }

        loadingDiv.classList.remove('hidden');
        resultDiv.innerHTML = '<p class="text-center text-gray-500 py-8"><i class="fas fa-spinner fa-spin"></i> Buscando información...</p>';
        resultDiv.classList.remove('hidden');
        resultDiv.style.display = 'block';

        const previousStudiesMessageDiv = document.getElementById('previous-studies-message');
        if (previousStudiesMessageDiv) {
            previousStudiesMessageDiv.classList.add('hidden');
            previousStudiesMessageDiv.innerHTML = '';
        }
        resetProfile();

        try {
            console.log('Iniciando búsqueda para DNI:', dni);
            const response = await fetch('/buscar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dni })
            });
            const data = await response.json();
            console.log('DEBUG APP.JS: Datos recibidos del servidor:', data);

            if (data.error) {
                console.log('DEBUG APP.JS: Servidor reporta error:', data.error);
                resultDiv.innerHTML = `<p class="text-center text-red-500 py-8">${data.error}</p>`;
                resultDiv.classList.remove('hidden');
                resultDiv.style.display = 'block';
                resetProfile();
            } else if (data.pacientePrincipal && (data.pacientePrincipal.DNI || data.pacientePrincipal.Documento)) {
                console.log('DEBUG APP.JS: Servidor devolvió datos de paciente principal.');
                const pacientePrincipal = data.pacientePrincipal;
                currentPatientDNI = pacientePrincipal.DNI || pacientePrincipal.Documento;
                currentPatientData = data.pacientePrincipal;
                currentRedFlags.clear();

                if (resultDiv) {
                    resultDiv.classList.add('hidden');
                }
                if (riskAssessmentDiv) { riskAssessmentDiv.style.display = 'block'; }
                if (cancerPreventionDiv) { cancerPreventionDiv.style.display = 'block'; }
                if (infectiousDiseasesDiv) { infectiousDiseasesDiv.style.display = 'block'; }
                if (healthyHabitsDiv) { healthyHabitsDiv.style.display = 'block'; }
                if (dentalHealthDiv) { dentalHealthDiv.style.display = 'block'; }
                if (mentalHealthDiv) { mentalHealthDiv.style.display = 'block'; }
                if (renalHealthDiv) { renalHealthDiv.style.display = 'block'; }
                if (visualHealthDiv) { visualHealthDiv.style.display = 'block'; }
                if (epocSectionDiv) { epocSectionDiv.style.display = 'block'; }
                if (aneurismaSectionDiv) { aneurismaSectionDiv.style.display = 'block'; }
                if (osteoporosisSectionDiv) { osteoporosisSectionDiv.style.display = 'block'; }
                if (aspirinaSectionDiv) { aspirinaSectionDiv.style.display = 'block'; }

                if (estudiosComplementariosSeccion) {
                    estudiosComplementariosSeccion.classList.remove('hidden');
                    resultadosEstudiosPacienteDiv.innerHTML = '<p class="text-gray-600">Haz clic en "Ver Estudios" para cargar los informes complementarios.</p>';
                    verEstudiosBtn.disabled = false;
                }
                setTimeout(() => {
                    updateProfile(pacientePrincipal);
                    showResults(pacientePrincipal);
                    evaluateCardiovascularRisk(pacientePrincipal);
                    evaluateCancerPrevention(pacientePrincipal);
                    evaluateInfectiousDiseases(pacientePrincipal);
                    evaluateHealthyHabits(pacientePrincipal);
                    evaluateDentalHealth(pacientePrincipal);
                    evaluateMentalHealth(pacientePrincipal);
                    evaluateRenalHealth(pacientePrincipal);
                    evaluateEPOC(pacientePrincipal);
                    evaluateAneurisma(pacientePrincipal);
                    evaluateOsteoporosis(pacientePrincipal);
                    evaluateAspirina(pacientePrincipal);
                    evaluateVisualHealth(pacientePrincipal);
                }, 50);

                const estudiosPrevios = data.estudiosPrevios;
                if (estudiosPrevios && estudiosPrevios.length > 0) {
                    console.log('DEBUG APP.JS: ¡Paciente con estudios previos encontrados!', estudiosPrevios);
                    if (previousStudiesMessageDiv) {
                        previousStudiesMessageDiv.style.display = 'block';
                        previousStudiesMessageDiv.innerHTML = `
                            <p class="text-yellow-700 font-semibold mb-2">
                                <i class="fas fa-exclamation-triangle mr-2"></i>Existen otros Día Preventivos registrados:
                            </p>
                            <ul class="list-disc list-inside ml-4">
                                ${estudiosPrevios.map(estudio => `<li>${estudio.fecha}</li>`).join('')}
                            </ul>
                            <p class="text-sm text-gray-500 mt-2">
                                El estudio mostrado actualmente corresponde a la fecha más reciente.
                            </p>
                        `;
                    } else {
                        console.error("DEBUG APP.JS: Div 'previous-studies-message' no encontrado en el HTML.");
                    }
                } else {
                    if (previousStudiesMessageDiv) {
                        previousStudiesMessageDiv.style.display = 'none';
                        previousStudiesMessageDiv.innerHTML = '';
                    }
                }
            } else {
                console.error('DEBUG APP.JS: Respuesta inesperada del servidor (no es error ni datos de paciente válidos):', data);
                resultDiv.innerHTML = '<p class="text-center text-red-500 py-8">Error: Formato de datos inesperado del servidor.</p>';
                resultDiv.classList.remove('hidden');
                resultDiv.style.display = 'block';
                currentPatientData = null;
                currentRedFlags.clear();
                resetProfile();
            }
        } catch (error) {
            console.error('Error en la consulta:', error);
            resultDiv.innerHTML = '<p class="text-center text-red-500 py-8">Error al conectar con el servidor</p>';
            resultDiv.classList.remove('hidden');
            resultDiv.style.display = 'block';
            resetProfile();
        } finally {
            loadingDiv.classList.add('hidden');
        }
    }

    // --- Función para abrir el modal de laboratorio ---
    function openLabResultsModal(results) {
        console.log('DEBUG: Abriendo modal laboratorio');
        console.log('Modal element:', labResultsModal);
        console.log('Modal display style:', labResultsModal.style.display);
        console.log('Modal classList:', labResultsModal.classList);
    
        let tableHtml = `<h3 class="text-lg font-semibold mb-4 text-gray-800">Resultados de Laboratorio</h3>`;
        tableHtml += `<table class="min-w-full bg-white border border-gray-300">
            <thead>
                <tr class="bg-gray-100">
                    <th class="py-2 px-4 border-b">Campo</th>
                    <th class="py-2 px-4 border-b">Resultado</th>
                </tr>
            </thead>
            <tbody>`;
        let hasResults = false;
        for (const campo in results) {
            if (['DNI', 'Nombre', 'Apellido', 'Fecha', 'Prestador', 'TipoEstudio'].includes(campo)) continue;
            const valor = results[campo];
            if (valor && String(valor).trim() !== '' && String(valor).trim().toLowerCase() !== 'n/a') {
                const formattedCampoName = campo.replace(/([A-Z])/g, ' $1').trim();
                tableHtml += `<tr>
                    <td class="py-2 px-4 border-b text-gray-700">${formattedCampoName}</td>
                    <td class="py-2 px-4 border-b text-gray-900 font-medium">${valor}</td>
                </tr>`;
                hasResults = true;
            }
        }
        if (!hasResults) {
            tableHtml += `<tr><td colspan="2" class="py-4 px-4 text-center text-gray-500">No hay resultados detallados de laboratorio para mostrar.</td></tr>`;
        }
        tableHtml += `</tbody></table>`;
        labResultsModalContent.innerHTML = tableHtml;
        labResultsModal.classList.remove('hidden');
        console.log('DESPUÉS de remover hidden - Modal classList:', labResultsModal.classList);
    }

    // --- Función para abrir el modal de enfermería ---
    function openEnfermeriaResultsModal(results) {
        console.log('DEBUG: Abriendo modal de enfermería con datos:', results);
        if (!enfermeriaResultsModal || !enfermeriaResultsModalContent) {
        console.error('Modal de enfermería no disponible');
        alert('Error: No se puede mostrar los resultados en este momento.');
        return;
    }
    // Accede correctamente al objeto de resultados anidados
    const enfermeriaData = results.ResultadosEnfermeria;

    if (!enfermeriaData) {
        enfermeriaResultsModalContent.innerHTML = `<p class="text-red-500">No se encontraron datos de enfermería.</p>`;
        enfermeriaResultsModal.classList.remove('hidden');
        enfermeriaResultsModal.classList.add('flex');
        return;
    }

    let tableHtml = `<h3 class="text-lg font-semibold mb-4 text-gray-800">Resultados de Enfermería</h3>`;
    tableHtml += `<table class="min-w-full bg-white border border-gray-300">
            <thead>
                <tr class="bg-gray-100">
                    <th class="py-2 px-4 border-b">Campo</th>
                    <th class="py-2 px-4 border-b">Resultado</th>
                </tr>
            </thead>
            <tbody>`;

    const camposEnfermeria = {
        'Altura': enfermeriaData.Altura || 'N/A',
        'Peso': enfermeriaData.Peso || 'N/A',
        'Circunferencia cintura': enfermeriaData.Circunferencia_cintura || 'N/A',
        'Presión Arterial': enfermeriaData.Presion_Arterial || 'N/A',
        'Vacunas': enfermeriaData.Vacunas || 'N/A',
        'Agudeza Visual': enfermeriaData.AgudezaVisual || 'N/A', // CLAVE: Acceder a través de `enfermeriaData`
        'Fecha de Cierre': enfermeriaData.Fecha_cierre_Enf || 'N/A'
    };
    for (const campo in camposEnfermeria) {
            tableHtml += `<tr>
                <td class="py-2 px-4 border-b text-gray-700">${campo}</td>
                <td class="py-2 px-4 border-b text-gray-900 font-medium">${camposEnfermeria[campo]}</td>
            </tr>`;
    }
    tableHtml += `</tbody></table>`;
    let linksHtml = '';
    // La Espirometría también debe leerse desde `enfermeriaData`
    if (enfermeriaData.Espirometria_PDF && enfermeriaData.Espirometria_PDF.trim() !== '') {
        linksHtml += `<a href="${enfermeriaData.Espirometria_PDF}" target="_blank" class="block mt-2 text-blue-500 hover:underline">Ver Espirometría (PDF)</a>`;
    }
    
    tableHtml += linksHtml;
    
    enfermeriaResultsModalContent.innerHTML = tableHtml;
    enfermeriaResultsModal.classList.remove('hidden');
    enfermeriaResultsModal.classList.remove('flex'); 
}
    
    // --- Lógica para el botón "Ver Estudios" ---
if (verEstudiosBtn) {
    verEstudiosBtn.addEventListener('click', async () => {
        if (!currentPatientDNI) {
            alert('No hay un DNI de paciente cargado para buscar estudios.');
            return;
        }
        resultadosEstudiosPacienteDiv.innerHTML = '<p class="text-gray-600"><i class="fas fa-spinner fa-spin"></i> Cargando informes complementarios...</p>';
        verEstudiosBtn.disabled = true;

        try {
            const response = await fetch('/obtener-estudios-paciente', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dni: currentPatientDNI })
            });
            const result = await response.json();
            console.log('DEBUG (app.js - /obtener-estudios-paciente): Datos recibidos del Backend:', result);
            if (response.ok && result.estudios && result.estudios.length > 0) {
                allFetchedStudies = result.estudios;
                let estudiosHtml = `<h4 class="text-lg font-semibold text-gray-700 mb-4">Estudios Encontrados para DNI: ${currentPatientDNI}</h4>`;
                estudiosHtml += `<table class="resultados-table w-full border-collapse">`;
                estudiosHtml += `
                    <thead>
                        <tr class="bg-gray-200">
                            <th class="px-4 py-2 border text-left">Tipo de Estudio</th>
                            <th class="px-4 py-2 border text-left">Fecha</th>
                            <th class="px-4 py-2 border text-left">Prestador</th>
                            <th class="px-4 py-2 border text-left">Resultado/Detalle</th>
                            <th class="px-4 py-2 border text-center">Informe/PDF</th>
                        </tr>
                    </thead>
                    <tbody>
                `;
                result.estudios.forEach((estudio, index) => {
                    const tipoEstudio = estudio.TipoEstudio || 'Desconocido';
                    const fechaEstudio = estudio.Fecha || 'N/A';
                    const prestadorEstudio = estudio.Prestador || 'N/A';
                    let resultadoCeldaContent = '';
                    let informeCeldaContent = '';

                    if (tipoEstudio === 'Laboratorio' && estudio.ResultadosLaboratorio && typeof estudio.ResultadosLaboratorio === 'object') {
                        resultadoCeldaContent = '<p class="text-gray-600 text-sm">Ver detalles en tabla.</p>';
                        informeCeldaContent = `<button type="button" class="ver-lab-results-btn bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm" data-index="${index}">Ver Tabla Resultados</button>`;
                    } else if (tipoEstudio === 'Enfermeria' && estudio.ResultadosEnfermeria) {
                        resultadoCeldaContent = 'Ver resultados en modal';
                        informeCeldaContent = `<button type="button" class="ver-enfermeria-results-btn bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm" data-index="${index}">Ver Resultados</button>`;
                    } 
                    
                    // --- Lógica para Espirometria ---
                    // Se verifica si el tipo de estudio es Espirometria
                    else if (tipoEstudio === 'Espirometria') {
                        // Accede a los datos del campo directamente
                        const resultado = estudio.Resultado || 'N/A';
                        const link = estudio.LinkPDF;
                        
                        // Determina si el link debe ser un enlace o solo texto
                        const esLink = link && String(link).trim() !== '' && link.startsWith('http');
                        
                        resultadoCeldaContent = resultado;
                        informeCeldaContent = esLink ? `<a href="${link}" target="_blank" class="text-blue-500 hover:underline">Ver PDF <i class="fas fa-external-link-alt ml-1"></i></a>` : '<span>N/A</span>';
                    }
                    
                    else {
                        // Lógica para todos los demás estudios (Mamografia, Odontologia, etc.)
                        resultadoCeldaContent = estudio.Resultado || 'N/A';
                        const linkPdf = estudio.LinkPDF && String(estudio.LinkPDF).trim() !== '' ? estudio.LinkPDF : null;
                        informeCeldaContent = linkPdf ? `<a href="${linkPdf}" target="_blank" class="text-blue-500 hover:underline">Ver PDF <i class="fas fa-external-link-alt ml-1"></i></a>` : '<span class="text-gray-500">No disponible</span>';
                    }
                    estudiosHtml += `<tr class="hover:bg-gray-50"><td class="px-4 py-2 border">${tipoEstudio}</td><td class="px-4 py-2 border">${fechaEstudio}</td><td class="px-4 py-2 border">${prestadorEstudio}</td><td class="px-4 py-2 border">${resultadoCeldaContent}</td><td class="px-4 py-2 border text-center">${informeCeldaContent}</td></tr>`;
                });
                estudiosHtml += `</tbody></table>`;
                resultadosEstudiosPacienteDiv.innerHTML = estudiosHtml;
            } else {
                resultadosEstudiosPacienteDiv.innerHTML = `<p class="text-gray-600">No se encontraron estudios complementarios para este paciente.</p>`;
            }
        } catch (error) {
            console.error('ERROR en frontend al buscar estudios (verEstudiosBtn):', error);
            resultadosEstudiosPacienteDiv.innerHTML = '<p class="text-red-500">Error al buscar estudios. Intente de nuevo.</p>';
        } finally {
            verEstudiosBtn.disabled = false;
        }
    });
}
// Este bloque debe existir en tu app.js y estar fuera del addEventListener de verEstudiosBtn

document.addEventListener('click', function(event) {
    // Listener para el modal de Laboratorio
    if (event.target.classList.contains('ver-lab-results-btn')) {
        const index = event.target.getAttribute('data-index');
        const estudio = allFetchedStudies[index];
        if (estudio && estudio.ResultadosLaboratorio) {
            // Llamada a la función del modal de laboratorio
            openLaboratorioResultsModal(estudio.ResultadosLaboratorio); 
        } else {
            alert('Error: No se encontraron datos de laboratorio para este estudio.');
        }
    }
    
    // Listener para el modal de Enfermería
    if (event.target.classList.contains('ver-enfermeria-results-btn')) {
        const index = event.target.getAttribute('data-index');
        const estudio = allFetchedStudies[index];
        if (estudio && estudio.ResultadosEnfermeria) {
            // Llamada a la función del modal de enfermería
            openEnfermeriaResultsModal(estudio); 
        } else {
            alert('Error: No se encontraron datos de enfermería para este estudio.');
        }
    }
});

function resetProfile() {
    // Limpiar los divs de resultados
    resultDiv.innerHTML = '';

    // ¡IMPORTANTE! NO vaciar innerHTML de riskAssessmentDiv aquí.
    // Solo ocúltala. Sus elementos internos (como pressure-value) deben permanecer.
    if (riskAssessmentDiv) {
        riskAssessmentDiv.style.display = 'none'; // Usa display: none para ocultar
    }
    if (cancerPreventionDiv) {
        cancerPreventionDiv.style.display = 'none';
    }
    if (infectiousDiseasesDiv) {
        infectiousDiseasesDiv.style.display = 'none';
    }
    if (healthyHabitsDiv) {
        healthyHabitsDiv.style.display = 'none';
    }

    if (dentalHealthDiv) {
        dentalHealthDiv.style.display = 'none';
    }

    if (mentalHealthDiv) {
        mentalHealthDiv.style.display = 'none';
    }
    
    if (renalHealthDiv) { 
        renalHealthDiv.style.display = 'none';
    }
    if (visualHealthDiv) {
        visualHealthDiv.style.display = 'none';
    }
    if (epocSectionDiv) {
        epocSectionDiv.style.display = 'none';
    }
    if (aneurismaSectionDiv) {
        aneurismaSectionDiv.style.display = 'none';
    }
    if (osteoporosisSectionDiv) {
        osteoporosisSectionDiv.style.display = 'none';
    }
    if (aspirinaSectionDiv) {
        aspirinaSectionDiv.style.display = 'none';
    }


    // Ocultar la sección de estudios complementarios
    if (estudiosComplementariosSeccion) {
        estudiosComplementariosSeccion.classList.add('hidden');
        resultadosEstudiosPacienteDiv.innerHTML = '';
        currentPatientDNI = null;
    }
    // ... Cualquier otra lógica para limpiar el perfil del paciente
}

function updateProfile(data) {
    const nombre = data.Nombre || data.nombre || 'Afiliado';
    document.getElementById('user-name').textContent = `${nombre} ${data.Apellido || data.apellido || ''}`.trim();
    document.getElementById('welcome-message').innerHTML = 
        `¡Hola, ${nombre}! Este programa es para ayudarte y acompañarte en el cuidado de tu salud.`;
}
function showResults(data) {
    console.log('Mostrando resultados con datos:', data);
    const practicaSelect = document.getElementById('practica');
    const practicaSeleccionada = practicaSelect.value;
    
    let infoPractica = '';
    
    if (practicaSeleccionada) {
        // Mapeo de campos a sus observaciones correspondientes
        const mapaObservaciones = {
            'Presion_Arterial': 'Observaciones_Presion_Arterial',
            'IMC': 'Observaciones_IMC',
            'Agudeza_visual': 'Observaciones - Agudeza visual',
            'Control_odontologico': 'Observaciones - Control_odontologico',
            'Valor_CPO': 'Observaciones - Control_odontologico',
            'Alimentacion_saludable': 'Observaciones - Alimentacion_saludable',
            'Actividad_fisica': 'Observaciones - Actividad_fisica',
            'Seguridad_vial': 'Observaciones - Seguridad_vial',
            'Caidas_en_adultos_mayores': 'Observaciones - Caidas_en_adultos_mayores',
            'Acido_folico': 'Observaciones - Acido_folico',
            'Abuso_alcohol': 'Observaciones - Abuso_alcohol',
            'Tabaco': 'Observaciones - Tabaco',
            'Violencia': 'Observaciones - Violencia',
            'Depresion': 'Observaciones - Depresion',
            'ITS': 'Observaciones - ITS',
            'Hepatitis_B': 'Observaciones - Hepatitis_B',
            'Hepatitis_C': 'Observaciones - Hepatitis_C',
            'VIH': 'Observaciones - VIH',
            'Dislipemias': 'Observaciones - Dislipemias',
            'Diabetes': 'Observaciones - Diabetes',
            'Cancer_cervico_uterino_HPV': 'Observaciones - HPV',
            'Cancer_cervico_uterino_PAP': 'Observaciones - PAP',
            'Cancer_colon_SOMF': 'Observaciones - SOMF',
            'Cancer_colon_Colonoscopia': 'Observaciones - Colonoscopia',
            'Cancer_mama_Mamografia': 'Observaciones - Mamografia',
            'ERC': 'Observaciones - ERC',
            'EPOC': 'Observaciones - EPOC',
            'Aneurisma_aorta': 'Observaciones - Aneurisma_aorta',
            'Osteoporosis': 'Observaciones - Osteoporosis',
            'Estratificacion_riesgo_CV': 'Observaciones - Riesgo_CV',
            'Aspirina': 'Observaciones - Aspirina',
            'Inmunizaciones': 'Observaciones - Inmunizaciones',
            'VDRL': 'Observaciones - VDRL',
            'Prostata_PSA': 'Observaciones - PSA',
            'Chagas': 'Observaciones - Chagas'
            // 'Profesional' no tiene observaciones asociadas
        };

        const valor = data[practicaSeleccionada] || 'No registrado';
        const nombrePractica = practicaSelect.options[practicaSelect.selectedIndex].text;
        
        // Solo buscar observaciones si no es el campo "Profesional"
        let observaciones = '';
        if (practicaSeleccionada !== 'Profesional' && mapaObservaciones[practicaSeleccionada]) {
            observaciones = data[mapaObservaciones[practicaSeleccionada]] || '';
        }

        infoPractica = `
            <div class="bg-blue-50 p-4 rounded-lg mt-4">
                <h3 class="font-semibold text-blue-800 mb-2">${nombrePractica}</h3>
                <p><span class="font-medium">Valor:</span> ${valor}</p>
                ${observaciones ? `<p><span class="font-medium">Observaciones:</span> ${observaciones}</p>` : ''}
            </div>
        `;
    }

    document.getElementById('result').innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-blue-50 p-4 rounded-lg">
                <h3 class="font-semibold text-blue-800 mb-2">Datos Personales</h3>
                <p><span class="font-medium">Nombre:</span> ${data.Nombre || data.nombre || 'N/A'}</p>
                <p><span class="font-medium">Apellido:</span> ${data.Apellido || data.apellido || 'N/A'}</p>
                <p><span class="font-medium">Edad:</span> ${data.Edad || data.edad || 'N/A'}</p>
                <p><span class="font-medium">DNI:</span> ${data.DNI || data.dni || data.Documento || 'N/A'}</p>
                ${data.Profesional ? `<p><span class="font-medium">Profesional:</span> ${data.Profesional}</p>` : ''}
            </div>
            ${infoPractica}
        </div>
    `;
}

function evaluateCardiovascularRisk(data) {
    console.log('Datos completos recibidos:', data); // Para depuración

    // 1. Obtener valores REALES del paciente (sin procesar)
    const valoresReales = {
        edad: parseInt(data.Edad || data.edad) || 0,
        sexo: (data.Sexo || '').toUpperCase().startsWith('F') ? 'Femenino' : 'Masculino',
        presion: data['Presion Arterial'] || data['Presion_Arterial'] || 'No registrado',
        imc: data['IMC'] || 'No registrado',
        // Asegúrate de que los nombres de las columnas sean EXACTOS como están en tu Google Sheet
        diabetes: data['Diabetes'] || 'No registrado', // Asumo 'Diabetes' como nombre de columna
        dislipemia: data['Dislipemias'] || 'No registrado', // Asumo 'Dislipemias' como nombre de columna
        tabaquismo: data['Tabaquismo'] || data['Tabaco'] || 'No registrado', // Asumo 'Tabaquismo' o 'Tabaco'
    };


    // --- Definir pendingKeywords aquí para usarla en todas las funciones ---
    const pendingKeywords = ['no se realiza', 'no registrado']; // Asegúrate de que 'no registrado' también es un pendiente
    // --- Fin pendingKeywords ---


    // 2. Evaluar factores de riesgo (lógica que funciona bien)
    const factoresEvaluados = {
        presion: evaluarPresion(valoresReales.presion),
        imc: evaluarIMC(valoresReales.imc),
        diabetes: { valor: valoresReales.diabetes, riesgo: valoresReales.diabetes.toLowerCase() === 'presenta' }, // Convertir a minúsculas
        dislipemia: { valor: valoresReales.dislipemia, riesgo: valoresReales.dislipemia.toLowerCase() === 'presenta' }, // Convertir a minúsculas
        tabaquismo: evaluarTabaquismo(valoresReales.tabaquismo), // Usa la función evaluarTabaquismo
        edad: { valor: valoresReales.edad, riesgo: valoresReales.edad >= 40 },
        sexo: { valor: valoresReales.sexo, riesgo: valoresReales.sexo === 'Masculino' }
    };

    // 3. Calcular puntuación (función existente que funciona)
    const puntuacion = calcularPuntuacionRiesgo(factoresEvaluados);
    
    // 4. Clasificar riesgo (función existente que funciona)
    const riesgo = clasificarRiesgo(puntuacion, factoresEvaluados.diabetes.riesgo, factoresEvaluados.presion.riesgo);

    // 5. Mostrar resultados y AÑADIR RED FLAGS
    currentRedFlags.delete('IMC'); // Ahora solo borramos 'IMC'

    
    // Hipertensión
    if (factoresEvaluados.presion.riesgo) {
        currentRedFlags.add('Hipertension');
    } else if (valoresReales.presion.toLowerCase().includes('no se realiza') || valoresReales.presion.toLowerCase().includes('no aplica')) {
        currentRedFlags.add('Control Presión Arterial (Pendiente)');
    }

    // Dislipemia
    if (factoresEvaluados.dislipemia.riesgo) {
        currentRedFlags.add('Dislipemia');
    } else if (valoresReales.dislipemia.toLowerCase().includes('no se realiza') || valoresReales.dislipemia.toLowerCase().includes('no aplica') || valoresReales.dislipemia === 'No registrado') {
        currentRedFlags.add('Perfil Lipídico (Pendiente)');
    }

    // Diabetes
    if (factoresEvaluados.diabetes.riesgo) {
        currentRedFlags.add('Diabetes');
    } else if (valoresReales.diabetes.toLowerCase().includes('no se realiza') || valoresReales.diabetes.toLowerCase().includes('no aplica') || valoresReales.diabetes === 'No registrado') {
        currentRedFlags.add('Control Glucémico (Pendiente)');
    }

    // Tabaquismo
    if (factoresEvaluados.tabaquismo.riesgo) { // Si evaluarTabaquismo retorna riesgo=true
        currentRedFlags.add('Tabaquismo');
    } else if (valoresReales.tabaquismo.toLowerCase().includes('no se realiza') || valoresReales.tabaquismo.toLowerCase().includes('no aplica') || valoresReales.tabaquismo === 'No registrado') {
        currentRedFlags.add('Hábito Tabáquico (Pendiente)');
    }

    // IMC / Obesidad
    const imcValueString = valoresReales.imc.toLowerCase().trim(); 
    
    const imcRiesgoKeywords = [
        'obesidad morbida',
        'obesidad grado ii',
        'obesidad', 
        'sobrepeso'
    ];

    let shouldAddIMCFlag = false; // Bandera para decidir si añadir 'IMC'

    // Verifica si es una condición de riesgo o sobrepeso
    for (const keyword of imcRiesgoKeywords) {
        if (imcValueString.includes(keyword)) {
            shouldAddIMCFlag = true;
            console.log(`DEBUG IMC: 'IMC' marcada para bandera por '${keyword}'!`);
            break; 
        }
    }


    // Si alguna de las condiciones anteriores se cumplió, añadir la bandera genérica 'IMC'
    if (shouldAddIMCFlag) {
        currentRedFlags.add('IMC'); // ¡Siempre añade 'IMC' como la bandera!
        console.log("DEBUG IMC: Bandera 'IMC' añadida a currentRedFlags.");
    } else {
        console.log("DEBUG IMC: IMC no es una categoría de riesgo/sobrepeso ni pendiente. No se añade bandera.");
        // AÑADE ESTA LÍNEA AQUÍ para que el IMC pendiente también pase a seguimiento:
        if (pendingKeywords.includes(imcValueString) && !currentRedFlags.has('IMC (Pendiente)')) {
            currentRedFlags.add('IMC (Pendiente)');
            console.log("DEBUG IMC: IMC (Pendiente) añadido a currentRedFlags.");
        }
    }
    // Si el riesgo general es ALTO o MODERADO, añadirlo como motivo de seguimiento general
    if (riesgo.nivel === "ALTO RIESGO" || riesgo.nivel === "RIESGO MODERADO") {
        currentRedFlags.add(`Riesgo Cardiovascular: ${riesgo.nivel}`);
    }


    // Finalmente, llama a la función para mostrar los resultados en el DOM.
    // Esta función DEBERÍA ser la que actualiza los colores y textos en tu interfaz.
    mostrarResultadosFinales({
        valoresReales,
        factoresEvaluados,
        puntuacion,
        riesgo,
        pendingKeywords
    });
}

function evaluarPresion(presion) {
    let valor = presion;
    let riesgo = false;
    
    // Asegura que la cadena sea insensible a mayúsculas/minúsculas y espacios
    const presionClean = presion.toLowerCase().trim();

    if (presionClean.includes('hipertensión') || presionClean.includes('hipertension')) {
        riesgo = true;
    } else if (presionClean.match(/\d+\s*\/\s*\d+/)) {
        const [sistolica, diastolica] = presionClean.split('/').map(Number);
        riesgo = sistolica >= 140 || diastolica >= 90;
        valor = `${sistolica}/${diastolica}`;
    } else if (presionClean.includes('no se realiza') || presionClean.includes('no aplica')) {
        // No es un "riesgo" per se, pero es un pendiente
        riesgo = false; 
    }
    
    return {valor, riesgo};
}

function evaluarIMC(imc) {
    let valor = imc;
    let riesgo = false;
    const imcNum = parseFloat(imc);
    
    if (!isNaN(imcNum)) {
        riesgo = imcNum >= 25; // Si 25 es el umbral para sobrepeso/riesgo
        valor = imcNum.toFixed(1);
    } else if (imc.toLowerCase().includes('sobrepeso') || imc.toLowerCase().includes('obesidad')) {
        riesgo = true;
    }
    // No hace falta un 'else' aquí para 'No registrado', ya se maneja en 'evaluateCardiovascularRisk' al añadir el flag.
    
    return {valor, riesgo};
}

function evaluarTabaquismo(tabaco) {
    let valor = tabaco;
    let riesgo = false;
    const tabacoClean = tabaco.toLowerCase().trim();

    if (tabacoClean === "fuma") {
        riesgo = true;
        valor = "Fuma";
    } else if (tabacoClean === "no fuma") {
        riesgo = false;
        valor = "No fuma";
    } else {
        // Para casos como "No registrado" o valores inesperados
        riesgo = false; // No hay riesgo si no está definido como "Fuma"
        valor = tabaco || "No registrado";
    }
    
    return {valor, riesgo};
}

function calcularPuntuacionRiesgo(factores) {
    let puntos = 0;

    // Puntos por edad (tu lógica actual)
    if (factores.edad.valor >= 70) puntos += (factores.sexo.valor === 'Masculino' ? 8 : 9);
    else if (factores.edad.valor >= 60) puntos += (factores.sexo.valor === 'Masculino' ? 6 : 7);
    else if (factores.edad.valor >= 50) puntos += 4;
    else if (factores.edad.valor >= 40) puntos += (factores.sexo.valor === 'Masculino' ? 3 : 2);

    // Puntos por factores de riesgo (tu lógica actual)
    if (factores.presion.riesgo) puntos += 3;
    if (factores.diabetes.riesgo) puntos += 3;
    if (factores.tabaquismo.riesgo) puntos += 2;
    if (factores.dislipemia.riesgo) puntos += 2; // Ya tenías esto, lo confirmamos.
    if (factores.imc.riesgo) {
        const imcNum = parseFloat(factores.imc.valor); // Usamos el valor numérico del IMC
        puntos += (!isNaN(imcNum) && imcNum >= 30) ? 2 : 1; // 2 puntos por Obesidad (IMC >= 30), 1 punto por Sobrepeso (IMC >= 25)
    }

    return puntos;
}

function clasificarRiesgo(puntuacion, diabetes, hipertension) {
    // Tu lógica actual de clasificación de riesgo.
    if (puntuacion >= 15 || diabetes || hipertension) {
        return {
            nivel: "ALTO RIESGO",
            porcentaje: "≥20% a 10 años",
            clase: "risk-high",
            recomendacion: "Consulta cardiológica urgente. Control estricto de factores de riesgo."
        };
    } else if (puntuacion >= 10) {
        return {
            nivel: "RIESGO MODERADO",
            porcentaje: "10-19% a 10 años",
            clase: "risk-medium",
            recomendacion: "Consulta con médico clínico. Mejora de hábitos."
        };
    }
    return {
        nivel: "BAJO RIESGO",
        porcentaje: "<10% a 10 años",
        clase: "risk-low",
        recomendacion: "Control médico anual. Mantener hábitos saludables."
    };
}

function actualizarEstiloTarjeta(tipo, tieneRiesgo) {
    const card = document.getElementById(`${tipo}-card`);
    const notesElement = document.getElementById(`${tipo}-notes`);
    const valueElement = document.getElementById(`${tipo}-value`);
    
    if (!card || !notesElement || !valueElement) {
        console.warn(`Elementos de tarjeta, notas o valor no encontrados para ID: ${tipo}`);
        return;
    }

    // Obtenemos el valor real del elemento y lo normalizamos para la comparación
    const actualValueClean = String(valueElement.textContent).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // --- Lógica de prioridades para el ESTILO y la NOTA ---
    if (PENDING_KEYWORDS_FOR_VISUALS.includes(actualValueClean)) {
        // Si es "No se realiza" o "No registrado" -> GRIS (y debería estar en seguimiento por tu otra lógica)
        card.className = `p-4 rounded-lg bg-gray-100 border-l-4 border-gray-500`;
        notesElement.innerHTML = '<span class="text-gray-500"><i class="fas fa-info-circle"></i> No realizado / Pendiente</span>';
    } else if (NOT_APPLICABLE_KEYWORDS.includes(actualValueClean)) {
        // Si es "No aplica" -> VERDE (no es riesgo, no es pendiente, no necesita seguimiento)
        card.className = `p-4 rounded-lg bg-green-100 border-l-4 border-green-500`;
        notesElement.innerHTML = '<span class="text-green-500"><i class="fas fa-check-circle"></i> No aplica</span>';
    } else if (tieneRiesgo) {
        // Si hay riesgo -> ROJO
        card.className = `p-4 rounded-lg bg-red-100 border-l-4 border-red-500`;
        notesElement.innerHTML = '<span class="text-red-500"><i class="fas fa-exclamation-triangle"></i> Riesgo detectado</span>';
    } else {
        // Si no es ninguno de los anteriores y no tiene riesgo -> VERDE (Normal)
        card.className = `p-4 rounded-lg bg-green-100 border-l-4 border-green-500`;
        notesElement.innerHTML = '<span class="text-green-500"><i class="fas fa-check-circle"></i> Normal</span>';
    }
}

function mostrarResultadosFinales({valoresReales, factoresEvaluados, puntuacion, riesgo}) {
    const riskAssessmentDiv = document.getElementById('risk-assessment');
    
    // 1. Mostrar valores EXACTOS del paciente
    document.getElementById('pressure-value').textContent = valoresReales.presion;
    document.getElementById('imc-value').textContent = valoresReales.imc;
    document.getElementById('diabetes-value').textContent = valoresReales.diabetes;
    document.getElementById('dislipemia-value').textContent = valoresReales.dislipemia;
    document.getElementById('tabaquismo-value').textContent = valoresReales.tabaquismo;
    document.getElementById('edad-value').textContent = `${valoresReales.edad} años`;
    document.getElementById('sexo-value').textContent = valoresReales.sexo;

    // 2. Aplicar estilos según evaluación (sin alterar los valores mostrados)
    actualizarEstiloTarjeta('pressure', factoresEvaluados.presion.riesgo);
    actualizarEstiloTarjeta('imc', factoresEvaluados.imc.riesgo);
    actualizarEstiloTarjeta('diabetes', factoresEvaluados.diabetes.riesgo);
    actualizarEstiloTarjeta('dislipemia', factoresEvaluados.dislipemia.riesgo);
    actualizarEstiloTarjeta('tabaquismo', factoresEvaluados.tabaquismo.riesgo);

    // 3. Mostrar evaluación de riesgo (calculada correctamente)
    document.getElementById('risk-level').textContent = riesgo.nivel;
    document.getElementById('risk-percentage').textContent = riesgo.porcentaje;
    document.getElementById('risk-description').innerHTML = `
        <strong>Puntuación:</strong> ${puntuacion}<br>
        <strong>Recomendaciones:</strong> ${riesgo.recomendacion}
    `;
    // 4. Color del recuadro principal según riesgo
    document.getElementById('risk-card').className = `md:col-span-2 p-4 rounded-lg ${riesgo.clase}`;
    
    riskAssessmentDiv.classList.remove('hidden');
}

function evaluateCancerPrevention(data) {
    const cancerDiv = document.getElementById('cancer-prevention');
    const recommendationsList = document.getElementById('cancer-recommendations');
    
    // Limpiar recomendaciones previas
    recommendationsList.innerHTML = '';
    
    // Mapeo de campos de cáncer con nombres normalizados
    const cancerTests = {
        'hpv': {
            field: 'Cancer_cervico_uterino_HPV',
            notesField: 'Observaciones - HPV',
            name: 'Test de HPV',
            gender: 'Femenino',
            ageRange: '30-65 años',
            frequency: 'Cada 5 años'
        },
        'pap': {
            field: 'Cancer_cervico_uterino_PAP',
            notesField: 'Observaciones - PAP',
            name: 'Papanicolaou',
            gender: 'Femenino',
            ageRange: '25-65 años',
            frequency: 'Cada 3 años'
        },
        'somf': {
            field: 'Cancer_colon_SOMF',
            notesField: 'Observaciones - SOMF',
            name: 'SOMF (Sangre Oculta en Materia Fecal)',
            gender: 'Ambos',
            ageRange: '50-75 años',
            frequency: 'Anual'
        },
        'colonoscopia': {
            field: 'Cancer_colon_Colonoscopia',
            notesField: 'Observaciones - Colonoscopia',
            name: 'Colonoscopia',
            gender: 'Ambos',
            ageRange: '50-75 años',
            frequency: 'Cada 10 años'
        },
        'mamografia': {
            field: 'Cancer_mama_Mamografia',
            notesField: 'Observaciones - Mamografia',
            name: 'Mamografia',
            gender: 'Femenino',
            ageRange: '50-69 años',
            frequency: 'Cada 2 años'
        },
        'psa': {
            field: 'Prostata_PSA',
            notesField: 'Observaciones - PSA',
            name: 'PSA (Antígeno Prostático Específico)',
            gender: 'Masculino',
            ageRange: '50-70 años',
            frequency: 'Según criterio médico'
        }
    };
    
    // Procesar cada examen
    for (const [testId, testInfo] of Object.entries(cancerTests)) {
        const valueElement = document.getElementById(`${testId}-value`);
        const notesElement = document.getElementById(`${testId}-notes`);
        const cardElement = document.getElementById(`${testId}-card`);
        
        // Obtener el valor original del campo
        let originalValue = data[testInfo.field] || 'No registrado';
        const notes = data[testInfo.notesField] || '';
        
        // --- NUEVOS LOGS DE DEPURACIÓN EN ESTA FUNCIÓN ---
        console.log(`CANCER_DEBUG: Procesando test: ${testInfo.name} (ID: ${testId})`);
        console.log(`CANCER_DEBUG: Valor ORIGINAL para ${testInfo.name}: "${originalValue}"`);

        // *** CAMBIOS CRÍTICOS AQUÍ: Normalizar a minúsculas, limpiar espacios y remover acentos ***
        let evaluatedValue = String(originalValue).trim().toLowerCase(); 
        evaluatedValue = evaluatedValue.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 
        // ***********************************************************************************

        console.log(`CANCER_DEBUG: Valor EVALUADO FINAL para ${testInfo.name} (minúsculas, sin acentos): "${evaluatedValue}"`);
        // --- FIN NUEVOS LOGS ---
        
        // Verificar si el valor contiene alguna de las palabras clave (ahora `evaluatedValue` ya está normalizado)
        // Usamos includes() para flexibilidad, o regex si necesitamos patrones más complejos
        // Las regex ahora solo necesitan las versiones sin acento/minúscula
        const isPatologico = /patologico|patologica|alterado|alterada|positivo/i.test(evaluatedValue); // Añadido 'patologico' y 'alterada'
        const isNormal = /normal|negativo/i.test(evaluatedValue);
        const isNoRealizado = /no se realiza|no realizado|no aplica/i.test(evaluatedValue); // Añadido 'no aplica' en minúsculas

        valueElement.textContent = originalValue; // Muestra el valor original en la interfaz
        
        // Establecer estilo según resultado
        if (isPatologico) {
            cardElement.className = 'p-4 rounded-lg risk-high';
            notesElement.innerHTML = '<span class="text-red-500"><i class="fas fa-exclamation-triangle"></i> Resultado patológico - Requiere atención</span>';
            
            // Agregar recomendación urgente
            recommendationsList.innerHTML += `
                <li class="text-red-600 font-medium">
                    <strong>${testInfo.name}:</strong> Resultado patológico (${originalValue}). Consultar con especialista urgentemente.
                </li>
            `;
            currentRedFlags.add(testInfo.name); 
        } else if (isNormal) {
            cardElement.className = 'p-4 rounded-lg risk-low';
            notesElement.innerHTML = '<span class="text-green-500"><i class="fas fa-check-circle"></i> Resultado normal</span>';
        } else if (isNoRealizado) {
            cardElement.className = 'p-4 rounded-lg bg-gray-100';
            notesElement.innerHTML = '<span class="text-gray-500"><i class="fas fa-info-circle"></i> No realizado</span>';
            
            // ... (Tu lógica para recomendar según edad y sexo es correcta aquí) ...
            const edad = parseInt(data.Edad || data.edad) || 0;
            const sexo = (data.Sexo || '').toUpperCase().startsWith('F') ? 'Femenino' : 'Masculino';
            
            if ((testInfo.gender === 'Ambos' || testInfo.gender === sexo) && 
                edad >= parseInt(testInfo.ageRange.split('-')[0])) {
                recommendationsList.innerHTML += `
                    <li>
                        <strong>${testInfo.name}:</strong> Recomendado para ${sexo} ${testInfo.ageRange} (${testInfo.frequency}). 
                        <span class="text-blue-600">Considerar realizar.</span>
                    </li>
                `;
                currentRedFlags.add(`${testInfo.name} (Pendiente)`);
            }
            
        } else {
            cardElement.className = 'p-4 rounded-lg bg-gray-100';
            notesElement.innerHTML = '<span class="text-gray-500"><i class="fas fa-question-circle"></i> No registrado / Valor no reconocido</span>'; // Mensaje más claro
            currentRedFlags.add(`${testInfo.name} (Dato No Reconocido)`);
        }
        
        // Mostrar observaciones si existen
        if (notes) {
            notesElement.innerHTML += `<div class="mt-1 text-gray-600">Obs: ${notes}</div>`;
        }
    }
    
    // Mostrar la sección
    cancerDiv.classList.remove('hidden');
}
function evaluateInfectiousDiseases(data) {
    const infectiousDiv = document.getElementById('infectious-diseases');
    const recommendationsList = document.getElementById('infectious-recommendations');
    
    // Limpiar recomendaciones previas
    recommendationsList.innerHTML = '';
    
    // Mapeo de campos de enfermedades infecciosas
    const infectiousTests = {
        'its': {
            field: 'ITS',
            notesField: 'Observaciones - ITS',
            name: 'Infecciones de Transmisión Sexual', // Nombre legible para el flag
            riskGroups: ['Personas sexualmente activas', 'Múltiples parejas', 'Sin protección'],
            screening: 'Anual o según factores de riesgo'
        },
        'hepatitis-b': {
            field: 'Hepatitis_B',
            notesField: 'Observaciones - Hepatitis_B',
            name: 'Hepatitis B', // Nombre legible para el flag
            riskGroups: ['Personal de salud', 'Parejas de infectados', 'Usuarios de drogas IV'],
            screening: 'Al menos una vez en la vida'
        },
        'hepatitis-c': {
            field: 'Hepatitis_C',
            notesField: 'Observaciones - Hepatitis_C',
            name: 'Hepatitis C', // Nombre legible para el flag
            riskGroups: ['Nacidos entre 1945-1965', 'Transfusiones antes de 1992', 'Usuarios de drogas IV'],
            screening: 'Al menos una vez en la vida'
        },
        'vih': {
            field: 'VIH',
            notesField: 'Observaciones - VIH',
            name: 'VIH', // Nombre legible para el flag
            riskGroups: ['Personas sexualmente activas', 'Usuarios de drogas IV', 'Parejas de positivos'],
            screening: 'Al menos una vez en la vida, anual si factores de riesgo'
        },
        'vdrl': {
            field: 'VDRL',
            notesField: 'Observaciones - VDRL',
            name: 'VDRL (Sífilis)', // Nombre legible para el flag
            riskGroups: ['Embarazadas', 'Personas sexualmente activas', 'Hombres que tienen sexo con hombres'],
            screening: 'Anual si factores de riesgo'
        },
        'chagas': {
            field: 'Chagas',
            notesField: 'Observaciones - Chagas',
            name: 'Chagas', // Nombre legible para el flag
            riskGroups: ['Zonas endémicas', 'Madres positivas', 'Transfusiones antes de 2005'],
            screening: 'Al menos una vez en la vida si factores de riesgo'
        }
    };
    
    // Procesar cada examen
    for (const [testId, testInfo] of Object.entries(infectiousTests)) {
        const valueElement = document.getElementById(`${testId}-value`);
        const notesElement = document.getElementById(`${testId}-notes`);
        const cardElement = document.getElementById(`${testId}-card`);
        
        // Obtener el valor del campo, normalizando posibles variaciones
        let value = data[testInfo.field] || 'No registrado';
        const notes = data[testInfo.notesField] || '';
        
        // Normalizar valores
        value = value.toString().trim();
        
        // Verificar si el valor contiene alguna de las palabras clave
        const isPositive = /positivo|reactivo|detectado|presenta/i.test(value);
        const isNegative = /negativo|no reactivo|no presenta/i.test(value);
        const isNotDone = /no se realiza|no realizado|no efectuado/i.test(value);
        
        valueElement.textContent = value;
        
        // Establecer estilo según resultado
        if (isPositive) {
            cardElement.className = 'p-4 rounded-lg risk-high';
            notesElement.innerHTML = '<span class="text-red-500"><i class="fas fa-exclamation-triangle"></i> Resultado positivo - Requiere atención</span>';
            
            // Agregar recomendación urgente
            recommendationsList.innerHTML += `
                <li class="text-red-600 font-medium">
                    <strong>${testInfo.name}:</strong> Resultado positivo (${value}). Consultar con especialista urgentemente.
                </li>
            `;
            // --- AÑADIR A RED FLAGS PARA RESULTADOS POSITIVOS ---
            currentRedFlags.add(testInfo.name); 

        } else if (isNegative) {
            cardElement.className = 'p-4 rounded-lg risk-low';
            notesElement.innerHTML = '<span class="text-green-500"><i class="fas fa-check-circle"></i> Resultado negativo</span>';
        } else if (isNotDone) {
            cardElement.className = 'p-4 rounded-lg bg-gray-100';
            notesElement.innerHTML = '<span class="text-gray-500"><i class="fas fa-info-circle"></i> No realizado</span>';
            
            // Recomendación de screening según factores de riesgo (aquí puedes añadir una lógica más compleja si lo necesitas)
            // Por ahora, asumimos que si no está hecho y es una prueba de screening, se recomienda.
            recommendationsList.innerHTML += `
                <li>
                    <strong>${testInfo.name}:</strong> Prueba recomendada para ${testInfo.riskGroups.join(', ')}. 
                    <span class="text-blue-600">Frecuencia: ${testInfo.screening}.</span>
                </li>
            `;
            // --- AÑADIR A RED FLAGS PARA PRUEBAS PENDIENTES ---
            currentRedFlags.add(`${testInfo.name} (Pendiente)`);
            
        } else {
            cardElement.className = 'p-4 rounded-lg bg-gray-100';
            notesElement.innerHTML = '<span class="text-gray-500"><i class="fas fa-question-circle"></i> No registrado</span>';
            // Puedes añadir a currentRedFlags aquí si un "No registrado" también se considera un pendiente de seguimiento
            // currentRedFlags.add(`${testInfo.name} (No Registrado)`);
        }
        
        // Mostrar observaciones si existen
        if (notes) {
            notesElement.innerHTML += `<div class="mt-1 text-gray-600">Obs: ${notes}</div>`;
        }
    }
    
    // Mostrar la sección
    infectiousDiv.classList.remove('hidden');
}

function evaluateHealthyHabits(data) {
    const habitsDiv = document.getElementById('healthy-habits');
    const recommendationsList = document.getElementById('habits-recommendations');
    
    // Limpiar recomendaciones previas
    recommendationsList.innerHTML = '';
    
    // Mapeo de hábitos saludables con patrones de detección mejorados
    const healthyHabits = {
        'alimentacion': {
            field: 'Alimentacion_saludable',
            notesField: 'Observaciones - Alimentacion_saludable',
            name: 'Alimentación Saludable',
            recommendationPositive: 'Excelentes hábitos alimenticios, continúa así',
            recommendationNegative: 'Considera mejorar tu dieta con más frutas, verduras y alimentos integrales',
            recommendationNotDone: 'Recomendación: Evaluación nutricional anual'
        },
        'actividad': {
            field: 'Actividad_fisica',
            notesField: 'Observaciones - Actividad_fisica',
            name: 'Actividad Física',
            recommendationPositive: 'Buen nivel de actividad física, mantén la rutina',
            recommendationNegative: 'Intenta realizar al menos 150 minutos de actividad moderada por semana',
            recommendationNotDone: 'Recomendación: Evaluación de actividad física anual'
        },
        'seguridad': {
            field: 'Seguridad_vial',
            notesField: 'Observaciones - Seguridad_vial',
            name: 'Seguridad Vial',
            recommendationPositive: 'Buenas prácticas de seguridad vial',
            recommendationNegative: 'Recuerda usar siempre cinturón de seguridad y casco en motocicletas',
            recommendationNotDone: 'Recomendación: Revisión de hábitos de seguridad vial'
        },
        'caidas': {
            field: 'Caidas_en_adultos_mayores',
            notesField: 'Observaciones - Caidas_en_adultos_mayores',
            name: 'Prevención de Caídas',
            recommendationPositive: 'Buenas medidas de prevención de caídas',
            recommendationNegative: 'Evalúa la seguridad en tu hogar y usa calzado adecuado',
            recommendationNotDone: 'Recomendación: Evaluación de riesgo de caídas'
        },
        'alcohol': {
            field: 'Abuso_alcohol',
            notesField: 'Observaciones - Abuso_alcohol',
            name: 'Consumo de Alcohol',
            recommendationPositive: 'Consumo responsable o nulo de alcohol',
            recommendationNegative: 'Considera reducir el consumo de alcohol',
            recommendationNotDone: 'Recomendación: Evaluación de consumo de alcohol anual'
        },
        'tabaco': {
            field: 'Tabaco',
            notesField: 'Observaciones - Tabaco',
            name: 'Consumo de Tabaco',
            recommendationPositive: 'No fumas o has dejado de fumar, excelente decisión',
            recommendationNegative: 'Dejar de fumar es lo mejor para tu salud',
            recommendationNotDone: 'Recomendación: Evaluación de hábito tabáquico'
        },
        'acido': {
            field: 'Acido_folico',
            notesField: 'Observaciones - Acido_folico',
            name: 'Ácido Fólico',
            recommendationPositive: 'Niveles adecuados de ácido fólico',
            recommendationNegative: 'Considera suplementación si estás en edad fértil', 
            recommendationNotDone: 'Recomendación: Evaluación de niveles de ácido fólico'
        }
    };
    
// Procesar cada hábito
for (const [habitId, habitInfo] of Object.entries(healthyHabits)) {
    const valueElement = document.getElementById(`${habitId}-value`);
    const notesElement = document.getElementById(`${habitId}-notes`);
    const cardElement = document.getElementById(`${habitId}-card`);
    
    // Obtener el valor original de la hoja (lo usaremos para mostrarlo si no lo quieres en minúsculas)
    let originalValue = data[habitInfo.field] || 'No registrado'; 
    const notes = data[habitInfo.notesField] || ''; 

    // *** CAMBIO CRÍTICO: Normalizar a minúsculas y limpiar espacios para LA EVALUACIÓN ***
    let evaluatedValue = String(originalValue).trim().toLowerCase(); 

    // Esto asegura que 'Patológico' y 'Patologico' se conviertan a 'patologico' para la comparación.
    evaluatedValue = evaluatedValue.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); 

    console.log(`DEBUG_COMPARISON: El valor final a comparar es: "${evaluatedValue}"`);

    // --- LOGS DEPURACIÓN (AHORA SÍ CON EL VALOR REAL) ---
    console.log('DEBUG: Hábito: ' + habitInfo.name + ', Valor ORIGINAL leído: "' + originalValue + '"');
    console.log('DEBUG: Hábito: ' + habitInfo.name + ', Valor EVALUADO (minúsculas): "' + evaluatedValue + '" (longitud: ' + evaluatedValue.length + ')');
    // --- FIN LOGS DEPURACIÓN ---
    
    let isPositive = false;
    let isNegative = false;
    let isNotDone = false; // "No realizado / Pendiente" (gris)

    // //////////////////////////////////////////////////////////////////////////////////
    // // LÓGICA DE EVALUACIÓN ROBUSTA Y EXPLICITA (Listas de valores y prioridad)    //
    // //////////////////////////////////////////////////////////////////////////////////

    // --- Definir las listas de valores esperados (en minúsculas) ---

    // Valores que indican que la evaluación/práctica NO SE REALIZÓ (pendiente, gris)
    const pendingKeywords = [
        'no se realiza', // Ej. La pregunta de caídas no se le hizo al paciente
        'no realizado',
        'pte',
        'no aplica'
    ];

// Valores que indican un resultado NEGATIVO o de RIESGO (rojo)
const negativeKeywords = [
    'no cumple',        
    'no',               
    'indicado',         
    'se verifica',      
    'abusa',
    'excesivo', 'excesiva',
    'fuma',
    'sedentario', 'sedentaria',
    'poco', 'poca',
    'alto', 'alta',
    'riesgo alto',
    'patologico',       // Solo necesitas la versión en minúsculas y sin acentos
    'alterada',         // Solo necesitas la versión en minúsculas
    'positivo'          
];

// Valores que indican un resultado POSITIVO o SALUDABLE (verde)
const positiveKeywords = [
    'cumple',           
    'si',
    'adecuado', 'adecuada',
    'bueno', 'buena',
    'no abusa',
    'no se verifica',         
    'no fuma',          
    'nunca',
    'no indicado',
    'normal',
    'si realiza',           
    'negativo',         
    'no detectable'     
];
    // --- Aplicar la lógica de evaluación con prioridades ---

    // 1. Primero, verificar el caso específico de Actividad Física "No realiza" (es negativo/rojo)
    if (habitId === 'actividad' && evaluatedValue === 'no realiza') {
        isNegative = true;
    } 
    // 2. Luego, verificar otros resultados NEGATIVOS (si no fue el caso de Actividad Física especial)
    else if (negativeKeywords.includes(evaluatedValue)) {
        isNegative = true;
    }
    // 3. Después, verificar resultados PENDIENTES / NO REALIZADOS (son gris)
    else if (pendingKeywords.includes(evaluatedValue)) {
        isNotDone = true;
    }
    // 4. Finalmente, verificar resultados POSITIVOS
    else if (positiveKeywords.includes(evaluatedValue)) {
        isPositive = true;
    }
    // Si no coincide con nada, se considerará "No categorizado" por el último else.

    // //////////////////////////////////////////////////////////////////////////////////
    // // FIN DE LA LÓGICA DE EVALUACIÓN                                                //
    // //////////////////////////////////////////////////////////////////////////////////

    // --- LOGS DEPURACIÓN (RESULTADO FINAL DE LAS BANDERAS) ---
    console.log(`DEBUG: ${habitInfo.name} - FINAL isNotDone: ${isNotDone}, isNegative: ${isNegative}, isPositive: ${isPositive}`);
    // --- FIN LOGS DEPURACIÓN ---
    
    valueElement.textContent = originalValue; // Muestra el valor original, no el en minúsculas

    // Establecer estilo y agregar a red flags según el resultado final de las banderas
    if (isNotDone) { // Si se marcó como "No realizado" / Pendiente (gris)
        cardElement.className = 'p-4 rounded-lg bg-gray-100'; // Gris para pendiente
        notesElement.innerHTML = '<span class="text-gray-500"><i class="fas fa-info-circle"></i> No realizado / Pendiente</span>';
        recommendationsList.innerHTML += `<li class="text-gray-600"><strong>${habitInfo.name}:</strong> ${habitInfo.recommendationNotDone}</li>`;
        currentRedFlags.add(`${habitInfo.name} (Pendiente)`); 
        
    } else if (isNegative) { // Si se marcó como Negativo / Requiere mejora (rojo)
        cardElement.className = 'p-4 rounded-lg risk-high'; // Rojo para negativo
        notesElement.innerHTML = '<span class="text-red-500"><i class="fas fa-exclamation-triangle"></i> Requiere mejora</span>';
        recommendationsList.innerHTML += `<li class="text-red-600 font-medium"><strong>${habitInfo.name}:</strong> ${habitInfo.recommendationNegative}</li>`;
        currentRedFlags.add(habitInfo.name); 

    } else if (isPositive) { // Si se marcó como Positivo (verde)
        cardElement.className = 'p-4 rounded-lg risk-low'; // Verde para positivo
        notesElement.innerHTML = '<span class="text-green-500"><i class="fas fa-check-circle"></i> Adecuado</span>';
        recommendationsList.innerHTML += `<li class="text-green-600"><strong>${habitInfo.name}:</strong> ${habitInfo.recommendationPositive}</li>`;
        // No se añade a currentRedFlags si es positivo

    } else { // Si el valor no coincide con ninguna categoría conocida (ni negativo, ni pendiente, ni positivo)
        cardElement.className = 'p-4 rounded-lg bg-gray-100'; // Color por defecto (gris)
        notesElement.innerHTML = '<span class="text-gray-500"><i class="fas fa-question-circle"></i> Dato no categorizado / No registrado</span>';
        currentRedFlags.add(`${habitInfo.name} (Dato No Reconocido)`); // Se marca para seguimiento por ser desconocido
    }
    
    // Mostrar observaciones si existen
    if (notes) {
        notesElement.innerHTML += `<div class="mt-1 text-gray-600">Obs: ${notes}</div>`;
    }
}
    // Mostrar la sección
    habitsDiv.classList.remove('hidden');
}
function evaluateDentalHealth(data) {
    const dentalDiv = document.getElementById('dental-health');
    const recommendationsList = document.getElementById('dental-recommendations');
    
    // Limpiar recomendaciones previas
    recommendationsList.innerHTML = '';
    
    // Obtener valores
    const value = data['Control_odontologico'] || 'No registrado';
    const notes = data['Observaciones - Control_odontologico'] || '';
    
    // Mostrar valores
    document.getElementById('odontologico-value').textContent = value;
    
    // Evaluar resultado
    const isHighRisk = /riesgo alto/i.test(value);
    const isModerateRisk = /riesgo moderado/i.test(value);
    const isLowRisk = /riesgo bajo/i.test(value);
    const isNotDone = /no se realiza/i.test(value);
    
    // Aplicar estilos y recomendaciones
    const cardElement = document.getElementById('odontologico-card');
    const notesElement = document.getElementById('odontologico-notes');
    
    if (isHighRisk) {
        cardElement.className = 'p-4 rounded-lg risk-high';
        notesElement.innerHTML = '<span class="text-red-500"><i class="fas fa-exclamation-triangle"></i> Riesgo Alto</span>';
        recommendationsList.innerHTML = `
            <li class="text-red-600 font-medium">Consulta odontológica urgente requerida</li>
            <li>Evaluación cada 3 meses</li>
            <li>Reforzar higiene bucal</li>
        `;
        // --- AÑADIR A RED FLAGS PARA RIESGO ALTO ---
        currentRedFlags.add('Control Odontológico (Riesgo Alto)');

    } else if (isModerateRisk) {
        cardElement.className = 'p-4 rounded-lg risk-medium';
        notesElement.innerHTML = '<span class="text-yellow-500"><i class="fas fa-exclamation-circle"></i> Riesgo Moderado</span>';
        recommendationsList.innerHTML = `
            <li class="text-yellow-600 font-medium">Consulta odontológica recomendada</li>
            <li>Evaluación cada 6 meses</li>
            <li>Mejorar técnicas de cepillado</li>
        `;
    } else if (isLowRisk) {
        cardElement.className = 'p-4 rounded-lg risk-low';
        notesElement.innerHTML = '<span class="text-green-500"><i class="fas fa-check-circle"></i> Riesgo Bajo</span>';
        recommendationsList.innerHTML = `
            <li class="text-green-600">Control anual odontológico</li>
            <li>Mantener buenos hábitos de higiene</li>
        `;
    } else if (isNotDone) {
        cardElement.className = 'p-4 rounded-lg bg-gray-100';
        notesElement.innerHTML = '<span class="text-gray-500"><i class="fas fa-info-circle"></i> No realizado</span>';
        recommendationsList.innerHTML = `
            <li>Recomendado: Control odontológico anual</li>
            <li>Importante para salud general</li>
        `;
        // --- AÑADIR A RED FLAGS PARA PRUEBAS PENDIENTES ---
        currentRedFlags.add('Control Odontológico (Pendiente)');
        
    } else {
        cardElement.className = 'p-4 rounded-lg bg-gray-100';
        notesElement.innerHTML = '<span class="text-gray-500"><i class="fas fa-question-circle"></i> No registrado</span>';
        currentRedFlags.add('Control Odontológico (No Registrado)');
    }
    
    // Mostrar observaciones
    if (notes) {
        notesElement.innerHTML += `<div class="mt-1 text-gray-600">Obs: ${notes}</div>`;
    }
    
    // Mostrar sección
    dentalDiv.classList.remove('hidden');
}
function evaluateMentalHealth(data) {
    const mentalDiv = document.getElementById('mental-health');
    const recommendationsList = document.getElementById('mental-recommendations');
    
    // Limpiar recomendaciones previas
    recommendationsList.innerHTML = '';
    
    // Evaluar Depresión
    const depresionValue = data['Depresion'] || '';
    const depresionNotes = data['Observaciones - Depresion'] || '';
    
    document.getElementById('depresion-value').textContent = depresionValue || 'No registrado';
    
    // Detección corregida (insensible a mayúsculas/minúsculas y espacios)
    const isDepresion = /^se\s*verifica$/i.test(depresionValue.trim());
    const isNotDepresion = /^no\s*se\s*verifica$/i.test(depresionValue.trim());
    
    const depresionCard = document.getElementById('depresion-card');
    const depresionNotesElement = document.getElementById('depresion-notes');
    
    if (isDepresion) {
        depresionCard.className = 'p-4 rounded-lg risk-high';
        depresionNotesElement.innerHTML = '<span class="text-red-500"><i class="fas fa-exclamation-triangle"></i> Se verifica</span>';
        recommendationsList.innerHTML += `
            <li class="text-red-600 font-medium">Depresión detectada: Evaluación por especialista requerida</li>
            <li>Considerar intervención psicológica/psiquiátrica</li>
        `;
         // --- AÑADIR A RED FLAGS PARA RESULTADOS POSITIVOS ---
        currentRedFlags.add('Depresión (Se verifica)');
        
    } else if (isNotDepresion) {
        depresionCard.className = 'p-4 rounded-lg risk-low';
        depresionNotesElement.innerHTML = '<span class="text-green-500"><i class="fas fa-check-circle"></i> No se verifica</span>';
        recommendationsList.innerHTML += `
            <li class="text-green-600">Sin indicios de depresión detectados</li>
        `;
    } else {
        depresionCard.className = 'p-4 rounded-lg bg-gray-100';
        depresionNotesElement.innerHTML = '<span class="text-gray-500"><i class="fas fa-question-circle"></i> No registrado</span>';
        currentRedFlags.add('Depresión (No Registrado)'); 
    }
    
    // Evaluar Violencia (misma lógica corregida)
    const violenciaValue = data['Violencia'] || '';
    const violenciaNotes = data['Observaciones - Violencia'] || '';
    
    document.getElementById('violencia-value').textContent = violenciaValue || 'No registrado';
    
    const isViolencia = /^se\s*verifica$/i.test(violenciaValue.trim());
    const isNotViolencia = /^no\s*se\s*verifica$/i.test(violenciaValue.trim());
    
    const violenciaCard = document.getElementById('violencia-card');
    const violenciaNotesElement = document.getElementById('violencia-notes');
    
    if (isViolencia) {
        violenciaCard.className = 'p-4 rounded-lg risk-high';
        violenciaNotesElement.innerHTML = '<span class="text-red-500"><i class="fas fa-exclamation-triangle"></i> Se verifica</span>';
        recommendationsList.innerHTML += `
            <li class="text-red-600 font-medium">Violencia detectada: Intervención urgente necesaria</li>
            <li>Contactar con servicios de protección</li>
            <li>Protocolo de actuación frente a violencia</li>
        `;
         // --- AÑADIR A RED FLAGS PARA RESULTADOS POSITIVOS ---
        currentRedFlags.add('Violencia (Se verifica)');
        
    } else if (isNotViolencia) {
        violenciaCard.className = 'p-4 rounded-lg risk-low';
        violenciaNotesElement.innerHTML = '<span class="text-green-500"><i class="fas fa-check-circle"></i> No se verifica</span>';
        recommendationsList.innerHTML += `
            <li class="text-green-600">Sin indicios de violencia detectados</li>
        `;
    } else {
        violenciaCard.className = 'p-4 rounded-lg bg-gray-100';
        violenciaNotesElement.innerHTML = '<span class="text-gray-500"><i class="fas fa-question-circle"></i> No registrado</span>';
        currentRedFlags.add('Violencia (No Registrado)');
    }
    
    // Mostrar observaciones si existen
    if (depresionNotes) {
        depresionNotesElement.innerHTML += `<div class="mt-1 text-gray-600">Obs: ${depresionNotes}</div>`;
    }
    if (violenciaNotes) {
        violenciaNotesElement.innerHTML += `<div class="mt-1 text-gray-600">Obs: ${violenciaNotes}</div>`;
    }
    
    // Mostrar sección
    mentalDiv.classList.remove('hidden');
}
function evaluateRenalHealth(data) {
    const renalDiv = document.getElementById('renal-health');
    const recommendationsList = document.getElementById('renal-recommendations');
    
    // Limpiar recomendaciones previas
    recommendationsList.innerHTML = '';
    
    // Obtener valores
    const value = data['ERC'] || '';
    const notes = data['Observaciones - ERC'] || '';
    
    // Mostrar valores
    document.getElementById('erc-value').textContent = value;
    
    // Evaluar resultado
    const isNormal = /normal/i.test(value);
    const isPathological = /patol[oó]gico/i.test(value);
    const isNotDone = /No se Realiza/i.test(value);
    
    // Aplicar estilos y recomendaciones
    const cardElement = document.getElementById('erc-card');
    const notesElement = document.getElementById('erc-notes');
    
    if (isPathological) {
        cardElement.className = 'p-4 rounded-lg risk-high';
        notesElement.innerHTML = '<span class="text-red-500"><i class="fas fa-exclamation-triangle"></i> Resultado Patológico</span>';
        recommendationsList.innerHTML = `
            <li class="text-red-600 font-medium">Evaluación nefrológica urgente requerida</li>
            <li>Control estricto de función renal</li>
            <li>Monitorizar presión arterial</li>
        `;
        currentRedFlags.add('ERC (Patológico)');
        
    } else if (isNormal) {
        cardElement.className = 'p-4 rounded-lg risk-low';
        notesElement.innerHTML = '<span class="text-green-500"><i class="fas fa-check-circle"></i> Normal</span>';
        recommendationsList.innerHTML = `
            <li class="text-green-600">Control anual de función renal</li>
            <li>Mantener buena hidratación</li>
        `;
    } else if (isNotDone) {
        cardElement.className = 'p-4 rounded-lg bg-gray-100';
        notesElement.innerHTML = '<span class="text-gray-500"><i class="fas fa-info-circle"></i> No se Realiza</span>';
        recommendationsList.innerHTML = `
            <li>Recomendado: Evaluación de función renal</li>
            <li>Especialmente si hay factores de riesgo</li>
        `;
        currentRedFlags.add('ERC (Pendiente)');
    } else {
        cardElement.className = 'p-4 rounded-lg bg-gray-100';
        notesElement.innerHTML = '<span class="text-gray-500"><i class="fas fa-question-circle"></i> No se Realiza</span>';
        currentRedFlags.add('ERC (No se Realiza)');

    }
    
    // Mostrar observaciones
    if (notes) {
        notesElement.innerHTML += `<div class="mt-1 text-gray-600">Obs: ${notes}</div>`;
    }
    
    // Mostrar sección
    renalDiv.classList.remove('hidden');
}
function evaluateEPOC(data) {
    const epocDiv = document.getElementById('epoc-section');
    const recommendationsList = document.getElementById('epoc-recommendations');
    
    // Limpiar recomendaciones previas
    recommendationsList.innerHTML = '';
    
    // Obtener valores
    const value = data['EPOC'] || '';
    const notes = data['Observaciones - EPOC'] || '';
    
    // Mostrar valores
    document.getElementById('epoc-value').textContent = value;
    
    // Evaluar resultado
    const isPositive = /^se\s*verifica$/i.test(value.trim());
    const isNegative = /^no\s*se\s*verifica$/i.test(value.trim());
    const isNotDone = /^no\s*se\s*realiza$/i.test(value.trim());
    
    // Aplicar estilos y recomendaciones
    const cardElement = document.getElementById('epoc-card');
    const notesElement = document.getElementById('epoc-notes');
    
    if (isPositive) {
        cardElement.className = 'p-4 rounded-lg risk-high';
        notesElement.innerHTML = '<span class="text-red-500"><i class="fas fa-exclamation-triangle"></i> Se verifica</span>';
        recommendationsList.innerHTML = `
            <li class="text-red-600 font-medium">EPOC detectado: Evaluación neumológica</li>
            <li>Rehabilitación pulmonar recomendada</li>
            <li>Evitar exposición a humos/contaminantes</li>
        `;
        currentRedFlags.add('EPOC (se verifica)');
        
    } else if (isNegative) {
        cardElement.className = 'p-4 rounded-lg risk-low';
        notesElement.innerHTML = '<span class="text-green-500"><i class="fas fa-check-circle"></i> No se verifica</span>';
        recommendationsList.innerHTML = `
            <li class="text-green-600">Sin indicios de EPOC detectados</li>
            <li>Continuar con prevención en fumadores</li>
        `;
    } else if (isNotDone) {
        cardElement.className = 'p-4 rounded-lg bg-gray-100';
        notesElement.innerHTML = '<span class="text-gray-500"><i class="fas fa-info-circle"></i> No realizado</span>';
        recommendationsList.innerHTML = `
            <li>Evaluación recomendada para fumadores</li>
            <li>Espirometría como prueba diagnóstica</li>
        `;
    } else {
        cardElement.className = 'p-4 rounded-lg bg-gray-100';
        notesElement.innerHTML = '<span class="text-gray-500"><i class="fas fa-question-circle"></i> No registrado</span>';
        currentRedFlags.add('EPOC (No registrado)');
    }
    
    // Mostrar observaciones
    if (notes) {
        notesElement.innerHTML += `<div class="mt-1 text-gray-600">Obs: ${notes}</div>`;
    }
    
    // Mostrar sección
    epocDiv.classList.remove('hidden');
}

function evaluateAneurisma(data) {
    const aneurismaDiv = document.getElementById('aneurisma-section');
    const recommendationsList = document.getElementById('aneurisma-recommendations');
    
    // Limpiar recomendaciones previas
    recommendationsList.innerHTML = '';
    
    // Obtener valores
    const value = data['Aneurisma_aorta'] || '';
    const notes = data['Observaciones - Aneurisma_aorta'] || '';
    
    // Mostrar valores
    document.getElementById('aneurisma-value').textContent = value;
    
    // Evaluar resultado
    const isPositive = /^se\s*verifica$/i.test(value.trim());
    const isNegative = /^no\s*se\s*verifica$/i.test(value.trim());
    const isNotDone = /^no\s*se\s*realiza$/i.test(value.trim());
    
    // Aplicar estilos y recomendaciones
    const cardElement = document.getElementById('aneurisma-card');
    const notesElement = document.getElementById('aneurisma-notes');
    
    if (isPositive) {
        cardElement.className = 'p-4 rounded-lg risk-high';
        notesElement.innerHTML = '<span class="text-red-500"><i class="fas fa-exclamation-triangle"></i> Se verifica</span>';
        recommendationsList.innerHTML = `
            <li class="text-red-600 font-medium">Aneurisma detectado: Urgencia vascular</li>
            <li>Evaluación por cirugía vascular</li>
            <li>Control estricto de presión arterial</li>
        `;
        currentRedFlags.add('Aneurisma aorta (se verifica)');
        
    } else if (isNegative) {
        cardElement.className = 'p-4 rounded-lg risk-low';
        notesElement.innerHTML = '<span class="text-green-500"><i class="fas fa-check-circle"></i> No se verifica</span>';
        recommendationsList.innerHTML = `
            <li class="text-green-600">Sin evidencia de aneurisma</li>
            <li>Control en pacientes de riesgo</li>
        `;
    } else if (isNotDone) {
        cardElement.className = 'p-4 rounded-lg bg-gray-100';
        notesElement.innerHTML = '<span class="text-gray-500"><i class="fas fa-info-circle"></i> No realizado</span>';
        recommendationsList.innerHTML = `
            <li>Recomendado en fumadores >65 años</li>
            <li>Ecografía abdominal de screening</li>
        `;
    } else {
        cardElement.className = 'p-4 rounded-lg bg-gray-100';
        notesElement.innerHTML = '<span class="text-gray-500"><i class="fas fa-question-circle"></i> No registrado</span>';
        currentRedFlags.add('Aneurisma aorta (No registrado)');
    }
    
    // Mostrar observaciones
    if (notes) {
        notesElement.innerHTML += `<div class="mt-1 text-gray-600">Obs: ${notes}</div>`;
    }
    
    // Mostrar sección
    aneurismaDiv.classList.remove('hidden');
}

function evaluateOsteoporosis(data) {
    const osteoporosisDiv = document.getElementById('osteoporosis-section');
    const recommendationsList = document.getElementById('osteoporosis-recommendations');
    
    // Limpiar recomendaciones previas
    recommendationsList.innerHTML = '';
    
    // Obtener valores
    const value = data['Osteoporosis'] || '';
    const notes = data['Observaciones - Osteoporosis'] || '';
    
    // Mostrar valores
    document.getElementById('osteoporosis-value').textContent = value;
    
    // Evaluar resultado
    const isPositive = /^se\s*verifica$/i.test(value.trim());
    const isNegative = /^no\s*se\s*verifica$/i.test(value.trim());
    const isNotDone = /^no\s*se\s*realiza$/i.test(value.trim());
    
    // Aplicar estilos y recomendaciones
    const cardElement = document.getElementById('osteoporosis-card');
    const notesElement = document.getElementById('osteoporosis-notes');
    
    if (isPositive) {
        cardElement.className = 'p-4 rounded-lg risk-high';
        notesElement.innerHTML = '<span class="text-red-500"><i class="fas fa-exclamation-triangle"></i> Se verifica</span>';
        recommendationsList.innerHTML = `
            <li class="text-red-600 font-medium">Osteoporosis confirmada</li>
            <li>Suplementación con calcio/vitamina D</li>
            <li>Evaluación para tratamiento específico</li>
        `;
        currentRedFlags.add('Osteoporosis (se verifica)');
    
    } else if (isNegative) {
        cardElement.className = 'p-4 rounded-lg risk-low';
        notesElement.innerHTML = '<span class="text-green-500"><i class="fas fa-check-circle"></i> No se verifica</span>';
        recommendationsList.innerHTML = `
            <li class="text-green-600">Densidad ósea normal</li>
            <li>Mantener ingesta adecuada de calcio</li>
        `;
    } else if (isNotDone) {
        cardElement.className = 'p-4 rounded-lg bg-gray-100';
        notesElement.innerHTML = '<span class="text-gray-500"><i class="fas fa-info-circle"></i> No realizado</span>';
        recommendationsList.innerHTML = `
            <li>Recomendado en mujeres >65 años</li>
            <li>Densitometría ósea como prueba clave</li>
        `;
    } else {
        cardElement.className = 'p-4 rounded-lg bg-gray-100';
        notesElement.innerHTML = '<span class="text-gray-500"><i class="fas fa-question-circle"></i> No registrado</span>';
        currentRedFlags.add('Osteoporosis (No registrado)');
    }
    
    // Mostrar observaciones
    if (notes) {
        notesElement.innerHTML += `<div class="mt-1 text-gray-600">Obs: ${notes}</div>`;
    }
    
    // Mostrar sección
    osteoporosisDiv.classList.remove('hidden');
}

function evaluateAspirina(data) {
    const aspirinaDiv = document.getElementById('aspirina-section');
    const recommendationsList = document.getElementById('aspirina-recommendations');
    
    // Limpiar recomendaciones previas
    recommendationsList.innerHTML = '';
    
    // Obtener valores
    const value = data['Aspirina'] || '';
    const notes = data['Observaciones - Aspirina'] || '';
    
    // Mostrar valores
    document.getElementById('aspirina-value').textContent = value || 'No registrado';
    
    // Evaluar resultado
    const isIndicated = /^indicada$/i.test(value.trim());
    const isNotIndicated = /^no\s*indicada$/i.test(value.trim());
    
    // Aplicar estilos y recomendaciones
    const cardElement = document.getElementById('aspirina-card');
    const notesElement = document.getElementById('aspirina-notes');
    
    if (isIndicated) {
        cardElement.className = 'p-4 rounded-lg risk-high';
        notesElement.innerHTML = '<span class="text-red-500"><i class="fas fa-exclamation-triangle"></i> Indicada</span>';
        recommendationsList.innerHTML = `
            <li class="text-red-600 font-medium">Aspirina indicada para prevención</li>
            <li>Dosis usual: 75-100 mg/día</li>
            <li>Monitorizar efectos gastrointestinales</li>
        `;
        currentRedFlags.add('Aspirina (Indicada)');
        
    } else if (isNotIndicated) {
        cardElement.className = 'p-4 rounded-lg risk-low';
        notesElement.innerHTML = '<span class="text-green-500"><i class="fas fa-check-circle"></i> No indicada</span>';
        recommendationsList.innerHTML = `
            <li class="text-green-600">Sin indicación actual de aspirina</li>
            <li>Reevaluar según factores de riesgo</li>
        `;
    } else {
        cardElement.className = 'p-4 rounded-lg bg-gray-100';
        notesElement.innerHTML = '<span class="text-gray-500"><i class="fas fa-question-circle"></i> No registrado</span>';
        recommendationsList.innerHTML = `
            <li>Evaluar indicación según riesgo CV</li>
            <li>Balancear riesgo/beneficio individual</li>
        `;
    }
    
    // Mostrar observaciones
    if (notes) {
        notesElement.innerHTML += `<div class="mt-1 text-gray-600">Obs: ${notes}</div>`;
    }
    
    // Mostrar sección
    aspirinaDiv.classList.remove('hidden');
}
function evaluateVisualHealth(data) {
    const visualDiv = document.getElementById('visual-health');
    const recommendationsList = document.getElementById('visual-recommendations');
    
    // Limpiar recomendaciones previas
    recommendationsList.innerHTML = '';
    
    // Obtener valores
    const value = data['Agudeza_visual'] || '';
    const notes = data['Observaciones - Agudeza visual'] || '';
    
    // Mostrar valores
    document.getElementById('agudeza-value').textContent = value || 'No registrado';
    
    // Evaluar resultado
    const isAlterada = /Alterada/i.test(value);
    const isNormal = /Normal/i.test(value);
    const isControlNormal = /Control Normal/i.test(value);
    const isNotDone = /No se Realiza|no realizado/i.test(value);
    
    // Aplicar estilos y recomendaciones
    const cardElement = document.getElementById('agudeza-card');
    const notesElement = document.getElementById('agudeza-notes');
    
    if (isAlterada) {
        cardElement.className = 'p-4 rounded-lg risk-high';
        notesElement.innerHTML = '<span class="text-red-500"><i class="fas fa-exclamation-triangle"></i> Alterada</span>';
        recommendationsList.innerHTML = `
            <li class="text-red-600 font-medium">Agudeza visual alterada detectada</li>
            <li>Evaluación oftalmológica urgente recomendada</li>
            <li>Considerar corrección visual</li>
        `;
        currentRedFlags.add('Agudeza visual (Alterada)');
        
    } else if (isNormal || isControlNormal) {
        cardElement.className = 'p-4 rounded-lg risk-low';
        notesElement.innerHTML = '<span class="text-green-500"><i class="fas fa-check-circle"></i> Normal</span>';
        recommendationsList.innerHTML = `
            <li class="text-green-600">Agudeza visual dentro de parámetros normales</li>
            <li>Control anual recomendado</li>
        `;
    } else if (isNotDone) {
        cardElement.className = 'p-4 rounded-lg bg-gray-100';
        notesElement.innerHTML = '<span class="text-gray-500"><i class="fas fa-info-circle"></i> No realizado</span>';
        recommendationsList.innerHTML = `
            <li>Evaluación de agudeza visual recomendada</li>
            <li>Realizar en próximo control de salud</li>
            <li>Importante para detección temprana de problemas visuales</li>
        `;
    } else {
        cardElement.className = 'p-4 rounded-lg bg-gray-100';
        notesElement.innerHTML = '<span class="text-gray-500"><i class="fas fa-question-circle"></i> No registrado</span>';
        currentRedFlags.add('Agudeza visual (No registrada)');
    }
    
    // Mostrar observaciones
    if (notes) {
        notesElement.innerHTML += `<div class="mt-1 text-gray-600">Obs: ${notes}</div>`;
    }
    
    // Mostrar sección
    visualDiv.classList.remove('hidden');
}

if (window.location.pathname === '/estadisticas.html') {
        const selectorCampos = document.getElementById('selector-campos');
        const agregarFiltroBtn = document.getElementById('agregar-filtro');
        const filtrosAplicadosDiv = document.getElementById('filtros-aplicados');
        const consultarGrupoBtn = document.getElementById('consultar-grupo-btn');
        const resultadosResumenDiv = document.getElementById('resultados-resumen');
        const exportarExcelBtn = document.getElementById('exportar-excel-btn');
        const combinacionFiltrosSelect = document.getElementById('combinacion-filtros');

        if (selectorCampos && agregarFiltroBtn && filtrosAplicadosDiv && consultarGrupoBtn && resultadosResumenDiv && exportarExcelBtn && combinacionFiltrosSelect) {
            cargarCampos();

            agregarFiltroBtn.addEventListener('click', agregarNuevoFiltro);
            consultarGrupoBtn.addEventListener('click', realizarConsultaGrupal);
            exportarExcelBtn.addEventListener('click', exportarResultados);
        }

        async function cargarCampos() {
            try {
                const response = await fetch('/obtener-campos');
                const campos = await response.json();
                campos.forEach(campo => {
                    const option = document.createElement('option');
                    option.value = campo;
                    option.textContent = campo;
                    selectorCampos.appendChild(option);
                });
            } catch (error) {
                console.error('Error al cargar los campos:', error);
            }
        }
function agregarNuevoFiltro() {
    const camposSeleccionados = Array.from(selectorCampos.selectedOptions).map(option => option.value);
    console.log('Campos seleccionados para filtrar:', camposSeleccionados);
    camposSeleccionados.forEach(campo => {
        // Verificamos SI NO existe ya un filtro para este campo
        if (!document.getElementById(`filtro-${campo}`)) {
            crearInterfazFiltro(campo);
        }
    });
}
async function crearInterfazFiltro(campo) {
    const filtroExistente = document.getElementById(`filtro-${campo}`);
    if (filtroExistente) {
        console.log(`Ya existe un filtro para el campo: ${campo}`);
        return; // Si ya existe, no creamos uno nuevo
    }

    const filtroDiv = document.createElement('div');
    filtroDiv.id = `filtro-${campo}`;
    filtroDiv.classList.add('filtro', 'mb-4', 'p-3', 'bg-gray-200', 'rounded-md');

    const labelCampo = document.createElement('label');
    labelCampo.textContent = `${campo}:`;
    labelCampo.classList.add('block', 'text-gray-700', 'text-sm', 'font-bold', 'mb-2');
    filtroDiv.appendChild(labelCampo);

    if (campo === 'Edad') {
        // ... (tu código para crear el filtro de rango de edad) ...
        const divRango = document.createElement('div');
        divRango.classList.add('flex', 'space-x-2', 'mb-2');

        const labelDesde = document.createElement('label');
        labelDesde.textContent = 'Desde:';
        labelDesde.classList.add('text-gray-700', 'text-sm', 'font-bold');
        const inputDesde = document.createElement('input');
        inputDesde.type = 'number';
        inputDesde.classList.add('shadow', 'appearance-none', 'border', 'rounded', 'w-full', 'py-2', 'px-3', 'text-gray-700', 'leading-tight', 'focus:outline-none', 'focus:shadow-outline');
        inputDesde.id = `edad-desde`;

        const labelHasta = document.createElement('label');
        labelHasta.textContent = 'Hasta:';
        labelHasta.classList.add('text-gray-700', 'text-sm', 'font-bold');
        const inputHasta = document.createElement('input');
        inputHasta.type = 'number';
        inputHasta.classList.add('shadow', 'appearance-none', 'border', 'rounded', 'w-full', 'py-2', 'px-3', 'text-gray-700', 'leading-tight', 'focus:outline-none', 'focus:shadow-outline');
        inputHasta.id = `edad-hasta`;

        const aplicarBtn = document.createElement('button');
        aplicarBtn.textContent = 'Aplicar Rango';
        aplicarBtn.classList.add('bg-blue-500', 'hover:bg-blue-700', 'text-white', 'font-bold', 'py-2', 'px-4', 'rounded', 'focus:outline-none', 'focus:shadow-outline');
        aplicarBtn.addEventListener('click', () => {
            const desde = document.getElementById('edad-desde').value;
            const hasta = document.getElementById('edad-hasta').value;
            filtroDiv.dataset.edadDesde = desde;
            filtroDiv.dataset.edadHasta = hasta;
            console.log(`Rango de edad aplicado: Desde ${desde} hasta ${hasta}`);
        });

        divRango.appendChild(labelDesde);
        divRango.appendChild(inputDesde);
        divRango.appendChild(labelHasta);
        divRango.appendChild(inputHasta);

        filtroDiv.appendChild(divRango);
        filtroDiv.appendChild(aplicarBtn);

        filtrosAplicadosDiv.appendChild(filtroDiv);

    } else {
        try {
            const response = await fetch(`/obtener-opciones-campo/${campo}`);
            const opciones = await response.json();

            if (opciones && opciones.length > 0) {
                opciones.forEach(opcion => {
                    const checkboxDiv = document.createElement('div');
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = `opcion-${campo}-${opcion.replace(/\s+/g, '-')}`;
                    checkbox.value = opcion;
                    const labelOpcion = document.createElement('label');
                    labelOpcion.textContent = opcion;
                    labelOpcion.setAttribute('for', `opcion-${campo}-${opcion.replace(/\s+/g, '-')}`);
                    labelOpcion.classList.add('ml-2', 'text-gray-700', 'text-sm');

                    checkboxDiv.appendChild(checkbox);
                    checkboxDiv.appendChild(labelOpcion);
                    filtroDiv.appendChild(checkboxDiv);
                });
            } else {
                const inputTexto = document.createElement('input');
                inputTexto.type = 'text';
                inputTexto.classList.add('shadow', 'appearance-none', 'border', 'rounded', 'w-full', 'py-2', 'px-3', 'text-gray-700', 'leading-tight', 'focus:outline-none', 'focus:shadow-outline');
                filtroDiv.appendChild(inputTexto);
            }
            filtrosAplicadosDiv.appendChild(filtroDiv);

        } catch (error) {
            console.error(`Error al obtener opciones para ${campo}:`, error);
            const mensajeError = document.createElement('p');
            mensajeError.textContent = `Error al cargar opciones para ${campo}`;
            filtroDiv.appendChild(mensajeError);
            filtrosAplicadosDiv.appendChild(filtroDiv);
        }
    }
}
async function realizarConsultaGrupal() {
    const filtros = obtenerCriteriosDeFiltro();
    const combinacion = combinacionFiltrosSelect.value;
    const dataToSend = { conditions: filtros, combinator: combinacion };

    try {
        const response = await fetch('/consultar-grupo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        });
        const resultados = await response.json();
        console.log('Resultados de la consulta grupal:', resultados);

        // Asumimos que 'resultados.data' ahora contiene el array de objetos con los datos completos
        if (resultados && Array.isArray(resultados.data)) {
            // Almacenamos los datos en un atributo data del botón de exportar para accederlos fácilmente
            exportarExcelBtn.data = resultados.data;
            mostrarResultadosResumen({
                total_registros: resultados.total_registros,
                conteo_cruce: resultados.conteo_cruce,
                criterios_cruce: resultados.criterios_cruce
            });
        } else {
            resultadosResumenDiv.textContent = 'Error: No se recibieron datos detallados para la exportación.';
            console.error('Error: No se recibieron datos detallados para la exportación:', resultados);
        }

    } catch (error) {
        console.error('Error al realizar la consulta grupal:', error);
    }
}

function obtenerCriteriosDeFiltro() {
    const filtros = [];
    const filtrosDivs = document.querySelectorAll('#filtros-aplicados > .filtro');
    filtrosDivs.forEach(filtroDiv => {
        const campo = filtroDiv.id.replace('filtro-', '');
        if (campo === 'Edad') {
            const desde = filtroDiv.dataset.edadDesde;
            const hasta = filtroDiv.dataset.edadHasta;
            if (desde && hasta) {
                if (desde === hasta) {
                    filtros.push({ field: campo, operator: 'equals', value: desde });
                } else {
                    filtros.push({ field: campo, operator: 'greaterThanOrEqual', value: desde });
                    filtros.push({ field: campo, operator: 'lessThanOrEqual', value: hasta });
                }
            }
        } else {
            const checkboxes = filtroDiv.querySelectorAll('input[type="checkbox"]:checked');
            const textoInput = filtroDiv.querySelector('input[type="text"]');

            if (checkboxes.length > 0) {
                const valores = Array.from(checkboxes).map(cb => cb.value);
                filtros.push({ field: campo, operator: 'in', value: valores });
            } else if (textoInput && textoInput.value.trim() !== '') {
                filtros.push({ field: campo, operator: 'includes', value: textoInput.value.trim() });
            }
        }
    });
    return filtros;
}

function mostrarResultadosResumen(resultados) {
    resultadosResumenDiv.innerHTML = ''; // Limpiar el contenido anterior

    if (!resultados || typeof resultados.total_registros === 'undefined' || typeof resultados.conteo_cruce === 'undefined') {
        resultadosResumenDiv.textContent = 'Error al recibir los resultados del cruce.';
        console.error('Estructura de resultados inesperada:', resultados);
        return;
    }

    const totalRegistros = resultados.total_registros;
    const conteoCruce = resultados.conteo_cruce;
    const porcentajeCruce = ((conteoCruce / totalRegistros) * 100).toFixed(2);
    const criteriosCruce = resultados.criterios_cruce || {};

    const tabla = document.createElement('table');
    tabla.classList.add('resultados-table'); // Añadimos la clase principal

    // Crear encabezado de la tabla
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th>Total Registros</th>
        <th>Criterios del Cruce</th>
        <th>Resultado del Cruce (Cantidad)</th>
        <th>Resultado del Cruce (%)</th>
    `;
    thead.appendChild(headerRow);
    tabla.appendChild(thead);

    // Crear cuerpo de la tabla (una única fila con el resultado del cruce)
    const tbody = document.createElement('tbody');
    const dataRow = document.createElement('tr');
    dataRow.innerHTML = `
        <td>${totalRegistros}</td>
        <td>${Object.entries(criteriosCruce)
                        .map(([variable, valor]) => `${variable} = ${valor}`)
                        .join('<br>')}</td>
        <td>${conteoCruce}</td>
        <td>${porcentajeCruce}%</td>
    `;
    tbody.appendChild(dataRow);
    tabla.appendChild(tbody);

    resultadosResumenDiv.appendChild(tabla);
}

function exportarResultados() {
    const dataParaExportar = exportarExcelBtn.data;

    if (!dataParaExportar || dataParaExportar.length === 0) {
        alert('No hay datos para exportar.');
        return;
    }

    // Crear una nueva hoja de cálculo
    const wb = XLSX.utils.book_new();
    const ws_data = [Object.keys(dataParaExportar[0])]; // Encabezados de las columnas
    dataParaExportar.forEach(obj => ws_data.push(Object.values(obj)));
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Añadir la hoja de cálculo al libro
    XLSX.utils.book_append_sheet(wb, ws, "Datos Filtrados");

    // Generar el archivo Excel y forzar la descarga
    XLSX.writeFile(wb, "datos_filtrados.xlsx");
}
    }
    });