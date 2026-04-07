import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '1dPtriZ5AUdLakUFW9du6SRs9PzfE-SqNg1yr68kFink';
const SHEET_NAME = 'Trabajos';

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
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
    const sheets = google.sheets({ version: 'v4', auth });

    const now = new Date().toLocaleString('es-BO', { timeZone: 'America/La_Paz' });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
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

    res.json({ success: true, spreadsheetId: SPREADSHEET_ID });
  } catch (err) {
    console.error('Error syncing to Google Sheets:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}
