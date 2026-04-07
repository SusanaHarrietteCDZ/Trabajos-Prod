import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

let connectionSettings = null;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X-Replit-Token not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-sheet',
    {
      headers: {
        'Accept': 'application/json',
        'X-Replit-Token': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Sheet not connected');
  }
  return accessToken;
}

async function getUncachableGoogleSheetClient() {
  const accessToken = await getAccessToken();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.sheets({ version: 'v4', auth: oauth2Client });
}

async function getDriveClient() {
  const accessToken = await getAccessToken();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.drive({ version: 'v3', auth: oauth2Client });
}

let spreadsheetId = null;
const SHEET_NAME = 'Trabajos';
const SPREADSHEET_TITLE = 'CDZ - Registro de Trabajos de Producción';

async function getOrCreateSpreadsheet() {
  if (spreadsheetId) return spreadsheetId;

  const drive = await getDriveClient();

  const searchResult = await drive.files.list({
    q: `name='${SPREADSHEET_TITLE}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
    spaces: 'drive',
    fields: 'files(id, name)',
  });

  if (searchResult.data.files && searchResult.data.files.length > 0) {
    spreadsheetId = searchResult.data.files[0].id;
    console.log('Found existing spreadsheet:', spreadsheetId);
    return spreadsheetId;
  }

  const sheets = await getUncachableGoogleSheetClient();
  const createResult = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: SPREADSHEET_TITLE },
      sheets: [{
        properties: { title: SHEET_NAME }
      }]
    }
  });

  spreadsheetId = createResult.data.spreadsheetId;
  console.log('Created new spreadsheet:', spreadsheetId);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!A1:K1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        'Fecha',
        'Usuario',
        'Trabajo Realizado',
        'Variedad',
        'Traslado',
        'De Tanque',
        'A Tanque',
        'Tanque',
        'Litros Tanque Final',
        'Observaciones',
        'Fecha Registro'
      ]]
    }
  });

  return spreadsheetId;
}

app.post('/api/sync-sheet', async (req, res) => {
  try {
    const {
      fecha, nombreUsuario, trabajoRealizado, variedad,
      traslado, deTanque, aTanque, tanque,
      litrosTanqueFinal, observaciones
    } = req.body;

    const ssId = await getOrCreateSpreadsheet();
    const sheets = await getUncachableGoogleSheetClient();

    const now = new Date().toLocaleString('es-BO', { timeZone: 'America/La_Paz' });

    await sheets.spreadsheets.values.append({
      spreadsheetId: ssId,
      range: `${SHEET_NAME}!A:K`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[
          fecha || '',
          nombreUsuario || '',
          trabajoRealizado || '',
          variedad || '',
          traslado || '',
          deTanque || '',
          aTanque || '',
          tanque || '',
          litrosTanqueFinal || '',
          observaciones || '',
          now
        ]]
      }
    });

    res.json({ success: true, spreadsheetId: ssId });
  } catch (err) {
    console.error('Error syncing to Google Sheets:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/sheet-info', async (req, res) => {
  try {
    const ssId = await getOrCreateSpreadsheet();
    res.json({ success: true, spreadsheetId: ssId, url: `https://docs.google.com/spreadsheets/d/${ssId}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server running on port ${PORT}`);
});
