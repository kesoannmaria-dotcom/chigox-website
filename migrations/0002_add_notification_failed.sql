PRAGMA foreign_keys = OFF;

BEGIN TRANSACTION;

CREATE TABLE contact_inquiries_v2 (
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
        'notification_pending',
        'notification_failed'
      )
    ),
  notification_attempts INTEGER NOT NULL DEFAULT 0,
  notification_last_attempt_at TEXT,
  notification_next_attempt_at TEXT,
  notification_sent_at TEXT,
  notification_provider_id TEXT,
  notification_last_error TEXT,
  notification_failed_at TEXT
);

INSERT INTO contact_inquiries_v2 (
  inquiry_id,
  idempotency_key,
  payload_hash,
  created_at,
  updated_at,
  customer_name,
  email,
  country,
  company,
  product_code,
  message,
  language,
  page_url,
  landing_page,
  utm_source,
  utm_medium,
  utm_campaign,
  status,
  notification_status,
  notification_attempts,
  notification_last_attempt_at,
  notification_next_attempt_at,
  notification_sent_at,
  notification_provider_id,
  notification_last_error,
  notification_failed_at
)
SELECT
  inquiry_id,
  idempotency_key,
  payload_hash,
  created_at,
  updated_at,
  customer_name,
  email,
  country,
  company,
  product_code,
  message,
  language,
  page_url,
  landing_page,
  utm_source,
  utm_medium,
  utm_campaign,
  status,
  notification_status,
  notification_attempts,
  notification_last_attempt_at,
  notification_next_attempt_at,
  notification_sent_at,
  notification_provider_id,
  notification_last_error,
  NULL
FROM contact_inquiries;

DROP TABLE contact_inquiries;
ALTER TABLE contact_inquiries_v2 RENAME TO contact_inquiries;

CREATE INDEX idx_contact_inquiries_created_at
  ON contact_inquiries(created_at DESC);

CREATE INDEX idx_contact_inquiries_status
  ON contact_inquiries(status, created_at DESC);

CREATE INDEX idx_contact_inquiries_notification_retry
  ON contact_inquiries(
    notification_status,
    notification_next_attempt_at,
    notification_attempts
  );

COMMIT;

PRAGMA foreign_keys = ON;
