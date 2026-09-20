-- ORION Canonical Database Schema v1.2 (SQLite)
-- Section 12 of ORION Master Project Documentation v3.3
-- Required: PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS incidents (
    incident_id TEXT PRIMARY KEY,
    schema_version TEXT NOT NULL DEFAULT '1.2',
    timestamp DATETIME NOT NULL,
    event_time DATETIME NOT NULL,
    module TEXT NOT NULL,
    layer TEXT NOT NULL,
    input_type TEXT NOT NULL,
    threat_type TEXT NOT NULL,
    assessment TEXT NOT NULL,
    severity TEXT NOT NULL,
    risk_score INTEGER NOT NULL,
    confidence REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    correlation_id TEXT,
    risk_breakdown_json TEXT NOT NULL,
    explanation_json TEXT NOT NULL,
    recommended_actions_json TEXT NOT NULL,
    mitre_json TEXT,
    model_metadata_json TEXT
);

CREATE TABLE IF NOT EXISTS evidence (
    evidence_id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    value_json TEXT NOT NULL,
    weight REAL NOT NULL,
    direction TEXT NOT NULL,
    contribution REAL,
    contribution_pct REAL,
    source_engine TEXT NOT NULL,
    description TEXT NOT NULL,
    FOREIGN KEY (incident_id) REFERENCES incidents (incident_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS entities (
    entity_pk INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    value_canonical TEXT NOT NULL,
    first_seen DATETIME NOT NULL,
    last_seen DATETIME NOT NULL,
    CONSTRAINT uq_entity UNIQUE (entity_type, value_canonical)
);

CREATE TABLE IF NOT EXISTS incident_entities (
    incident_id TEXT NOT NULL,
    entity_pk INTEGER NOT NULL,
    role TEXT NOT NULL DEFAULT 'subject',
    criticality TEXT NOT NULL DEFAULT 'standard',
    PRIMARY KEY (incident_id, entity_pk),
    FOREIGN KEY (incident_id) REFERENCES incidents (incident_id) ON DELETE CASCADE,
    FOREIGN KEY (entity_pk) REFERENCES entities (entity_pk) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS model_registry (
    model_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    module TEXT NOT NULL,
    metrics_json TEXT
);

CREATE TABLE IF NOT EXISTS analysis_runs (
    run_id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL,
    model_id TEXT,
    latency_ms REAL NOT NULL,
    risk_config_version TEXT NOT NULL,
    started_at DATETIME NOT NULL,
    FOREIGN KEY (incident_id) REFERENCES incidents (incident_id) ON DELETE CASCADE,
    FOREIGN KEY (model_id) REFERENCES model_registry (model_id)
);

CREATE TABLE IF NOT EXISTS events (
    event_id TEXT PRIMARY KEY,
    run_id TEXT,
    module TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    event_time DATETIME NOT NULL,
    FOREIGN KEY (run_id) REFERENCES analysis_runs (run_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS alerts (
    alert_id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL,
    severity TEXT NOT NULL,
    channel TEXT NOT NULL,
    message TEXT NOT NULL,
    acknowledged BOOLEAN NOT NULL DEFAULT 0,
    acknowledged_by TEXT,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (incident_id) REFERENCES incidents (incident_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS analysts (
    analyst_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS incident_history (
    history_id INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_id TEXT NOT NULL,
    analyst_id INTEGER,
    from_status TEXT NOT NULL,
    to_status TEXT NOT NULL,
    changed_at DATETIME NOT NULL,
    FOREIGN KEY (incident_id) REFERENCES incidents (incident_id) ON DELETE CASCADE,
    FOREIGN KEY (analyst_id) REFERENCES analysts (analyst_id)
);

CREATE TABLE IF NOT EXISTS action_log (
    action_id INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_id TEXT NOT NULL,
    analyst_id INTEGER,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    at DATETIME NOT NULL,
    FOREIGN KEY (incident_id) REFERENCES incidents (incident_id) ON DELETE CASCADE,
    FOREIGN KEY (analyst_id) REFERENCES analysts (analyst_id)
);

CREATE TABLE IF NOT EXISTS artifacts (
    artifact_id TEXT PRIMARY KEY,
    incident_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    opaque_path TEXT NOT NULL,
    sha256 TEXT NOT NULL,
    FOREIGN KEY (incident_id) REFERENCES incidents (incident_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ioc_entries (
    ioc_pk INTEGER PRIMARY KEY AUTOINCREMENT,
    ioc_type TEXT NOT NULL,
    value_canonical TEXT NOT NULL,
    source TEXT NOT NULL,
    confidence REAL NOT NULL DEFAULT 1.0,
    confirmed BOOLEAN NOT NULL DEFAULT 1,
    active BOOLEAN NOT NULL DEFAULT 1,
    added_at DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS incident_ioc_matches (
    incident_id TEXT NOT NULL,
    ioc_pk INTEGER NOT NULL,
    evidence_id TEXT,
    PRIMARY KEY (incident_id, ioc_pk),
    FOREIGN KEY (incident_id) REFERENCES incidents (incident_id) ON DELETE CASCADE,
    FOREIGN KEY (ioc_pk) REFERENCES ioc_entries (ioc_pk) ON DELETE CASCADE,
    FOREIGN KEY (evidence_id) REFERENCES evidence (evidence_id)
);

CREATE TABLE IF NOT EXISTS allowlist_entries (
    allowlist_pk INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    value_canonical TEXT NOT NULL,
    reason TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS protected_identities (
    identity_id INTEGER PRIMARY KEY AUTOINCREMENT,
    display_name TEXT NOT NULL,
    role_type TEXT NOT NULL,
    profile TEXT NOT NULL,
    official_domains_json TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS baselines (
    baseline_id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_type TEXT NOT NULL,
    subject_value TEXT NOT NULL,
    kind TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    updated_at DATETIME NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_incidents_filter ON incidents (module, layer, severity, status, timestamp);
CREATE INDEX IF NOT EXISTS idx_incidents_correlation ON incidents (correlation_id);
CREATE INDEX IF NOT EXISTS idx_evidence_incident ON evidence (incident_id);
CREATE INDEX IF NOT EXISTS idx_analysis_runs_incident ON analysis_runs (incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_entities_entity ON incident_entities (entity_pk);
CREATE INDEX IF NOT EXISTS idx_alerts_incident_ack ON alerts (incident_id, acknowledged);
CREATE INDEX IF NOT EXISTS idx_ioc_lookup ON ioc_entries (ioc_type, value_canonical);
CREATE INDEX IF NOT EXISTS idx_allowlist_lookup ON allowlist_entries (entity_type, value_canonical);
