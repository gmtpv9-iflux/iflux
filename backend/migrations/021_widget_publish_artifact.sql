-- iFlux Widget Publish — published artifacts (Widget-Centric, reference-first)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS widget_published_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_id VARCHAR(64) NOT NULL,
    version INT NOT NULL,
    lifecycle_state VARCHAR(32) NOT NULL DEFAULT 'published',
    artifact JSONB NOT NULL,
    etag VARCHAR(80) NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (widget_id, version)
);

CREATE INDEX IF NOT EXISTS idx_widget_pub_widget_id ON widget_published_versions(widget_id);
CREATE INDEX IF NOT EXISTS idx_widget_pub_etag ON widget_published_versions(etag);

CREATE TABLE IF NOT EXISTS widget_current_versions (
    widget_id VARCHAR(64) PRIMARY KEY,
    version_id UUID NOT NULL REFERENCES widget_published_versions(id) ON DELETE RESTRICT,
    version INT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS page_published_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_key VARCHAR(64) NOT NULL,
    version INT NOT NULL,
    lifecycle_state VARCHAR(32) NOT NULL DEFAULT 'published',
    artifact JSONB NOT NULL,
    etag VARCHAR(80) NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (page_key, version)
);

CREATE INDEX IF NOT EXISTS idx_page_pub_page_key ON page_published_versions(page_key);
CREATE INDEX IF NOT EXISTS idx_page_pub_etag ON page_published_versions(etag);

CREATE TABLE IF NOT EXISTS page_current_versions (
    page_key VARCHAR(64) PRIMARY KEY,
    version_id UUID NOT NULL REFERENCES page_published_versions(id) ON DELETE RESTRICT,
    version INT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS artifact_lifecycle_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_type VARCHAR(16) NOT NULL,
    artifact_key VARCHAR(64) NOT NULL,
    version INT,
    from_state VARCHAR(32),
    to_state VARCHAR(32) NOT NULL,
    actor VARCHAR(255),
    detail JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_key ON artifact_lifecycle_events(artifact_type, artifact_key);
