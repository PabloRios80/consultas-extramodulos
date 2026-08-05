require("dotenv").config();
const { GoogleSpreadsheet } = require("google-spreadsheet");

const SPREADSHEET_ID_LECTURA = "15YPfBG9PBfN3nBW5xXJYjIXEgYIS9z71pI0VpeCtAAU";

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

const credentials = require("./credentials.json");

// Simula UNA búsqueda completa de "Ver Estudios", creando su propio documento descartable
async function buscarEstudiosDescartable(dniFalso) {
  const doc = new GoogleSpreadsheet(SPREADSHEET_ID_LECTURA);
  await doc.useServiceAccountAuth({
    client_email: credentials.client_email,
    private_key: credentials.private_key.replace(/\\n/g, "\n"),
  });
  await doc.loadInfo();

  let totalEncontrados = 0;

  for (const nombreHoja of hojasDeEstudios) {
    const sheet = doc.sheetsByTitle[nombreHoja];
    if (!sheet) continue;
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    const filtrados = rows.filter(
      (r) => String(r["DNI"] || "").trim() === String(dniFalso).trim(),
    );
    totalEncontrados += filtrados.length;
  }

  return totalEncontrados;
}

function mostrarMemoria(etiqueta) {
  const mem = process.memoryUsage();
  console.log(
    `[${etiqueta}] heapUsed=${(mem.heapUsed / 1024 / 1024).toFixed(1)}MB, rss=${(mem.rss / 1024 / 1024).toFixed(1)}MB`,
  );
}

async function simularVariasBusquedas() {
  const dniDePrueba = "18040813"; // no importa si no existe, igual recorre y filtra todas las filas

  console.log("Simulando 5 búsquedas seguidas, cada una con documento descartable...\n");
  mostrarMemoria("Inicio");

  for (let i = 1; i <= 5; i++) {
    const inicio = Date.now();
    const encontrados = await buscarEstudiosDescartable(dniDePrueba);
    const tiempo = Date.now() - inicio;
    console.log(`\nBúsqueda #${i}: ${encontrados} coincidencias, ${tiempo}ms`);

    // Forzar limpieza si el flag está disponible (opcional, solo diagnóstico)
    if (global.gc) global.gc();

    mostrarMemoria(`Después de búsqueda #${i}`);
  }

  console.log("\n=== FIN DE LA SIMULACIÓN ===");
}

simularVariasBusquedas().catch((e) => {
  console.error("Error:", e.message);
});