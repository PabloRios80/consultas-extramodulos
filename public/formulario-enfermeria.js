document.addEventListener('DOMContentLoaded', () => {
    // Definición de elementos del DOM
    const form = document.getElementById('enfermeriaForm');
    const formStepsContainer = document.getElementById('form-steps-container');
    const steps = document.querySelectorAll('.form-step');
    const progressBar = document.getElementById('progress-bar');
    const prevBtn = document.getElementById('prev-step-btn');
    const nextBtn = document.getElementById('next-step-btn');
    const guardarBtn = document.getElementById('guardar-enfermeria-btn');

    // Variables de estado
    let currentStep = 0;
    const totalSteps = steps.length;

    // Función para mostrar el paso actual y actualizar la barra de progreso
    function showStep(stepIndex) {
        steps.forEach((step, index) => {
            if (index === stepIndex) {
                step.classList.remove('hidden');
            } else {
                step.classList.add('hidden');
            }
        });

        // Actualiza la barra de progreso
        const progress = (stepIndex + 1) / totalSteps * 100;
        progressBar.style.width = `${progress}%`;

        // Muestra/oculta los botones de navegación
        prevBtn.classList.toggle('hidden', stepIndex === 0);
        nextBtn.classList.toggle('hidden', stepIndex === totalSteps - 1);
        guardarBtn.classList.toggle('hidden', stepIndex !== totalSteps - 1);
    }

    // Eventos para los botones de navegación de pasos
    nextBtn.addEventListener('click', () => {
        currentStep++;
        showStep(currentStep);
    });

    prevBtn.addEventListener('click', () => {
        currentStep--;
        showStep(currentStep);
    });
 // Evento para el envío del formulario final
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Obtener los datos de los campos DNI, Nombre y Apellido manualmente
        const dni = document.getElementById('dni').value;
        const nombre = document.getElementById('nombre').value;
        const apellido = document.getElementById('apellido').value;

        // 2. Obtener el resto de los datos del formulario
        const formData = new FormData(form);
        const formValues = Object.fromEntries(formData.entries());

        // 3. Unir todos los datos en un solo objeto
        const finalData = {
            DNI: dni,
            Nombre: nombre,
            Apellido: apellido,
            ...formValues,
        };
        
        try {
            const response = await fetch('/api/enfermeria/guardar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(finalData)
            });

            const result = await response.json();

            if (response.ok) {
                alert('Datos de enfermería guardados correctamente.');
                form.reset();
                currentStep = 0;
                showStep(currentStep);
            } else {
                alert(`Error al guardar los datos: ${result.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Ocurrió un error al intentar guardar los datos.');
        }
    });

    // Muestra el formulario directamente, sin buscar DNI
    form.classList.remove('hidden');
    showStep(0);
});