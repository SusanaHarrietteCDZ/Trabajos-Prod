const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '1dPtriZ5AUdLakUFW9du6SRs9PzfE-SqNg1yr68kFink';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    success: true,
    spreadsheetId: SPREADSHEET_ID,
    url: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`,
  });
}
