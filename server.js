require('dotenv').config();
const express = require('express');
const path = require('path');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();
const PORT = process.env.PORT || 3000;

// ====================================================================
// CONFIGURACIÓN DE IDs DE PLANILLAS (LOCAL)
// ====================================================================
const SPREADSHEET_ID_LECTURA = '15YPfBG9PBfN3nBW5xXJYjIXEgYIS9z71pI0VpeCtAAU';
const SPREADSHEET_ID_ESCRITURA = process.env.SHEET_ID_CONSULTAS || 'TU_NUEVO_ID_AQUI';

// ====================================================================
// MIDDLEWARES Y AUTH
// ====================================================================
app.use(express.json());
app.use(express.static('public'));
app.use(session({
    secret: 'secret-key-extramodulos',
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// ====================================================================
// VARIABLES GLOBALES Y CONEXIÓN
// ====================================================================
let doc; // Doc de Lectura (Base original)
let docEscritura; // Doc de Escritura (Consultas Nuevas)
let credentials;

async function initializeGoogleSheets() {
    try {
        credentials = require('./credentials.json');

        // Inicializar Base de Lectura
        doc = new GoogleSpreadsheet(SPREADSHEET_ID_LECTURA);
        await doc.useServiceAccountAuth({
            client_email: credentials.client_email,
            private_key: credentials.private_key.replace(/\\n/g, '\n'),
        });
        await doc.loadInfo();
        console.log('✅ Base de Lectura (Pacientes) Conectada');

        // Inicializar Base de Escritura
        docEscritura = new GoogleSpreadsheet(SPREADSHEET_ID_ESCRITURA);
        await docEscritura.useServiceAccountAuth({
            client_email: credentials.client_email,
            private_key: credentials.private_key.replace(/\\n/g, '\n'),
        });
        await docEscritura.loadInfo();
        console.log('✅ Base de Escritura (Consultas) Conectada');

    } catch (error) {
        console.error('❌ Error inicializando Google Sheets:', error);
        throw error;
    }
}

// Helper para obtener datos de cualquier hoja por nombre
async function getDataFromSpecificSheet(sheetIdentifier) {
    if (!doc) throw new Error('Documento no inicializado');
    let sheet = doc.sheetsByTitle[sheetIdentifier];
    if (!sheet) return [];
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    return rows.map(row => {
        const rowData = {};
        sheet.headerValues.forEach(header => {
            rowData[header] = row[header] || '';
        });
        return rowData;
    });
}

// ====================================================================
// ESTRATEGIA PASSPORT (GOOGLE)
// ====================================================================
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || `http://localhost:${PORT}/auth/google/callback`
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Rutas Auth
app.get('/auth/google', (req, res, next) => {
    req.session.returnTo = req.query.returnTo || '/';
    next();
}, passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login.html' }),
    (req, res) => {
        const redirectUrl = req.session.returnTo || '/consultas.html';
        delete req.session.returnTo;
        res.redirect(redirectUrl);
    }
);

app.get('/api/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ isLoggedIn: true, user: { name: req.user.displayName, email: req.user.emails[0].value } });
    } else {
        res.json({ isLoggedIn: false });
    }
});

// ====================================================================
// RUTAS DE BÚSQUEDA Y ESTUDIOS (LECTURA BASE ORIGINAL)
// ====================================================================

app.post('/buscar', async (req, res) => {
    try {
        const dniABuscar = String(req.body.dni).trim();
        const sheet = doc.sheetsByIndex[0]; // Buscamos en la primera hoja por defecto
        await sheet.loadHeaderRow();
        const rows = await sheet.getRows();

        const paciente = rows.find(r => 
            String(r['DNI'] || r['Documento'] || '').trim() === dniABuscar
        );

        if (paciente) {
            res.json({
                pacientePrincipal: {
                    DNI: paciente.DNI || paciente.Documento,
                    Nombre: paciente.Nombre,
                    Apellido: paciente.Apellido,
                    Edad: paciente.Edad || '',
                    Sexo: paciente.Sexo || ''
                }
            });
        } else {
            res.json({ error: 'DNI no encontrado.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al buscar paciente' });
    }
});

app.post('/obtener-estudios-paciente', async (req, res) => {
    try {
        const { dni } = req.body;
        const estudiosEncontrados = [];
        const hojasDeEstudios = ['Mamografia', 'Laboratorio', 'Ecografia', 'Espirometria', 'Densitometria', 'Enfermeria', 'Eco mamaria', 'Oftalmologia'];

        for (const sheetName of hojasDeEstudios) {
            try {
                const sheetData = await getDataFromSpecificSheet(sheetName);
                const filtrados = sheetData.filter(row => String(row['DNI'] || '').trim() === String(dni).trim());

                filtrados.forEach(estudio => {
                    let baseData = {
                        TipoEstudio: sheetName,
                        Fecha: estudio['Fecha'] || estudio['Fecha_cierre_Enf'] || 'N/A',
                        LinkPDF: estudio['LinkPDF'] || estudio['Espirometria (Enlace a PDF)'] || ''
                    };

                    if (sheetName === 'Laboratorio') {
                        baseData.ResultadosLaboratorio = estudio; // Enviamos todo el objeto para el parseo del frontend
                    } else if (sheetName === 'Enfermeria') {
                        baseData.ResultadosEnfermeria = {
                            'Altura': estudio['Altura (cm)'],
                            'Peso': estudio['Peso (kg)'],
                            'Presion_Arterial': estudio['Presion Arterial (mmhg)']
                        };
                    } else {
                        baseData.Resultado = estudio['Resultado'] || estudio['Normal/Patologica'] || 'N/A';
                    }
                    estudiosEncontrados.push(baseData);
                });
            } catch (e) { console.warn(`Hoja ${sheetName} no accesible`); }
        }
        res.json({ success: true, estudios: estudiosEncontrados });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener estudios' });
    }
});

// ====================================================================
// RUTA DE GUARDADO (ESCRITURA BASE NUEVA - CUENTA PAGA)
// ====================================================================

app.post('/guardar-consulta', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ success: false, message: 'No autorizado' });

    try {
        await docEscritura.loadInfo();
        const sheetTitle = 'Consultas';
        let sheet = docEscritura.sheetsByTitle[sheetTitle];

        if (!sheet) {
            sheet = await docEscritura.addSheet({
                title: sheetTitle,
                headerValues: ['DNI', 'Nombre', 'Apellido', 'Edad', 'Sexo', 'Motivo de consulta', 'Diagnostico', 'Indicaciones', 'Recordatorio', 'Profesional', 'Fecha'],
            });
        }

        const data = req.body;
        await sheet.addRow({
            'DNI': data.DNI,
            'Nombre': data.Nombre,
            'Apellido': data.Apellido,
            'Edad': data.Edad,
            'Sexo': data.Sexo,
            'Motivo de consulta': data['motivo de consulta'],
            'Diagnostico': data.diagnostico,
            'Indicaciones': data.indicaciones,
            'Recordatorio': data.recordatorio,
            'Profesional': req.user.displayName,
            'Fecha': new Date().toLocaleString('es-AR')
        });

        res.json({ success: true, message: 'Consulta guardada en la base nueva con éxito.' });
    } catch (error) {
        console.error('Error al guardar:', error);
        res.status(500).json({ success: false, message: 'Error al guardar la consulta.' });
    }
});

// ====================================================================
// INICIO
// ====================================================================
app.get('/consultas.html', (req, res) => {
    if (req.isAuthenticated()) res.sendFile(path.join(__dirname, 'private', 'consultas.html'));
    else res.redirect('/auth/google?returnTo=/consultas.html');
});

initializeGoogleSheets().then(() => {
    app.listen(PORT, () => {
        console.log(`✅ Servidor de Consultas Protegido en http://localhost:${PORT}`);
    });
});