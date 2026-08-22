ALTER TABLE inquiries ADD COLUMN utm_content TEXT NOT NULL DEFAULT '';
ALTER TABLE inquiries ADD COLUMN utm_term TEXT NOT NULL DEFAULT '';
ALTER TABLE inquiries ADD COLUMN source TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE inquiries ADD COLUMN medium TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE inquiries ADD COLUMN channel TEXT NOT NULL DEFAULT 'Direct / Unknown';
ALTER TABLE inquiries ADD COLUMN seo_likely TEXT NOT NULL DEFAULT 'no'
  CHECK (seo_likely IN ('yes', 'no'));
ALTER TABLE inquiries ADD COLUMN keyword TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_inquiries_channel
  ON inquiries(channel, created_at DESC);
