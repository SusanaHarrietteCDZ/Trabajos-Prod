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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const auth = getAuth();
    const drive = google.drive({ version: 'v3', auth });

    const searchResult = await drive.files.list({
      q: `name='${SPREADSHEET_TITLE}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name)',
    });

    if (searchResult.data.files && searchResult.data.files.length > 0) {
      const id = searchResult.data.files[0].id;
      res.json({ success: true, spreadsheetId: id, url: `https://docs.google.com/spreadsheets/d/${id}` });
    } else {
      res.json({ success: false, message: 'No spreadsheet found yet. It will be created on first registro.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
