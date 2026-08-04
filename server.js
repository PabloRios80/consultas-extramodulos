require("dotenv").config();
const express = require("express");
const path = require("path");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const app = express();
const PORT = process.env.PORT || 3000;

const { createClient } = require("@supabase/supabase-js");
const axios = require("axios");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

// ====================================================================
// CONFIGURACIÓN DE IDs DE PLANILLAS
// ====================================================================
const SPREADSHEET_ID_LECTURA = "15YPfBG9PBfN3nBW5xXJYjIXEgYIS9z71pI0VpeCtAAU";
const SPREADSHEET_ID_ESCRITURA =
  process.env.SHEET_ID_CONSULTAS || "TU_NUEVO_ID_AQUI";

app.enable("trust proxy");

// ====================================================================
// MIDDLEWARES INICIALES
// ====================================================================
app.use(express.json());

// IMPORTANTE: Servir estáticos ANTES de las protecciones para evitar 401 en JS/CSS
app.use(express.static(path.join(__dirname, "public")));

// ====================================================================
// VARIABLES GLOBALES Y CONEXIÓN
// ====================================================================
let doc;
let docEscritura;
let credentials;

async function initializeGoogleSheets() {
  try {
    // En Render usamos variables de entorno para evitar depender de archivos físicos si es posible,
    // pero mantenemos tu lógica de credentials.json
    credentials = require("./credentials.json");

    doc = new GoogleSpreadsheet(SPREADSHEET_ID_LECTURA);
    await doc.useServiceAccountAuth({
      client_email: credentials.client_email,
      private_key: credentials.private_key.replace(/\\n/g, "\n"),
    });
    await doc.loadInfo();
    console.log("✅ Base de Lectura (Pacientes) Conectada");

    docEscritura = new GoogleSpreadsheet(SPREADSHEET_ID_ESCRITURA);
    await docEscritura.useServiceAccountAuth({
      client_email: credentials.client_email,
      private_key: credentials.private_key.replace(/\\n/g, "\n"),
    });
    await docEscritura.loadInfo();
    console.log("✅ Base de Escritura (Consultas) Conectada");
  } catch (error) {
    console.error("❌ Error inicializando Google Sheets:", error);
  }
}

// ====================================================================
// RUTAS DE DATOS (Mantenidas sin cambios de lógica)
// ====================================================================

async function getDataFromSpecificSheet(sheetIdentifier) {
  if (!doc) throw new Error("Documento no inicializado");
  let sheet = doc.sheetsByTitle[sheetIdentifier];
  if (!sheet) return [];
  await sheet.loadHeaderRow();
  const rows = await sheet.getRows();
  return rows.map((row) => {
    const rowData = {};
    sheet.headerValues.forEach((header) => {
      rowData[header] = row[header] || "";
    });
    return rowData;
  });
}

/**
 * LÓGICA DE BÚSQUEDA Y AUTOCOMPLETADO
 * Busca al paciente por DNI y llena el formulario automáticamente.
 */
async function buscarPaciente() {
  const dniInput = document.getElementById("dni-busqueda");
  const dni = dniInput.value.trim();

  if (!dni) {
    mostrarMensaje("Por favor, ingrese un DNI", "error");
    return;
  }

  try {
    // Mostrar estado de carga (opcional)
    dniInput.classList.add("loading");

    const response = await fetch("/buscar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dni }),
    });

    const data = await response.json();

    if (data.pacientePrincipal) {
      const p = data.pacientePrincipal;

      // AUTOCOMPLETADO DE CAMPOS
      // Buscamos los elementos por sus IDs y asignamos el valor
      if (document.getElementById("paciente-nombre")) {
        document.getElementById("paciente-nombre").value = p.Nombre || "";
      }
      if (document.getElementById("paciente-apellido")) {
        document.getElementById("paciente-apellido").value = p.Apellido || "";
      }
      if (document.getElementById("paciente-edad")) {
        document.getElementById("paciente-edad").value = p.Edad || "";
      }
      if (document.getElementById("paciente-sexo")) {
        document.getElementById("paciente-sexo").value = p.Sexo || "";
      }

      // Opcional: Bloquear campos para que no se editen si vienen de la base
      // bloquearCampos(true);

      mostrarMensaje("Paciente encontrado y datos cargados", "success");

      // Si tienes una función para buscar estudios adicionales, la disparas aquí
      if (typeof obtenerEstudios === "function") {
        obtenerEstudios(dni);
      }
    } else if (data.error) {
      mostrarMensaje("Paciente no encontrado en la base de datos", "warning");
      limpiarFormularioPaciente();
    }
  } catch (error) {
    console.error("Error en la búsqueda:", error);
    mostrarMensaje("Error de conexión con el servidor", "error");
  } finally {
    dniInput.classList.remove("loading");
  }
}

/**
 * Limpia los campos si el paciente no existe para permitir carga manual
 */
function limpiarFormularioPaciente() {
  const campos = [
    "paciente-nombre",
    "paciente-apellido",
    "paciente-edad",
    "paciente-sexo",
  ];
  campos.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

/**
 * Función auxiliar para mensajes visuales (sin usar alert)
 */
function mostrarMensaje(texto, tipo) {
  const toast = document.getElementById("toast-mensaje");
  if (!toast) return;

  toast.textContent = texto;
  toast.className = `fixed bottom-5 right-5 p-4 rounded shadow-lg text-white transition-all ${
    tipo === "success"
      ? "bg-green-500"
      : tipo === "warning"
        ? "bg-yellow-500"
        : "bg-red-500"
  }`;

  setTimeout(() => {
    toast.classList.add("opacity-0");
  }, 3000);
}

app.post("/buscar", async (req, res) => {
  try {
    const dniABuscar = String(req.body.dni).trim();
    const sheet = doc.sheetsByIndex[0];
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    const paciente = rows.find(
      (r) => String(r["DNI"] || r["Documento"] || "").trim() === dniABuscar,
    );
    if (paciente) {
      res.json({
        pacientePrincipal: {
          DNI: paciente.DNI || paciente.Documento,
          Nombre: paciente.Nombre,
          Apellido: paciente.Apellido,
          Edad: paciente.Edad || "",
          Sexo: paciente.Sexo || "",
        },
      });
    } else {
      res.json({ error: "DNI no encontrado." });
    }
  } catch (error) {
    res.status(500).json({ error: "Error al buscar" });
  }
});

app.post("/obtener-estudios-paciente", async (req, res) => {
  try {
    const { dni } = req.body;
    const estudiosEncontrados = [];
    const hojasDeEstudios = [
      "Mamografia",
      "Laboratorio",
      "Ecografia",
      "Espirometria",
      "Densitometria",
      "Enfermeria",
      "Eco mamaria",
      "Oftalmologia",
    ];
    for (const sheetName of hojasDeEstudios) {
      try {
        const sheetData = await getDataFromSpecificSheet(sheetName);
        const filtrados = sheetData.filter(
          (row) => String(row["DNI"] || "").trim() === String(dni).trim(),
        );
        filtrados.forEach((estudio) => {
          let baseData = {
            TipoEstudio: sheetName,
            Fecha: estudio["Fecha"] || estudio["Fecha_cierre_Enf"] || "N/A",
            LinkPDF:
              estudio["LinkPDF"] ||
              estudio["Espirometria (Enlace a PDF)"] ||
              "",
          };
          if (sheetName === "Laboratorio") {
            baseData.ResultadosLaboratorio = estudio;
          } else if (sheetName === "Enfermeria") {
            baseData.ResultadosEnfermeria = {
              Altura: estudio["Altura (cm)"],
              Peso: estudio["Peso (kg)"],
              Presion_Arterial: estudio["Presion Arterial (mmhg)"],
            };
          } else {
            baseData.Resultado =
              estudio["Resultado"] || estudio["Normal/Patologica"] || "N/A";
          }
          estudiosEncontrados.push(baseData);
        });
      } catch (e) {}
    }
    res.json({ success: true, estudios: estudiosEncontrados });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener estudios" });
  }
});
app.post("/guardar-consulta", async (req, res) => {
  const data = req.body;

  try {
    // 1. Guardar en Supabase (principal)
    const { error: supaError } = await supabase
      .from("consultas_extramodulo")
      .insert({
        dni: data.DNI,
        apellido: data.Apellido,
        nombre: data.Nombre,
        edad: data.Edad,
        sexo: data.Sexo,
        motivo_consulta: data["motivo de consulta"],
        diagnostico: data.diagnostico,
        indicaciones: data.indicaciones,
        recordatorio: data.recordatorio,
        profesional: data.Profesional || "Desconocido",
        fecha: new Date(),
      });

    if (supaError) {
      console.error("Error Supabase consulta:", supaError);
      return res.status(500).json({
        success: false,
        message: "Error al guardar en base de datos.",
      });
    }

    console.log("✅ Consulta guardada en Supabase para DNI:", data.DNI);
    // Registrar consulta médica extramódulo como acción facturable (420101 / interno C040101)
    try {
      const hoy = new Date().toISOString().split("T")[0];
      await supabase.from("practicas_autorizadas").insert({
        dni: data.DNI,
        nombre_completo: `${data.Apellido || ""} ${data.Nombre || ""}`.trim(),
        descripcion_practica: "Consulta médica (Extramódulo)",
        estado: "REALIZADA",
        fecha_autorizacion: hoy,
        fecha_carga: hoy,
        nombre_prestador: data.Profesional || "Desconocido",
      });
      console.log(
        "✅ Consulta Extramódulo registrada como REALIZADA para DNI:",
        data.DNI,
      );

      const idSedeDp = data.id_sede_dp ? parseInt(data.id_sede_dp) : null;
      if (idSedeDp) {
        const { data: prestadoresCoordSede } = await supabase
          .from("prestador_sedes")
          .select("id_prestador")
          .eq("id_sede_dp", idSedeDp);

        let prestadorCoord = null;
        if (prestadoresCoordSede && prestadoresCoordSede.length > 0) {
          const idsPrestadores = prestadoresCoordSede.map(
            (r) => r.id_prestador,
          );
          const { data: institucionCoord } = await supabase
            .from("prestadores_institucionales")
            .select("id, nombre_institucion")
            .in("id", idsPrestadores)
            .eq("especialidad", "coordinacion_dp")
            .maybeSingle();
          if (institucionCoord) {
            prestadorCoord = institucionCoord;
          }
        }

        if (prestadorCoord) {
          await supabase.from("practicas_autorizadas").insert({
            dni: data.DNI,
            nombre_completo:
              `${data.Apellido || ""} ${data.Nombre || ""}`.trim(),
            descripcion_practica: "Módulo Extramódulo",
            estado: "REALIZADA",
            fecha_autorizacion: hoy,
            fecha_carga: hoy,
            id_prestador: prestadorCoord.id,
            nombre_prestador: prestadorCoord.nombre_institucion,
          });
          console.log(
            "✅ Módulo Extramódulo (420101) registrado para DNI:",
            data.DNI,
          );
        } else {
          console.warn(
            `No hay prestador de Coordinación DP configurado para sede ${idSedeDp}`,
          );
        }
      } else {
        console.warn(
          "No se recibió id_sede_dp, no se pudo asignar Módulo Extramódulo a ningún prestador.",
        );
      }
    } catch (medErr) {
      console.error(
        "Error al registrar consulta extramódulo en practicas_autorizadas:",
        medErr.message,
      );
    }

    // 2. Guardar en Google Sheets (secundario — no bloquea si falla)
    try {
      await docEscritura.loadInfo();
      let sheet = docEscritura.sheetsByTitle["Consultas"];
      if (!sheet) {
        sheet = await docEscritura.addSheet({
          title: "Consultas",
          headerValues: [
            "DNI",
            "Nombre",
            "Apellido",
            "Edad",
            "Sexo",
            "Motivo de consulta",
            "Diagnostico",
            "Indicaciones",
            "Recordatorio",
            "Profesional",
            "Fecha",
          ],
        });
      }
      await sheet.addRow({
        DNI: data.DNI,
        Nombre: data.Nombre,
        Apellido: data.Apellido,
        Edad: data.Edad,
        Sexo: data.Sexo,
        "Motivo de consulta": data["motivo de consulta"],
        Diagnostico: data.diagnostico,
        Indicaciones: data.indicaciones,
        Recordatorio: data.recordatorio,
        Profesional: data.Profesional || "Desconocido",
        Fecha: new Date().toLocaleString("es-AR"),
      });
      console.log("✅ Consulta guardada en Sheets para DNI:", data.DNI);
    } catch (sheetsError) {
      console.error(
        "⚠️ Error guardando en Sheets (Supabase sí guardó):",
        sheetsError.message,
      );
    }
    res.json({
      success: true,
      sheetsOk: false,
      sheetsWarning: "No se pudo guardar en Google Sheets",
    });
  } catch (error) {
    console.error("Error guardar consulta:", error);
    res.status(500).json({ success: false });
  }
});
app.post("/obtener-historial-consultas", async (req, res) => {
  const { dni } = req.body;
  if (!dni)
    return res.status(400).json({ success: false, message: "DNI requerido" });

  try {
    const { data: historial, error } = await supabase
      .from("consultas_extramodulo")
      .select(
        "fecha, profesional, motivo_consulta, diagnostico, indicaciones, recordatorio",
      )
      .eq("dni", dni)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const resultado = (historial || []).map((row) => ({
      Fecha: row.fecha ? new Date(row.fecha).toLocaleString("es-AR") : "",
      Profesional: row.profesional || "",
      "motivo de consulta": row.motivo_consulta || "",
      diagnostico: row.diagnostico || "",
      indicaciones: row.indicaciones || "",
      recordatorio: row.recordatorio || "",
    }));

    res.json({ success: true, historial: resultado });
  } catch (error) {
    console.error("Error historial consultas:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Error al obtener historial" });
  }
});
// ====================================================================
// ACCESO A ARCHIVOS PRIVADOS (PROTECCIÓN DEL RULO)
// ====================================================================
app.get("/consultas.html", (req, res) => {
  res.sendFile(path.join(__dirname, "private", "consultas.html"));
});
app.get("/", (req, res) => {
  const token = req.query.token;
  if (token) {
    res.redirect("/consultas.html?token=" + token);
  } else {
    res.redirect("/consultas.html");
  }
});

app.post("/api/verificar-paciente-extramodulo", async (req, res) => {
  const { dni } = req.body;
  if (!dni)
    return res.status(400).json({ success: false, message: "DNI requerido." });

  const hoy = new Date();
  const mesActual = hoy.getMonth() + 1;
  const anioActual = hoy.getFullYear();

  try {
    // 1. Verificar en IAPOS
    const fechaHoy = hoy.toISOString().split("T")[0];
    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
            <soap:Body>
                <BEWsValidaAfi.Execute xmlns="IAPOS_WS">
                    <Usuario>CONSULTAPDP</Usuario>
                    <Passwd>1Qaz</Passwd>
                    <Nafiliado>${dni}</Nafiliado>
                    <Badocnumdo>${dni}</Badocnumdo>
                    <Tidocodigo_de_documento>96</Tidocodigo_de_documento>
                    <Ogorcodigo>1</Ogorcodigo>
                    <Fechpresta>${fechaHoy}</Fechpresta>
                </BEWsValidaAfi.Execute>
            </soap:Body>
        </soap:Envelope>`;

    let datosIAPOS = null;
    try {
      const iaposRes = await axios.post(
        "https://aswe.santafe.gov.ar/iapos-sw-srvt/servlet/abewsvalidaafi",
        soapBody,
        {
          headers: {
            "Content-Type": "text/xml; charset=utf-8",
            SOAPAction: "IAPOS_WSaction/ABEWSVALIDAAFI.Execute",
          },
          timeout: 10000,
        },
      );
      const xml = iaposRes.data;
      const getValor = (tag) => {
        const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]+)<\/${tag}>`));
        return match ? match[1].trim() : null;
      };
      datosIAPOS = {
        esActivo: getValor("Estado") === "A",
        nombre: getValor("Apenom"),
        edad: getValor("Edad"),
        sexo: getValor("Sexo"),
        localidad: getValor("Localidad"),
      };
    } catch (e) {
      console.error("Error IAPOS:", e.message);
    }

    // 2. Verificar DP previo en historial
    const { data: historial } = await supabase
      .from("historial_dia_preventivo")
      .select("fechax, tipo")
      .eq("dni", dni)
      .in("tipo", ["Adultos", "Pediatria", "Pediatrico"])
      .order("fechax", { ascending: false })
      .limit(1);

    const ultimoDP = historial?.[0] || null;
    const dosAniosAtras = new Date();
    dosAniosAtras.setFullYear(dosAniosAtras.getFullYear() - 2);

    let bloqueado = false;
    let motivoBloqueo = null;

    // Verificar si tiene DP previo
    if (!ultimoDP) {
      bloqueado = true;
      motivoBloqueo = "NO_DP";
    } else if (new Date(ultimoDP.fechax) < dosAniosAtras) {
      bloqueado = true;
      motivoBloqueo = "DP_VENCIDO";
    }

    // 3. Contar consultas del mes y del año
    const { data: consultasMes } = await supabase
      .from("consultas_extramodulo")
      .select("id")
      .eq("dni", dni)
      .gte(
        "created_at",
        `${anioActual}-${String(mesActual).padStart(2, "0")}-01`,
      )
      .lt(
        "created_at",
        `${anioActual}-${String(mesActual + 1).padStart(2, "0")}-01`,
      );

    const { data: consultasAnio } = await supabase
      .from("consultas_extramodulo")
      .select("id")
      .eq("dni", dni)
      .gte("created_at", `${anioActual}-01-01`);

    const cantMes = consultasMes?.length || 0;
    const cantAnio = consultasAnio?.length || 0;

    // 4. Verificar permisos especiales
    const { data: permiso } = await supabase
      .from("permisos_especiales")
      .select("*")
      .eq("dni_paciente", dni)
      .eq("tipo_permiso", "extramodulo_extra")
      .eq("activo", true)
      .single();

    const extraPermitido = permiso?.cantidad_extra || 0;
    const limiteAnio = 6 + extraPermitido;

    if (!bloqueado && cantMes >= 2) {
      bloqueado = true;
      motivoBloqueo = "LIMITE_MES";
    }

    if (!bloqueado && cantAnio >= limiteAnio) {
      bloqueado = true;
      motivoBloqueo = "LIMITE_ANIO";
    }

    // 5. Alertas clínicas del último cierre
    const { data: ultimoCierre } = await supabase
      .from("historial_dia_preventivo")
      .select(
        "cancer_cervico_hpv, somf, diabetes, dislipemias, presion_arterial, osteoporosis, epoc",
      )
      .eq("dni", dni)
      .order("fechax", { ascending: false })
      .limit(1);

    const alertas = [];
    const cierre = ultimoCierre?.[0];
    if (cierre) {
      if (cierre.cancer_cervico_hpv === "Patologico")
        alertas.push({
          tipo: "URGENTE",
          mensaje: "🔴 HPV Patológico — verificar PAP",
        });
      if (cierre.somf === "Patologico")
        alertas.push({
          tipo: "URGENTE",
          mensaje: "🔴 SOMF Patológico — indicar VCC urgente",
        });
      if (cierre.diabetes === "Presenta")
        alertas.push({
          tipo: "RIESGO",
          mensaje: "⚠️ Diabetes — verificar HbA1c y fondo de ojo",
        });
      if (cierre.dislipemias === "Presenta")
        alertas.push({
          tipo: "RIESGO",
          mensaje: "⚠️ Dislipemia — verificar tratamiento",
        });
      if (cierre.presion_arterial === "Hipertensión")
        alertas.push({
          tipo: "RIESGO",
          mensaje: "⚠️ Hipertensión — verificar tratamiento",
        });
      if (cierre.osteoporosis === "Se verifica")
        alertas.push({
          tipo: "RIESGO",
          mensaje: "⚠️ Osteoporosis — verificar tratamiento",
        });
      if (cierre.epoc === "Se verifica")
        alertas.push({
          tipo: "RIESGO",
          mensaje: "⚠️ EPOC — verificar espirometría",
        });
    }

    res.json({
      success: true,
      bloqueado,
      motivoBloqueo,
      iapos: datosIAPOS,
      ultimoDP,
      cantMes,
      cantAnio,
      limiteAnio,
      alertas,
    });
  } catch (e) {
    console.error("Error verificar extramodulo:", e.message);
    res.status(500).json({ success: false, message: e.message });
  }
});
async function iniciarApp() {
  const maxIntentos = 5;
  let retraso = 1000;
  for (let intento = 1; intento <= maxIntentos; intento++) {
    try {
      console.log(
        `⏳ Cargando Google Sheet (Intento ${intento}/${maxIntentos})...`,
      );
      await initializeGoogleSheets();
      console.log("✅ Google Sheets conectado.");
      break;
    } catch (error) {
      console.error(`⚠️ Intento ${intento} fallido:`, error.message);
      if (intento === maxIntentos) {
        console.error(
          "⚠️ Google Sheets no disponible al arrancar — el servidor sigue funcionando sin Sheets.",
        );
      } else {
        console.log(`🔄 Reintentando en ${retraso / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, retraso));
        retraso *= 2;
      }
    }
  }
  app.listen(PORT, () => {
    console.log(`✅ Servidor de Consultas Protegido en puerto ${PORT}`);
  });
}

iniciarApp();
