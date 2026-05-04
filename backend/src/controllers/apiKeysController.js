const { pool } = require('../config/db');
const { encrypt } = require('../utils/crypto');

async function getMyKeys(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT github_token, trello_api_key, trello_token, slack_token
       FROM user_api_keys WHERE user_id = $1`,
      [req.user.id]
    );

    if (!rows.length) {
      return res.json({
        data: { has_github: false, has_trello: false, has_slack: false },
      });
    }

    const k = rows[0];
    res.json({
      data: {
        has_github: !!k.github_token,
        has_trello: !!(k.trello_api_key && k.trello_token),
        has_slack:  !!k.slack_token,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function saveKeys(req, res, next) {
  try {
    const { github_token, trello_api_key, trello_token, slack_token } = req.body;

    const setClauses = [];
    const values = [req.user.id]; // $1 always userId

    function addEncrypted(plaintext, colCiphertext, colIv, colTag) {
      const { ciphertext, iv, tag } = encrypt(plaintext);
      const base = values.length; // 0-indexed position before push
      values.push(ciphertext, iv, tag);
      setClauses.push(
        `${colCiphertext} = $${base + 1}, ${colIv} = $${base + 2}, ${colTag} = $${base + 3}`
      );
    }

    if (github_token   !== undefined) addEncrypted(github_token,   'github_token',   'github_iv',        'github_tag');
    if (trello_api_key !== undefined) addEncrypted(trello_api_key, 'trello_api_key', 'trello_key_iv',    'trello_key_tag');
    if (trello_token   !== undefined) addEncrypted(trello_token,   'trello_token',   'trello_token_iv',  'trello_token_tag');
    if (slack_token    !== undefined) addEncrypted(slack_token,    'slack_token',    'slack_iv',         'slack_tag');

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No keys provided' });
    }

    setClauses.push('updated_at = NOW()');

    // Ensure the row exists, then update only the supplied fields
    await pool.query(
      `INSERT INTO user_api_keys (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [req.user.id]
    );

    await pool.query(
      `UPDATE user_api_keys
       SET ${setClauses.join(', ')}
       WHERE user_id = $1`,
      values
    );

    res.json({ message: 'Keys saved successfully' });
  } catch (err) {
    next(err);
  }
}

async function deleteKey(req, res, next) {
  try {
    const { service } = req.params;

    const nullSets = {
      github: 'github_token = NULL, github_iv = NULL, github_tag = NULL',
      trello: 'trello_api_key = NULL, trello_key_iv = NULL, trello_key_tag = NULL, ' +
              'trello_token = NULL, trello_token_iv = NULL, trello_token_tag = NULL',
      slack:  'slack_token = NULL, slack_iv = NULL, slack_tag = NULL',
    };

    if (!nullSets[service]) {
      return res.status(400).json({ error: 'Invalid service. Valid values: github, trello, slack' });
    }

    await pool.query(
      `UPDATE user_api_keys
       SET ${nullSets[service]}, updated_at = NOW()
       WHERE user_id = $1`,
      [req.user.id]
    );

    res.json({ message: `${service} key removed` });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMyKeys, saveKeys, deleteKey };
