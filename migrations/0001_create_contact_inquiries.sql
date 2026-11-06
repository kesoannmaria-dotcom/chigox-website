CREATE TABLE IF NOT EXISTS contact_inquiries (
  inquiry_id TEXT PRIMARY KEY NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  payload_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  product_code TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT '',
  page_url TEXT NOT NULL DEFAULT '',
  landing_page TEXT NOT NULL DEFAULT '',
  utm_source TEXT NOT NULL DEFAULT '',
  utm_medium TEXT NOT NULL DEFAULT '',
  utm_campaign TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'qualified', 'closed')),
  notification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (
      notification_status IN (
        'pending',
        'sending',
        'sent',
        'notification_pending'
      )
    ),
  notification_attempts INTEGER NOT NULL DEFAULT 0,
  notification_last_attempt_at TEXT,
  notification_next_attempt_at TEXT,
  notification_sent_at TEXT,
  notification_provider_id TEXT,
  notification_last_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at
  ON contact_inquiries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status
  ON contact_inquiries(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_notification_retry
  ON contact_inquiries(
    notification_status,
    notification_next_attempt_at,
    notification_attempts
  );
