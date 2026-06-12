import sequelize from '../config/database.js';

// Run with: node server/src/migrations/create_qr_distribution_tables.js
// Idempotent.
//
// QR-code beneficiary distribution module:
//   project_beneficiaries — direct project↔beneficiary enrolment, each Active
//                           row carrying a unique QR token.
//   distribution_events   — scheduled hand-out occasions per project.
//   distribution_scans    — one row per QR scan at an event; client_uuid is
//                           the mobile offline-queue idempotency key.
async function run() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS project_beneficiaries (
        id                      SERIAL PRIMARY KEY,
        project_id              INTEGER NOT NULL REFERENCES projects(id),
        beneficiary_id          INTEGER NOT NULL REFERENCES beneficiaries(id),
        qr_token                VARCHAR(32) NOT NULL UNIQUE,
        status                  VARCHAR(20) NOT NULL DEFAULT 'Active'
                                CHECK (status IN ('Active','Replaced','Withdrawn')),
        enrolled_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by              INTEGER REFERENCES users(id),
        created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    // One Active enrolment per (project, beneficiary). Replaced/Withdrawn
    // rows are kept for history, so the uniqueness is partial.
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS project_beneficiaries_active_uniq
        ON project_beneficiaries (project_id, beneficiary_id)
        WHERE status = 'Active';
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS project_beneficiaries_project_idx     ON project_beneficiaries (project_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS project_beneficiaries_beneficiary_idx ON project_beneficiaries (beneficiary_id);`);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS distribution_events (
        id                      SERIAL PRIMARY KEY,
        project_id              INTEGER NOT NULL REFERENCES projects(id),
        name                    VARCHAR(200) NOT NULL,
        scheduled_date          DATE NOT NULL,
        location                VARCHAR(200),
        status                  VARCHAR(20) NOT NULL DEFAULT 'Planned'
                                CHECK (status IN ('Planned','Active','Closed')),
        notes                   TEXT,
        created_by              INTEGER REFERENCES users(id),
        created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS distribution_events_project_idx ON distribution_events (project_id);`);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS distribution_events_status_idx  ON distribution_events (status);`);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS distribution_scans (
        id                      SERIAL PRIMARY KEY,
        event_id                INTEGER NOT NULL REFERENCES distribution_events(id),
        project_beneficiary_id  INTEGER NOT NULL REFERENCES project_beneficiaries(id),
        scanned_by              INTEGER REFERENCES users(id),
        scanned_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        latitude                NUMERIC(10,7),
        longitude               NUMERIC(10,7),
        notes                   TEXT,
        client_uuid             VARCHAR(64) UNIQUE,
        created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    // Same beneficiary can never be scanned twice for the same event.
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS distribution_scans_event_enrolment_uniq
        ON distribution_scans (event_id, project_beneficiary_id);
    `);
    await sequelize.query(`CREATE INDEX IF NOT EXISTS distribution_scans_event_idx ON distribution_scans (event_id);`);

    console.log('project_beneficiaries, distribution_events, distribution_scans ready');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
