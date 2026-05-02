const { google } = require('googleapis');
const { pool } = require('../config/db');

// Create a fresh OAuth2 client using env vars read at call-time
function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// Load stored credentials for a user and return an authenticated client.
// Also wires up token refresh persistence so the new access_token is saved
// automatically when googleapis refreshes it.
async function getAuthedClient(userId) {
  const { rows } = await pool.query(
    `SELECT access_token, refresh_token, token_expiry
     FROM service_credentials
     WHERE user_id = $1 AND service = 'google'`,
    [userId]
  );

  if (!rows.length) {
    const err = new Error(
      'Google Drive is not connected for this account. Please authorize first via GET /api/google/auth.'
    );
    err.status = 403;
    throw err;
  }

  const { access_token, refresh_token, token_expiry } = rows[0];

  const client = createOAuth2Client();
  client.setCredentials({
    access_token,
    refresh_token,
    expiry_date: token_expiry ? new Date(token_expiry).getTime() : undefined,
  });

  // Persist refreshed access tokens automatically
  client.on('tokens', async (tokens) => {
    await pool.query(
      `UPDATE service_credentials
       SET access_token = $1,
           token_expiry = $2,
           updated_at   = NOW()
       WHERE user_id = $3 AND service = 'google'`,
      [
        tokens.access_token,
        tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        userId,
      ]
    );
  });

  return client;
}

// ── Public: generate the Google OAuth consent URL ──────────────────────────
// The frontend (which has the logged-in user's JWT) passes ?userId=<uuid> so
// we can link the resulting tokens to the right user in handleCallback.
async function getAuthUrl(req, res, next) {
  try {
    const { userId } = req.query;
    const client = createOAuth2Client();

    const url = client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',                   // force refresh_token to be returned
      scope: ['https://www.googleapis.com/auth/drive.readonly'],
      state: userId ?? '',                  // echoed back by Google on redirect
    });

    res.json({ url });
  } catch (err) {
    next(err);
  }
}

// ── Public: OAuth2 callback — exchanges code for tokens and persists them ──
// Google redirects the browser here with ?code=...&state=<userId>
async function handleCallback(req, res, next) {
  try {
    const { code, state: userId, error } = req.query;

    if (error) {
      return res.redirect(
        `${process.env.CLIENT_URL}/admin/google?error=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    const client = createOAuth2Client();
    const { tokens } = await client.getToken(code);

    if (userId) {
      await pool.query(
        `INSERT INTO service_credentials
           (user_id, service, access_token, refresh_token, token_expiry)
         VALUES ($1, 'google', $2, $3, $4)
         ON CONFLICT (user_id, service) DO UPDATE
           SET access_token  = EXCLUDED.access_token,
               refresh_token = COALESCE(EXCLUDED.refresh_token, service_credentials.refresh_token),
               token_expiry  = EXCLUDED.token_expiry,
               updated_at    = NOW()`,
        [
          userId,
          tokens.access_token,
          tokens.refresh_token ?? null,
          tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        ]
      );
    }

    res.redirect(`${process.env.CLIENT_URL}/admin/google?connected=true`);
  } catch (err) {
    next(err);
  }
}

// ── Protected: list the user's Drive files ─────────────────────────────────
async function getFiles(req, res, next) {
  try {
    const client = await getAuthedClient(req.user.id);
    const drive = google.drive({ version: 'v3', auth: client });

    const response = await drive.files.list({
      pageSize: 20,
      fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink)',
      orderBy: 'modifiedTime desc',
    });

    const files = (response.data.files ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      mime_type: f.mimeType,
      size: f.size ? parseInt(f.size) : null,
      modified_time: f.modifiedTime,
      web_view_link: f.webViewLink,
    }));

    res.json({ data: files, total: files.length });
  } catch (err) {
    next(err);
  }
}

// ── Protected: get the user's Drive storage quota ──────────────────────────
async function getStorageQuota(req, res, next) {
  try {
    const client = await getAuthedClient(req.user.id);
    const drive = google.drive({ version: 'v3', auth: client });

    const response = await drive.about.get({ fields: 'storageQuota' });
    const q = response.data.storageQuota;

    const limit = q.limit ? parseInt(q.limit) : null;
    const usage = parseInt(q.usage ?? 0);

    res.json({
      data: {
        limit,
        usage,
        usage_in_drive:       parseInt(q.usageInDrive ?? 0),
        usage_in_drive_trash: parseInt(q.usageInDriveTrash ?? 0),
        used_percent: limit ? Math.round((usage / limit) * 100) : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAuthUrl, handleCallback, getFiles, getStorageQuota };
