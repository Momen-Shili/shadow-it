const axios = require('axios');
const { pool } = require('../config/db');
const { decrypt } = require('../utils/crypto');

async function getGithubClient(userId) {
  const { rows } = await pool.query(
    `SELECT github_token, github_iv, github_tag
     FROM user_api_keys WHERE user_id = $1`,
    [userId]
  );

  if (!rows.length || !rows[0].github_token) {
    const err = new Error('Clé API non configurée. Rendez-vous dans Settings.');
    err.status = 400;
    throw err;
  }

  const token = decrypt(rows[0].github_token, rows[0].github_iv, rows[0].github_tag);

  return axios.create({
    baseURL: 'https://api.github.com',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'nexaboard',
      Accept: 'application/vnd.github+json',
    },
  });
}

async function getProfile(req, res, next) {
  try {
    const client = await getGithubClient(req.user.id);
    const { data } = await client.get('/user');
    res.json({
      data: {
        login:        data.login,
        name:         data.name,
        avatar_url:   data.avatar_url,
        html_url:     data.html_url,
        public_repos: data.public_repos,
        followers:    data.followers,
        following:    data.following,
        created_at:   data.created_at,
      },
    });
  } catch (err) {
    next(normalizeGitHubError(err));
  }
}

async function getRepos(req, res, next) {
  try {
    const client = await getGithubClient(req.user.id);
    const { data } = await client.get('/user/repos', {
      params: { per_page: 100, sort: 'updated', direction: 'desc' },
    });

    const repos = data.map((r) => ({
      id:               r.id,
      name:             r.name,
      full_name:        r.full_name,
      html_url:         r.html_url,
      language:         r.language,
      stargazers_count: r.stargazers_count,
      forks_count:      r.forks_count,
      updated_at:       r.updated_at,
      private:          r.private,
    }));

    res.json({ data: repos, total: repos.length });
  } catch (err) {
    next(normalizeGitHubError(err));
  }
}

async function getRecentCommits(req, res, next) {
  try {
    const client = await getGithubClient(req.user.id);
    const { data: repos } = await client.get('/user/repos', {
      params: { per_page: 100, sort: 'updated', direction: 'desc' },
    });

    const results = await Promise.allSettled(
      repos.map(async (repo) => {
        const { data: commits } = await client.get(
          `/repos/${repo.full_name}/commits`,
          { params: { per_page: 10 } }
        );
        return {
          repo: repo.full_name,
          commits: commits.map((c) => ({
            sha:      c.sha.slice(0, 7),
            message:  c.commit.message.split('\n')[0],
            author:   c.commit.author.name,
            date:     c.commit.author.date,
            html_url: c.html_url,
          })),
        };
      })
    );

    const data   = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
    const failed = results.filter((r) => r.status === 'rejected').length;

    res.json({ data, total_repos: repos.length, failed_repos: failed });
  } catch (err) {
    next(normalizeGitHubError(err));
  }
}

function normalizeGitHubError(err) {
  if (!err.response) return err;
  const status = err.response.status;
  const message =
    status === 401 ? 'Invalid or missing GitHub token'
    : status === 403 ? 'GitHub API rate limit exceeded or forbidden'
    : status === 404 ? 'GitHub resource not found'
    : `GitHub API error: ${err.response.data?.message || err.message}`;
  const error = new Error(message);
  error.status = status;
  return error;
}

module.exports = { getProfile, getRepos, getRecentCommits };
