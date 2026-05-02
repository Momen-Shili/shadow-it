const { pool } = require('../config/db');

async function list(req, res, next) {
  try {
    const { status, risk_level, category, department, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = [];
    const params = [];
    let idx = 1;

    if (status)     { conditions.push(`status = $${idx++}`);     params.push(status); }
    if (risk_level) { conditions.push(`risk_level = $${idx++}`); params.push(risk_level); }
    if (category)   { conditions.push(`category = $${idx++}`);   params.push(category); }
    if (department) { conditions.push(`department ILIKE $${idx++}`); params.push(`%${department}%`); }
    if (search)     { conditions.push(`(name ILIKE $${idx++} OR vendor ILIKE $${idx++})`); params.push(`%${search}%`, `%${search}%`); idx++; }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT i.*, u.name AS created_by_name
         FROM integrations i
         LEFT JOIN users u ON u.id = i.created_by
         ${where}
         ORDER BY i.discovered_at DESC
         LIMIT $${idx++} OFFSET $${idx++}`,
        [...params, parseInt(limit), offset]
      ),
      pool.query(`SELECT COUNT(*) FROM integrations ${where}`, params),
    ]);

    res.json({
      data: dataResult.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT i.*, u.name AS created_by_name
       FROM integrations i
       LEFT JOIN users u ON u.id = i.created_by
       WHERE i.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Integration not found' });
    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const {
      name, vendor, category, department, users_count = 0,
      risk_level = 'medium', status = 'detected', monthly_cost = 0,
      data_classification = 'internal', url, notes,
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO integrations
         (name, vendor, category, department, users_count, risk_level, status,
          monthly_cost, data_classification, url, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [name, vendor, category, department, users_count, risk_level, status,
       monthly_cost, data_classification, url, notes, req.user.id]
    );

    res.status(201).json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    const allowed = [
      'name', 'vendor', 'category', 'department', 'users_count',
      'risk_level', 'status', 'monthly_cost', 'data_classification',
      'url', 'notes', 'last_seen_at',
    ];

    const fields = Object.keys(req.body).filter((k) => allowed.includes(k));
    if (!fields.length) return res.status(400).json({ error: 'No valid fields to update' });

    const sets = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const values = fields.map((f) => req.body[f]);

    const { rows } = await pool.query(
      `UPDATE integrations SET ${sets}, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, ...values]
    );

    if (!rows.length) return res.status(404).json({ error: 'Integration not found' });

    // Audit trail
    const historyInserts = fields.map((f) =>
      pool.query(
        `INSERT INTO integration_history (integration_id, changed_by, field, new_value)
         VALUES ($1, $2, $3, $4)`,
        [id, req.user.id, f, String(req.body[f])]
      )
    );
    await Promise.all(historyInserts);

    res.json({ data: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM integrations WHERE id = $1',
      [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Integration not found' });
    res.json({ message: 'Integration deleted' });
  } catch (err) {
    next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT h.*, u.name AS changed_by_name
       FROM integration_history h
       LEFT JOIN users u ON u.id = h.changed_by
       WHERE h.integration_id = $1
       ORDER BY h.changed_at DESC`,
      [req.params.id]
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const [byStatus, byRisk, byCategory, costSummary] = await Promise.all([
      pool.query(
        `SELECT status, COUNT(*) AS count
         FROM integrations GROUP BY status`
      ),
      pool.query(
        `SELECT risk_level, COUNT(*) AS count
         FROM integrations GROUP BY risk_level`
      ),
      pool.query(
        `SELECT category, COUNT(*) AS count
         FROM integrations GROUP BY category ORDER BY count DESC`
      ),
      pool.query(
        `SELECT
           COUNT(*) AS total_integrations,
           SUM(users_count) AS total_users_exposed,
           SUM(monthly_cost) AS total_monthly_cost,
           AVG(monthly_cost) AS avg_monthly_cost
         FROM integrations`
      ),
    ]);

    res.json({
      by_status: byStatus.rows,
      by_risk: byRisk.rows,
      by_category: byCategory.rows,
      summary: costSummary.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove, getHistory, getStats };
