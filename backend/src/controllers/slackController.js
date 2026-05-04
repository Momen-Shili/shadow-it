const axios = require('axios');
const { pool } = require('../config/db');
const { decrypt } = require('../utils/crypto');

async function getSlackClient(userId) {
  const { rows } = await pool.query(
    `SELECT slack_token, slack_iv, slack_tag
     FROM user_api_keys WHERE user_id = $1`,
    [userId]
  );

  if (!rows.length || !rows[0].slack_token) {
    const err = new Error('Clé API non configurée. Rendez-vous dans Settings.');
    err.status = 400;
    throw err;
  }

  const token = decrypt(rows[0].slack_token, rows[0].slack_iv, rows[0].slack_tag);
  const client = axios.create({ baseURL: 'https://slack.com/api' });
  client.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return client;
}

// Slack always returns HTTP 200; real errors are in response.data.ok === false
function assertOk(data, fallback) {
  if (!data.ok) {
    const err = new Error(data.error ? slackErrorMessage(data.error) : fallback);
    err.status = slackErrorStatus(data.error);
    throw err;
  }
}

async function getWorkspaceInfo(req, res, next) {
  try {
    const client = await getSlackClient(req.user.id);
    const { data } = await client.get('/team.info');
    assertOk(data, 'Failed to fetch workspace info');

    const t = data.team;
    res.json({
      data: {
        id:           t.id,
        name:         t.name,
        domain:       t.domain,
        email_domain: t.email_domain,
        icon:         t.icon?.image_88 ?? null,
        url:          `https://${t.domain}.slack.com`,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getChannels(req, res, next) {
  try {
    const client = await getSlackClient(req.user.id);
    const { data } = await client.get('/conversations.list', {
      params: { types: 'public_channel', exclude_archived: true, limit: 200 },
    });
    assertOk(data, 'Failed to fetch channels');

    const channels = data.channels.map((c) => ({
      id:           c.id,
      name:         c.name,
      topic:        c.topic?.value ?? null,
      purpose:      c.purpose?.value ?? null,
      member_count: c.num_members,
      is_private:   c.is_private,
      created:      c.created,
    }));

    res.json({ data: channels, total: channels.length });
  } catch (err) {
    next(err);
  }
}

async function getChannelMessages(req, res, next) {
  try {
    const client = await getSlackClient(req.user.id);
    const { data } = await client.get('/conversations.history', {
      params: { channel: req.params.id, limit: 20 },
    });
    assertOk(data, 'Failed to fetch messages');

    const messages = data.messages.map((m) => ({
      ts:          m.ts,
      user:        m.user ?? m.bot_id ?? null,
      text:        m.text,
      type:        m.subtype ?? 'message',
      reply_count: m.reply_count ?? 0,
      reactions:   (m.reactions ?? []).map((r) => ({ name: r.name, count: r.count })),
      timestamp:   new Date(parseFloat(m.ts) * 1000).toISOString(),
    }));

    res.json({ data: messages, total: messages.length });
  } catch (err) {
    next(err);
  }
}

function slackErrorMessage(code) {
  const map = {
    invalid_auth:     'Invalid Slack token',
    not_authed:       'Missing Slack token',
    account_inactive: 'Slack account is inactive',
    token_revoked:    'Slack token has been revoked',
    no_permission:    'Bot lacks required Slack scopes',
    channel_not_found:'Slack channel not found',
    not_in_channel:   'Bot is not a member of this channel',
    missing_scope:    'Bot is missing required OAuth scope',
    ratelimited:      'Slack API rate limit exceeded',
  };
  return map[code] ?? `Slack API error: ${code}`;
}

function slackErrorStatus(code) {
  if (['invalid_auth', 'not_authed', 'token_revoked'].includes(code)) return 401;
  if (['no_permission', 'missing_scope', 'not_in_channel'].includes(code)) return 403;
  if (code === 'channel_not_found') return 404;
  if (code === 'ratelimited') return 429;
  return 500;
}

module.exports = { getWorkspaceInfo, getChannels, getChannelMessages };
