/**
 * MÓDULO DE VISUALIZACIÓN DE SALUD
 * Muestra los datos de métodos complementarios sin evaluaciones de riesgo.
 */
function evaluateVisualHealth(data) {
    const visualDiv = document.getElementById('visual-health');
    const recommendationsList = document.getElementById('visual-recommendations');
    const cardElement = document.getElementById('agudeza-card');
    const notesElement = document.getElementById('agudeza-notes');
    
    if (!visualDiv || !recommendationsList) return;

    // Limpiar recomendaciones previas (ahora solo mostraremos info relevante)
    recommendationsList.innerHTML = '';
    
    // Obtener valores
    const value = data['Agudeza_visual'] || 'No registrado';
    const notes = data['Observaciones - Agudeza visual'] || '';
    
    // Mostrar valores en la interfaz
    const agudezaValueElem = document.getElementById('agudeza-value');
    if (agudezaValueElem) agudezaValueElem.textContent = value;
    
    // Estilo neutro y visibilización de estado
    if (cardElement) cardElement.className = 'p-4 rounded-lg bg-white border border-gray-200 shadow-sm';
    
    if (notesElement) {
        notesElement.innerHTML = `<span class="text-indigo-600 font-medium"><i class="fas fa-eye"></i> Agudeza: ${value}</span>`;
        if (notes) {
            notesElement.innerHTML += `<div class="mt-2 text-sm text-gray-500 italic border-t pt-1">Obs: ${notes}</div>`;
        }
    }

    // Mostrar sección
    visualDiv.classList.remove('hidden');
}

/**
 * MÓDULO DE CONSULTAS Y ESTADÍSTICAS
 * Gestiona filtros dinámicos y consultas grupales.
 */
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('/estadisticas.html')) {
        const selectorCampos = document.getElementById('selector-campos');
        const agregarFiltroBtn = document.getElementById('agregar-filtro');
        const filtrosAplicadosDiv = document.getElementById('filtros-aplicados');
        const consultarGrupoBtn = document.getElementById('consultar-grupo-btn');
        const resultadosResumenDiv = document.getElementById('resultados-resumen');
        const exportarExcelBtn = document.getElementById('exportar-excel-btn');
        const combinacionFiltrosSelect = document.getElementById('combinacion-filtros');

        if (selectorCampos && agregarFiltroBtn && filtrosAplicadosDiv && consultarGrupoBtn) {
            cargarCampos(selectorCampos);

            agregarFiltroBtn.addEventListener('click', () => {
                const camposSeleccionados = Array.from(selectorCampos.selectedOptions).map(option => option.value);
                camposSeleccionados.forEach(campo => {
                    if (!document.getElementById(`filtro-${campo}`)) {
                        crearInterfazFiltro(campo, filtrosAplicadosDiv);
                    }
                });
            });

            consultarGrupoBtn.addEventListener('click', () => realizarConsultaGrupal(combinacionFiltrosSelect, resultadosResumenDiv, exportarExcelBtn));
            
            if (exportarExcelBtn) {
                exportarExcelBtn.addEventListener('click', exportarResultados);
            }
        }
    }
});

async function cargarCampos(selectElement) {
    try {
        const response = await fetch('/obtener-campos');
        const campos = await response.json();
        campos.forEach(campo => {
            const option = document.createElement('option');
            option.value = campo;
            option.textContent = campo;
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar los campos:', error);
    }
}

async function crearInterfazFiltro(campo, contenedor) {
    const filtroDiv = document.createElement('div');
    filtroDiv.id = `filtro-${campo}`;
    filtroDiv.classList.add('filtro', 'mb-4', 'p-4', 'bg-gray-50', 'border', 'rounded-lg', 'relative');

    // Botón para eliminar filtro
    const btnCerrar = document.createElement('button');
    btnCerrar.innerHTML = '&times;';
    btnCerrar.className = 'absolute top-1 right-2 text-gray-400 hover:text-red-500 text-xl';
    btnCerrar.onclick = () => filtroDiv.remove();
    filtroDiv.appendChild(btnCerrar);

    const labelCampo = document.createElement('label');
    labelCampo.textContent = campo;
    labelCampo.classList.add('block', 'text-indigo-900', 'text-sm', 'font-bold', 'mb-2', 'uppercase');
    filtroDiv.appendChild(labelCampo);

    if (campo === 'Edad') {
        const divRango = document.createElement('div');
        divRango.classList.add('flex', 'items-center', 'space-x-2');
        divRango.innerHTML = `
            <input type="number" id="edad-desde" placeholder="Desde" class="border rounded p-2 w-full text-sm">
            <span class="text-gray-400">a</span>
            <input type="number" id="edad-hasta" placeholder="Hasta" class="border rounded p-2 w-full text-sm">
            <button class="bg-indigo-500 text-white px-3 py-2 rounded text-xs" onclick="this.parentElement.parentElement.dataset.edadDesde=document.getElementById('edad-desde').value; this.parentElement.parentElement.dataset.edadHasta=document.getElementById('edad-hasta').value; this.textContent='OK'">Fijar</button>
        `;
        filtroDiv.appendChild(divRango);
    } else {
        try {
            const response = await fetch(`/obtener-opciones-campo/${campo}`);
            const opciones = await response.json();

            if (opciones && opciones.length > 0) {
                opciones.forEach(opcion => {
                    const checkboxDiv = document.createElement('div');
                    checkboxDiv.className = 'flex items-center mb-1';
                    const idCheck = `opcion-${campo}-${opcion.replace(/\s+/g, '-')}`;
                    checkboxDiv.innerHTML = `
                        <input type="checkbox" id="${idCheck}" value="${opcion}" class="mr-2">
                        <label for="${idCheck}" class="text-sm text-gray-600">${opcion}</label>
                    `;
                    filtroDiv.appendChild(checkboxDiv);
                });
            } else {
                const inputTexto = document.createElement('input');
                inputTexto.type = 'text';
                inputTexto.placeholder = 'Buscar texto...';
                inputTexto.classList.add('border', 'rounded', 'w-full', 'py-2', 'px-3', 'text-sm');
                filtroDiv.appendChild(inputTexto);
            }
        } catch (error) {
            console.error(`Error al obtener opciones para ${campo}:`, error);
        }
    }
    contenedor.appendChild(filtroDiv);
}

async function realizarConsultaGrupal(combinacionSelect, resultadosDiv, exportBtn) {
    const filtros = [];
    const filtrosDivs = document.querySelectorAll('#filtros-aplicados > .filtro');
    
    filtrosDivs.forEach(filtroDiv => {
        const campo = filtroDiv.id.replace('filtro-', '');
        if (campo === 'Edad') {
            const desde = filtroDiv.dataset.edadDesde;
            const hasta = filtroDiv.dataset.edadHasta;
            if (desde) filtros.push({ field: campo, operator: 'greaterThanOrEqual', value: desde });
            if (hasta) filtros.push({ field: campo, operator: 'lessThanOrEqual', value: hasta });
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

    const dataToSend = { conditions: filtros, combinator: combinacionSelect.value };

    try {
        const response = await fetch('/consultar-grupo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        });
        const resultados = await response.json();

        if (resultados && Array.isArray(resultados.data)) {
            exportBtn.data = resultados.data;
            mostrarResultadosResumen(resultados, resultadosDiv);
        }
    } catch (error) {
        console.error('Error al realizar la consulta grupal:', error);
    }
}

function mostrarResultadosResumen(resultados, contenedor) {
    contenedor.innerHTML = '';
    const { total_registros, conteo_cruce, criterios_cruce } = resultados;
    const porcentaje = ((conteo_cruce / total_registros) * 100).toFixed(2);

    const tabla = document.createElement('table');
    tabla.className = 'min-w-full border-collapse block md:table mt-4';
    tabla.innerHTML = `
        <thead class="block md:table-header-group">
            <tr class="border border-gray-300 block md:table-row">
                <th class="p-2 text-left block md:table-cell font-bold">Total</th>
                <th class="p-2 text-left block md:table-cell font-bold">Criterios</th>
                <th class="p-2 text-left block md:table-cell font-bold">Resultado (n)</th>
                <th class="p-2 text-left block md:table-cell font-bold">%</th>
            </tr>
        </thead>
        <tbody class="block md:table-row-group">
            <tr class="bg-white border border-gray-300 block md:table-row">
                <td class="p-2 block md:table-cell">${total_registros}</td>
                <td class="p-2 block md:table-cell text-xs italic">${JSON.stringify(criterios_cruce || {})}</td>
                <td class="p-2 block md:table-cell font-bold text-indigo-600">${conteo_cruce}</td>
                <td class="p-2 block md:table-cell">${porcentaje}%</td>
            </tr>
        </tbody>
    `;
    contenedor.appendChild(tabla);
}

function exportarResultados() {
    const data = this.data;
    if (!data || data.length === 0) return alert('Sin datos para exportar');
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Resultados");
    XLSX.writeFile(wb, "consulta_salud.xlsx");
}