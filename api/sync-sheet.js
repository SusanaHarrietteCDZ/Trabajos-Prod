import { google } from 'googleapis';

const SHEET_NAME = 'Trabajos';
const SPREADSHEET_TITLE = 'CDZ - Registro de Trabajos de Producción';

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });
  return auth;
}

async function getOrCreateSpreadsheet(auth) {
  const sheets = google.sheets({ version: 'v4', auth });
  const drive = google.drive({ version: 'v3', auth });

  const searchResult = await drive.files.list({
    q: `name='${SPREADSHEET_TITLE}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
    spaces: 'drive',
    fields: 'files(id, name)',
  });

  if (searchResult.data.files && searchResult.data.files.length > 0) {
    return searchResult.data.files[0].id;
  }

  const createResult = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: SPREADSHEET_TITLE },
      sheets: [{ properties: { title: SHEET_NAME } }],
    },
  });

  const spreadsheetId = createResult.data.spreadsheetId;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET_NAME}!A1:K1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        'Fecha', 'Usuario', 'Trabajo Realizado', 'Variedad',
        'Traslado', 'De Tanque', 'A Tanque', 'Tanque',
        'Litros Tanque Final', 'Observaciones', 'Fecha Registro',
      ]],
    },
  });

  return spreadsheetId;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      fecha, nombreUsuario, trabajoRealizado, variedad,
      traslado, deTanque, aTanque, tanque,
      litrosTanqueFinal, observaciones,
    } = req.body;

    const auth = getAuth();
    const spreadsheetId = await getOrCreateSpreadsheet(auth);
    const sheets = google.sheets({ version: 'v4', auth });

    const now = new Date().toLocaleString('es-BO', { timeZone: 'America/La_Paz' });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_NAME}!A:K`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[
          fecha || '', nombreUsuario || '', trabajoRealizado || '',
          variedad || '', traslado || '', deTanque || '',
          aTanque || '', tanque || '', litrosTanqueFinal || '',
          observaciones || '', now,
        ]],
      },
    });

    res.json({ success: true, spreadsheetId });
  } catch (err) {
    console.error('Error syncing to Google Sheets:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}
