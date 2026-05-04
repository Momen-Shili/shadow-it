const axios = require('axios');
const { pool } = require('../config/db');
const { decrypt } = require('../utils/crypto');

async function getTrelloParams(userId) {
  const { rows } = await pool.query(
    `SELECT trello_api_key, trello_key_iv, trello_key_tag,
            trello_token,   trello_token_iv, trello_token_tag
     FROM user_api_keys WHERE user_id = $1`,
    [userId]
  );

  if (!rows.length || !rows[0].trello_api_key || !rows[0].trello_token) {
    const err = new Error('Clé API non configurée. Rendez-vous dans Settings.');
    err.status = 400;
    throw err;
  }

  return {
    key:   decrypt(rows[0].trello_api_key, rows[0].trello_key_iv,   rows[0].trello_key_tag),
    token: decrypt(rows[0].trello_token,   rows[0].trello_token_iv, rows[0].trello_token_tag),
  };
}

function makeTrelloClient(key, token) {
  const client = axios.create({ baseURL: 'https://api.trello.com/1' });
  client.interceptors.request.use((config) => {
    config.params = { key, token, ...config.params };
    return config;
  });
  return client;
}

async function getBoards(req, res, next) {
  try {
    const { key, token } = await getTrelloParams(req.user.id);
    const client = makeTrelloClient(key, token);
    const { data } = await client.get('/members/me/boards', {
      params: { filter: 'open', fields: 'id,name,desc,url,prefs,dateLastActivity,closed' },
    });

    const boards = data.map((b) => ({
      id:            b.id,
      name:          b.name,
      desc:          b.desc,
      url:           b.url,
      background:    b.prefs?.backgroundColor ?? b.prefs?.backgroundImage ?? null,
      last_activity: b.dateLastActivity,
    }));

    res.json({ data: boards, total: boards.length });
  } catch (err) {
    next(normalizeTrelloError(err));
  }
}

async function getBoardLists(req, res, next) {
  try {
    const { key, token } = await getTrelloParams(req.user.id);
    const client = makeTrelloClient(key, token);
    const { data } = await client.get(`/boards/${req.params.id}/lists`, {
      params: { filter: 'open', fields: 'id,name,pos,closed' },
    });

    const lists = data.map((l) => ({ id: l.id, name: l.name, pos: l.pos }));
    res.json({ data: lists, total: lists.length });
  } catch (err) {
    next(normalizeTrelloError(err));
  }
}

async function getBoardCards(req, res, next) {
  try {
    const { key, token } = await getTrelloParams(req.user.id);
    const client = makeTrelloClient(key, token);
    const { data } = await client.get(`/boards/${req.params.id}/cards`, {
      params: {
        filter: 'open',
        fields: 'id,name,desc,url,due,dueComplete,idList,labels,pos,dateLastActivity',
      },
    });

    const cards = data.map((c) => ({
      id:            c.id,
      name:          c.name,
      desc:          c.desc,
      url:           c.url,
      due:           c.due,
      due_complete:  c.dueComplete,
      list_id:       c.idList,
      labels:        c.labels.map((l) => ({ id: l.id, name: l.name, color: l.color })),
      last_activity: c.dateLastActivity,
    }));

    res.json({ data: cards, total: cards.length });
  } catch (err) {
    next(normalizeTrelloError(err));
  }
}

function normalizeTrelloError(err) {
  if (!err.response) return err;
  const status = err.response.status;
  const message =
    status === 401 ? 'Invalid or missing Trello API key / token'
    : status === 403 ? 'Trello access forbidden — check token permissions'
    : status === 404 ? 'Trello resource not found'
    : `Trello API error: ${err.response.data ?? err.message}`;
  const error = new Error(message);
  error.status = status;
  return error;
}

module.exports = { getBoards, getBoardLists, getBoardCards };
