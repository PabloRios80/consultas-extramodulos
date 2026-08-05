require("dotenv").config();
const { GoogleSpreadsheet } = require("google-spreadsheet");

const SPREADSHEET_ID_LECTURA = "15YPfBG9PBfN3nBW5xXJYjIXEgYIS9z71pI0VpeCtAAU";
const credentials = require("./credentials.json");

function mostrarMemoria(etiqueta) {
  const mem = process.memoryUsage();
  console.log(
    `[${etiqueta}] heapUsed=${(mem.heapUsed / 1024 / 1024).toFixed(1)}MB, rss=${(mem.rss / 1024 / 1024).toFixed(1)}MB`,
  );
}

async function probarHoja1() {
  mostrarMemoria("Inicio");

  const doc = new GoogleSpreadsheet(SPREADSHEET_ID_LECTURA);
  await doc.useServiceAccountAuth({
    client_email: credentials.client_email,
    private_key: credentials.private_key.replace(/\\n/g, "\n"),
  });
  await doc.loadInfo();
  mostrarMemoria("Después de loadInfo");

  const sheet = doc.sheetsByIndex[0];
  console.log(`\nHoja: "${sheet.title}" — ${sheet.rowCount} filas x ${sheet.columnCount} columnas\n`);

  const inicio = Date.now();
  await sheet.loadHeaderRow();
  mostrarMemoria("Después de loadHeaderRow");

  const rows = await sheet.getRows();
  const tiempo = Date.now() - inicio;
  console.log(`\n${rows.length} filas cargadas en ${tiempo}ms`);
  mostrarMemoria("Después de getRows completo");
}

probarHoja1().catch((e) => {
  console.error("Error:", e.message);
});