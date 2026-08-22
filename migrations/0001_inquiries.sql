CREATE TABLE IF NOT EXISTS inquiries (
  inquiry_id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  product TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  page_path TEXT NOT NULL,
  page_language TEXT NOT NULL,
  landing_page TEXT NOT NULL,
  referrer TEXT NOT NULL DEFAULT '',
  utm_source TEXT NOT NULL DEFAULT '',
  utm_medium TEXT NOT NULL DEFAULT '',
  utm_campaign TEXT NOT NULL DEFAULT '',
  visitor_country TEXT NOT NULL DEFAULT '',
  turnstile_hostname TEXT NOT NULL,
  turnstile_action TEXT NOT NULL,
  notification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (notification_status IN ('pending', 'sent', 'failed')),
  notification_provider_id TEXT,
  notification_updated_at TEXT
) STRICT;

CREATE TABLE IF NOT EXISTS used_turnstile_tokens (
  token_hash TEXT PRIMARY KEY,
  inquiry_id TEXT NOT NULL,
  used_at TEXT NOT NULL,
  FOREIGN KEY (inquiry_id) REFERENCES inquiries(inquiry_id) ON DELETE CASCADE
) STRICT;

CREATE TABLE IF NOT EXISTS inquiry_rate_limits (
  client_hash TEXT NOT NULL,
  window_started_at TEXT NOT NULL,
  submission_count INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (client_hash, window_started_at)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_inquiries_created_at
  ON inquiries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inquiries_product_country
  ON inquiries(product, visitor_country, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inquiries_source
  ON inquiries(utm_source, utm_medium, created_at DESC);
