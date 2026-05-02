const axios = require('axios');

const trelloClient = axios.create({
  baseURL: 'https://api.trello.com/1',
});

// Appended to every request via interceptor so the keys
// are read at call-time (not at module load-time).
trelloClient.interceptors.request.use((config) => {
  config.params = {
    key: process.env.TRELLO_API_KEY,
    token: process.env.TRELLO_TOKEN,
    ...config.params,
  };
  return config;
});

async function getBoards(req, res, next) {
  try {
    const { data } = await trelloClient.get('/members/me/boards', {
      params: {
        filter: 'open',
        fields: 'id,name,desc,url,prefs,dateLastActivity,closed',
      },
    });

    const boards = data.map((b) => ({
      id: b.id,
      name: b.name,
      desc: b.desc,
      url: b.url,
      background: b.prefs?.backgroundColor ?? b.prefs?.backgroundImage ?? null,
      last_activity: b.dateLastActivity,
    }));

    res.json({ data: boards, total: boards.length });
  } catch (err) {
    next(normalizeTrelloError(err));
  }
}

async function getBoardLists(req, res, next) {
  try {
    const { id } = req.params;
    const { data } = await trelloClient.get(`/boards/${id}/lists`, {
      params: {
        filter: 'open',
        fields: 'id,name,pos,closed',
      },
    });

    const lists = data.map((l) => ({
      id: l.id,
      name: l.name,
      pos: l.pos,
    }));

    res.json({ data: lists, total: lists.length });
  } catch (err) {
    next(normalizeTrelloError(err));
  }
}

async function getBoardCards(req, res, next) {
  try {
    const { id } = req.params;
    const { data } = await trelloClient.get(`/boards/${id}/cards`, {
      params: {
        filter: 'open',
        fields: 'id,name,desc,url,due,dueComplete,idList,labels,pos,dateLastActivity',
      },
    });

    const cards = data.map((c) => ({
      id: c.id,
      name: c.name,
      desc: c.desc,
      url: c.url,
      due: c.due,
      due_complete: c.dueComplete,
      list_id: c.idList,
      labels: c.labels.map((l) => ({ id: l.id, name: l.name, color: l.color })),
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
    status === 401 ? 'Invalid or missing TRELLO_API_KEY / TRELLO_TOKEN'
    : status === 403 ? 'Trello access forbidden — check token permissions'
    : status === 404 ? 'Trello resource not found'
    : `Trello API error: ${err.response.data ?? err.message}`;
  const error = new Error(message);
  error.status = status;
  return error;
}

module.exports = { getBoards, getBoardLists, getBoardCards };
