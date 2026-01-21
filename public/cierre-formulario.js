document.addEventListener('DOMContentLoaded', () => {
const unauthorizedMessage = document.getElementById('unauthorized-message');
    const mainContent = document.getElementById('main-content');
    
    // Primero, verifica el estado de autenticación del usuario
    checkAuthStatus();

    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/user');
            const data = await response.json();

            if (data.isLoggedIn) {
                // El usuario está autenticado, podemos mostrar el formulario
                mainContent.classList.remove('hidden');
                unauthorizedMessage.classList.add('hidden');
                console.log('Usuario autenticado:', data.user.name, data.user.email);
                // Aquí, podrías llenar un campo oculto del formulario con el nombre del profesional
                // Por ejemplo:
                // const profesionalNameInput = document.createElement('input');
                // profesionalNameInput.type = 'hidden';
                // profesionalNameInput.name = 'Profesional_Nombre';
                // profesionalNameInput.value = data.user.name;
                // document.getElementById('cierre-form').appendChild(profesionalNameInput);

                // Y en tu app.post('/api/cierre/guardar', ...) podrás obtenerlo con req.body.Profesional_Nombre
            } else {
                // No autenticado, mostramos el mensaje de error y ocultamos el formulario
                mainContent.classList.add('hidden');
                unauthorizedMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error al verificar autenticación:', error);
            mainContent.classList.add('hidden');
            unauthorizedMessage.classList.remove('hidden');
        }
    }

    const verEstudiosBtn = document.getElementById('ver-estudios-btn');
    const dniInput = document.getElementById('paciente-dni');
    const cargarDatosBtn = document.getElementById('cargar-datos-btn');
    const patientInfoDisplay = document.getElementById('patient-info-display'); // Nuevo contenedor para campos fijos
    const pacienteApellidoInput = document.getElementById('paciente-apellido');
    const pacienteNombreInput = document.getElementById('paciente-nombre');
    const pacienteEdadInput = document.getElementById('paciente-edad');
    const pacienteSexoSelect = document.getElementById('paciente-sexo');
    
    const cierreForm = document.getElementById('cierre-form'); // El formulario completo, incluyendo pasos
    const formStepsContainer = document.getElementById('form-steps-container');
    const progressBar = document.getElementById('progress-bar');
    const prevStepBtn = document.getElementById('prev-step-btn');
    const nextStepBtn = document.getElementById('next-step-btn');
    const guardarCierreBtn = document.getElementById('guardar-cierre-btn');
    const cancelarCierreBtn = document.getElementById('cancelar-cierre-btn');

      // Elementos del Modal
    const estudiosModal = document.getElementById('estudiosModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalCloseButtonBottom = document.getElementById('modalCloseButtonBottom');
    const modalDNI = document.getElementById('modalDNI');
    const estudiosModalContent = document.getElementById('estudiosModalContent');

    let currentPatientData = null;
    let currentStep = 0; // Para el formulario multi-paso
    let formSteps = []; // Almacenará los divs de cada paso

    // Deshabilitar el botón de cargar datos al inicio si el DNI está vacío
    if (!dniInput.value.trim()) {
        cargarDatosBtn.disabled = true;
    }

    // Inicializar el formulario: ocultar campos de paciente y el formulario de cierre
    patientInfoDisplay.classList.add('hidden');
    cierreForm.classList.add('hidden');
    prevStepBtn.classList.add('hidden'); // Ocultar botón anterior al inicio

    // Definición de los campos del formulario con iconos
    const fieldsConfig = [
        { name: 'Presion_Arterial', label: 'Presión Arterial', type: 'select', options: ['Control Normal', 'Hipertensión', 'No se realiza'], hasStudyButton: true, studyType: 'Enfermeria', required: true, icon: 'fas fa-heartbeat' },
        { name: 'Observaciones_Presion_Arterial', label: 'Obs. Presión Arterial', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'IMC', label: 'IMC', type: 'select', options: ['Bajo Peso', 'Control Normal', 'Sobrepeso', 'Obesidad', 'Obesidad Grado II', 'Obesidad Mórbida', 'No se realiza'], hasStudyButton: true, studyType: 'Enfermeria', required: true, icon: 'fas fa-weight' },
        { name: 'Observaciones_IMC', label: 'Obs. IMC', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Agudeza_visual', label: 'Agudeza Visual', type: 'select', options: ['Alterada', 'Control Normal', 'No se realiza'], hasStudyButton: true, studyType: 'Enfermeria', required: true, icon: 'fas fa-eye' },
        { name: 'Observaciones_Agudeza_visual', label: 'Obs. Agudeza Visual', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Control_odontologico', label: 'Control Odontológico', type: 'select', options: ['Control Normal', 'No se realiza', 'Riesgo bajo', 'Riesgo medio', 'Riesgo alto'], hasStudyButton: true, studyType: 'Odontologia', required: true, icon: 'fas fa-tooth' },
        { name: 'Observaciones_Control_odontologico', label: 'Obs. Control Odontológico', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Alimentacion_saludable', label: 'Alimentación Saludable', type: 'select', options: ['Sí', 'No'], required: true, icon: 'fas fa-apple-alt' },
        { name: 'Observaciones_Alimentacion_saludable', label: 'Obs. Alimentación Saludable', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Actividad_fisica', label: 'Actividad Física', type: 'select', options: ['Sí realiza', 'No realiza'], required: true, icon: 'fas fa-running' },
        { name: 'Observaciones_Actividad_fisica', label: 'Obs. Actividad Física', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Seguridad_vial', label: 'Seguridad Vial', type: 'select', options: ['Cumple', 'No cumple', 'No realiza'], required: true, icon: 'fas fa-car' },
        { name: 'Observaciones_Seguridad_vial', label: 'Obs. Seguridad Vial', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Cuidados_adultos_mayores', label: 'Cuidados Adultos Mayores', type: 'select', options: ['No se realiza', 'Se verifica'], required: true, icon: 'fas fa-hands-helping' },
        { name: 'Observaciones_Cuidados_adultos_mayores', label: 'Obs. Cuidados Adultos Mayores', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Acido_folico', label: 'Ácido Fólico', type: 'select', options: ['Indicado', 'No indicado'], required: true, icon: 'fas fa-pills' },
        { name: 'Observaciones_Acido_folico', label: 'Obs. Ácido Fólico', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Abuso_alcohol', label: 'Abuso Alcohol', type: 'select', options: ['Abuso', 'No abusa', 'No se realiza'], required: true, icon: 'fas fa-beer' },
        { name: 'Observaciones_Abuso_alcohol', label: 'Obs. Abuso Alcohol', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Tabaco', label: 'Tabaco', type: 'select', options: ['Fuma', 'No fuma'], required: true, icon: 'fas fa-smoking' },
        { name: 'Observaciones_Tabaco', label: 'Obs. Tabaco', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Violencia', label: 'Violencia', type: 'select', options: ['Se verifica', 'No se verifica', 'No se realiza'], required: true, icon: 'fas fa-hand-rock' },
        { name: 'Observaciones_Violencia', label: 'Obs. Violencia', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Depresion', label: 'Depresión', type: 'select', options: ['Se verifica', 'No se verifica', 'No se realiza'], required: true, icon: 'fas fa-sad-tear' },
        { name: 'Observaciones_Depresion', label: 'Obs. Depresión', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'ITS', label: 'ITS', type: 'select', options: ['Negativo', 'Positivo', 'No se realiza'], hasStudyButton: true, studyType: 'Laboratorio', required: true, icon: 'fas fa-microscope' },
        { name: 'Observaciones_ITS', label: 'Obs. ITS', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Hepatitis_B', label: 'Hepatitis B', type: 'select', options: ['Negativo', 'Positivo', 'No se realiza'], hasStudyButton: true, studyType: 'Laboratorio', required: true, icon: 'fas fa-virus' },
        { name: 'Observaciones_Hepatitis_B', label: 'Obs. Hepatitis B', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Hepatitis_C', label: 'Hepatitis C', type: 'select', options: ['Negativo', 'Positivo', 'No se realiza'], hasStudyButton: true, studyType: 'Laboratorio', required: true, icon: 'fas fa-virus' },
        { name: 'Observaciones_Hepatitis_C', label: 'Obs. Hepatitis C', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'VIH', label: 'VIH', type: 'select', options: ['Negativo', 'Positivo', 'No se realiza'], hasStudyButton: true, studyType: 'Laboratorio', required: true, icon: 'fas fa-viruses' },
        { name: 'Observaciones_VIH', label: 'Obs. VIH', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Dislipemias', label: 'Dislipemias', type: 'select', options: ['No presenta', 'Presenta', 'No se realiza'], hasStudyButton: true, studyType: 'Laboratorio', required: true, icon: 'fas fa-blood-drop' },
        { name: 'Observaciones_Dislipemias', label: 'Obs. Dislipemias', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Diabetes', label: 'Diabetes', type: 'select', options: ['No presenta', 'Presenta', 'No se realiza'], hasStudyButton: true, studyType: 'Laboratorio', required: true, icon: 'fas fa-candy-cane' }, // Icono simbólico
        { name: 'Observaciones_Diabetes', label: 'Obs. Diabetes', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Cancer_cervico_uterino_HPV', label: 'Cáncer Cérvico Uterino (HPV)', type: 'select', options: ['Normal', 'Pendiente', 'No se realiza', 'Patologico'], hasStudyButton: true, studyType: 'Laboratorio', required: true, icon: 'fas fa-dna' },
        { name: 'Observaciones_Cancer_cervico_uterino_HPV', label: 'Obs. Cáncer Cérvico Uterino (HPV)', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Cancer_cervico_uterino_PAP', label: 'Cáncer Cérvico Uterino (PAP)', type: 'select', options: ['Normal', 'Pendiente', 'No se realiza', 'Patologico'], hasStudyButton: true, studyType: 'Biopsia', required: true, icon: 'fas fa-flask' },
        { name: 'Observaciones_PAP', label: 'Obs. PAP', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Cancer_colon_SOMF', label: 'Cáncer Colon (SOMF)', type: 'select', options: ['Normal', 'Pendiente', 'No se realiza', 'Patologico'], hasStudyButton: true, studyType: 'Laboratorio', required: true, icon: 'fas fa-poop' }, // Icono simbólico
        { name: 'Observaciones_Cancer_colon_SOMF', label: 'Obs. Cáncer Colon (SOMF)', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Cancer_colon_Colonoscopia', label: 'Cáncer Colon (Colonoscopia)', type: 'select', options: ['Normal', 'Pendiente', 'No se realiza', 'Patologico'], hasStudyButton: true, studyType: 'VCC', required: true, icon: 'fas fa-colon-sign' }, // Icono simbólico
        { name: 'Observaciones_Colonoscopia', label: 'Obs. Colonoscopia', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Cancer_mama_Mamografia', label: 'Cáncer Mama (Mamografía)', type: 'select', options: ['Normal', 'Pendiente', 'No se realiza', 'Patologico'], hasStudyButton: true, studyType: 'Mamografia', required: true, icon: 'fas fa-x-ray' },
        { name: 'Observaciones_Mamografia', label: 'Obs. Mamografía', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Cancer_mama_Eco_mamaria', label: 'Cáncer Mama (Eco mamaria)', type: 'select', options: ['Normal', 'Pendiente', 'No se realiza', 'Patologico'], hasStudyButton: true, studyType: 'Eco mamaria', required: true, icon: 'fas fa-x-ray' },
        { name: 'Observaciones_Eco_mamaria', label: 'Obs. Ecografía Mamaria', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'ERC', label: 'ERC', type: 'select', options: ['Normal', 'Pendiente', 'No se realiza', 'Patologico'], hasStudyButton: true, studyType: 'Laboratorio', required: true, icon: 'fas fa-kidneys' },
        { name: 'Observaciones_ECG', label: 'Obs. ECG', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'EPOC', label: 'EPOC', type: 'select', options: ['Se verifica', 'No se verifica', 'No se realiza'], hasStudyButton: true, studyType: 'Espirometria', required: true, icon: 'fas fa-lungs' },
        { name: 'Observaciones_EPOC', label: 'Obs. EPOC', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Aneurisma_aorta', label: 'Aneurisma Aorta', type: 'select', options: ['Se verifica', 'No se verifica', 'No se realiza'], hasStudyButton: true, studyType: 'Ecografia', required: true, icon: 'fas fa-heart' },
        { name: 'Observaciones_Aneurisma_aorta', label: 'Obs. Aneurisma Aorta', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Osteoporosis', label: 'Osteoporosis', type: 'select', options: ['Se verifica', 'No se verifica', 'No se realiza'], hasStudyButton: true, studyType: 'Densitometria', required: true, icon: 'fas fa-bone' },
        { name: 'Observaciones_Osteoporosis', label: 'Obs. Osteoporosis', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Estratificacion_riesgo_CV', label: 'Estratificación Riesgo CV', type: 'select', options: ['Alto', 'Bajo', 'Medio', 'Muy Alto'], required: true, icon: 'fas fa-chart-line' },
        { name: 'Observaciones_Riesgo_CV', label: 'Obs. Riesgo CV', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Aspirina', label: 'Aspirina', type: 'select', options: ['Indicado', 'No indicado'], required: true, icon: 'fas fa-prescription-bottle-alt' },
        { name: 'Observaciones_Aspirina', label: 'Obs. Aspirina', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Inmunizaciones', label: 'Inmunizaciones', type: 'select', options: ['Completo', 'Incompleto'], hasStudyButton: true, studyType: 'Enfermeria', required: true, icon: 'fas fa-syringe' },
        { name: 'Observaciones_Inmunizaciones', label: 'Obs. Inmunizaciones', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'VDRL', label: 'VDRL', type: 'select', options: ['Negativo', 'Positivo', 'No aplica', 'Pendiente'], hasStudyButton: true, studyType: 'Laboratorio', required: true, icon: 'fas fa-vial' },
        { name: 'Observaciones_VDRL', label: 'Obs. VDRL', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Prostata_PSA', label: 'Próstata (PSA)', type: 'select', options: ['Normal', 'Pendiente', 'No aplica', 'Patologico'], hasStudyButton: true, studyType: 'Laboratorio', required: true, icon: 'fas fa-male' },
        { name: 'Observaciones_PSA', label: 'Obs. PSA', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Chagas', label: 'Chagas', type: 'select', options: ['Negativo', 'Positivo', 'No aplica', 'Pendiente'], hasStudyButton: true, studyType: 'Laboratorio', required: true, icon: 'fas fa-bug' }, // Icono simbólico
        { name: 'Observaciones_Chagas', label: 'Obs. Chagas', type: 'textarea', required: false, icon: 'fas fa-comment' },
        { name: 'Fecha_cierre_DP', label: 'Fecha Cierre DP', type: 'date', required: true, icon: 'fas fa-calendar-alt' } 
    ];

    // Función para generar los pasos del formulario
    function generateFormSteps() {
        formStepsContainer.innerHTML = ''; // Limpiar contenido previo
        formSteps = []; // Resetear los pasos
        let stepDiv;
        let fieldCounter = 0;

        fieldsConfig.forEach(field => {
            if (fieldCounter % 2 === 0) { // Cada 2 campos, crear un nuevo paso
                stepDiv = document.createElement('div');
                stepDiv.className = 'form-step grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white rounded-lg shadow-inner border border-blue-100 hidden'; // Inicialmente ocultos
                formStepsContainer.appendChild(stepDiv);
                formSteps.push(stepDiv);
            }

            const fieldContainer = document.createElement('div');
            fieldContainer.className = 'mb-4';

            const label = document.createElement('label');
            label.htmlFor = field.name;
            label.className = 'block text-gray-700 text-sm font-bold mb-2 flex items-center';
            if (field.icon) {
                const icon = document.createElement('i');
                icon.className = `${field.icon} mr-2 text-blue-600`;
                label.appendChild(icon);
            }
            label.appendChild(document.createTextNode(field.label + ':'));

            let inputElement;
            const inputClasses = 'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

            if (field.type === 'select') {
                inputElement = document.createElement('select');
                inputElement.className = inputClasses;
                inputElement.id = field.name;
                inputElement.name = field.name;
                inputElement.required = field.required !== false;

                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Seleccione';
                defaultOption.disabled = true;
                defaultOption.selected = true;
                inputElement.appendChild(defaultOption);

                field.options.forEach(optionText => {
                    const option = document.createElement('option');
                    option.value = optionText;
                    option.textContent = optionText;
                    inputElement.appendChild(option);
                });
            } else if (field.type === 'textarea') {
                inputElement = document.createElement('textarea');
                inputElement.className = `${inputClasses} h-20 resize-y`;
                inputElement.id = field.name;
                inputElement.name = field.name;
                inputElement.required = field.required !== false;
            } else { // type 'text' o 'date' o 'number'
                inputElement = document.createElement('input');
                inputElement.type = field.type;
                inputElement.className = inputClasses;
                inputElement.id = field.name;
                inputElement.name = field.name;
                inputElement.required = field.required !== false;
            }

            // Setear la fecha actual para el campo 'Fecha_cierre_dp' al generarse
            if (field.name === 'Fecha_cierre_DP') {
                const today = new Date();
                const formattedDate = today.getFullYear() + '-' +
                                    String(today.getMonth() + 1).padStart(2, '0') + '-' +
                                    String(today.getDate()).padStart(2, '0');
                inputElement.value = formattedDate;
            }

            fieldContainer.appendChild(label);

            if (field.hasStudyButton) {
                const inputGroup = document.createElement('div');
                inputGroup.className = 'flex items-center';
                inputGroup.appendChild(inputElement);

                const studyButton = document.createElement('button');
                studyButton.className = 'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r ml-2 focus:outline-none focus:shadow-outline flex-shrink-0 text-sm';
                studyButton.innerHTML = `<i class="fas fa-search mr-1"></i>Ver Estudio`; // Añadido texto "Ver Estudio"
                studyButton.title = `Ver Estudio de ${field.label}`; // Tooltip
                studyButton.dataset.studyType = field.studyType;
                studyButton.addEventListener('click', (e) => {
                    e.preventDefault(); // Prevenir envío del formulario
                    if (currentPatientData && currentPatientData.DNI) {
                        mostrarEstudiosModal(currentPatientData.DNI, studyButton.dataset.studyType); // <-- ESTA ES LA CORRECCIÓN
                    } else {
                        alert('DNI del paciente no disponible para ver estudios.');
                    }
                });  

                inputGroup.appendChild(studyButton);
                fieldContainer.appendChild(inputGroup);
            } else {
                fieldContainer.appendChild(inputElement);
            }

            stepDiv.appendChild(fieldContainer);
            fieldCounter++;
        });
        showStep(0); // Mostrar el primer paso al generar
    }

    // Función para mostrar un paso específico
    function showStep(stepIndex) {
        formSteps.forEach((step, index) => {
            step.classList.add('hidden');
            if (index === stepIndex) {
                step.classList.remove('hidden');
            }
        });

        currentStep = stepIndex;
        updateProgressBar();
        updateNavigationButtons();
    }

    // Función para actualizar la barra de progreso
    function updateProgressBar() {
        const progress = ((currentStep + 1) / formSteps.length) * 100;
        progressBar.style.width = `${progress}%`;
    }

    // Función para actualizar la visibilidad de los botones de navegación
    function updateNavigationButtons() {
        if (currentStep === 0) {
            prevStepBtn.classList.add('hidden');
        } else {
            prevStepBtn.classList.remove('hidden');
        }

        if (currentStep === formSteps.length - 1) {
            nextStepBtn.classList.add('hidden');
            guardarCierreBtn.classList.remove('hidden'); // Mostrar el botón Guardar en la última página
        } else {
            nextStepBtn.classList.remove('hidden');
            guardarCierreBtn.classList.add('hidden'); // Ocultar Guardar si no es la última página
        }
    }

    // Función para limpiar el formulario y resetear el estado
    function resetForm() {
        dniInput.value = '';
        pacienteApellidoInput.value = '';
        pacienteNombreInput.value = '';
        pacienteEdadInput.value = '';
        pacienteSexoSelect.value = '';

        patientInfoDisplay.classList.add('hidden');
        cierreForm.classList.add('hidden');
        formStepsContainer.innerHTML = ''; // Limpiar los pasos generados
        currentStep = 0;
        formSteps = [];
        updateProgressBar();
        
        // Restablecer el estado inicial de los campos fijos
        pacienteApellidoInput.setAttribute('readonly', true);
        pacienteNombreInput.setAttribute('readonly', true);
        pacienteEdadInput.setAttribute('readonly', true);
        pacienteSexoSelect.setAttribute('disabled', true);

        cargarDatosBtn.disabled = true; // Deshabilitar botón de carga hasta que se ingrese DNI
    }

    // --- LÓGICA DE EVENTOS ---

    // Event Listener para el DNI input: habilita el botón Cargar Datos
    dniInput.addEventListener('input', () => {
        if (dniInput.value.trim().length > 0) {
            cargarDatosBtn.disabled = false;
        } else {
            cargarDatosBtn.disabled = true;
            resetForm(); // Resetear el formulario si el DNI se borra
        }
    });

    // Event Listener para el botón "Cargar Datos"
    cargarDatosBtn.addEventListener('click', () => {
        const dni = dniInput.value.trim();
        if (!dni) {
            alert('Por favor, ingrese un DNI para cargar los datos.');
            return;
        }
        
        // Asignar DNI a currentPatientData para el botón "Ver Estudio"
        currentPatientData = { DNI: dni };

        // Mostrar campos fijos de paciente y el formulario de cierre
        patientInfoDisplay.classList.remove('hidden');
        cierreForm.classList.remove('hidden');

        // Habilitar edición de campos fijos
        pacienteApellidoInput.removeAttribute('readonly');
        pacienteNombreInput.removeAttribute('readonly');
        pacienteEdadInput.removeAttribute('readonly');
        pacienteSexoSelect.removeAttribute('disabled');
        
        // Limpiar campos fijos al cargar para que el usuario los complete si son nuevos
        pacienteApellidoInput.value = '';
        pacienteNombreInput.value = '';
        pacienteEdadInput.value = '';
        pacienteSexoSelect.value = '';

        // Generar y mostrar el primer paso del formulario dinámico
        generateFormSteps();
    });

    // Event Listeners para los botones de navegación del formulario multi-paso
    nextStepBtn.addEventListener('click', () => {
        // Validar campos de la página actual antes de avanzar
        const currentStepFields = formSteps[currentStep].querySelectorAll('input, select, textarea');
        let stepIsValid = true;
        currentStepFields.forEach(field => {
            if (field.required && !field.value.trim()) {
                field.classList.add('border-red-500', 'ring-red-500');
                stepIsValid = false;
            } else {
                field.classList.remove('border-red-500', 'ring-red-500');
            }
        });

        if (!stepIsValid) {
            alert('Por favor, complete todos los campos obligatorios antes de avanzar.');
            return;
        }

        if (currentStep < formSteps.length - 1) {
            showStep(currentStep + 1);
        }
    });

    prevStepBtn.addEventListener('click', () => {
        if (currentStep > 0) {
            showStep(currentStep - 1);
        }
    });

    // Event Listener para el botón "Guardar Cierre"
    guardarCierreBtn.addEventListener('click', async (e) => {
        e.preventDefault(); // Prevenir el envío tradicional del formulario

        // Validar todos los campos del formulario (incluyendo el último paso)
        const allFormInputs = cierreForm.querySelectorAll('input:not([readonly]), select:not([disabled]), textarea');
        let allFieldsValid = true;
        const formData = {};

        // Recolectar datos de campos fijos de paciente
        formData['DNI'] = dniInput.value.trim();
        formData['Apellido'] = pacienteApellidoInput.value.trim();
        formData['Nombre'] = pacienteNombreInput.value.trim();
        formData['Edad'] = pacienteEdadInput.value.trim();
        formData['Sexo'] = pacienteSexoSelect.value.trim();

        // Recolectar datos de campos dinámicos y validar
        allFormInputs.forEach(input => {
            if (input.required && !input.value.trim()) {
                allFieldsValid = false;
                input.classList.add('border-red-500', 'ring-red-500'); // Resaltar campos vacíos
            } else {
                input.classList.remove('border-red-500', 'ring-red-500');
            }
            formData[input.name] = input.value.trim();
        });

        if (!allFieldsValid) {
            alert('Por favor, complete todos los campos obligatorios del formulario.');
            return;
        }

        guardarCierreBtn.disabled = true;
        guardarCierreBtn.textContent = 'Guardando...';

        try {
            const response = await fetch('/api/cierre/guardar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                alert(result.message);
                resetForm(); // Resetear el formulario y volver al estado inicial
            } else {
                alert(`Error al guardar: ${result.error}`);
            }
        } catch (error) {
            console.error('Error al guardar el formulario de cierre:', error);
            alert('Ocurrió un error al guardar el formulario. Intente nuevamente.');
        } finally {
            guardarCierreBtn.disabled = false;
            guardarCierreBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Guardar Cierre';
        }
    });

    // Event Listener para el botón "Cancelar"
    cancelarCierreBtn.addEventListener('click', () => {
        if (confirm('¿Está seguro de que desea cancelar? Se perderán los cambios no guardados.')) {
            resetForm(); // Volver al estado inicial
        }
    });
// --- FUNCIÓN GLOBAL PARA MOSTRAR ESTUDIOS EN UN MODAL ---
// Esta función será llamada por los botones "Ver Estudio"
async function mostrarEstudiosModal(dni, studyType) {
    if (!dni) {
        alert('DNI del paciente no disponible para ver estudios.');
        return;
    }

    modalDNI.textContent = `DNI: ${dni} - Tipo: ${studyType}`;
    estudiosModalContent.innerHTML = '<p class="text-center text-gray-500">Cargando estudios...</p>';
    estudiosModal.classList.remove('hidden'); // Mostrar el modal

    try {
        const response = await fetch('/obtener-estudios-paciente', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dni: dni })
        });
        const data = await response.json();

        estudiosModalContent.innerHTML = ''; // Limpiar el contenido de carga

        if (data.success && data.estudios.length > 0) {
            const filteredStudies = data.estudios.filter(s => s.TipoEstudio === studyType);
            
            if (filteredStudies.length > 0) {
                filteredStudies.forEach(estudio => {
                    const estudioCard = document.createElement('div');
                    estudioCard.className = 'bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200 mb-4';
                    
                    let contentHtml = `<h4 class="font-bold text-blue-700 mb-2">${estudio.TipoEstudio} - Fecha: ${estudio.Fecha || 'N/A'}</h4>`;
                    contentHtml += `<p><strong>Prestador:</strong> ${estudio.Prestador || 'N/A'}</p>`;

                    // LÓGICA UNIFICADA PARA RESULTADOS DETALLADOS
                    const resultados = estudio.ResultadosLaboratorio || estudio.ResultadosEnfermeria;
                    
                    if (resultados) {
                        const tituloResultados = estudio.TipoEstudio === 'Laboratorio' ? 'Resultados de Laboratorio' : 'Resultados de Enfermería';
                        contentHtml += `<p class="font-semibold mt-2">${tituloResultados}:</p>`;
                        contentHtml += `<ul class="list-disc list-inside ml-4">`;

                        for (const key in resultados) {
                            let value = resultados[key];
                            if (!value || String(value).trim() === '') {
                                value = 'N/A';
                            }
                            
                            // Manejo de enlaces PDF dentro de los resultados detallados
                            if ((key === 'Agudeza_Visual_PDF' || key === 'Espirometria_PDF') && value !== 'N/A') {
                                const label = key.replace(/_/g, ' ').replace('PDF', '').trim();
                                contentHtml += `<li><strong>${label}:</strong> <a href="${value}" target="_blank" class="text-blue-600 hover:underline"><i class="fas fa-file-pdf mr-1"></i>Ver Informe</a></li>`;
                            } 
                            
                            // Manejo especial para IMC (cálculo)
                            else if (key === 'Peso') {
                                const alturaCm = parseFloat(resultados.Altura);
                                const pesoKg = parseFloat(value);
                                
                                if (!isNaN(alturaCm) && !isNaN(pesoKg) && alturaCm > 0) {
                                    const imc = (pesoKg / ((alturaCm / 100) ** 2)).toFixed(2);
                                    contentHtml += `<li><strong>IMC:</strong> ${imc}</li>`;
                                }
                                contentHtml += `<li><strong>Peso:</strong> ${value} kg</li>`;
                            }
                            // Ignorar el campo Altura para evitar duplicados en la lista cuando se calcula el IMC
                            else if (key === 'Altura') {
                                contentHtml += `<li><strong>Altura:</strong> ${value} cm</li>`;
                            }
                            else {
                                const label = key.replace(/_/g, ' ');
                                contentHtml += `<li><strong>${label}:</strong> ${value}</li>`;
                            }
                        }
                        contentHtml += `</ul>`;

                        // Maneja el LinkPDF del estudio, que ahora está en el objeto 'estudio'
                    if (estudio.LinkPDF && estudio.LinkPDF.trim() !== '') {
                        contentHtml += `<p class="mt-2"><a href="${estudio.LinkPDF}" target="_blank" class="bg-green-400 hover:bg-green-500 text-gray-900 font-bold py-1 px-2 rounded inline-block"><i class="fas fa-file-pdf mr-1"></i> Ver PDF</a></p>`;
                    }


                    } else if (estudio.LinkPDF) { // Lógica para estudios con un solo PDF (ej. Mamografía)
                        contentHtml += `<p class="mt-2"><a href="${estudio.LinkPDF}" target="_blank" class="text-blue-600 hover:underline"><i class="fas fa-file-pdf mr-1"></i>Ver PDF</a></p>`;
                    } else { // Lógica para el resto de los estudios (ej. Odontologia)
                        contentHtml += `<p><strong>Resultado:</strong> ${estudio.Resultado || 'N/A'}</p>`;
                        if (estudio.Observaciones) {
                            contentHtml += `<p><strong>Observaciones:</strong> ${estudio.Observaciones}</p>`;
                        }
                    }

                    estudioCard.innerHTML = contentHtml;
                    estudiosModalContent.appendChild(estudioCard);
                });
            } else {
                estudiosModalContent.innerHTML = `<p class="text-center text-gray-600">No se encontraron estudios de tipo "${studyType}" para este DNI.</p>`;
            }
            estudiosModalContent.style.maxHeight = '60vh';
            estudiosModalContent.style.overflowY = 'auto';

        } else {
            estudiosModalContent.innerHTML = `<p class="text-center text-gray-600">${data.message || 'No se encontraron estudios para este DNI.'}</p>`;
        }
    } catch (error) {
        console.error('Error al obtener estudios para el modal:', error);
        estudiosModalContent.innerHTML = `<p class="text-center text-red-600">Error al cargar los estudios. Intente nuevamente.</p>`;
    }
}
    // Eventos para cerrar el modal
    closeModalBtn.addEventListener('click', () => {
        estudiosModal.classList.add('hidden');
    });

    modalCloseButtonBottom.addEventListener('click', () => {
        estudiosModal.classList.add('hidden');
    });

    // Cerrar modal al hacer clic fuera de él (opcional)
    estudiosModal.addEventListener('click', (e) => {
        if (e.target === estudiosModal) {
            estudiosModal.classList.add('hidden');
        }
    });

    // Asegurarse de que la función mostrarEstudiosModal esté disponible globalmente (opcional si ya está ahí)
    // window.mostrarEstudiosModal = mostrarEstudiosModal; // Descomentar si realmente necesitas que sea global para otras partes del código
});