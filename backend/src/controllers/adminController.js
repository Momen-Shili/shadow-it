const { pool } = require('../config/db');

async function getMembers(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, status, created_at
       FROM users
       WHERE role = 'team_member'
       ORDER BY created_at DESC`
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

async function approveMember(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE users
       SET status = 'approved', updated_at = NOW()
       WHERE id = $1 AND role = 'team_member'
       RETURNING id, name, email, status`,
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Member not found' });
    }

    await pool.query(
      `INSERT INTO activity_logs (admin_id, target_user_id, action)
       VALUES ($1, $2, 'approved')`,
      [req.user.id, id]
    );

    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function rejectMember(req, res, next) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE users
       SET status = 'rejected', rejected_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND role = 'team_member'
       RETURNING id, name, email, status`,
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Member not found' });
    }

    await pool.query(
      `INSERT INTO activity_logs (admin_id, target_user_id, action)
       VALUES ($1, $2, 'rejected')`,
      [req.user.id, id]
    );

    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function getMemberDashboard(req, res, next) {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `SELECT github_token, trello_api_key, trello_token, slack_token
       FROM user_api_keys WHERE user_id = $1`,
      [id]
    );

    // Log the view action
    await pool.query(
      `INSERT INTO activity_logs (admin_id, target_user_id, action)
       VALUES ($1, $2, 'viewed_dashboard')`,
      [req.user.id, id]
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
        has_slack: !!k.slack_token,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getTeamStats(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT
         COUNT(*)                                              FILTER (WHERE role = 'team_member') AS total,
         COUNT(*) FILTER (WHERE role = 'team_member' AND status = 'pending')  AS pending,
         COUNT(*) FILTER (WHERE role = 'team_member' AND status = 'approved') AS approved,
         COUNT(*) FILTER (WHERE role = 'team_member' AND status = 'rejected') AS rejected
       FROM users`
    );
    // pg returns bigint counts as strings; cast to int for cleaner JSON
    const raw = rows[0];
    res.json({
      data: {
        total:    parseInt(raw.total),
        pending:  parseInt(raw.pending),
        approved: parseInt(raw.approved),
        rejected: parseInt(raw.rejected),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getActivityLogs(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT
         al.id,
         al.action,
         al.created_at,
         a.name  AS admin_name,
         a.email AS admin_email,
         t.name  AS target_name,
         t.email AS target_email
       FROM activity_logs al
       LEFT JOIN users a ON al.admin_id       = a.id
       LEFT JOIN users t ON al.target_user_id = t.id
       ORDER BY al.created_at DESC
       LIMIT 50`
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMembers,
  approveMember,
  rejectMember,
  getMemberDashboard,
  getTeamStats,
  getActivityLogs,
};
