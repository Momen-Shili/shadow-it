require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { pool } = require('./db');

const schema = `
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(120)        NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255)        NOT NULL,
    role        VARCHAR(20)  NOT NULL DEFAULT 'analyst'
                CHECK (role IN ('admin', 'analyst', 'viewer')),
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       TEXT         NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS integrations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(120)  NOT NULL,
    vendor              VARCHAR(120),
    category            VARCHAR(60)   NOT NULL
                        CHECK (category IN (
                          'communication','storage','project_management',
                          'crm','hr','finance','devtools','analytics','other'
                        )),
    department          VARCHAR(120),
    users_count         INTEGER       NOT NULL DEFAULT 0,
    risk_level          VARCHAR(20)   NOT NULL DEFAULT 'medium'
                        CHECK (risk_level IN ('low','medium','high','critical')),
    status              VARCHAR(20)   NOT NULL DEFAULT 'detected'
                        CHECK (status IN ('detected','under_review','approved','blocked')),
    monthly_cost        NUMERIC(10,2) DEFAULT 0,
    data_classification VARCHAR(30)   DEFAULT 'internal'
                        CHECK (data_classification IN ('public','internal','confidential','restricted')),
    url                 VARCHAR(500),
    notes               TEXT,
    discovered_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    last_seen_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    created_by          UUID          REFERENCES users(id) ON DELETE SET NULL,
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS integration_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id  UUID         NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    changed_by      UUID         REFERENCES users(id) ON DELETE SET NULL,
    field           VARCHAR(60)  NOT NULL,
    old_value       TEXT,
    new_value       TEXT,
    changed_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS service_credentials (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service       VARCHAR(50)  NOT NULL,
    access_token  TEXT         NOT NULL,
    refresh_token TEXT,
    token_expiry  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, service)
  );

  CREATE INDEX IF NOT EXISTS idx_integrations_status     ON integrations(status);
  CREATE INDEX IF NOT EXISTS idx_integrations_risk_level ON integrations(risk_level);
  CREATE INDEX IF NOT EXISTS idx_integrations_category   ON integrations(category);
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id  ON refresh_tokens(user_id);
  CREATE INDEX IF NOT EXISTS idx_service_creds_user      ON service_credentials(user_id, service);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(schema);
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
