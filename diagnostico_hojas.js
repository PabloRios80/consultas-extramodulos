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

async function diagnosticar() {
  console.log("Conectando a la planilla de lectura...\n");

  const credentials = require("./credentials.json");
  const doc = new GoogleSpreadsheet(SPREADSHEET_ID_LECTURA);
  await doc.useServiceAccountAuth({
    client_email: credentials.client_email,
    private_key: credentials.private_key.replace(/\\n/g, "\n"),
  });
  await doc.loadInfo();

  console.log(`Título de la planilla: ${doc.title}`);
  console.log(`Total de hojas en la planilla: ${doc.sheetCount}\n`);

  console.log("Todas las hojas disponibles en esta planilla:");
  Object.keys(doc.sheetsByTitle).forEach((titulo) => {
    const s = doc.sheetsByTitle[titulo];
    console.log(`  - "${titulo}": ${s.rowCount} filas x ${s.columnCount} columnas`);
  });

  console.log("\n--- Detalle de las 8 hojas que usa /obtener-estudios-paciente ---\n");

  let totalFilasReales = 0;
  const inicioTotal = Date.now();

  for (const nombre of hojasDeEstudios) {
    const sheet = doc.sheetsByTitle[nombre];
    if (!sheet) {
      console.log(`❌ "${nombre}": NO EXISTE en la planilla`);
      continue;
    }

    const inicio = Date.now();
    try {
      await sheet.loadHeaderRow();
      const rows = await sheet.getRows();
      const tiempo = Date.now() - inicio;
      totalFilasReales += rows.length;
      console.log(
        `✅ "${nombre}": ${rows.length} filas reales cargadas en ${tiempo}ms (rowCount de la hoja: ${sheet.rowCount})`,
      );
    } catch (e) {
      console.log(`⚠️ "${nombre}": ERROR al cargar — ${e.message}`);
    }

    // Memoria usada hasta el momento
    const mem = process.memoryUsage();
    console.log(
      `   Memoria actual: heapUsed=${(mem.heapUsed / 1024 / 1024).toFixed(1)}MB, rss=${(mem.rss / 1024 / 1024).toFixed(1)}MB`,
    );
  }

  const tiempoTotal = Date.now() - inicioTotal;
  console.log(`\n=== RESUMEN ===`);
  console.log(`Total de filas reales sumando las 8 hojas: ${totalFilasReales}`);
  console.log(`Tiempo total: ${tiempoTotal}ms`);
  const memFinal = process.memoryUsage();
  console.log(
    `Memoria final: heapUsed=${(memFinal.heapUsed / 1024 / 1024).toFixed(1)}MB, rss=${(memFinal.rss / 1024 / 1024).toFixed(1)}MB`,
  );
}

diagnosticar().catch((e) => {
  console.error("Error en el diagnóstico:", e.message);
});