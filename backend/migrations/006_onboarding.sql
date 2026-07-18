CREATE TABLE IF NOT EXISTS onboarding_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel VARCHAR(16) NOT NULL CHECK (channel IN ('app', 'web')),
    step_order INT NOT NULL DEFAULT 0,
    title VARCHAR(255) NOT NULL,
    body_text TEXT NOT NULL DEFAULT '',
    image_url TEXT,
    target_key VARCHAR(64),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_steps_channel ON onboarding_steps(channel, step_order);
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_active ON onboarding_steps(channel, is_active);

ALTER TABLE user_data ADD COLUMN IF NOT EXISTS onboarding_json JSONB NOT NULL DEFAULT '{}';
